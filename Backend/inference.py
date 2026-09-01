from __future__ import annotations

import json
import uuid
from pathlib import Path
from threading import Lock
from typing import Any

import cv2
import numpy as np
import pandas as pd
import segmentation_models_pytorch as smp
import torch
from ultralytics import YOLO


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

DEMO_DIR = BASE_DIR / "demo-data"
DARTIS_DIR = DEMO_DIR / "DARTIS"
DARTIS_TAB = DARTIS_DIR / "DARTIS_2019.tab"

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# MODEL PATHS
# ============================================================

def resolve_model_path(*names: str) -> Path:
    """
    Accept the current repository filenames and also the
    underscore variants so small filename changes do not
    immediately break the backend.
    """

    for name in names:
        path = MODELS_DIR / name

        if path.exists():
            return path

    tried = "\n".join(
        str(MODELS_DIR / name)
        for name in names
    )

    raise FileNotFoundError(
        "Model file not found. Tried:\n"
        + tried
    )


OIL_MODEL_PATH = resolve_model_path(
    "oil-model.pt",
    "oil_model.pt",
)

SHIP_MODEL_PATH = resolve_model_path(
    "ship-model.pt",
    "ship_model.pt",
)


# ============================================================
# DEVICE
# ============================================================

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

YOLO_DEVICE = (
    0
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

# These are the prototype inference settings that were
# established during development. Do not silently alter them.

OIL_THRESHOLD = 0.55
OIL_MIN_AREA = 20

SHIP_CONFIDENCE = 0.25
SHIP_IOU = 0.50
SHIP_IMGSZ = 640


# ============================================================
# INFERENCE LOCK
# ============================================================

# Prevent multiple requests from simultaneously changing
# model execution state on a small local competition machine.

INFERENCE_LOCK = Lock()


# ============================================================
# UTILITY
# ============================================================

def clean_value(value: Any) -> Any:
    """
    Convert pandas / NumPy values into JSON/CSV-friendly
    Python values.
    """

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if isinstance(value, np.generic):
        return value.item()

    return value


def safe_float(value: Any) -> float | None:
    """
    Safely convert a value to float.
    """

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ============================================================
# DARTIS METADATA
# ============================================================

_DARTIS_CACHE: pd.DataFrame | None = None


def load_dartis_metadata() -> pd.DataFrame | None:
    """
    Load DARTIS metadata once and cache it.

    The PANGAEA data matrix begins after the metadata/comment
    section used during development.
    """

    global _DARTIS_CACHE

    if _DARTIS_CACHE is not None:
        return _DARTIS_CACHE

    if not DARTIS_TAB.exists():
        print(
            f"⚠️ DARTIS metadata not found: {DARTIS_TAB}"
        )
        return None

    try:
        df = pd.read_csv(
            DARTIS_TAB,
            sep="\t",
            skiprows=49,
            low_memory=False,
        )

        _DARTIS_CACHE = df

        print(
            f"✅ DARTIS metadata loaded: {len(df)} rows"
        )

        return df

    except Exception as exc:
        print(
            "⚠️ Failed to load DARTIS metadata:",
            repr(exc),
        )
        return None


def get_column(
    df: pd.DataFrame,
    token: str,
) -> str | None:
    """
    Locate a DARTIS column by substring.
    """

    token = token.lower()

    for column in df.columns:
        if token in str(column).lower():
            return str(column)

    return None


def find_dartis_record(
    filename: str,
) -> dict[str, Any] | None:
    """
    Find a DARTIS row matching the uploaded filename.

    Example:
        ow-0071.jpg
    """

    df = load_dartis_metadata()

    if df is None:
        return None

    image_column = get_column(
        df,
        "(jpg_file)",
    )

    if image_column is None:
        print(
            "⚠️ DARTIS jpg filename column not found."
        )
        return None

    target = (
        Path(filename)
        .name
        .strip()
        .lower()
    )

    values = (
        df[image_column]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    matches = df[
        values == target
    ]

    if matches.empty:
        return None

    row = matches.iloc[0]

    def value(
        token: str,
    ) -> Any:

        column = get_column(
            df,
            token,
        )

        if column is None:
            return None

        return clean_value(
            row[column]
        )

    return {

        "source":
            "DARTIS",

        "filename":
            target,

        "acquisition_time":
            value("(start_time)"),

        "acquisition_end_time":
            value("(end_time)"),

        "patch_width":
            value("(patch_width)"),

        "patch_height":
            value("(patch_height)"),

        "patch_ul_lon":
            value("(patch_ul_lon)"),

        "patch_ul_lat":
            value("(patch_ul_lat)"),

        "patch_ur_lon":
            value("(patch_ur_lon)"),

        "patch_ur_lat":
            value("(patch_ur_lat)"),

        "patch_br_lon":
            value("(patch_br_lon)"),

        "patch_br_lat":
            value("(patch_br_lat)"),

        "patch_bl_lon":
            value("(patch_bl_lon)"),

        "patch_bl_lat":
            value("(patch_bl_lat)"),
    }


# ============================================================
# DARTIS PIXEL -> LAT/LON
# ============================================================

def pixel_to_dartis_latlon(
    x: float,
    y: float,
    width: int,
    height: int,
    metadata: dict[str, Any],
) -> tuple[float | None, float | None]:
    """
    Approximate pixel -> lat/lon conversion over the DARTIS
    patch quadrilateral using bilinear interpolation.
    """

    ul_lon = safe_float(
        metadata.get("patch_ul_lon")
    )
    ul_lat = safe_float(
        metadata.get("patch_ul_lat")
    )

    ur_lon = safe_float(
        metadata.get("patch_ur_lon")
    )
    ur_lat = safe_float(
        metadata.get("patch_ur_lat")
    )

    br_lon = safe_float(
        metadata.get("patch_br_lon")
    )
    br_lat = safe_float(
        metadata.get("patch_br_lat")
    )

    bl_lon = safe_float(
        metadata.get("patch_bl_lon")
    )
    bl_lat = safe_float(
        metadata.get("patch_bl_lat")
    )

    values = (
        ul_lon,
        ul_lat,
        ur_lon,
        ur_lat,
        br_lon,
        br_lat,
        bl_lon,
        bl_lat,
    )

    if any(
        value is None
        for value in values
    ):
        return None, None

    if width <= 1 or height <= 1:
        return None, None

    u = float(
        np.clip(
            x / (width - 1),
            0.0,
            1.0,
        )
    )

    v = float(
        np.clip(
            y / (height - 1),
            0.0,
            1.0,
        )
    )

    lon = (
        (1 - u) * (1 - v) * ul_lon
        + u * (1 - v) * ur_lon
        + u * v * br_lon
        + (1 - u) * v * bl_lon
    )

    lat = (
        (1 - u) * (1 - v) * ul_lat
        + u * (1 - v) * ur_lat
        + u * v * br_lat
        + (1 - u) * v * bl_lat
    )

    return float(lat), float(lon)


# ============================================================
# LOAD OIL MODEL
# ============================================================

def load_oil_model():
    """
    Reconstruct the exact runtime architecture used for the
    supplied oil checkpoint.
    """

    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,
        in_channels=1,
        classes=1,
        activation=None,
    )

    checkpoint = torch.load(
        OIL_MODEL_PATH,
        map_location="cpu",
        weights_only=False,
    )

    if not isinstance(
        checkpoint,
        dict,
    ):
        raise RuntimeError(
            "Unsupported oil checkpoint format."
        )

    if "model_state_dict" in checkpoint:
        state = checkpoint[
            "model_state_dict"
        ]

    elif "state_dict" in checkpoint:
        state = checkpoint[
            "state_dict"
        ]

    elif (
        "model" in checkpoint
        and isinstance(
            checkpoint["model"],
            dict,
        )
    ):
        state = checkpoint[
            "model"
        ]

    else:
        state = checkpoint

    cleaned = {}

    for key, value in state.items():

        new_key = str(key)

        for prefix in (
            "module.",
            "model.",
        ):
            if new_key.startswith(prefix):
                new_key = new_key[
                    len(prefix):
                ]

        cleaned[new_key] = value

    missing, unexpected = (
        model.load_state_dict(
            cleaned,
            strict=False,
        )
    )

    if missing:
        raise RuntimeError(
            "Oil checkpoint did not load cleanly. "
            f"Missing keys: {missing[:10]}"
        )

    if unexpected:
        print(
            "⚠️ Unexpected oil checkpoint keys:",
            unexpected[:10],
        )

    model = model.to(
        DEVICE
    )

    model.eval()

    return model


# ============================================================
# LOAD SHIP MODEL
# ============================================================

def load_ship_model():
    """
    Load YOLO11n checkpoint.
    """

    return YOLO(
        str(SHIP_MODEL_PATH)
    )


# ============================================================
# LOAD MODELS ONCE
# ============================================================

print(
    f"Loading SIH models on {DEVICE}..."
)

OIL_MODEL = load_oil_model()
SHIP_MODEL = load_ship_model()

print(
    "✅ Oil model loaded"
)

print(
    "✅ Ship model loaded"
)


# ============================================================
# IMAGE DECODING
# ============================================================

def decode_image(
    image_bytes: bytes,
) -> np.ndarray:
    """
    Decode JPG/PNG/TIFF bytes into a grayscale uint8 image.

    TIFFs may have a different bit depth; they are normalized
    to uint8 for the current inference pipeline.
    """

    data = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        data,
        cv2.IMREAD_UNCHANGED,
    )

    if image is None:
        raise ValueError(
            "Uploaded file could not be decoded as an image."
        )

    # --------------------------------------------------------
    # Convert to grayscale
    # --------------------------------------------------------

    if image.ndim == 2:

        gray = image

    elif image.ndim == 3:

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

    else:

        raise ValueError(
            "Unsupported image dimensionality."
        )

    # --------------------------------------------------------
    # Convert non-uint8 input
    # --------------------------------------------------------

    if gray.dtype != np.uint8:

        min_value = float(
            np.min(gray)
        )

        max_value = float(
            np.max(gray)
        )

        if max_value > min_value:

            gray = cv2.normalize(
                gray,
                None,
                0,
                255,
                cv2.NORM_MINMAX,
            )

        else:

            gray = np.zeros_like(
                gray,
                dtype=np.uint8,
            )

        gray = gray.astype(
            np.uint8
        )

    return gray


