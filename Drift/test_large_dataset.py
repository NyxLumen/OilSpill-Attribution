"""Run a massive simulation through the synthetic whirlpool and storm."""

import numpy as np
from datetime import datetime, timezone
import matplotlib.pyplot as plt

from drift.backtrack import run_backtrack
from drift.export import export_trajectory_to_csv, export_origin_cloud_to_csv  # ADD THIS

def run_large_test():
    print("Running large-scale backtrack on synthetic NetCDF files...")

    detection_time = datetime(2026, 8, 26, 10, 0, tzinfo=timezone.utc)
    lon_start, lat_start = 71.0, 21.0

    trajectory, particles = run_backtrack(
        detection_lon=lon_start,
        detection_lat=lat_start,
        detection_time=detection_time,
        current_file="data/currents/synthetic_currents.nc",
        wind_file="data/wind/synthetic_winds.nc",
        n_particles=5000,
        backtrack_hours=36,
        timestep_s=900,
        seed_radius_m=1000
    )

    # ==========================================
    # NEW: EXPORT TO CSV
    # ==========================================
    print("\n📤 Exporting trajectory data to CSV...")
    export_trajectory_to_csv(trajectory, "results/large_full_trajectory.csv")
    export_origin_cloud_to_csv(particles, detection_time, "results/large_origin_cloud.csv")

    # Plotting code remains the same...
    fig, ax = plt.subplots(figsize=(12, 10))
    lons = trajectory["lon"]
    lats = trajectory["lat"]

    for i in range(0, 5000, 50):
        ax.plot(lons[:, i], lats[:, i], alpha=0.15, c='gray', linewidth=0.5)

    ax.scatter(lon_start, lat_start, s=200, c="red", marker="X", zorder=5, label="Detection (T=0)")
    ax.scatter(particles.lon, particles.lat, s=1, alpha=0.4, c="blue", zorder=3, label="Origin Cloud (T=-36h)")

    ax.set_title("36-Hour Backtrack through Complex Eddy & Storm Data")
    ax.set_xlabel("Longitude"); ax.set_ylabel("Latitude")
    ax.legend(); ax.grid(True, alpha=0.3)
    ax.set_xlim(68.0, 73.0)
    ax.set_ylim(18.0, 23.0)

    plt.tight_layout()
    plt.savefig("results/large_synthetic_test.png", dpi=200)
    print("\n✅ Simulation and Plot complete. Look at results/large_synthetic_test.png")
    plt.show()

if __name__ == "__main__":
    run_large_test()