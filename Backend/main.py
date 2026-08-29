from __future__ import annotations

from pathlib import Path

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from inference import run_inference


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(
    __file__
).resolve().parent

OUTPUT_DIR = (
    BASE_DIR /
    "outputs"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Oil Spill Attribution API",
    description=(
        "Two-stage SAR inference pipeline: "
        "oil detection followed by ship detection."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
#
# Allows your friend's frontend to call the local API.
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
        "service":
            "Oil Spill Attribution API",

        "status":
            "running",

        "pipeline":
            "oil -> ship -> CSV + annotated image",

        "endpoints": {
            "health":
                "GET /health",

            "predict":
                "POST /predict",

            "csv":
                "GET /results/{request_id}.csv",

            "image":
                "GET /results/{request_id}.png",
        },
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status":
            "ok"
    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/x-tiff",
        "application/octet-stream",
    }

    if (
        file.content_type
        and
        file.content_type
        not in allowed_types
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Upload JPG, PNG or TIFF."
            ),
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    image_bytes = await file.read()

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
            filename=(
                file.filename
                or "uploaded_image"
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            "Inference error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Inference failed. "
                "Check backend logs."
            ),
        )

    # --------------------------------------------------------
    # Return lightweight response
    # --------------------------------------------------------

    request_id = (
        result["request_id"]
    )

    return {

        "status":
            "success",

        "request_id":
            request_id,

        "filename":
            file.filename,

        "oil_detected":
            result["oil_detected"],

        "oil_confidence":
            result["oil_confidence"],

        "ship_count":
            result["ship_count"],

        "csv_url":
            f"/results/{request_id}.csv",

        "image_url":
            f"/results/{request_id}.png",
    }


# ============================================================
# CSV RESULT
# ============================================================

@app.get(
    "/results/{request_id}.csv"
)
def get_csv(
    request_id: str
):

    path = (
        OUTPUT_DIR /
        f"{request_id}.csv"
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
# ANNOTATED IMAGE RESULT
# ============================================================

@app.get(
    "/results/{request_id}.png"
)
def get_image(
    request_id: str
):

    path = (
        OUTPUT_DIR /
        f"{request_id}.png"
    )

    if not path.exists():

        raise HTTPException(
            status_code=404,
            detail="Result image not found.",
        )

    return FileResponse(
        path,
        media_type="image/png",
        filename=path.name,
    )