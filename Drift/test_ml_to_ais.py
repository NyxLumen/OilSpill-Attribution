from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# IMPORT EXISTING PROJECT COMPONENTS
# ============================================================

from ais.generator import generate_synthetic_ais
from ais.cleaner import clean_ais_data
from ais.trajectory import reconstruct_trajectories
from matching.matcher import VesselMatcher
from drift.backtrack import run_backtrack


# ============================================================
# HELPERS
# ============================================================

def parse_time(value):

    timestamp = pd.to_datetime(
        value,
        utc=True,
        errors="coerce",
    )

    if pd.isna(timestamp):
        return None

    return timestamp.to_pydatetime().astimezone(
        timezone.utc
    )


def load_ml_result(path: str | Path) -> dict:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"ML result not found: {path}"
        )

    if path.suffix.lower() == ".json":

        import json

        with path.open(
            "r",
            encoding="utf-8",
        ) as f:

            return json.load(f)

    if path.suffix.lower() == ".csv":

        df = pd.read_csv(path)

        if df.empty:
            raise ValueError(
                "ML result CSV is empty."
            )

        return df.iloc[0].to_dict()

    raise ValueError(
        "ML result must be CSV or JSON."
    )


def read_ml_detection(
    path: str | Path,
) -> dict:

    raw = load_ml_result(path)

    # --------------------------------------------------------
    # Nested JSON
    # --------------------------------------------------------

    if isinstance(
        raw.get("oil"),
        dict,
    ):

        metadata = raw.get(
            "metadata",
            {},
        )

        oil = raw.get(
            "oil",
            {},
        )

        centroid = oil.get(
            "centroid",
            {},
        )

        return {

            "oil_detected":
                bool(
                    oil.get(
                        "detected",
                        False,
                    )
                ),

            "latitude":
                centroid.get(
                    "latitude"
                ),

            "longitude":
                centroid.get(
                    "longitude"
                ),

            "acquisition_time":
                metadata.get(
                    "acquisition_time"
                ),
        }

    # --------------------------------------------------------
    # Flat CSV
    # --------------------------------------------------------

    oil_detected = raw.get(
        "oil_detected",
        False,
    )

    if isinstance(
        oil_detected,
        str,
    ):

        oil_detected = (
            oil_detected.lower()
            in {
                "true",
                "1",
                "yes",
                "y",
            }
        )

    return {

        "oil_detected":
            bool(oil_detected),

        "latitude":
            raw.get(
                "oil_latitude"
            ),

        "longitude":
            raw.get(
                "oil_longitude"
            ),

        "acquisition_time":
            raw.get(
                "acquisition_time"
            ),
    }


