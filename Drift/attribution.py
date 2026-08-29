"""
AIS candidate attribution for the OilSpill-Attribution project.

Purpose
-------
Take a completed ML inference result and AIS data, identify vessels
that were plausibly near the detected spill at the relevant time,
optionally compare them with a backward drift origin cloud, and
produce a ranked candidate-vessel table.

This module does NOT:
- train ML models
- perform oil segmentation
- perform ship detection
- replace the existing DriftEngine
- fabricate geographic coordinates

Input
-----
1. Backend ML result (.csv or .json)
2. AIS dataframe / CSV
3. Optional drift-origin cloud CSV

Output
------
A ranked pandas DataFrame and optional CSV.

Important
---------
The resulting score is a prototype ranking score, not proof that a
specific vessel caused the spill.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_MAX_TIME_DIFF_HOURS = 6.0
DEFAULT_MAX_DISTANCE_KM = 50.0

# Weighting of the prototype candidate score.
# These are deliberately configurable rather than hard-coded
# throughout the calculation.

TIME_WEIGHT = 0.30
DISTANCE_WEIGHT = 0.40
DRIFT_WEIGHT = 0.30


# ============================================================
# BASIC UTILITIES
# ============================================================

EARTH_RADIUS_KM = 6371.008


def safe_float(
    value: Any,
) -> float | None:
    """Safely convert a value to float."""

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


def parse_timestamp(
    value: Any,
) -> pd.Timestamp | None:
    """Convert a value to UTC pandas Timestamp."""

    if value is None:
        return None

    try:
        timestamp = pd.to_datetime(
            value,
            utc=True,
        )
    except Exception:
        return None

    if pd.isna(timestamp):
        return None

    return timestamp


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Great-circle distance between two geographic positions.
    """

    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)

    dlat = np.radians(
        lat2 - lat1
    )

    dlon = np.radians(
        lon2 - lon1
    )

    a = (
        np.sin(dlat / 2.0) ** 2
        +
        np.cos(lat1_rad)
        * np.cos(lat2_rad)
        * np.sin(dlon / 2.0) ** 2
    )

    c = 2.0 * np.arcsin(
        np.sqrt(a)
    )

    return float(
        EARTH_RADIUS_KM * c
    )


# ============================================================
# LOAD ML RESULT
# ============================================================

def load_ml_result(
    path: str | Path,
) -> dict[str, Any]:
    """
    Load a single Backend inference result.

    Supports:
        .csv
        .json
    """

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"ML result not found: {path}"
        )

    suffix = path.suffix.lower()

    # --------------------------------------------------------
    # JSON
    # --------------------------------------------------------

    if suffix == ".json":

        with path.open(
            "r",
            encoding="utf-8",
        ) as handle:

            result = json.load(
                handle
            )

        if not isinstance(
            result,
            dict,
        ):
            raise ValueError(
                "ML JSON result must be an object."
            )

        return result

    # --------------------------------------------------------
    # CSV
    # --------------------------------------------------------

    if suffix == ".csv":

        df = pd.read_csv(
            path
        )

        if df.empty:
            raise ValueError(
                "ML CSV result is empty."
            )

        return df.iloc[0].to_dict()

    raise ValueError(
        "ML result must be CSV or JSON."
    )


# ============================================================
# EXTRACT ML DETECTION
# ============================================================

