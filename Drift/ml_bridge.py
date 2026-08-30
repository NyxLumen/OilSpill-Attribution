from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


# ============================================================
# LOAD BACKEND RESULT
# ============================================================

def load_result(
    path: str | Path,
) -> dict[str, Any]:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Result file not found: {path}"
        )

    suffix = path.suffix.lower()

    if suffix == ".json":

        with path.open(
            "r",
            encoding="utf-8",
        ) as handle:

            return json.load(handle)

    if suffix == ".csv":

        df = pd.read_csv(path)

        if df.empty:
            raise ValueError(
                "Backend CSV is empty."
            )

        return df.iloc[0].to_dict()

    raise ValueError(
        "Supported result formats are CSV and JSON."
    )


# ============================================================
# OPTIONAL FLOAT CONVERSION
# ============================================================

def to_float(
    value: Any,
) -> float | None:

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    try:
        return float(value)
    except (
        TypeError,
        ValueError,
    ):
        return None


# ============================================================
# GET DETECTION TIME
# ============================================================

def get_detection_time(
    result: dict[str, Any],
) -> str | None:

    value = result.get(
        "acquisition_time"
    )

    if value is None:
        return None

    return str(value)


# ============================================================
# GET OIL LOCATION
# ============================================================

def get_oil_location(
    result: dict[str, Any],
) -> tuple[
    float | None,
    float | None,
]:

    lat = to_float(
        result.get(
            "oil_latitude"
        )
    )

    lon = to_float(
        result.get(
            "oil_longitude"
        )
    )

    return lat, lon


# ============================================================
# EXTRACT SHIP POSITIONS FROM FLAT CSV
# ============================================================

def extract_ships_from_csv(
    result: dict[str, Any],
) -> list[dict[str, Any]]:

    ships = []

    ship_count = int(
        to_float(
            result.get(
                "ship_count",
                0,
            )
        )
        or 0
    )

    for index in range(
        1,
        ship_count + 1,
    ):

        confidence = to_float(
            result.get(
                f"ship_{index}_confidence"
            )
        )

        latitude = to_float(
            result.get(
                f"ship_{index}_latitude"
            )
        )

        longitude = to_float(
            result.get(
                f"ship_{index}_longitude"
            )
        )

        center_x = to_float(
            result.get(
                f"ship_{index}_center_x"
            )
        )

        center_y = to_float(
            result.get(
                f"ship_{index}_center_y"
            )
        )

        ships.append({

            "id": index,

            "confidence":
                confidence,

            "latitude":
                latitude,

            "longitude":
                longitude,

            "center_x":
                center_x,

            "center_y":
                center_y,
        })

    return ships


# ============================================================
# EXTRACT STRUCTURED RESULT
# ============================================================

def extract_detection(
    path: str | Path,
) -> dict[str, Any]:

    result = load_result(path)

    oil_detected = bool(
        result.get(
            "oil_detected",
            False,
        )
    )

    oil_lat, oil_lon = (
        get_oil_location(
            result
        )
    )

    ships = (
        extract_ships_from_csv(
            result
        )
    )

    # Remove ships without valid geographic positions from
    # geographic AIS processing. Pixel coordinates remain
    # available in the original result.

    geo_ships = [
        ship
        for ship in ships
        if (
            ship["latitude"] is not None
            and
            ship["longitude"] is not None
        )
    ]

    return {

        "filename":
            result.get(
                "filename"
            ),

        "source":
            result.get(
                "source"
            ),

        "acquisition_time":
            get_detection_time(
                result
            ),

        "oil_detected":
            oil_detected,

        "oil_latitude":
            oil_lat,

        "oil_longitude":
            oil_lon,

        "ships":
            ships,

        "geographic_ships":
            geo_ships,
    }