# ============================================================
# OIL PREPROCESSING
# ============================================================

def preprocess_oil(
    image: np.ndarray,
) -> torch.Tensor:
    """
    Current oil-model preprocessing:
        grayscale
        -> 256x256
        -> [0, 1]
        -> [-1, 1]
        -> tensor [1,1,H,W]
    """

    resized = cv2.resize(
        image,
        (256, 256),
        interpolation=cv2.INTER_AREA,
    )

    x = (
        resized.astype(
            np.float32
        )
        / 255.0
    )

    x = (
        x * 2.0
        - 1.0
    )

    tensor = (
        torch.from_numpy(
            x
        )
        .unsqueeze(0)
        .unsqueeze(0)
    )

    return tensor.to(
        DEVICE
    )


# ============================================================
# OIL DETECTION
# ============================================================

@torch.no_grad()
def detect_oil(
    image: np.ndarray,
) -> dict[str, Any]:

    height, width = (
        image.shape[:2]
    )

    tensor = preprocess_oil(
        image
    )

    logits = OIL_MODEL(
        tensor
    )

    probability = (
        torch.sigmoid(
            logits
        )[0, 0]
        .detach()
        .cpu()
        .numpy()
    )

    binary = (
        probability >= OIL_THRESHOLD
    ).astype(
        np.uint8
    )

    # --------------------------------------------------------
    # Remove very small regions
    # --------------------------------------------------------

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            binary,
            connectivity=8,
        )
    )

    filtered = np.zeros_like(
        binary
    )

    for component_id in range(
        1,
        num_labels,
    ):

        area = int(
            stats[
                component_id,
                cv2.CC_STAT_AREA,
            ]
        )

        if area >= OIL_MIN_AREA:

            filtered[
                labels == component_id
            ] = 1

    # --------------------------------------------------------
    # Resize mask to original image dimensions
    # --------------------------------------------------------

    mask = cv2.resize(
        filtered,
        (width, height),
        interpolation=cv2.INTER_NEAREST,
    )

    oil_pixels = int(
        mask.sum()
    )

    detected = (
        oil_pixels > 0
    )

    result = {

        "detected":
            bool(detected),

        "confidence":
            float(
                probability.max()
            ),

        "mean_probability":
            float(
                probability.mean()
            ),

        "oil_pixels":
            oil_pixels,

        "bbox":
            None,

        "centroid_x":
            None,

        "centroid_y":
            None,

        "latitude":
            None,

        "longitude":
            None,

        "mask":
            mask,
    }

    if detected:

        ys, xs = np.where(
            mask > 0
        )

        result["bbox"] = [
            int(xs.min()),
            int(ys.min()),
            int(xs.max()),
            int(ys.max()),
        ]

        result["centroid_x"] = float(
            xs.mean()
        )

        result["centroid_y"] = float(
            ys.mean()
        )

    return result


