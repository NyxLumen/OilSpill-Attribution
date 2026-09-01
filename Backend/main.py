from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

try:
    from Backend.inference import run_inference
except ModuleNotFoundError:
    from inference import run_inference


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

# ------------------------------------------------------------
# Allow Backend to import modules from Drift/
#
# Repository:
#
# OilSpill-Attribution/
# ├── Backend/
# └── Drift/
#
# ------------------------------------------------------------

DRIFT_DIR = PROJECT_ROOT / "Drift"

if str(DRIFT_DIR) not in sys.path:
    sys.path.insert(0, str(DRIFT_DIR))


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="OilSpill Attribution API",
    version="2.1.0",
    description=(
        "SAR oil-spill segmentation, conditional ship detection, "
        "annotated output generation, CSV/JSON export, and "
        "Drift/AIS vessel attribution."
    ),
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "service": "OilSpill Attribution API",
        "status": "running",

        "pipeline": (
            "SAR image -> oil segmentation -> "
            "conditional ship detection -> "
            "CSV/JSON + annotated PNG -> "
            "Drift/AIS attribution"
        ),

        "models": {
            "oil": "U-Net + ResNet34",
            "ship": "YOLO11n",
        },

        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "attribute": "POST /attribute",

            "image":
                "GET /results/{request_id}.png",

            "csv":
                "GET /results/{request_id}.csv",

            "json":
                "GET /results/{request_id}.json",

            "attribution_csv":
                "GET /results/{request_id}_attribution.csv",
        },
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),

    metadata: str | None = Form(
        default=None
    ),

    output_format: str = Form(
        default="csv"
    ),
):
    """
    Run the ML inference pipeline.

    Input
    -----
    file:
        SAR image.

    metadata:
        Optional JSON object.

    output_format:
        csv | json | both

    Output
    ------
    Lightweight JSON response containing URLs for:
        - annotated PNG
        - CSV
        - JSON
    """

    # --------------------------------------------------------
    # File name / extension
    # --------------------------------------------------------

    original_filename = (
        file.filename
        or "uploaded_image"
    )

    filename = Path(
        original_filename
    ).name

    extension = (
        Path(filename)
        .suffix
        .lower()
    )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".tif",
        ".tiff",
    }

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Supported formats: "
                "JPG, JPEG, PNG, TIF, TIFF."
            ),
        )

    # --------------------------------------------------------
    # Parse optional metadata
    # --------------------------------------------------------

    parsed_metadata: dict = {}

    if metadata:

        try:
            parsed_metadata = json.loads(
                metadata
            )

        except json.JSONDecodeError as exc:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The 'metadata' field must "
                    f"contain valid JSON: {exc}"
                ),
            )

        if not isinstance(
            parsed_metadata,
            dict,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "'metadata' must be a JSON object."
                ),
            )

    # --------------------------------------------------------
    # Validate requested output format
    # --------------------------------------------------------

    output_format = (
        output_format
        .strip()
        .lower()
    )

    if output_format not in {
        "csv",
        "json",
        "both",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "output_format must be "
                "'csv', 'json', or 'both'."
            ),
        )

    # --------------------------------------------------------
    # Read uploaded image
    # --------------------------------------------------------

    try:
        image_bytes = await file.read()

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not read uploaded file: {exc}"
            ),
        )

    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # --------------------------------------------------------
    # Run inference
    # --------------------------------------------------------

    try:

        result = run_inference(
            image_bytes=image_bytes,
            filename=filename,
            metadata=parsed_metadata,
            output_format=output_format,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except FileNotFoundError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            "Inference error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Inference failed. "
                "Check the backend terminal logs."
            ),
        )

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    request_id = result[
        "request_id"
    ]

    return {
        "status": "success",

        "request_id":
            request_id,

        "filename":
            result["filename"],

        "source":
            result["source"],

        "acquisition_time":
            result["acquisition_time"],

        "place":
            result["place"],

        "oil_detected":
            result["oil_detected"],

        "oil_confidence":
            result["oil_confidence"],

        "oil_latitude":
            result["oil_latitude"],

        "oil_longitude":
            result["oil_longitude"],

        "ship_count":
            result["ship_count"],

        "output_format":
            output_format,

        # PNG is always generated.
        "image_url":
            f"/results/{request_id}.png",

        "csv_url":
            (
                f"/results/{request_id}.csv"
                if result["csv_path"]
                else None
            ),

        "json_url":
            (
                f"/results/{request_id}.json"
                if result["json_path"]
                else None
            ),
    }


