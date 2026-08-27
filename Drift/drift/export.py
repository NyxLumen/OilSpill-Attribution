"""Export particle trajectories to CSV format and graphs to multiple formats."""

import pandas as pd
import numpy as np
import os

def export_trajectory_to_csv(trajectory, output_path="results/particle_trajectories.csv"):
    """
    Convert the trajectory dictionary into a flat CSV file.
    """
    times = trajectory["time"]
    lons = trajectory["lon"]
    lats = trajectory["lat"]
    masses = trajectory["mass"]

    n_timesteps, n_particles = lons.shape
    detection_time = times[0]

    rows = []

    for t_idx in range(n_timesteps):
        current_time = times[t_idx]
        hours_before = (detection_time - current_time).total_seconds() / 3600

        for p_idx in range(n_particles):
            rows.append({
                "particle_id": p_idx,
                "timestep": t_idx,
                "time": current_time,
                "longitude": float(lons[t_idx, p_idx]),
                "latitude": float(lats[t_idx, p_idx]),
                "mass": float(masses[t_idx, p_idx]),
                "hours_before_detection": round(hours_before, 2)
            })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)

    print(f"✅ Exported {len(df)} rows to {output_path}")
    print(f"   Particles: {n_particles}")
    print(f"   Timesteps: {n_timesteps}")
    print(f"   Time range: {times[0]} to {times[-1]}")

    return df


def export_origin_cloud_to_csv(particles, detection_time, output_path="results/origin_cloud.csv"):
    """
    Export just the final origin cloud (T = -X hours) as a simple CSV.
    """
    active = particles.get_active_mask()

    rows = []
    for i in range(particles.n):
        if active[i]:
            rows.append({
                "particle_id": i,
                "longitude": float(particles.lon[i]),
                "latitude": float(particles.lat[i]),
                "mass": float(particles.mass[i]),
                "water_fraction": float(particles.water_fraction[i]),
                "age_hours": particles.age_s[i] / 3600
            })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)

    print(f"✅ Exported origin cloud: {len(df)} active particles")
    print(f"   Saved to: {output_path}")
    print(f"   Lon range: {df['longitude'].min():.4f} to {df['longitude'].max():.4f}")
    print(f"   Lat range: {df['latitude'].min():.4f} to {df['latitude'].max():.4f}")

    return df


def export_plot_all_formats(fig, base_name="results/backtrack_plot", formats=None):
    """
    Save a matplotlib figure in multiple high-quality formats.

    Parameters
    ----------
    fig : matplotlib.figure.Figure
        The figure object to save
    base_name : str
        Base filename without extension (e.g., "results/my_plot")
    formats : list
        List of formats to save. Default: ['png', 'pdf', 'svg', 'eps', 'tiff']
    """
    if formats is None:
        formats = ['png', 'pdf', 'svg', 'eps', 'tiff']

    # Create results folder if it doesn't exist
    os.makedirs(os.path.dirname(base_name) if os.path.dirname(base_name) else ".", exist_ok=True)

    saved_files = []

    for fmt in formats:
        filepath = f"{base_name}.{fmt}"
        try:
            if fmt == 'tiff':
                # TIFF requires special handling for better compression
                fig.savefig(filepath, dpi=300, format='tiff', compression='tiff_lzw')
            else:
                fig.savefig(filepath, dpi=300, format=fmt)
            saved_files.append(filepath)
            print(f"   📄 Saved: {filepath}")
        except Exception as e:
            print(f"   ⚠️ Could not save {fmt}: {e}")

    print(f"\n✅ Plot exported in {len(saved_files)} formats: {', '.join(formats)}")
    return saved_files