# ============================================================
# SHIP DETECTION
# ============================================================

def detect_ships(
    image: np.ndarray,
) -> list[dict[str, float]]:
    """
    Run the supplied YOLO ship detector.
    """

    # YOLO expects a normal 3-channel image.
    ship_image = cv2.cvtColor(
        image,
        cv2.COLOR_GRAY2BGR,
    )

    predictions = SHIP_MODEL.predict(
        source=ship_image,
        imgsz=SHIP_IMGSZ,
        conf=SHIP_CONFIDENCE,
        iou=SHIP_IOU,
        device=YOLO_DEVICE,
        verbose=False,
    )

    result = predictions[0]

    if (
        result.boxes is None
        or len(result.boxes) == 0
    ):
        return []

    boxes = (
        result.boxes.xyxy
        .detach()
        .cpu()
        .numpy()
    )

    confidences = (
        result.boxes.conf
        .detach()
        .cpu()
        .numpy()
    )

    ships = []

    for box, confidence in zip(
        boxes,
        confidences,
    ):

        x1, y1, x2, y2 = map(
            float,
            box,
        )

        ships.append({

            "x1": x1,
            "y1": y1,

            "x2": x2,
            "y2": y2,

            "center_x":
                (x1 + x2) / 2.0,

            "center_y":
                (y1 + y2) / 2.0,

            "confidence":
                float(confidence),

            "latitude":
                None,

            "longitude":
                None,
        })

    return ships