# ============================================================
# AIS ATTRIBUTION
# ============================================================

@app.post("/attribute")
async def attribute(
    ml_result: UploadFile = File(...),

    ais_file: UploadFile | None = File(
        default=None
    ),

    backtrack_hours: int = Form(
        default=12
    ),

    current_file: UploadFile | None = File(
        default=None
    ),

    wind_file: UploadFile | None = File(
        default=None
    ),
):
    """
    Run:

        ML result
            ->
        backward Drift simulation
            ->
        AIS cleaning
            ->
        AIS trajectories
            ->
        existing VesselMatcher
            ->
        ranked vessel candidates

    Required:
        ml_result = CSV or JSON generated by /predict

    Optional:
        ais_file  = AIS CSV (defaults to project AIS / dynamic synthesis)
        current_file
        wind_file
    """

    # --------------------------------------------------------
    # Validate backtracking value
    # --------------------------------------------------------

    if backtrack_hours <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "backtrack_hours must be greater than 0."
            ),
        )

    # --------------------------------------------------------
    # Validate ML result
    # --------------------------------------------------------

    ml_original_filename = (
        ml_result.filename
        or "ml_result.csv"
    )

    ml_filename = Path(
        ml_original_filename
    ).name

    ml_extension = (
        Path(ml_filename)
        .suffix
        .lower()
    )

    if ml_extension not in {
        ".csv",
        ".json",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "ml_result must be a CSV or JSON file."
            ),
        )

    # --------------------------------------------------------
    # Validate AIS if provided
    # --------------------------------------------------------

    ais_filename = None
    if ais_file is not None:
        ais_original_filename = (
            ais_file.filename
            or "ais.csv"
        )

        ais_filename = Path(
            ais_original_filename
        ).name

        if (
            Path(ais_filename)
            .suffix
            .lower()
            != ".csv"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "ais_file must be a CSV file."
                ),
            )

    # --------------------------------------------------------
    # Optional current file
    # --------------------------------------------------------

    current_filename = None

    if current_file is not None:

        current_filename = Path(
            current_file.filename
            or "current_data"
        ).name

    # --------------------------------------------------------
    # Optional wind file
    # --------------------------------------------------------

    wind_filename = None

    if wind_file is not None:

        wind_filename = Path(
            wind_file.filename
            or "wind_data"
        ).name

    # --------------------------------------------------------
    # Request directories
    # --------------------------------------------------------

    request_id = uuid.uuid4().hex

    attribute_dir = (
        OUTPUT_DIR
        / "attribute"
        / request_id
    )

    attribute_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    ml_path = (
        attribute_dir
        / ml_filename
    )

    ais_path = (
        attribute_dir
        / ais_filename
        if ais_filename
        else PROJECT_ROOT / "Drift" / "data" / "ais" / "synthetic_ais.csv"
    )

    current_path = (
        attribute_dir
        / current_filename
        if current_filename
        else None
    )

    wind_path = (
        attribute_dir
        / wind_filename
        if wind_filename
        else None
    )

    attribution_output = (
        OUTPUT_DIR
        / f"{request_id}_attribution.csv"
    )

    # --------------------------------------------------------
    # Read uploaded files
    # --------------------------------------------------------

    try:

        ml_bytes = await ml_result.read()

        if not ml_bytes:
            raise ValueError(
                "ML result file is empty."
            )

        ml_path.write_bytes(
            ml_bytes
        )

        if ais_file is not None and ais_filename is not None:
            ais_bytes = await ais_file.read()
            if ais_bytes:
                ais_path.write_bytes(
                    ais_bytes
                )


        if (
            current_file is not None
            and current_path is not None
        ):

            current_bytes = (
                await current_file.read()
            )

            if current_bytes:
                current_path.write_bytes(
                    current_bytes
                )

        if (
            wind_file is not None
            and wind_path is not None
        ):

            wind_bytes = (
                await wind_file.read()
            )

            if wind_bytes:
                wind_path.write_bytes(
                    wind_bytes
                )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not save attribution input files: {exc}"
            ),
        )

    # --------------------------------------------------------
    # Run existing Drift + AIS pipeline
    # --------------------------------------------------------

    try:

        from run_ml_ais import (
            run_ml_ais_pipeline
        )

        ranked = run_ml_ais_pipeline(

            ml_result_path=
                str(ml_path),

            ais_path=
                str(ais_path),

            output_path=
                str(attribution_output),

            current_file=
                (
                    str(current_path)
                    if current_path
                    and current_path.exists()
                    else None
                ),

            wind_file=
                (
                    str(wind_path)
                    if wind_path
                    and wind_path.exists()
                    else None
                ),

            backtrack_hours=
                backtrack_hours,

            n_particles=500,

            timestep_s=900,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except FileNotFoundError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            "Attribution error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "AIS attribution failed. "
                "Check the backend terminal logs."
            ),
        )

    # --------------------------------------------------------
    # No candidates
    # --------------------------------------------------------

    if ranked.empty:

        return {
            "status":
                "no_candidates",

            "request_id":
                request_id,

            "candidate_count":
                0,

            "message":
                (
                    "No AIS vessels satisfied the "
                    "current attribution filters."
                ),

            "csv_url":
                (
                    f"/results/"
                    f"{request_id}_attribution.csv"
                ),
        }

    # --------------------------------------------------------
    # Top candidate
    # --------------------------------------------------------

    best = ranked.iloc[0]

    def safe_number(
        value,
    ):
        try:
            return float(value)
        except (
            TypeError,
            ValueError,
        ):
            return None

    return {
        "status":
            "success",

        "request_id":
            request_id,

        "candidate_count":
            int(len(ranked)),

        "top_candidate": {

            "rank":
                1,

            "mmsi":
                best.get("mmsi"),

            "vessel_type":
                best.get(
                    "vessel_type"
                ),

            "composite_score":
                safe_number(
                    best.get(
                        "composite_score"
                    )
                ),

            "spatial_score":
                safe_number(
                    best.get(
                        "spatial_score"
                    )
                ),

            "temporal_score":
                safe_number(
                    best.get(
                        "temporal_score"
                    )
                ),

            "course_score":
                safe_number(
                    best.get(
                        "course_score"
                    )
                ),

            "mean_distance_km":
                safe_number(
                    best.get(
                        "mean_distance_km"
                    )
                ),

            "min_distance_km":
                safe_number(
                    best.get(
                        "min_distance_km"
                    )
                ),
        },

        "csv_url": (
            f"/results/{request_id}_attribution.csv"
        ),
        "origin_csv_url": (
            f"/results/{request_id}_origin.csv"
            if (OUTPUT_DIR / f"{request_id}_origin.csv").exists()
            else None
        ),
    }


