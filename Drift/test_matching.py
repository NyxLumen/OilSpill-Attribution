"""
Complete test: Generate oil drift, create AIS, match them together.
"""

from datetime import datetime, timezone, timedelta
import numpy as np

try:
    print("=" * 70)
    print("🚢 COMPLETE OIL SPILL FORENSICS TEST")
    print("=" * 70)

    # ============================================
    # PART 1: Run Drift Simulation
    # ============================================
    print("\n📍 PART 1: Running drift simulation...")

    from drift.particle import ParticleSet
    from drift.physics.advection import advect_by_current, advect_by_wind
    from drift.physics.diffusion import apply_diffusion

    detection_lon, detection_lat = 70.5, 19.5
    detection_time = datetime(2026, 8, 26, 10, 0, tzinfo=timezone.utc)
    backtrack_hours = 36
    n_particles = 500
    dt = -900  # 15 min backward

    particles = ParticleSet(n_particles, detection_lon, detection_lat, seed_radius_m=500)

    n_steps = int(backtrack_hours * 3600 / abs(dt))
    times = [detection_time]
    lons = [particles.lon.copy()]
    lats = [particles.lat.copy()]

    current_time = detection_time

    for step in range(n_steps):
        active = particles.get_active_mask()

        particles.lon, particles.lat = advect_by_current(
            particles.lon, particles.lat,
            np.full(particles.n, 0.2), np.full(particles.n, -0.1),
            dt, active
        )

        particles.lon, particles.lat = advect_by_wind(
            particles.lon, particles.lat,
            np.full(particles.n, 5.0), np.full(particles.n, 2.0),
            dt, active
        )

        particles.lon, particles.lat = apply_diffusion(
            particles.lon, particles.lat, dt, active, diffusivity=20.0
        )

        current_time += timedelta(seconds=dt)
        times.append(current_time)
        lons.append(particles.lon.copy())
        lats.append(particles.lat.copy())

    print(f"✅ Drift complete: {len(times)} timesteps")

    origin_lon_mean = particles.lon.mean()
    origin_lat_mean = particles.lat.mean()

    print(f"   Detection: ({detection_lat:.2f}, {detection_lon:.2f})")
    print(f"   Origin: ({origin_lat_mean:.2f}, {origin_lon_mean:.2f})")

    # ============================================
    # PART 2: Generate AIS with Guilty Ship
    # ============================================
    print("\n🚢 PART 2: Generating AIS data...")

    from ais.generator import generate_synthetic_ais
    from ais.cleaner import clean_ais_data
    from ais.trajectory import reconstruct_trajectories

    start_time = detection_time - timedelta(hours=backtrack_hours)

    # Create guilty ship path
    from scipy.interpolate import interp1d
    guilty_lats = np.array([22.0, origin_lat_mean + 0.5, origin_lat_mean, origin_lat_mean - 0.5, 18.0])
    guilty_lons = np.array([68.0, origin_lon_mean - 0.5, origin_lon_mean, origin_lon_mean + 0.5, 73.0])

    t_orig = np.linspace(0, 1, 5)
    t_new = np.linspace(0, 1, 100)
    guilty_path = (
        interp1d(t_orig, guilty_lons, kind='linear')(t_new),
        interp1d(t_orig, guilty_lats, kind='linear')(t_new)
    )

    ais_df = generate_synthetic_ais(
        start_time=start_time,
        end_time=detection_time,
        lat_range=(18.0, 22.0),
        lon_range=(68.0, 73.0),
        n_ships=15,
        interval_minutes=15,
        seed=42,
        include_guilty_ship=True,
        guilty_path=guilty_path,
    )

    cleaned_ais = clean_ais_data(ais_df)
    trajectories = reconstruct_trajectories(cleaned_ais)

    # ============================================
    # PART 3: Match Oil to Ships
    # ============================================
    print("\n🔍 PART 3: Matching oil trajectory to ships...")

    from matching.matcher import VesselMatcher

    oil_trajectory = {
        'time': times,
        'lat': np.array(lats),
        'lon': np.array(lons),
    }

    matcher = VesselMatcher(
        weight_distance=0.5,
        weight_temporal=0.3,
        weight_course=0.2
    )

    ranked_candidates = matcher.match(
        oil_trajectory=oil_trajectory,
        ship_trajectories=trajectories,
        detection_time=detection_time,
        backtrack_hours=backtrack_hours
    )

    # ============================================
    # PART 4: Results
    # ============================================
    print("\n" + "=" * 70)
    print("📊 MATCHING RESULTS - TOP 5 CANDIDATES")
    print("=" * 70)

    print(ranked_candidates.head().to_string(index=False))

    guilty = matcher.find_guilty_ship(ranked_candidates, threshold_score=0.3)

    print("\n" + "=" * 70)
    print("🎯 MOST LIKELY GUILTY SHIP")
    print("=" * 70)

    if guilty:
        print(f"MMSI: {guilty['mmsi']}")
        print(f"Vessel Type: {guilty['vessel_type']}")
        print(f"Confidence: {guilty['confidence']}")
        print(f"Composite Score: {guilty['composite_score']:.4f}")
        print(f"Mean Distance: {guilty['mean_distance_km']:.2f} km")
        print(f"Min Distance: {guilty['min_distance_km']:.2f} km")
    else:
        print("No ship matches criteria")

    # ============================================
    # PART 5: Visualization
    # ============================================
    print("\n🎨 Creating final visualization...")

    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    ax1 = axes[0]
    lons_arr = np.array(lons)
    lats_arr = np.array(lats)

    for i in range(0, n_particles, 10):
        ax1.plot(lons_arr[:, i], lats_arr[:, i], 'b-', alpha=0.1, linewidth=0.5)

    ax1.scatter(detection_lon, detection_lat, s=200, c='red', marker='X',
                label='Detection', zorder=5, edgecolors='black', linewidths=2)
    ax1.scatter(particles.lon, particles.lat, s=5, c='blue', alpha=0.5,
                label='Origin Cloud', zorder=3)

    ax1.set_title('Oil Spill Backtracking', fontsize=14, fontweight='bold')
    ax1.set_xlabel('Longitude')
    ax1.set_ylabel('Latitude')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2 = axes[1]

    for mmsi, traj in trajectories.items():
        ax2.plot(traj['longitude'], traj['latitude'], 'gray', alpha=0.3, linewidth=1)

    top3 = ranked_candidates.head(3)
    colors = ['red', 'orange', 'yellow']

    for idx, (_, row) in enumerate(top3.iterrows()):
        mmsi = row['mmsi']
        if mmsi in trajectories:
            traj = trajectories[mmsi]
            ax2.plot(traj['longitude'], traj['latitude'],
                    color=colors[idx], linewidth=3, alpha=0.8,
                    label=f"Rank {idx+1}: MMSI {mmsi} ({row['composite_score']:.2f})")

    ax2.scatter(particles.lon, particles.lat, s=3, c='blue', alpha=0.3,
                label='Origin Cloud', zorder=2)

    ax2.set_title('Vessel Matching Results', fontsize=14, fontweight='bold')
    ax2.set_xlabel('Longitude')
    ax2.set_ylabel('Latitude')
    ax2.legend(loc='upper right')
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('results/full_matching_test.png', dpi=200)
    print("✅ Saved: results/full_matching_test.png")
    plt.show()

    print("\n" + "=" * 70)
    print("✅ COMPLETE PIPELINE TEST FINISHED")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()