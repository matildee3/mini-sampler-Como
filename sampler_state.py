# sampler_state.py: lo STATO del sampler (i parametri di ogni canale)
# e le regole per modificarlo. 

import numpy as np
import config #usa config.py

PARAMETER_LIMITS = {
    "gain": (0.0, 1.5),
    "rate": (0.5, 2.0),
    "pan": (-1.0, 1.0),
    "start": (0.0, 0.95),
    #FILTRO
    #"cutoff": (200.0, 10000.0),
}

sampler_state = [
    {"active": True, "gain": 0.70, "rate": 1.0, "pan": 0.0, "start": 0.0, 
     #FILTRO
     #"cutoff": 1000.0
     }
    for _ in range(config.N_CHANNELS)
]


def update_parameter(index, key, value):
    # Controlla che il valore sia nei limiti, poi lo salva.
    if key not in PARAMETER_LIMITS:
        raise ValueError(f"Parametro sconosciuto: {key}")
    low, high = PARAMETER_LIMITS[key]
    value = float(np.clip(value, low, high))
    sampler_state[int(index)][key] = value
    return value


def update_active(index, active):
    sampler_state[int(index)]["active"] = bool(active)



# randomizer: sceglie valori casuali per tutti i canali

RANDOM_RANGES = {
    "gain": (0.15, 1.0),
    "rate": (0.65, 1.60),
    "pan": (-1.0, 1.0),
    "start": (0.0, 0.75),
    #FILTRO
    #"cutoff": (500.0, 10000.0),
}


def randomize_all():
    for channel in sampler_state:
        for key, (low, high) in RANDOM_RANGES.items():
            channel[key] = float(np.random.uniform(low, high))
