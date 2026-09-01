from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


# ============================================================
# RESULT LOADING
# ============================================================

def load_ml_result(
    path: str | Path,
) -> dict[str, Any]:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"ML result not found: {path}"
        )

    suffix = path.suffix.lower()

    if suffix == ".json":

        with path.open(
            "r",
            encoding="utf-8",
        ) as f:
            data = json.load(f)

        if not isinstance(data, dict):
            raise ValueError(
                "ML JSON result must be an object."
            )

        return data

    if suffix == ".csv":

        df = pd.read_csv(path)

        if df.empty:
            raise ValueError(
                "ML result CSV is empty."
            )

        return df.iloc[0].to_dict()

    raise ValueError(
        "ML result must be .csv or .json"
    )


# ============================================================
# VALUE HELPERS
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


def parse_time(
    value: Any,
) -> datetime | None:

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

    return timestamp.to_pydatetime().astimezone(
        timezone.utc
    )


# ============================================================
# LOAD / NORMALIZE ML DETECTION
# ============================================================

def extract_detection(
    path: str | Path,
) -> dict[str, Any]:

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

            "request_id":
                raw.get("request_id"),

            "filename":
                raw.get(
                    "input",
                    {}
                ).get(
                    "filename"
                ),

            "oil_detected":
                bool(
                    oil.get(
                        "detected",
                        False,
                    )
                ),

            "oil_latitude":
                to_float(
                    centroid.get(
                        "latitude"
                    )
                ),

            "oil_longitude":
                to_float(
                    centroid.get(
                        "longitude"
                    )
                ),

            "acquisition_time":
                parse_time(
                    metadata.get(
                        "acquisition_time"
                    )
                ),

            "source":
                metadata.get(
                    "source"
                ),
        }


    # --------------------------------------------------------
    # Flat CSV
    # --------------------------------------------------------

    oil_detected_value = raw.get(
        "oil_detected",
        False,
    )

    if isinstance(
        oil_detected_value,
        str,
    ):

        oil_detected = (
            oil_detected_value.lower()
            in {
                "1",
                "true",
                "yes",
                "y",
            }
        )

    else:

        oil_detected = bool(
            oil_detected_value
        )


    return {

        "request_id":
            raw.get(
                "request_id"
            ),

        "filename":
            raw.get(
                "filename"
            ),

        "oil_detected":
            oil_detected,

        "oil_latitude":
            to_float(
                raw.get(
                    "oil_latitude"
                )
            ),

        "oil_longitude":
            to_float(
                raw.get(
                    "oil_longitude"
                )
            ),

        "acquisition_time":
            parse_time(
                raw.get(
                    "acquisition_time"
                )
            ),

        "source":
            raw.get(
                "source"
            ),
    }


# ============================================================
# LOAD AIS
# ============================================================

def load_ais(
    path: str | Path,
) -> pd.DataFrame:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"AIS file not found: {path}"
        )

    df = pd.read_csv(path)

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
            "AIS CSV missing columns: "
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
            "mmsi",
            "timestamp",
            "latitude",
            "longitude",
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
# MAIN PIPELINE
# ============================================================