# ============================================================
# END-TO-END IMAGE ATTRIBUTION
# ============================================================

@app.post("/attribute_image")
async def attribute_image(
    image_file: UploadFile = File(...),
    metadata: str | None = Form(
        default=None
    ),
):
    """
    Run full end-to-end pipeline from a single uploaded SAR image:

        1. ML segmentation & ship detection
        2. Backward Lagrangian drift simulation
        3. AIS data loading & cleaning (using synthetic_ais.csv)
        4. Vessel trajectory matching & composite scoring
        5. Return top culprit candidate and artifacts

    Input
    -----
    image_file:
        SAR image (JPG, PNG, TIFF).

    metadata:
        Optional JSON string with acquisition or coordinate metadata.

    Output
    ------
    JSON object containing ML summary, ranked candidate count,
    top candidate attribution scores, and artifact URLs.
    """

    # --------------------------------------------------------
    # File name / extension
    # --------------------------------------------------------

    original_filename = (
        image_file.filename
        or "uploaded_image"
    )

    filename = Path(
        original_filename
    ).name

    extension = (
        Path(filename)
        .suffix
        .lower()
    )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".tif",
        ".tiff",
    }

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Supported formats: "
                "JPG, JPEG, PNG, TIF, TIFF."
            ),
        )

    # --------------------------------------------------------
    # Parse optional metadata
    # --------------------------------------------------------

    parsed_metadata: dict = {}

    if metadata:
        try:
            parsed_metadata = json.loads(
                metadata
            )
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The 'metadata' field must "
                    f"contain valid JSON: {exc}"
                ),
            )

        if not isinstance(
            parsed_metadata,
            dict,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "'metadata' must be a JSON object."
                ),
            )

    # --------------------------------------------------------
    # Read uploaded image bytes
    # --------------------------------------------------------

    try:
        image_bytes = await image_file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not read uploaded file: {exc}"
            ),
        )

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # --------------------------------------------------------
    # Step 1: Run ML inference
    # --------------------------------------------------------

    try:
        result = run_inference(
            image_bytes=image_bytes,
            filename=filename,
            metadata=parsed_metadata,
            output_format="csv",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
    except Exception as exc:
        print(
            "Inference error in attribute_image:",
            repr(exc),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Inference failed. "
                "Check the backend terminal logs."
            ),
        )

    request_id = result["request_id"]

    # --------------------------------------------------------
    # Step 2: Check if oil was detected
    # --------------------------------------------------------

    if not result["oil_detected"]:
        return {
            "status": "no_oil_detected",
            "request_id": request_id,
            "filename": result["filename"],
            "oil_detected": False,
            "oil_confidence": result["oil_confidence"],
            "oil_latitude": result["oil_latitude"],
            "oil_longitude": result["oil_longitude"],
            "ship_count": result["ship_count"],
            "candidate_count": 0,
            "top_candidate": None,
            "image_url": f"/results/{request_id}.png",
            "csv_url": (
                f"/results/{request_id}.csv"
                if result["csv_path"]
                else None
            ),
            "attribution_csv_url": None,
            "origin_csv_url": None,
        }

    # --------------------------------------------------------
    # Step 3: Locate synthetic AIS data and output path
    # --------------------------------------------------------

    ais_path = PROJECT_ROOT / "Drift" / "data" / "ais" / "synthetic_ais.csv"

    attribution_output = (
        OUTPUT_DIR
        / f"{request_id}_attribution.csv"
    )

    # --------------------------------------------------------
    # Step 4: Run Drift + AIS attribution pipeline
    # --------------------------------------------------------

    try:
        from run_ml_ais import (
            run_ml_ais_pipeline
        )

        ranked = run_ml_ais_pipeline(
            ml_result_path=result["csv_path"],
            ais_path=str(ais_path) if ais_path.exists() else None,
            output_path=str(attribution_output),
            backtrack_hours=12,
            n_particles=500,
            timestep_s=900,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
    except Exception as exc:
        print(
            "Attribution error in attribute_image:",
            repr(exc),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "AIS attribution failed. "
                "Check the backend terminal logs."
            ),
        )

    # --------------------------------------------------------
    # Step 5: Format response with JSON-safe native Python types
    # --------------------------------------------------------

    def clean_scalar(val):
        if val is None:
            return None
        if hasattr(val, "item"):
            try:
                val = val.item()
            except Exception:
                pass
        try:
            if val != val:  # NaN check
                return None
        except Exception:
            pass
        return val

    def to_float(val):
        v = clean_scalar(val)
        if v is None:
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def to_int(val):
        v = clean_scalar(val)
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    def to_str(val):
        v = clean_scalar(val)
        if v is None:
            return None
        return str(v)

    top_candidate = None

    if not ranked.empty:
        best = ranked.iloc[0]
        top_candidate = {
            "rank": 1,
            "mmsi": to_int(best.get("mmsi")),
            "vessel_type": to_str(best.get("vessel_type")),
            "composite_score": to_float(
                best.get("composite_score")
            ),
            "spatial_score": to_float(
                best.get("spatial_score")
            ),
            "temporal_score": to_float(
                best.get("temporal_score")
            ),
            "course_score": to_float(
                best.get("course_score")
            ),
            "mean_distance_km": to_float(
                best.get("mean_distance_km")
            ),
            "min_distance_km": to_float(
                best.get("min_distance_km")
            ),
        }

    return {
        "status": (
            "success"
            if not ranked.empty
            else "no_candidates"
        ),
        "request_id": to_str(request_id),
        "filename": to_str(result.get("filename")),
        "oil_detected": bool(result.get("oil_detected")),
        "oil_confidence": to_float(result.get("oil_confidence")),
        "oil_latitude": to_float(result.get("oil_latitude")),
        "oil_longitude": to_float(result.get("oil_longitude")),
        "ship_count": to_int(result.get("ship_count")),
        "candidate_count": int(len(ranked)),
        "top_candidate": top_candidate,
        "image_url": f"/results/{request_id}.png",
        "csv_url": (
            f"/results/{request_id}.csv"
            if result.get("csv_path")
            else None
        ),
        "attribution_csv_url": (
            f"/results/{request_id}_attribution.csv"
            if attribution_output.exists()
            else None
        ),
        "origin_csv_url": (
            f"/results/{request_id}_origin.csv"
            if (OUTPUT_DIR / f"{request_id}_origin.csv").exists()
            else None
        ),
    }