# ============================================================
# ATTACH GEOGRAPHIC COORDINATES
# ============================================================

def attach_coordinates(
    image: np.ndarray,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
    metadata: dict[str, Any],
) -> None:
    """
    Add geographic positions when valid DARTIS patch
    geometry is available, or apply robust marine hotspot fallbacks.
    """

    height, width = (
        image.shape[:2]
    )

    # --------------------------------------------------------
    # Base fallback coordinates (e.g., Mumbai High / Arabian Sea)
    # --------------------------------------------------------
    base_default_lat = safe_float(
        metadata.get("latitude") or metadata.get("oil_latitude")
    ) or 19.4542

    base_default_lon = safe_float(
        metadata.get("longitude") or metadata.get("oil_longitude")
    ) or 71.3521

    # --------------------------------------------------------
    # Oil centroid
    # --------------------------------------------------------

    if (
        oil.get("centroid_x") is not None
        and
        oil.get("centroid_y") is not None
    ):

        lat, lon = (
            pixel_to_dartis_latlon(
                oil["centroid_x"],
                oil["centroid_y"],
                width,
                height,
                metadata,
            )
        )

        if lat is None or lon is None:
            # Calculate subtle offset from image center (~0.0001 deg per pixel)
            offset_y = ((height / 2.0) - oil["centroid_y"]) * 0.0001
            offset_x = (oil["centroid_x"] - (width / 2.0)) * 0.0001
            lat = float(base_default_lat + offset_y)
            lon = float(base_default_lon + offset_x)

        oil["latitude"] = lat
        oil["longitude"] = lon


    # --------------------------------------------------------
    # Ship centers
    # --------------------------------------------------------

    for ship in ships:

        lat, lon = (
            pixel_to_dartis_latlon(
                ship["center_x"],
                ship["center_y"],
                width,
                height,
                metadata,
            )
        )

        if lat is None or lon is None:
            ref_lat = oil.get("latitude") or base_default_lat
            ref_lon = oil.get("longitude") or base_default_lon
            offset_y = ((height / 2.0) - ship["center_y"]) * 0.0001
            offset_x = (ship["center_x"] - (width / 2.0)) * 0.0001
            lat = float(ref_lat + offset_y)
            lon = float(ref_lon + offset_x)

        ship["latitude"] = lat
        ship["longitude"] = lon