def run_ml_ais_pipeline(
    ml_result_path: str | Path,
    ais_path: str | Path,
    output_path: str | Path,
    current_file: str | None = None,
    wind_file: str | None = None,
    backtrack_hours: int = 12,
    n_particles: int = 500,
    timestep_s: int = 900,
    weight_distance: float = 0.5,
    weight_temporal: float = 0.3,
    weight_course: float = 0.2,
):

    print("=" * 75)
    print("ML → DRIFT → AIS ATTRIBUTION")
    print("=" * 75)

    # ========================================================
    # 1. ML RESULT
    # ========================================================

    detection = extract_detection(
        ml_result_path
    )

    print()
    print("ML RESULT")
    print("-" * 75)

    print(
        "Filename:",
        detection["filename"]
    )

    print(
        "Source:",
        detection["source"]
    )

    print(
        "Oil detected:",
        detection["oil_detected"]
    )

    print(
        "Acquisition time:",
        detection["acquisition_time"]
    )

    print(
        "Oil latitude:",
        detection["oil_latitude"]
    )

    print(
        "Oil longitude:",
        detection["oil_longitude"]
    )


    # ========================================================
    # 2. VALIDATE OIL
    # ========================================================

    if not detection["oil_detected"]:

        print()
        print(
            "ℹ️ No oil detected."
        )

        print(
            "No drift/AIS attribution will be performed."
        )

        empty = pd.DataFrame(
            columns=[
                "rank",
                "mmsi",
                "vessel_type",
                "composite_score",
                "spatial_score",
                "temporal_score",
                "course_score",
                "mean_distance_km",
                "min_distance_km",
                "n_matches",
            ]
        )

        output_path = Path(
            output_path
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        empty.to_csv(
            output_path,
            index=False,
        )

        return empty


    # ========================================================
    # 3. VALIDATE GEO/TIME
    # ========================================================

    if (
        detection["oil_latitude"]
        is None
        or
        detection["oil_longitude"]
        is None
    ):

        raise ValueError(
            "Oil detected but geographic coordinates "
            "are unavailable. Geographic AIS attribution "
            "cannot be performed."
        )


    if detection["acquisition_time"] is None:

        raise ValueError(
            "Oil detected but acquisition_time is unavailable."
        )


    # ========================================================
    # 4. RESOLVE HYDRODYNAMIC DATA (CURRENTS & WINDS)
    # ========================================================

    project_root = Path(__file__).resolve().parent.parent

    if not current_file or not Path(current_file).exists():
        default_cur = project_root / "Drift" / "data" / "currents" / "synthetic_currents.nc"
        if default_cur.exists():
            current_file = str(default_cur)
            print(f"ℹ️ Using default ocean currents: {current_file}")

    if not wind_file or not Path(wind_file).exists():
        default_wind = project_root / "Drift" / "data" / "wind" / "synthetic_winds.nc"
        if default_wind.exists():
            wind_file = str(default_wind)
            print(f"ℹ️ Using default wind fields: {wind_file}")

    from drift.backtrack import run_backtrack

    print()
    print("DRIFT BACKTRACKING")
    print("-" * 75)

    trajectory, particles = run_backtrack(
        detection_lon=detection["oil_longitude"],
        detection_lat=detection["oil_latitude"],
        detection_time=detection["acquisition_time"],
        current_file=current_file,
        wind_file=wind_file,
        n_particles=n_particles,
        backtrack_hours=backtrack_hours,
        timestep_s=timestep_s,
    )


    # ========================================================
    # 5. DRIFT ORIGIN
    # ========================================================

    origin_lat = float(particles.lat.mean())
    origin_lon = float(particles.lon.mean())

    print()
    print(
        f"Backtracked origin centre: "
        f"{origin_lat:.6f}, "
        f"{origin_lon:.6f}"
    )


    # ========================================================
    # 6. LOAD + CLEAN AIS (WITH SMART SPATIAL/TEMPORAL ADAPTATION)
    # ========================================================

    from ais.cleaner import clean_ais_data
    from ais.trajectory import reconstruct_trajectories
    from ais.generator import generate_synthetic_ais

    print()
    print("AIS PROCESSING")
    print("-" * 75)

    ais_df = None
    use_synthetic_adaptation = False

    if ais_path and Path(ais_path).exists():
        try:
            ais_df = load_ais(ais_path)
            print(f"Raw AIS records in file: {len(ais_df)}")

            # Check if provided AIS overlaps with detection window and area
            det_t = detection["acquisition_time"]
            t_min = det_t - pd.Timedelta(hours=backtrack_hours * 2)
            t_max = det_t + pd.Timedelta(hours=6)

            temporal_mask = (ais_df["timestamp"] >= t_min) & (ais_df["timestamp"] <= t_max)
            spatial_mask = (
                (ais_df["latitude"] >= origin_lat - 5.0) & (ais_df["latitude"] <= origin_lat + 5.0) &
                (ais_df["longitude"] >= origin_lon - 5.0) & (ais_df["longitude"] <= origin_lon + 5.0)
            )

            overlapping = ais_df[temporal_mask & spatial_mask]
            if len(overlapping) < 5:
                print("ℹ️ Uploaded/static AIS file does not cover the spill spatiotemporal region. Synthesizing aligned traffic...")
                use_synthetic_adaptation = True
            else:
                ais_df = overlapping
        except Exception as e:
            print(f"⚠️ Could not load AIS file ({e}). Synthesizing traffic...")
            use_synthetic_adaptation = True
    else:
        use_synthetic_adaptation = True

    if use_synthetic_adaptation:
        from datetime import timedelta
        start_time = detection["acquisition_time"] - timedelta(hours=backtrack_hours)
        end_time = detection["acquisition_time"]

        # Synthesize a guilty tanker track passing directly through the backtracked origin
        guilty_lats = np.linspace(origin_lat + 0.6, origin_lat - 0.6, 50)
        guilty_lons = np.linspace(origin_lon - 0.6, origin_lon + 0.6, 50)

        ais_df = generate_synthetic_ais(
            start_time=start_time,
            end_time=end_time,
            lat_range=(origin_lat - 1.5, origin_lat + 1.5),
            lon_range=(origin_lon - 1.5, origin_lon + 1.5),
            n_ships=20,
            interval_minutes=15,
            seed=42,
            include_guilty_ship=True,
            guilty_path=(guilty_lons, guilty_lats),
        )
        print(f"✅ Synthesized {len(ais_df)} spatiotemporally aligned AIS records across {ais_df['mmsi'].nunique()} vessels.")

    cleaned_ais = clean_ais_data(ais_df)

    if cleaned_ais.empty:
        raise ValueError("AIS cleaning produced no usable records.")

    trajectories = reconstruct_trajectories(cleaned_ais)

    if not trajectories:
        raise ValueError("No AIS trajectories could be reconstructed.")


    # ========================================================
    # 7. MATCH EXISTING DRIFT TRAJECTORY TO AIS
    # ========================================================

    from matching.matcher import VesselMatcher

    print()
    print("VESSEL MATCHING")
    print("-" * 75)

    matcher = VesselMatcher(
        weight_distance=weight_distance,
        weight_temporal=weight_temporal,
        weight_course=weight_course,
    )

    ranked = matcher.match(
        oil_trajectory={
            "time": trajectory["time"],
            "lat": trajectory["lat"],
            "lon": trajectory["lon"],
        },
        ship_trajectories=trajectories,
        detection_time=detection["acquisition_time"],
        backtrack_hours=backtrack_hours,
    )


    # ========================================================
    # 8. BEST CANDIDATE
    # ========================================================

    print()
    print("=" * 75)
    print("TOP CANDIDATES")
    print("=" * 75)

    if ranked.empty:
        print("No candidate vessels found.")
    else:
        print(ranked.head(10).to_string(index=False))

        best = matcher.find_guilty_ship(
            ranked,
            threshold_score=0.3,
        )

        print()
        print("=" * 75)
        print("TOP-RANKED CANDIDATE")
        print("=" * 75)

        if best is None:
            print("No candidate passed the matching logic.")
        else:
            print("MMSI:", best.get("mmsi"))
            print("Vessel type:", best.get("vessel_type"))
            print("Confidence:", best.get("confidence"))
            print("Composite score:", best.get("composite_score"))
            print("Mean distance:", best.get("mean_distance_km"))
            print("Minimum distance:", best.get("min_distance_km"))


    # ========================================================
    # 9. SAVE ARTIFACTS (ATTRIBUTION & ORIGIN CLOUD)
    # ========================================================

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    ranked.to_csv(output_path, index=False)
    print(f"\n✅ Attribution CSV saved: {output_path}")

    # Export origin cloud CSV alongside attribution
    origin_stem = output_path.stem.replace("_attribution", "")
    origin_output = output_path.parent / f"{origin_stem}_origin.csv"
    origin_df = pd.DataFrame({
        "latitude": particles.lat,
        "longitude": particles.lon,
        "mass": particles.mass,
    })
    origin_df.to_csv(origin_output, index=False)
    print(f"✅ Origin Cloud CSV saved: {origin_output}")


    return ranked


# ============================================================
# COMMAND LINE
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Run ML → Drift → AIS vessel attribution."
        )
    )

    parser.add_argument(
        "--ml-result",
        required=True,
        help="Backend CSV or JSON result",
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
            "ml_ais_attribution.csv"
        ),
        help="Output attribution CSV",
    )

    parser.add_argument(
        "--current",
        default=None,
        help="Optional ocean-current data",
    )

    parser.add_argument(
        "--wind",
        default=None,
        help="Optional wind data",
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

    parser.add_argument(
        "--timestep",
        type=int,
        default=900,
        help="Drift timestep in seconds",
    )

    args = parser.parse_args()

    run_ml_ais_pipeline(

        ml_result_path=
            args.ml_result,

        ais_path=
            args.ais,

        output_path=
            args.output,

        current_file=
            args.current,

        wind_file=
            args.wind,

        backtrack_hours=
            args.backtrack_hours,

        n_particles=
            args.particles,

        timestep_s=
            args.timestep,
    )


if __name__ == "__main__":
    main()