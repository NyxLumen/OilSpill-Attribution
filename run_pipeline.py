"""
===============================================================================
OIL SPILL ATTRIBUTION — UNIFIED END-TO-END PIPELINE RUNNER
===============================================================================
Usage:
    python run_pipeline.py
    python run_pipeline.py --image Backend/demo-data/OSSDD/00010.png
    python run_pipeline.py --image path/to/sar_image.png --backtrack-hours 12
===============================================================================
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Set up module search paths
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "Backend"
DRIFT_DIR = PROJECT_ROOT / "Drift"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if str(DRIFT_DIR) not in sys.path:
    sys.path.insert(0, str(DRIFT_DIR))

try:
    from inference import run_inference
except ImportError as exc:
    print(f"❌ Failed to import inference module from Backend: {exc}")
    sys.exit(1)

try:
    from run_ml_ais import run_ml_ais_pipeline
except ImportError as exc:
    print(f"❌ Failed to import run_ml_ais from Drift: {exc}")
    sys.exit(1)


def find_default_image() -> Path:
    """Find a default demo image if none is supplied."""
    candidates = [
        BACKEND_DIR / "demo-data" / "OSSDD" / "00010.png",
        BACKEND_DIR / "demo-data" / "OSSDD" / "00018.png",
        BACKEND_DIR / "demo-data" / "SOS" / "palsar_10.png",
        BACKEND_DIR / "demo-data" / "SOS" / "palsar_1000.png",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    # Search for any PNG/JPG in demo-data
    demo_dir = BACKEND_DIR / "demo-data"
    if demo_dir.exists():
        found = list(demo_dir.rglob("*.png")) + list(demo_dir.rglob("*.jpg"))
        if found:
            return found[0]

    raise FileNotFoundError("No demo images found in Backend/demo-data.")


def main():
    parser = argparse.ArgumentParser(
        description="Run complete SAR Oil Spill Detection -> Drift Backtracking -> AIS Vessel Attribution pipeline."
    )
    parser.add_argument(
        "--image",
        type=str,
        default=None,
        help="Path to input SAR satellite image (PNG, JPG, TIFF). Defaults to demo image.",
    )
    parser.add_argument(
        "--ais",
        type=str,
        default=str(DRIFT_DIR / "data" / "ais" / "synthetic_ais.csv"),
        help="Path to AIS CSV file (optional; defaults to project synthetic AIS).",
    )
    parser.add_argument(
        "--current",
        type=str,
        default=None,
        help="Optional ocean current NetCDF file (defaults to project synthetic currents).",
    )
    parser.add_argument(
        "--wind",
        type=str,
        default=None,
        help="Optional wind NetCDF file (defaults to project synthetic winds).",
    )
    parser.add_argument(
        "--backtrack-hours",
        type=int,
        default=12,
        help="Number of hours to backtrack the oil spill drift (default: 12).",
    )
    parser.add_argument(
        "--particles",
        type=int,
        default=500,
        help="Number of Lagrangian particles to simulate (default: 500).",
    )
    parser.add_argument(
        "--timestep",
        type=int,
        default=900,
        help="Simulation timestep in seconds (default: 900s = 15 min).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(PROJECT_ROOT / "Backend" / "outputs"),
        help="Directory to save output artifacts (default: Backend/outputs).",
    )

    args = parser.parse_args()

    # Resolve image path
    if args.image:
        image_path = Path(args.image)
        if not image_path.exists():
            print(f"❌ Specified image not found: {image_path}")
            sys.exit(1)
    else:
        try:
            image_path = find_default_image()
            print(f"ℹ️ No image specified. Using default demo image: {image_path}")
        except FileNotFoundError as exc:
            print(f"❌ Error: {exc}")
            sys.exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("🚀 STARTING FULL END-TO-END OIL SPILL ATTRIBUTION PIPELINE")
    print("=" * 80)
    print(f"📁 Input Image      : {image_path}")
    print(f"⏳ Backtrack Window  : {args.backtrack_hours} hours")
    print(f"🌊 Particle Count   : {args.particles}")
    print(f"📂 Output Directory : {output_dir}")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STEP 1: ML SEGMENTATION & SHIP DETECTION
    # -------------------------------------------------------------------------
    print("\n[1/3] RUNNING ML SEGMENTATION (U-NET) & SHIP DETECTION (YOLO)...")
    try:
        image_bytes = image_path.read_bytes()
        ml_result = run_inference(
            image_bytes=image_bytes,
            filename=image_path.name,
            output_format="both",
        )
    except Exception as exc:
        print(f"❌ ML inference failed: {exc}")
        sys.exit(1)

    request_id = ml_result["request_id"]
    oil_detected = ml_result["oil_detected"]

    print(f"  • Request ID       : {request_id}")
    print(f"  • Oil Detected     : {oil_detected} (Confidence: {ml_result['oil_confidence']:.4f})")
    print(f"  • Oil Coordinates  : Lat {ml_result['oil_latitude']:.4f}°N, Lon {ml_result['oil_longitude']:.4f}°E")
    print(f"  • Ships Detected   : {ml_result['ship_count']}")
    print(f"  • Annotated Image  : {ml_result['image_path']}")
    print(f"  • Detection CSV    : {ml_result['csv_path']}")
    print(f"  • Detection JSON   : {ml_result['json_path']}")

    if not oil_detected:
        print("\nℹ️ No oil was detected in the provided SAR image. Stopping attribution pipeline.")
        return

    # -------------------------------------------------------------------------
    # STEP 2 & 3: LAGRANGIAN DRIFT SIMULATION & AIS VESSEL MATCHING
    # -------------------------------------------------------------------------
    print("\n[2/3] RUNNING LAGRANGIAN BACKTRACKING & [3/3] AIS VESSEL MATCHING...")
    attribution_output_csv = output_dir / f"{request_id}_attribution.csv"

    try:
        ranked_candidates = run_ml_ais_pipeline(
            ml_result_path=ml_result["csv_path"],
            ais_path=args.ais,
            output_path=str(attribution_output_csv),
            current_file=args.current,
            wind_file=args.wind,
            backtrack_hours=args.backtrack_hours,
            n_particles=args.particles,
            timestep_s=args.timestep,
        )
    except Exception as exc:
        print(f"❌ Attribution pipeline failed: {exc}")
        sys.exit(1)

    # -------------------------------------------------------------------------
    # FINAL RESULTS SUMMARY
    # -------------------------------------------------------------------------
    origin_csv = output_dir / f"{request_id}_origin.csv"

    print("\n" + "=" * 80)
    print("🎯 ATTRIBUTION VERDICT & SUMMARY")
    print("=" * 80)

    if ranked_candidates.empty:
        print("⚠️ No candidate vessels met the matching criteria.")
    else:
        top = ranked_candidates.iloc[0]
        print(f"🏆 TOP SUSPECT VESSEL (Rank 1):")
        print(f"   • MMSI                 : {int(top['mmsi'])}")
        print(f"   • Vessel Type          : {top.get('vessel_type', 'Unknown')}")
        print(f"   • Composite Score      : {top['composite_score']:.4f} / 1.0000")
        print(f"   • Spatial Proximity    : {top['spatial_score']:.4f} (Min dist: {top['min_distance_km']:.2f} km)")
        print(f"   • Temporal Overlap     : {top['temporal_score']:.4f}")
        print(f"   • Course Score         : {top['course_score']:.4f}")
        print()
        print("📊 TOP 5 CANDIDATES TABLE:")
        print(ranked_candidates.head(5).to_string(index=False))

    print("\n📦 GENERATED ARTIFACTS:")
    print(f"   1. Annotated SAR Image : {ml_result['image_path']}")
    print(f"   2. ML Detections CSV   : {ml_result['csv_path']}")
    print(f"   3. Attribution CSV     : {attribution_output_csv}")
    if origin_csv.exists():
        print(f"   4. Origin Cloud CSV    : {origin_csv}")

    print("\n✅ PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    main()