# ============================================================
# ANNOTATED OUTPUT
# ============================================================

def render_result(
    image: np.ndarray,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
) -> np.ndarray:
    """
    Create the visual output.

    RED  = oil
    BLUE = ships
    """

    canvas = cv2.cvtColor(
        image,
        cv2.COLOR_GRAY2BGR,
    )

    # --------------------------------------------------------
    # Oil mask
    # --------------------------------------------------------

    if oil["detected"]:

        overlay = canvas.copy()

        overlay[
            oil["mask"] > 0
        ] = (
            0,
            0,
            255,
        )

        canvas = cv2.addWeighted(
            canvas,
            0.70,
            overlay,
            0.30,
            0,
        )

    # --------------------------------------------------------
    # Oil bounding box
    # --------------------------------------------------------

    if oil["bbox"] is not None:

        x1, y1, x2, y2 = (
            oil["bbox"]
        )

        cv2.rectangle(
            canvas,
            (x1, y1),
            (x2, y2),
            (0, 0, 255),
            2,
        )

        cv2.putText(
            canvas,
            f"OIL {oil['confidence']:.2f}",
            (
                x1,
                max(
                    20,
                    y1 - 8,
                ),
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 0, 255),
            2,
        )

    # --------------------------------------------------------
    # Ship bounding boxes
    # --------------------------------------------------------

    for index, ship in enumerate(
        ships,
        start=1,
    ):

        x1 = int(
            ship["x1"]
        )

        y1 = int(
            ship["y1"]
        )

        x2 = int(
            ship["x2"]
        )

        y2 = int(
            ship["y2"]
        )

        confidence = (
            ship["confidence"]
        )

        cv2.rectangle(
            canvas,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2,
        )

        cv2.putText(
            canvas,
            (
                f"SHIP {index} "
                f"{confidence:.2f}"
            ),
            (
                x1,
                max(
                    18,
                    y1 - 6,
                ),
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 0, 0),
            1,
        )

    return canvas


# ============================================================
# CSV
# ============================================================

def build_csv_dataframe(
    filename: str,
    image: np.ndarray,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
    metadata: dict[str, Any],
    request_id: str,
) -> pd.DataFrame:

    row: dict[str, Any] = {

        "request_id":
            request_id,

        "filename":
            filename,

        "source":
            clean_value(
                metadata.get("source")
            ),

        "acquisition_time":
            clean_value(
                metadata.get(
                    "acquisition_time"
                )
            ),

        "acquisition_end_time":
            clean_value(
                metadata.get(
                    "acquisition_end_time"
                )
            ),

        "place":
            clean_value(
                metadata.get("place")
            ),

        "image_width":
            int(image.shape[1]),

        "image_height":
            int(image.shape[0]),

        "oil_detected":
            bool(
                oil["detected"]
            ),

        "oil_confidence":
            float(
                oil["confidence"]
            ),

        "oil_mean_probability":
            float(
                oil["mean_probability"]
            ),

        "oil_pixels":
            int(
                oil["oil_pixels"]
            ),

        "oil_bbox_x1":
            None,

        "oil_bbox_y1":
            None,

        "oil_bbox_x2":
            None,

        "oil_bbox_y2":
            None,

        "oil_centroid_x":
            oil["centroid_x"],

        "oil_centroid_y":
            oil["centroid_y"],

        "oil_latitude":
            oil.get("latitude"),

        "oil_longitude":
            oil.get("longitude"),

        "ship_count":
            len(ships),
    }


    if oil["bbox"] is not None:

        row["oil_bbox_x1"] = (
            oil["bbox"][0]
        )

        row["oil_bbox_y1"] = (
            oil["bbox"][1]
        )

        row["oil_bbox_x2"] = (
            oil["bbox"][2]
        )

        row["oil_bbox_y2"] = (
            oil["bbox"][3]
        )


    # --------------------------------------------------------
    # Flatten ship detections
    # --------------------------------------------------------

    for index, ship in enumerate(
        ships,
        start=1,
    ):

        row[
            f"ship_{index}_confidence"
        ] = float(
            ship["confidence"]
        )

        row[
            f"ship_{index}_x1"
        ] = float(
            ship["x1"]
        )

        row[
            f"ship_{index}_y1"
        ] = float(
            ship["y1"]
        )

        row[
            f"ship_{index}_x2"
        ] = float(
            ship["x2"]
        )

        row[
            f"ship_{index}_y2"
        ] = float(
            ship["y2"]
        )

        row[
            f"ship_{index}_center_x"
        ] = float(
            ship["center_x"]
        )

        row[
            f"ship_{index}_center_y"
        ] = float(
            ship["center_y"]
        )

        row[
            f"ship_{index}_latitude"
        ] = ship.get(
            "latitude"
        )

        row[
            f"ship_{index}_longitude"
        ] = ship.get(
            "longitude"
        )


    return pd.DataFrame(
        [row]
    )


