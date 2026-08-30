from __future__ import annotations

import argparse
from datetime import datetime, timezone

from ml_bridge import extract_detection

from drift.backtrack import run_backtrack


# ============================================================
# PARSE ISO TIME
# ============================================================

def parse_time(
    value: str,
) -> datetime:

    value = value.strip()

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    dt = datetime.fromisoformat(
        value
    )

    if dt.tzinfo is None:
        dt = dt.replace(
            tzinfo=timezone.utc
        )

    return dt.astimezone(
        timezone.utc
    )


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Run Drift backtracking from "
            "a Backend ML result."
        )
    )

    parser.add_argument(
        "--result",
        required=True,
        help="Backend CSV or JSON result",
    )

    parser.add_argument(
        "--current",
        default=None,
        help="Current data file",
    )

    parser.add_argument(
        "--wind",
        default=None,
        help="Wind data file",
    )

    parser.add_argument(
        "--hours",
        type=int,
        default=12,
        help="Backtracking duration",
    )

    parser.add_argument(
        "--particles",
        type=int,
        default=1000,
        help="Number of particles",
    )

    args = parser.parse_args()


    # --------------------------------------------------------
    # Load ML result
    # --------------------------------------------------------

    detection = extract_detection(
        args.result
    )


    print("=" * 70)
    print("ML -> DRIFT INTEGRATION")
    print("=" * 70)

    print(
        "File:",
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
        "Detection time:",
        detection["acquisition_time"]
    )

    print(
        "Oil location:",
        detection["oil_latitude"],
        detection["oil_longitude"],
    )

    print(
        "Ships:",
        len(detection["ships"])
    )

    print(
        "Ships with geographic coordinates:",
        len(detection["geographic_ships"])
    )


    # --------------------------------------------------------
    # Validate oil geographic position
    # --------------------------------------------------------

    if not detection["oil_detected"]:

        print(
            "\nNo oil was detected."
        )

        print(
            "Drift backtracking is not started."
        )

        return


    if (
        detection["oil_latitude"] is None
        or
        detection["oil_longitude"] is None
    ):

        print(
            "\nOil detected but geographic "
            "coordinates are unavailable."
        )

        print(
            "Cannot run geographic backtracking."
        )

        return


    if not detection["acquisition_time"]:

        print(
            "\nOil detected but acquisition time "
            "is unavailable."
        )

        print(
            "Cannot run time-based backtracking."
        )

        return


    # --------------------------------------------------------
    # Parse time
    # --------------------------------------------------------

    detection_time = parse_time(
        detection["acquisition_time"]
    )


    # --------------------------------------------------------
    # Run existing Drift engine
    # --------------------------------------------------------

    trajectory, particles = run_backtrack(

        detection_lon=
            detection["oil_longitude"],

        detection_lat=
            detection["oil_latitude"],

        detection_time=
            detection_time,

        current_file=
            args.current,

        wind_file=
            args.wind,

        n_particles=
            args.particles,

        backtrack_hours=
            args.hours,
    )


    print()
    print("=" * 70)
    print("✅ BACKTRACK COMPLETE")
    print("=" * 70)

    print(
        "Final particle longitude range:",
        particles.lon.min(),
        "to",
        particles.lon.max(),
    )

    print(
        "Final particle latitude range:",
        particles.lat.min(),
        "to",
        particles.lat.max(),
    )


if __name__ == "__main__":
    main()