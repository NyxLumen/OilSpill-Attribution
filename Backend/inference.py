from __future__ import annotations

import uuid
from pathlib import Path
from threading import Lock
from typing import Any

import cv2
import numpy as np
import pandas as pd
import torch
import segmentation_models_pytorch as smp
from ultralytics import YOLO


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OIL_MODEL_PATH = MODELS_DIR / "oil_model.pt"
SHIP_MODEL_PATH = MODELS_DIR / "ship_model.pt"


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
# MODEL SETTINGS
# ============================================================

OIL_THRESHOLD = 0.55
OIL_MIN_AREA = 20

SHIP_CONFIDENCE = 0.25
SHIP_IOU = 0.50
SHIP_IMGSZ = 640


# ============================================================
# INFERENCE LOCK
#
# Prevent two requests from trying to run the models at the
# same time on the demo machine.
# ============================================================

INFERENCE_LOCK = Lock()


# ============================================================
# VALIDATE MODEL FILES
# ============================================================

if not OIL_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Oil model not found:\n{OIL_MODEL_PATH}"
    )

if not SHIP_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Ship model not found:\n{SHIP_MODEL_PATH}"
    )


# ============================================================
# LOAD OIL MODEL
# ============================================================

def load_oil_model():

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

    if not isinstance(checkpoint, dict):
        raise RuntimeError(
            "Unsupported oil checkpoint format."
        )

    if "model_state_dict" in checkpoint:
        state = checkpoint["model_state_dict"]

    elif "state_dict" in checkpoint:
        state = checkpoint["state_dict"]

    elif (
        "model" in checkpoint
        and isinstance(checkpoint["model"], dict)
    ):
        state = checkpoint["model"]

    else:
        state = checkpoint

    cleaned = {}

    for key, value in state.items():

        new_key = key

        for prefix in (
            "module.",
            "model.",
        ):
            if new_key.startswith(prefix):
                new_key = new_key[len(prefix):]

        cleaned[new_key] = value

    missing, unexpected = model.load_state_dict(
        cleaned,
        strict=False,
    )

    if missing:
        raise RuntimeError(
            "Oil model missing keys: "
            f"{missing[:10]}"
        )

    if unexpected:
        print(
            "Warning: unexpected oil model keys:",
            unexpected[:10]
        )

    model = model.to(DEVICE)
    model.eval()

    return model


# ============================================================
# LOAD SHIP MODEL
# ============================================================

def load_ship_model():

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

print("✅ Oil model loaded")
print("✅ Ship model loaded")


# ============================================================
# IMAGE DECODING
# ============================================================

def decode_image(
    image_bytes: bytes,
) -> np.ndarray:

    data = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        data,
        cv2.IMREAD_GRAYSCALE,
    )

    if image is None:
        raise ValueError(
            "Uploaded file could not be decoded "
            "as an image."
        )

    return image


# ============================================================
# OIL PREPROCESSING
#
# This reproduces the preprocessing used in our working
# Lightning/Kaggle inference test.
# ============================================================

def preprocess_oil(
    image: np.ndarray,
) -> torch.Tensor:

    resized = cv2.resize(
        image,
        (256, 256),
        interpolation=cv2.INTER_AREA,
    )

    x = (
        resized.astype(np.float32)
        / 255.0
    )

    x = (
        x * 2.0
        - 1.0
    )

    tensor = (
        torch.from_numpy(x)
        .unsqueeze(0)
        .unsqueeze(0)
    )

    return tensor.to(DEVICE)


# ============================================================
# OIL DETECTION
# ============================================================

@torch.no_grad()
def detect_oil(
    image: np.ndarray,
) -> dict[str, Any]:

    height, width = image.shape[:2]

    tensor = preprocess_oil(
        image
    )

    logits = OIL_MODEL(
        tensor
    )

    probability = torch.sigmoid(
        logits
    )[0, 0].detach().cpu().numpy()

    binary = (
        probability >= OIL_THRESHOLD
    ).astype(np.uint8)

    # --------------------------------------------------------
    # Remove tiny isolated components
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
    # Return to original dimensions
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
        "detected": bool(detected),

        "confidence": float(
            probability.max()
        ),

        "mean_probability": float(
            probability.mean()
        ),

        "oil_pixels": oil_pixels,

        "bbox": None,

        "centroid_x": None,

        "centroid_y": None,

        "mask": mask,
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

    predictions = SHIP_MODEL.predict(
        source=image,

        imgsz=SHIP_IMGSZ,

        conf=SHIP_CONFIDENCE,

        iou=SHIP_IOU,

        device=YOLO_DEVICE,

        verbose=False,
    )

    result = predictions[0]

    ships = []

    if (
        result.boxes is None
        or len(result.boxes) == 0
    ):
        return ships

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
        })

    return ships