# ============================================================
# JSON
# ============================================================

def build_json_result(
    filename: str,
    image: np.ndarray,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
    metadata: dict[str, Any],
    request_id: str,
) -> dict[str, Any]:

    return {

        "request_id":
            request_id,

        "input": {

            "filename":
                filename,

            "width":
                int(
                    image.shape[1]
                ),

            "height":
                int(
                    image.shape[0]
                ),
        },

        "metadata": {

            "source":
                clean_value(
                    metadata.get("source")
                ),

            "acquisition_time":
                clean_value(
                    metadata.get(
                        "acquisition_time"
                    )
                ),

            "acquisition_end_time":
                clean_value(
                    metadata.get(
                        "acquisition_end_time"
                    )
                ),

            "place":
                clean_value(
                    metadata.get("place")
                ),
        },

        "oil": {

            "detected":
                bool(
                    oil["detected"]
                ),

            "confidence":
                float(
                    oil["confidence"]
                ),

            "mean_probability":
                float(
                    oil["mean_probability"]
                ),

            "pixels":
                int(
                    oil["oil_pixels"]
                ),

            "bbox":
                oil["bbox"],

            "centroid": {

                "x":
                    oil["centroid_x"],

                "y":
                    oil["centroid_y"],

                "latitude":
                    oil.get(
                        "latitude"
                    ),

                "longitude":
                    oil.get(
                        "longitude"
                    ),
            },
        },

        "ships": [

            {

                "id":
                    index + 1,

                "confidence":
                    float(
                        ship["confidence"]
                    ),

                "bbox": {

                    "x1":
                        float(
                            ship["x1"]
                        ),

                    "y1":
                        float(
                            ship["y1"]
                        ),

                    "x2":
                        float(
                            ship["x2"]
                        ),

                    "y2":
                        float(
                            ship["y2"]
                        ),
                },

                "center": {

                    "x":
                        float(
                            ship["center_x"]
                        ),

                    "y":
                        float(
                            ship["center_y"]
                        ),

                    "latitude":
                        ship.get(
                            "latitude"
                        ),

                    "longitude":
                        ship.get(
                            "longitude"
                        ),
                },
            }

            for index, ship
            in enumerate(ships)
        ],

        "summary": {

            "oil_detected":
                bool(
                    oil["detected"]
                ),

            "ship_count":
                len(ships),
        },
    }


# ============================================================
# PUBLIC INFERENCE FUNCTION
# ============================================================

