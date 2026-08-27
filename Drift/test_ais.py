"""Test the AIS module with a guilty ship that passes through origin region."""

from datetime import datetime, timezone
import numpy as np
import matplotlib.pyplot as plt

from ais.generator import generate_synthetic_ais, save_ais_to_csv
from ais.cleaner import clean_ais_data
from ais.trajectory import reconstruct_trajectories
from ais.interpolate import resample_all_trajectories

print("=" * 60)
print("AIS DATA GENERATION TEST")
print("=" * 60)

# Time range
start_time = datetime(2026, 8, 24, 10, 0, tzinfo=timezone.utc)
end_time = datetime(2026, 8, 26, 10, 0, tzinfo=timezone.utc)

# Origin region (where oil was dumped)
origin_lat = 19.5
origin_lon = 70.5

# Create a guilty ship path that DEFINITELY passes through origin region
# Ship starts at top-left, passes through origin, ends at bottom-right
guilty_lats = np.array([22.0, 20.0, origin_lat, 19.0, 18.0])  # Passes THROUGH origin_lat
guilty_lons = np.array([68.0, 69.0, origin_lon, 71.0, 73.0])  # Passes THROUGH origin_lon

# Interpolate to get more points
from scipy.interpolate import interp1d
t_original = np.linspace(0, 1, len(guilty_lats))
t_new = np.linspace(0, 1, 100)
lat_interp = interp1d(t_original, guilty_lats, kind='linear')
lon_interp = interp1d(t_original, guilty_lons, kind='linear')

guilty_path = (lon_interp(t_new), lat_interp(t_new))

print(f"Origin region: ({origin_lat}, {origin_lon})")
print(f"Guilty path starts: ({guilty_path[1][0]:.2f}, {guilty_path[0][0]:.2f})")
print(f"Guilty path middle: ({guilty_path[1][50]:.2f}, {guilty_path[0][50]:.2f})")
print(f"Guilty path ends: ({guilty_path[1][-1]:.2f}, {guilty_path[0][-1]:.2f})")

# Generate AIS
print("\n📡 Generating synthetic AIS data...")
ais_df = generate_synthetic_ais(
    start_time=start_time,
    end_time=end_time,
    lat_range=(18.0, 22.0),
    lon_range=(68.0, 73.0),
    n_ships=20,
    interval_minutes=15,
    seed=42,
    include_guilty_ship=True,
    guilty_path=guilty_path,
)

# Save
save_ais_to_csv(ais_df, "data/ais/synthetic_ais.csv")

# Clean
cleaned_ais = clean_ais_data(ais_df)

# Reconstruct
trajectories = reconstruct_trajectories(cleaned_ais)

# Resample
resampled = resample_all_trajectories(trajectories, interval_minutes=15)

# Find the guilty ship MMSI (should be first alphabetically in our generation)
# The generator creates MMSI like 100000XXX for ship_idx=0
guilty_mmsi = ais_df[ais_df['vessel_type'] == 'tanker']['mmsi'].iloc[0]
print(f"\n🎯 Expected guilty ship MMSI: {guilty_mmsi}")

# Plot
print("\n🎨 Creating plot...")
fig, ax = plt.subplots(figsize=(14, 10))

# Plot origin region (larger and more visible)
circle = plt.Circle((origin_lon, origin_lat), 0.5, color='orange', alpha=0.4, label='Origin Region (Dump Site)')
ax.add_patch(circle)
ax.plot(origin_lon, origin_lat, 'X', color='darkorange', markersize=15, markeredgewidth=3, label='Dump Site Center')

colors = plt.cm.tab20(range(20))

guilty_plotted = False
for idx, (mmsi, traj) in enumerate(trajectories.items()):
    is_guilty = (mmsi == guilty_mmsi)

    if is_guilty:
        color = 'red'
        alpha = 1.0
        linewidth = 4.0
        label = f'GUILTY SHIP (MMSI: {mmsi})'
        guilty_plotted = True
        print(f"   Plotting guilty ship: {mmsi}")
    else:
        color = colors[idx % 20]
        alpha = 0.5
        linewidth = 1.0
        label = None

    ax.plot(traj["longitude"], traj["latitude"],
            color=color, alpha=alpha, linewidth=linewidth, label=label)

if not guilty_plotted:
    print("   ⚠️ WARNING: Guilty ship not found in trajectories!")

ax.set_xlabel("Longitude (°E)", fontsize=12)
ax.set_ylabel("Latitude (°N)", fontsize=12)
ax.set_title("Synthetic Ship Trajectories\n🔴 Red = Guilty Ship | 🟠 Orange = Oil Dump Site", fontsize=14)
ax.legend(loc='upper right', fontsize=10)
ax.grid(True, alpha=0.3)
ax.set_xlim(67, 74)
ax.set_ylim(17, 23)

plt.tight_layout()
plt.savefig("results/ais_trajectories.png", dpi=200)
print("\n✅ Saved: results/ais_trajectories.png")
plt.show()