# ============================================================
# NORMAL CSV RESULT
# ============================================================

@app.get(
    "/results/{request_id}.csv"
)
def get_csv(
    request_id: str,
):

    path = (
        OUTPUT_DIR
        / f"{request_id}.csv"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="CSV result not found.",
        )

    return FileResponse(
        path,
        media_type="text/csv",
        filename=path.name,
    )


# ============================================================
# NORMAL JSON RESULT
# ============================================================

@app.get(
    "/results/{request_id}.json"
)
def get_json(
    request_id: str,
):

    path = (
        OUTPUT_DIR
        / f"{request_id}.json"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="JSON result not found.",
        )

    return FileResponse(
        path,
        media_type="application/json",
        filename=path.name,
    )


# ============================================================
# ANNOTATED IMAGE
# ============================================================

@app.get(
    "/results/{request_id}.png"
)
def get_image(
    request_id: str,
):

    path = (
        OUTPUT_DIR
        / f"{request_id}.png"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="Annotated image not found.",
        )

    return FileResponse(
        path,
        media_type="image/png",
        filename=path.name,
    )


# ============================================================
# ATTRIBUTION CSV
# ============================================================

@app.get(
    "/results/{request_id}_attribution.csv"
)
def get_attribution_csv(
    request_id: str,
):

    path = (
        OUTPUT_DIR
        / f"{request_id}_attribution.csv"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="Attribution result not found.",
        )

    return FileResponse(
        path,
        media_type="text/csv",
        filename=path.name,
    )


# ============================================================
# ORIGIN CLOUD CSV
# ============================================================

@app.get(
    "/results/{request_id}_origin.csv"
)
def get_origin_csv(
    request_id: str,
):

    path = (
        OUTPUT_DIR
        / f"{request_id}_origin.csv"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="Origin cloud CSV not found.",
        )

    return FileResponse(
        path,
        media_type="text/csv",
        filename=path.name,
    )