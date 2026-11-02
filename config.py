# config.py: tutte le impostazioni in un posto solo.
# Chi lo legge: samples.py, wav_encoder.py, sampler_state.py
from pathlib import Path

SAMPLE_RATE = 22050      # campioni al secondo
N_CHANNELS = 8          # quanti canali ha il sampler
MAX_SECONDS = 60         # ogni suono viene tagliato a questa durata

# ----- DA DOVE PRENDIAMO I SUONI? -----
# Tieni attiva UNA sola delle due righe (l'altra resta con il #).

SOUND_SOURCE = "default"       # i suoni di esempio di librosa
#SOUND_SOURCE = "folder"      # i tuoi file nella cartella audio/

AUDIO_FOLDER = Path(__file__).parent / "audio"

DEFAULT_SAMPLES = [
    "trumpet", "brahms", "choice", "nutcracker",
    "vibeace", "fishin", "humpback", "robin", "pistachio", "snare"
]

# altri posssibili samples: "pistachio", "snare" https://librosa.org/doc/main/recordings.html