def extract_ml_detection(
    path: str | Path,
) -> dict[str, Any]:
    """
    Convert either the CSV or JSON ML result format into one
    normalized dictionary.
    """

    raw = load_ml_result(
        path
    )

    # --------------------------------------------------------
    # Detect whether this is the nested JSON format
    # --------------------------------------------------------

    if (
        isinstance(
            raw.get("oil"),
            dict,
        )
    ):

        oil = raw.get(
            "oil",
            {},
        )

        metadata = raw.get(
            "metadata",
            {},
        )

        input_data = raw.get(
            "input",
            {},
        )

        ships = raw.get(
            "ships",
            [],
        )

        oil_centroid = oil.get(
            "centroid",
            {},
        )

        return {

            "request_id":
                raw.get("request_id"),

            "filename":
                input_data.get(
                    "filename"
                ),

            "source":
                metadata.get(
                    "source"
                ),

            "acquisition_time":
                parse_timestamp(
                    metadata.get(
                        "acquisition_time"
                    )
                ),

            "oil_detected":
                bool(
                    oil.get(
                        "detected",
                        False,
                    )
                ),

            "oil_latitude":
                safe_float(
                    oil_centroid.get(
                        "latitude"
                    )
                ),

            "oil_longitude":
                safe_float(
                    oil_centroid.get(
                        "longitude"
                    )
                ),

            "ships":
                ships,
        }


    # --------------------------------------------------------
    # Flat CSV format
    # --------------------------------------------------------

    return {

        "request_id":
            raw.get(
                "request_id"
            ),

        "filename":
            raw.get(
                "filename"
            ),

        "source":
            raw.get(
                "source"
            ),

        "acquisition_time":
            parse_timestamp(
                raw.get(
                    "acquisition_time"
                )
            ),

        "oil_detected":
            bool(
                raw.get(
                    "oil_detected",
                    False,
                )
            ),

        "oil_latitude":
            safe_float(
                raw.get(
                    "oil_latitude"
                )
            ),

        "oil_longitude":
            safe_float(
                raw.get(
                    "oil_longitude"
                )
            ),

        "ships":
            extract_flat_ships(
                raw
            ),
    }


# ============================================================
# EXTRACT SHIPS FROM FLAT CSV
# ============================================================

