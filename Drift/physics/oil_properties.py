"""Oil types and physical property lookup."""

OIL_TYPES = {
    "light_crude": {
        "density_kg_m3": 830,
        "viscosity_cst": 5.0,
        "evaporable_fraction": 0.45,
        "api_gravity": 38.0,
        "pour_point_c": -20,
        "description": "Light crude oil (e.g. Brent, WTI)",
    },
    "heavy_crude": {
        "density_kg_m3": 950,
        "viscosity_cst": 200.0,
        "evaporable_fraction": 0.15,
        "api_gravity": 17.0,
        "pour_point_c": 5,
        "description": "Heavy crude oil (e.g. Maya, Boscan)",
    },
    "diesel": {
        "density_kg_m3": 840,
        "viscosity_cst": 3.0,
        "evaporable_fraction": 0.60,
        "api_gravity": 36.0,
        "pour_point_c": -30,
        "description": "Marine diesel / gas oil",
    },
    "bunker_fuel": {
        "density_kg_m3": 990,
        "viscosity_cst": 3500.0,
        "evaporable_fraction": 0.05,
        "api_gravity": 11.0,
        "pour_point_c": 20,
        "description": "Heavy fuel oil (HFO / IFO 380)",
    },
}


def get_oil(oil_type="light_crude"):
    """Retrieve properties for a specific oil type."""
    if oil_type not in OIL_TYPES:
        raise KeyError(
            f"Unknown oil type '{oil_type}'. "
            f"Available types: {', '.join(OIL_TYPES.keys())}"
        )

    return OIL_TYPES[oil_type].copy()