# ============================================================
# RENDER OUTPUT IMAGE
# ============================================================

def render_result(
    image: np.ndarray,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
) -> np.ndarray:

    canvas = cv2.cvtColor(
        image,
        cv2.COLOR_GRAY2BGR,
    )

    # --------------------------------------------------------
    # OIL MASK
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
    # OIL BOX
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
    # SHIP BOXES
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
# CSV ROW
# ============================================================

def build_csv_row(
    filename: str,
    oil: dict[str, Any],
    ships: list[dict[str, float]],
) -> pd.DataFrame:

    row = {

        "filename":
            filename,

        "oil_detected":
            oil["detected"],

        "oil_confidence":
            oil["confidence"],

        "oil_mean_probability":
            oil["mean_probability"],

        "oil_pixels":
            oil["oil_pixels"],

        "oil_bbox_x1": None,
        "oil_bbox_y1": None,
        "oil_bbox_x2": None,
        "oil_bbox_y2": None,

        "oil_centroid_x":
            oil["centroid_x"],

        "oil_centroid_y":
            oil["centroid_y"],

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
    # Flatten ship data
    # --------------------------------------------------------

    for i, ship in enumerate(
        ships,
        start=1,
    ):

        row[
            f"ship_{i}_confidence"
        ] = ship["confidence"]

        row[
            f"ship_{i}_x1"
        ] = ship["x1"]

        row[
            f"ship_{i}_y1"
        ] = ship["y1"]

        row[
            f"ship_{i}_x2"
        ] = ship["x2"]

        row[
            f"ship_{i}_y2"
        ] = ship["y2"]

        row[
            f"ship_{i}_center_x"
        ] = ship["center_x"]

        row[
            f"ship_{i}_center_y"
        ] = ship["center_y"]

    return pd.DataFrame(
        [row]
    )


# ============================================================
# MAIN PUBLIC FUNCTION
# ============================================================

def run_inference(
    image_bytes: bytes,
    filename: str = "uploaded_image",
) -> dict[str, Any]:

    with INFERENCE_LOCK:

        image = decode_image(
            image_bytes
        )

        # ----------------------------------------------------
        # STAGE 1 — OIL
        # ----------------------------------------------------

        oil = detect_oil(
            image
        )

        # ----------------------------------------------------
        # STAGE 2 — SHIP
        #
        # Ships are only evaluated when oil is detected.
        # ----------------------------------------------------

        if oil["detected"]:

            ships = detect_ships(
                image
            )

        else:

            ships = []

        # ----------------------------------------------------
        # STAGE 3 — RENDER
        # ----------------------------------------------------

        rendered = render_result(
            image,
            oil,
            ships,
        )

        # ----------------------------------------------------
        # STAGE 4 — REQUEST ID
        # ----------------------------------------------------

        request_id = uuid.uuid4().hex

        csv_path = (
            OUTPUT_DIR /
            f"{request_id}.csv"
        )

        image_path = (
            OUTPUT_DIR /
            f"{request_id}.png"
        )

        # ----------------------------------------------------
        # STAGE 5 — SAVE IMAGE
        # ----------------------------------------------------

        success = cv2.imwrite(
            str(image_path),
            rendered,
        )

        if not success:

            raise RuntimeError(
                "Failed to save annotated result image."
            )

        # ----------------------------------------------------
        # STAGE 6 — SAVE CSV
        # ----------------------------------------------------

        result_df = build_csv_row(
            filename,
            oil,
            ships,
        )

        result_df.to_csv(
            csv_path,
            index=False,
        )

        return {

            "request_id":
                request_id,

            "oil_detected":
                oil["detected"],

            "oil_confidence":
                oil["confidence"],

            "ship_count":
                len(ships),

            "csv_path":
                str(csv_path),

            "image_path":
                str(image_path),
        }