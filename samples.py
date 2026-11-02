# samples.py: carica i suoni e li restituisce come liste di numeri.


import numpy as np
import librosa
import config #usa config.py
import io
import soundfile as sf


AUDIO_EXTENSIONS = (".wav", ".mp3", ".flac", ".ogg", ".aif", ".aiff")


def load_file(path):
    audio, _ = librosa.load(path, sr=config.SAMPLE_RATE, mono=True,
                            duration=config.MAX_SECONDS)
    return audio


def load_default_samples():
    # I suoni di esempio di librosa (la prima volta vengono scaricati).
    return [{"name": name, "audio": load_file(librosa.ex(name))}
            for name in config.DEFAULT_SAMPLES]


def load_folder_samples():
    # I file che hai messo nella cartella audio/ (al massimo 8).
    files = sorted(f for f in config.AUDIO_FOLDER.iterdir()
                   if f.suffix.lower() in AUDIO_EXTENSIONS)
    if not files:
        raise FileNotFoundError("Nessun file audio nella cartella audio/")
    return [{"name": f.stem, "audio": load_file(f)}
            for f in files[:config.N_CHANNELS]]


def fill_empty_channels(samples):
    # Se i suoni sono meno di 8, i canali mancanti restano in silenzio.
    while len(samples) < config.N_CHANNELS:
        silence = np.zeros(config.SAMPLE_RATE, dtype=np.float32)
        samples.append({"name": f"vuoto_{len(samples) + 1}", "audio": silence})
    return samples


def load_samples():
    if config.SOUND_SOURCE == "folder":
        samples = load_folder_samples()
    else:
        samples = load_default_samples()
    return fill_empty_channels(samples)


#wav_encoder: trasforma una lista di numeri in un file WAV che il browser sa leggere
def to_wav_bytes(audio):
    buffer = io.BytesIO()
    sf.write(buffer, audio, config.SAMPLE_RATE, format="WAV")
    return buffer.getvalue()