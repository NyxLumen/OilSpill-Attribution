"""Weathering processes: evaporation, dispersion, emulsification."""

import numpy as np
from config.settings import (
    EVAPORATION_RATE,
    DISPERSION_RATE,
    EMULSIFICATION_MAX,
    EMULSIFICATION_RATE,
)

def apply_evaporation(mass, age_s, dt, active, oil_props, wind_speed=None):
    """Simple first-order evaporation model based on oil type and wind speed."""
    mass_new = mass.copy()

    evap_fraction = oil_props.get("evaporable_fraction", 0.45)
    rate = EVAPORATION_RATE

    if wind_speed is not None:
        rate *= (1.0 + 0.04 * wind_speed[active])

    remaining_evaporable = np.maximum(0, mass[active] - (1.0 - evap_fraction))
    evap_amount = rate * abs(dt) * remaining_evaporable

    mass_new[active] -= evap_amount
    mass_new = np.maximum(mass_new, 0.0)

    return mass_new

def apply_dispersion(mass, dt, active, wind_speed=None):
    """Natural dispersion — oil breaking into droplets; increases with wind/waves."""
    mass_new = mass.copy()

    rate = DISPERSION_RATE
    if wind_speed is not None:
        rate *= (1.0 + 0.1 * wind_speed[active] ** 2)

    disp_amount = rate * abs(dt) * mass[active]
    mass_new[active] -= disp_amount
    mass_new = np.maximum(mass_new, 0.0)

    return mass_new

def apply_emulsification(water_fraction, dt, active, wind_speed=None):
    """Water-in-oil emulsification. Water fraction increases toward a max cap."""
    wf_new = water_fraction.copy()

    rate = EMULSIFICATION_RATE
    if wind_speed is not None:
        rate *= (1.0 + 0.02 * wind_speed[active])

    remaining_capacity = EMULSIFICATION_MAX - water_fraction[active]
    remaining_capacity = np.maximum(remaining_capacity, 0)

    increase = rate * abs(dt) * remaining_capacity
    wf_new[active] += increase
    wf_new = np.minimum(wf_new, EMULSIFICATION_MAX)

    return wf_new