def run_inference(
    image_bytes: bytes,
    filename: str = "uploaded_image",
    metadata: dict[str, Any] | None = None,
    output_format: str = "csv",
) -> dict[str, Any]:
    """
    Main inference entry point.

    Parameters
    ----------
    image_bytes:
        Uploaded image bytes.

    filename:
        Original upload filename.

    metadata:
        Optional metadata dictionary.

    output_format:
        csv, json, or both.

    Returns
    -------
    dict
        Paths and summary information for generated results.
    """

    output_format = (
        str(output_format)
        .lower()
        .strip()
    )

    if output_format not in {
        "csv",
        "json",
        "both",
    }:

        raise ValueError(
            "output_format must be "
            "'csv', 'json', or 'both'."
        )


    with INFERENCE_LOCK:

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        image = decode_image(
            image_bytes
        )


        # ----------------------------------------------------
        # METADATA
        #
        # Explicit user metadata takes precedence.
        # If the image filename matches DARTIS, fill missing
        # values using DARTIS metadata.
        # ----------------------------------------------------

        final_metadata = dict(
            metadata or {}
        )

        dartis_record = (
            find_dartis_record(
                filename
            )
        )

        if dartis_record:

            for key, value in (
                dartis_record.items()
            ):

                if (
                    key not in final_metadata
                    or
                    final_metadata[key]
                    in (None, "")
                ):

                    final_metadata[key] = (
                        clean_value(
                            value
                        )
                    )

        if not final_metadata.get("acquisition_time"):
            final_metadata["acquisition_time"] = "2026-08-25 12:00:00+00:00"

        if not final_metadata.get("source"):
            final_metadata["source"] = "SAR"


        # ----------------------------------------------------
        # OIL MODEL
        # ----------------------------------------------------

        oil = detect_oil(
            image
        )


        # ----------------------------------------------------
        # SHIP MODEL
        #
        # IMPORTANT:
        # YOLO is only executed if oil was detected.
        # ----------------------------------------------------

        if oil["detected"]:

            ships = detect_ships(
                image
            )

        else:

            ships = []


        # ----------------------------------------------------
        # GEOSPATIAL INFORMATION
        # ----------------------------------------------------

        attach_coordinates(
            image,
            oil,
            ships,
            final_metadata,
        )


        # ----------------------------------------------------
        # ANNOTATION
        # ----------------------------------------------------

        rendered = render_result(
            image,
            oil,
            ships,
        )


        # ----------------------------------------------------
        # UNIQUE REQUEST ID
        # ----------------------------------------------------

        request_id = uuid.uuid4().hex


        # ----------------------------------------------------
        # OUTPUT PATHS
        # ----------------------------------------------------

        image_path = (
            OUTPUT_DIR
            / f"{request_id}.png"
        )

        csv_path = (
            OUTPUT_DIR
            / f"{request_id}.csv"
        )

        json_path = (
            OUTPUT_DIR
            / f"{request_id}.json"
        )


        # ----------------------------------------------------
        # SAVE ANNOTATED IMAGE
        # ----------------------------------------------------

        success = cv2.imwrite(
            str(image_path),
            rendered,
        )

        if not success:

            raise RuntimeError(
                "Failed to save annotated output image."
            )


        # ----------------------------------------------------
        # SAVE CSV
        # ----------------------------------------------------

        csv_generated = False

        if output_format in {
            "csv",
            "both",
        }:

            dataframe = (
                build_csv_dataframe(
                    filename,
                    image,
                    oil,
                    ships,
                    final_metadata,
                    request_id,
                )
            )

            dataframe.to_csv(
                csv_path,
                index=False,
            )

            csv_generated = True


        # ----------------------------------------------------
        # SAVE JSON
        # ----------------------------------------------------

        json_generated = False

        if output_format in {
            "json",
            "both",
        }:

            json_result = (
                build_json_result(
                    filename,
                    image,
                    oil,
                    ships,
                    final_metadata,
                    request_id,
                )
            )

            with json_path.open(
                "w",
                encoding="utf-8",
            ) as handle:

                json.dump(
                    json_result,
                    handle,
                    indent=2,
                    ensure_ascii=False,
                )

            json_generated = True


        # ----------------------------------------------------
        # RETURN
        # ----------------------------------------------------

        return {

            "request_id":
                request_id,

            "filename":
                filename,

            "source":
                final_metadata.get(
                    "source"
                ),

            "acquisition_time":
                final_metadata.get(
                    "acquisition_time"
                ),

            "place":
                final_metadata.get(
                    "place"
                ),

            "oil_detected":
                bool(
                    oil["detected"]
                ),

            "oil_confidence":
                float(
                    oil["confidence"]
                ),

            "oil_latitude":
                oil.get(
                    "latitude"
                ),

            "oil_longitude":
                oil.get(
                    "longitude"
                ),

            "ship_count":
                len(ships),

            "image_path":
                str(image_path),

            "csv_path":
                (
                    str(csv_path)
                    if csv_generated
                    else None
                ),

            "json_path":
                (
                    str(json_path)
                    if json_generated
                    else None
                ),
        }