def as_float(value):

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
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "End-to-end test of "
            "ML -> Drift -> synthetic AIS -> matcher."
        )
    )

    parser.add_argument(
        "--ml-result",
        required=True,
        help="Backend CSV/JSON inference result",
    )

    parser.add_argument(
        "--output",
        default=(
            "results/"
            "e2e_attribution.csv"
        ),
        help="Final ranked vessel CSV",
    )

    parser.add_argument(
        "--backtrack-hours",
        type=int,
        default=12,
    )

    parser.add_argument(
        "--particles",
        type=int,
        default=500,
    )

    args = parser.parse_args()


    print("=" * 75)
    print("END-TO-END ML -> DRIFT -> AIS TEST")
    print("=" * 75)


    # ========================================================
    # 1. LOAD ML RESULT
    # ========================================================

    detection = read_ml_detection(
        args.ml_result
    )

    oil_detected = detection[
        "oil_detected"
    ]

    oil_lat = as_float(
        detection["latitude"]
    )

    oil_lon = as_float(
        detection["longitude"]
    )

    detection_time = parse_time(
        detection["acquisition_time"]
    )


    print()
    print("STEP 1 — ML RESULT")
    print("-" * 75)

    print(
        "Oil detected:",
        oil_detected,
    )

    print(
        "Latitude:",
        oil_lat,
    )

    print(
        "Longitude:",
        oil_lon,
    )

    print(
        "Detection time:",
        detection_time,
    )


    # ========================================================
    # 2. STOP CLEANLY IF ML DID NOT DETECT OIL
    # ========================================================

    if not oil_detected:

        print()
        print(
            "ℹ️ No oil detected."
        )

        print(
            "Skipping Drift and AIS attribution."
        )

        return


    if (
        oil_lat is None
        or
        oil_lon is None
    ):

        raise ValueError(
            "Oil detected, but ML result does not "
            "contain valid geographic coordinates."
        )


    if detection_time is None:

        raise ValueError(
            "Oil detected, but ML result does not "
            "contain a valid acquisition time."
        )


    # ========================================================
    # 3. RUN BACKWARD DRIFT
    # ========================================================

    print()
    print("STEP 2 — BACKWARD DRIFT")
    print("-" * 75)

    trajectory, particles = run_backtrack(

        detection_lon=oil_lon,

        detection_lat=oil_lat,

        detection_time=detection_time,

        current_file=None,

        wind_file=None,

        n_particles=args.particles,

        backtrack_hours=args.backtrack_hours,

        timestep_s=900,

    )


    origin_lat = float(
        particles.lat.mean()
    )

    origin_lon = float(
        particles.lon.mean()
    )


    print(
        "Detection:",
        oil_lat,
        oil_lon,
    )

    print(
        "Backtracked origin:",
        origin_lat,
        origin_lon,
    )


    # ========================================================
    # 4. CREATE CONTROLLED SYNTHETIC AIS
    # ========================================================

    print()
    print("STEP 3 — SYNTHETIC AIS")
    print("-" * 75)


    start_time = (
        detection_time
        - timedelta(
            hours=args.backtrack_hours
        )
    )


    # --------------------------------------------------------
    # Create an intentionally compatible vessel trajectory.
    #
    # It passes near the backtracked origin.
    # --------------------------------------------------------

    guilty_lat = np.array([
        origin_lat + 1.0,
        origin_lat + 0.5,
        origin_lat,
        origin_lat - 0.5,
        origin_lat - 1.0,
    ])

    guilty_lon = np.array([
        origin_lon - 1.0,
        origin_lon - 0.5,
        origin_lon,
        origin_lon + 0.5,
        origin_lon + 1.0,
    ])


    # Smooth interpolation path.

    t_original = np.linspace(
        0.0,
        1.0,
        len(guilty_lat),
    )

    t_new = np.linspace(
        0.0,
        1.0,
        100,
    )


    from scipy.interpolate import interp1d


    guilty_path = (

        interp1d(
            t_original,
            guilty_lon,
            kind="linear",
        )(t_new),

        interp1d(
            t_original,
            guilty_lat,
            kind="linear",
        )(t_new),
    )


    ais_df = generate_synthetic_ais(

        start_time=start_time,

        end_time=detection_time,

        lat_range=(
            origin_lat - 2.0,
            origin_lat + 2.0,
        ),

        lon_range=(
            origin_lon - 2.0,
            origin_lon + 2.0,
        ),

        n_ships=15,

        interval_minutes=15,

        seed=42,

        include_guilty_ship=True,

        guilty_path=guilty_path,
    )


    print(
        f"Synthetic AIS records: {len(ais_df)}"
    )

    print(
        f"Synthetic vessels: "
        f"{ais_df['mmsi'].nunique()}"
    )


    # ========================================================
    # 5. CLEAN AIS
    # ========================================================

    print()
    print("STEP 4 — CLEAN AIS")
    print("-" * 75)


    cleaned = clean_ais_data(
        ais_df
    )


    if cleaned.empty:

        raise RuntimeError(
            "AIS cleaning removed all records."
        )


    # ========================================================
    # 6. RECONSTRUCT TRAJECTORIES
    # ========================================================

    print()
    print("STEP 5 — TRAJECTORIES")
    print("-" * 75)


    trajectories = (
        reconstruct_trajectories(
            cleaned
        )
    )


    if not trajectories:

        raise RuntimeError(
            "No AIS trajectories reconstructed."
        )


    # ========================================================
    # 7. MATCH
    # ========================================================

    print()
    print("STEP 6 — VESSEL MATCHING")
    print("-" * 75)


    matcher = VesselMatcher(

        weight_distance=0.5,

        weight_temporal=0.3,

        weight_course=0.2,
    )


    ranked = matcher.match(

        oil_trajectory={

            "time":
                trajectory["time"],

            "lat":
                trajectory["lat"],

            "lon":
                trajectory["lon"],
        },

        ship_trajectories=
            trajectories,

        detection_time=
            detection_time,

        backtrack_hours=
            args.backtrack_hours,
    )


    # ========================================================
    # 8. OUTPUT
    # ========================================================

    output_path = Path(
        args.output
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )


    if ranked.empty:

        print()
        print(
            "⚠️ No candidates returned."
        )

        ranked.to_csv(
            output_path,
            index=False,
        )

        return


    ranked.to_csv(
        output_path,
        index=False,
    )


    print()
    print("=" * 75)
    print("TOP 5 CANDIDATES")
    print("=" * 75)

    print(
        ranked.head(5).to_string(
            index=False
        )
    )


    # ========================================================
    # 9. BEST CANDIDATE
    # ========================================================

    best = matcher.find_guilty_ship(
        ranked,
        threshold_score=0.3,
    )


    print()
    print("=" * 75)
    print("TOP-RANKED CANDIDATE")
    print("=" * 75)


    if best is None:

        print(
            "No candidate."
        )

    else:

        print(
            "MMSI:",
            best.get("mmsi"),
        )

        print(
            "Vessel type:",
            best.get(
                "vessel_type"
            ),
        )

        print(
            "Confidence:",
            best.get(
                "confidence"
            ),
        )

        print(
            "Composite score:",
            best.get(
                "composite_score"
            ),
        )

        print(
            "Mean distance:",
            best.get(
                "mean_distance_km"
            ),
        )

        print(
            "Minimum distance:",
            best.get(
                "min_distance_km"
            ),
        )


    print()
    print(
        f"✅ Saved: {output_path}"
    )

    print()
    print(
        "✅ END-TO-END TEST COMPLETE"
    )


if __name__ == "__main__":
    main()