def extract_flat_ships(
    result: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Extract ship_N_* fields from the flat Backend CSV.
    """

    count = safe_float(
        result.get(
            "ship_count",
            0,
        )
    )

    if count is None:
        count = 0

    ship_count = max(
        0,
        int(count),
    )

    ships = []

    for index in range(
        1,
        ship_count + 1,
    ):

        ships.append({

            "id":
                index,

            "confidence":
                safe_float(
                    result.get(
                        f"ship_{index}_confidence"
                    )
                ),

            "latitude":
                safe_float(
                    result.get(
                        f"ship_{index}_latitude"
                    )
                ),

            "longitude":
                safe_float(
                    result.get(
                        f"ship_{index}_longitude"
                    )
                ),

            "center_x":
                safe_float(
                    result.get(
                        f"ship_{index}_center_x"
                    )
                ),

            "center_y":
                safe_float(
                    result.get(
                        f"ship_{index}_center_y"
                    )
                ),
        })

    return ships


# ============================================================
# LOAD AIS
# ============================================================

def load_ais(
    path: str | Path,
) -> pd.DataFrame:
    """
    Load AIS CSV.

    Expected minimum columns:

        mmsi
        timestamp
        latitude
        longitude

    Optional:

        sog
        cog
        heading
        vessel_type
    """

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"AIS file not found: {path}"
        )

    df = pd.read_csv(
        path
    )

    required = {
        "mmsi",
        "timestamp",
        "latitude",
        "longitude",
    }

    missing = (
        required
        - set(df.columns)
    )

    if missing:
        raise ValueError(
            "AIS CSV is missing required columns: "
            f"{sorted(missing)}"
        )

    df = df.copy()

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        utc=True,
        errors="coerce",
    )

    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce",
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce",
    )

    df = df.dropna(
        subset=[
            "timestamp",
            "latitude",
            "longitude",
            "mmsi",
        ]
    )

    df = df[
        df["latitude"].between(
            -90,
            90,
        )
    ]

    df = df[
        df["longitude"].between(
            -180,
            180,
        )
    ]

    return df


# ============================================================
# GET AIS POSITION NEAREST TO DETECTION TIME
# ============================================================

def get_nearest_ais_position(
    group: pd.DataFrame,
    detection_time: pd.Timestamp,
) -> dict[str, Any] | None:
    """
    Find the AIS record nearest to the detection timestamp.
    """

    if group.empty:
        return None

    differences = abs(
        group["timestamp"]
        - detection_time
    )

    index = differences.idxmin()

    row = group.loc[
        index
    ]

    time_difference = (
        row["timestamp"]
        - detection_time
    )

    return {

        "timestamp":
            row["timestamp"],

        "latitude":
            float(
                row["latitude"]
            ),

        "longitude":
            float(
                row["longitude"]
            ),

        "time_difference_hours":
            abs(
                time_difference
                .total_seconds()
            )
            / 3600.0,
    }


# ============================================================
# TIME SCORE
# ============================================================

def time_score(
    difference_hours: float,
    max_hours: float,
) -> float:
    """
    Convert time difference into a [0,1] score.

    1.0 = exact time
    0.0 = at or beyond max_hours
    """

    if difference_hours < 0:
        difference_hours = abs(
            difference_hours
        )

    if max_hours <= 0:
        return 0.0

    score = (
        1.0
        -
        difference_hours
        / max_hours
    )

    return float(
        np.clip(
            score,
            0.0,
            1.0,
        )
    )


# ============================================================
# DISTANCE SCORE
# ============================================================

def distance_score(
    distance_km: float,
    max_distance_km: float,
) -> float:
    """
    Convert geographic distance into [0,1].

    1.0 = same position
    0.0 = at or beyond max_distance_km
    """

    if max_distance_km <= 0:
        return 0.0

    score = (
        1.0
        -
        distance_km
        / max_distance_km
    )

    return float(
        np.clip(
            score,
            0.0,
            1.0,
        )
    )


# ============================================================
# DRIFT ORIGIN LOADING
# ============================================================

def load_drift_origins(
    path: str | Path | None,
) -> pd.DataFrame | None:
    """
    Load a drift origin cloud.

    Supported column names:

        lon / latitude-style variants
        lat / longitude-style variants

    The existing Drift export uses an origin-cloud CSV.
    This function is intentionally flexible about names.
    """

    if path is None:
        return None

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Drift origin file not found: {path}"
        )

    df = pd.read_csv(
        path
    )

    # --------------------------------------------------------
    # Find latitude column
    # --------------------------------------------------------

    lat_column = None
    lon_column = None

    for column in df.columns:

        lower = str(
            column
        ).lower()

        if lower in {
            "lat",
            "latitude",
        }:

            lat_column = column

        if lower in {
            "lon",
            "longitude",
        }:

            lon_column = column

    if (
        lat_column is None
        or
        lon_column is None
    ):

        raise ValueError(
            "Drift origin CSV needs latitude/longitude columns."
        )

    df = df.copy()

    df["latitude"] = pd.to_numeric(
        df[lat_column],
        errors="coerce",
    )

    df["longitude"] = pd.to_numeric(
        df[lon_column],
        errors="coerce",
    )

    return df.dropna(
        subset=[
            "latitude",
            "longitude",
        ]
    )


# ============================================================
# DRIFT CONSISTENCY
# ============================================================

def calculate_drift_score(
    ship_lat: float,
    ship_lon: float,
    origin_df: pd.DataFrame | None,
    max_distance_km: float,
) -> float:
    """
    Score whether a candidate ship is geographically close to
    the computed backward-drift origin cloud.

    This is deliberately a simple prototype score.

    It is NOT a physical probability of causation.
    """

    if origin_df is None:
        return 0.0

    if origin_df.empty:
        return 0.0

    distances = []

    # Avoid assuming the origin cloud is sorted or gridded.
    for row in origin_df.itertuples(
        index=False
    ):

        lat = safe_float(
            getattr(
                row,
                "latitude",
                None,
            )
        )

        lon = safe_float(
            getattr(
                row,
                "longitude",
                None,
            )
        )

        if (
            lat is None
            or
            lon is None
        ):
            continue

        distances.append(
            haversine_km(
                ship_lat,
                ship_lon,
                lat,
                lon,
            )
        )

    if not distances:
        return 0.0

    min_distance = min(
        distances
    )

    return distance_score(
        min_distance,
        max_distance_km,
    )


# ============================================================
# CANDIDATE GENERATION
# ============================================================

def generate_candidates(
    detection: dict[str, Any],
    ais_df: pd.DataFrame,
    max_time_diff_hours: float = DEFAULT_MAX_TIME_DIFF_HOURS,
    max_distance_km: float = DEFAULT_MAX_DISTANCE_KM,
    drift_origins: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """
    Generate and rank candidate vessels.

    The detection location is the detected oil location.

    AIS candidates are filtered by:
        time proximity
        geographic proximity
    """

    detection_time = detection.get(
        "acquisition_time"
    )

    oil_lat = safe_float(
        detection.get(
            "oil_latitude"
        )
    )

    oil_lon = safe_float(
        detection.get(
            "oil_longitude"
        )
    )

    oil_detected = bool(
        detection.get(
            "oil_detected",
            False,
        )
    )


    # --------------------------------------------------------
    # Guard: no oil
    # --------------------------------------------------------

    if not oil_detected:

        return pd.DataFrame()


    # --------------------------------------------------------
    # Guard: no geographic detection
    # --------------------------------------------------------

    if (
        oil_lat is None
        or
        oil_lon is None
    ):

        raise ValueError(
            "Oil was detected, but no geographic oil "
            "coordinates are available. AIS geographic "
            "attribution cannot be performed."
        )


    # --------------------------------------------------------
    # Guard: no timestamp
    # --------------------------------------------------------

    if detection_time is None:

        raise ValueError(
            "Oil was detected, but no acquisition time "
            "is available. AIS temporal matching cannot "
            "be performed."
        )


    detection_time = parse_timestamp(
        detection_time
    )

    if detection_time is None:

        raise ValueError(
            "Invalid acquisition_time."
        )


    # --------------------------------------------------------
    # Ensure AIS timestamps are UTC
    # --------------------------------------------------------

    ais_df = ais_df.copy()

    ais_df["timestamp"] = pd.to_datetime(
        ais_df["timestamp"],
        utc=True,
        errors="coerce",
    )

    ais_df = ais_df.dropna(
        subset=[
            "timestamp",
            "latitude",
            "longitude",
            "mmsi",
        ]
    )


    candidates = []


    # --------------------------------------------------------
    # Examine each vessel
    # --------------------------------------------------------

    for mmsi, group in ais_df.groupby(
        "mmsi"
    ):

        position = (
            get_nearest_ais_position(
                group,
                detection_time,
            )
        )

        if position is None:
            continue


        time_diff = position[
            "time_difference_hours"
        ]


        if (
            time_diff
            > max_time_diff_hours
        ):
            continue


        distance_km = (
            haversine_km(
                oil_lat,
                oil_lon,
                position["latitude"],
                position["longitude"],
            )
        )


        if (
            distance_km
            > max_distance_km
        ):
            continue


        # ----------------------------------------------------
        # Scores
        # ----------------------------------------------------

        temporal = time_score(
            time_diff,
            max_time_diff_hours,
        )

        spatial = distance_score(
            distance_km,
            max_distance_km,
        )

        drift = calculate_drift_score(
            position["latitude"],
            position["longitude"],
            drift_origins,
            max_distance_km,
        )


        total = (

            TIME_WEIGHT
            * temporal

            +

            DISTANCE_WEIGHT
            * spatial

            +

            DRIFT_WEIGHT
            * drift
        )


        candidate = {

            "mmsi":
                mmsi,

            "ais_timestamp":
                position["timestamp"],

            "ais_latitude":
                position["latitude"],

            "ais_longitude":
                position["longitude"],

            "time_difference_hours":
                time_diff,

            "distance_to_oil_km":
                distance_km,

            "time_score":
                temporal,

            "distance_score":
                spatial,

            "drift_score":
                drift,

            "total_score":
                total,
        }


        # ----------------------------------------------------
        # Optional vessel metadata
        # ----------------------------------------------------

        if "vessel_type" in group.columns:

            non_null_types = (
                group["vessel_type"]
                .dropna()
                .astype(str)
            )

            candidate[
                "vessel_type"
            ] = (
                non_null_types.iloc[0]
                if not non_null_types.empty
                else None
            )

        else:

            candidate[
                "vessel_type"
            ] = None



        candidates.append(
            candidate
        )


    if not candidates:

        return pd.DataFrame()


    result = pd.DataFrame(
        candidates
    )


    # --------------------------------------------------------
    # Rank
    # --------------------------------------------------------

    result = result.sort_values(
        "total_score",
        ascending=False,
    ).reset_index(
        drop=True
    )

    result.insert(
        0,
        "rank",
        np.arange(
            1,
            len(result) + 1,
        ),
    )


    return result


# ============================================================
# SAVE ATTRIBUTION RESULT
# ============================================================

def save_candidates(
    candidates: pd.DataFrame,
    output_path: str | Path,
) -> Path:

    output_path = Path(
        output_path
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    candidates.to_csv(
        output_path,
        index=False,
    )

    print(
        f"✅ Saved attribution results: "
        f"{output_path}"
    )

    return output_path


# ============================================================
# HIGH-LEVEL API
# ============================================================

def attribute_vessels(
    ml_result_path: str | Path,
    ais_path: str | Path,
    output_path: str | Path | None = None,
    drift_origin_path: str | Path | None = None,
    max_time_diff_hours: float = DEFAULT_MAX_TIME_DIFF_HOURS,
    max_distance_km: float = DEFAULT_MAX_DISTANCE_KM,
) -> pd.DataFrame:
    """
    Complete ML -> AIS candidate attribution step.
    """

    print("=" * 70)
    print("ML -> AIS VESSEL ATTRIBUTION")
    print("=" * 70)


    # --------------------------------------------------------
    # ML
    # --------------------------------------------------------

    detection = extract_ml_detection(
        ml_result_path
    )


    print(
        "Filename:",
        detection.get("filename")
    )

    print(
        "Source:",
        detection.get("source")
    )

    print(
        "Oil detected:",
        detection.get("oil_detected")
    )

    print(
        "Detection time:",
        detection.get("acquisition_time")
    )

    print(
        "Oil latitude:",
        detection.get("oil_latitude")
    )

    print(
        "Oil longitude:",
        detection.get("oil_longitude")
    )


    # --------------------------------------------------------
    # AIS
    # --------------------------------------------------------

    ais_df = load_ais(
        ais_path
    )

    print(
        f"AIS records loaded: {len(ais_df)}"
    )

    print(
        f"AIS vessels loaded: "
        f"{ais_df['mmsi'].nunique()}"
    )


    # --------------------------------------------------------
    # Drift origins
    # --------------------------------------------------------

    drift_origins = (
        load_drift_origins(
            drift_origin_path
        )
        if drift_origin_path
        else None
    )


    if drift_origins is not None:

        print(
            "Drift origin points:",
            len(drift_origins)
        )


    # --------------------------------------------------------
    # Candidate ranking
    # --------------------------------------------------------

    candidates = generate_candidates(

        detection=detection,

        ais_df=ais_df,

        max_time_diff_hours=
            max_time_diff_hours,

        max_distance_km=
            max_distance_km,

        drift_origins=
            drift_origins,
    )


    print()

    if candidates.empty:

        print(
            "⚠️ No AIS candidates satisfied "
            "the configured filters."
        )

    else:

        print(
            f"✅ Candidates found: "
            f"{len(candidates)}"
        )

        print()

        columns_to_show = [
            "rank",
            "mmsi",
            "distance_to_oil_km",
            "time_difference_hours",
            "time_score",
            "distance_score",
            "drift_score",
            "total_score",
        ]

        columns_to_show = [
            column
            for column
            in columns_to_show
            if column in candidates.columns
        ]

        print(
            candidates[
                columns_to_show
            ].to_string(
                index=False
            )
        )


    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    if output_path is not None:

        save_candidates(
            candidates,
            output_path,
        )


    return candidates


# ============================================================
# COMMAND LINE
# ============================================================

if __name__ == "__main__":

    import argparse


    parser = argparse.ArgumentParser(
        description=(
            "Rank AIS vessels against an ML "
            "oil-spill detection."
        )
    )


    parser.add_argument(
        "--ml-result",
        required=True,
        help=(
            "Backend CSV or JSON result"
        ),
    )


    parser.add_argument(
        "--ais",
        required=True,
        help="AIS CSV",
    )


    parser.add_argument(
        "--output",
        default=(
            "results/"
            "attribution_candidates.csv"
        ),
        help="Output CSV",
    )


    parser.add_argument(
        "--drift-origin",
        default=None,
        help=(
            "Optional drift origin cloud CSV"
        ),
    )


    parser.add_argument(
        "--max-time-hours",
        type=float,
        default=(
            DEFAULT_MAX_TIME_DIFF_HOURS
        ),
    )


    parser.add_argument(
        "--max-distance-km",
        type=float,
        default=(
            DEFAULT_MAX_DISTANCE_KM
        ),
    )


    args = parser.parse_args()


    attribute_vessels(

        ml_result_path=
            args.ml_result,

        ais_path=
            args.ais,

        output_path=
            args.output,

        drift_origin_path=
            args.drift_origin,

        max_time_diff_hours=
            args.max_time_hours,

        max_distance_km=
            args.max_distance_km,
    )