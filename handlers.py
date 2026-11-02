# handlers.py: le funzioni che rispondono alle richieste del browser.
# Ogni funzione e' collegata a un indirizzo in app.py.
# Usa: samples.py, sampler_state.py
from flask import render_template, request, jsonify, Response
import samples
import sampler_state

# All'avvio: carico i suoni e li preparo per il browser (una volta sola).
SAMPLES = samples.load_samples()
NAMES = [s["name"] for s in SAMPLES]
WAV_FILES = [samples.to_wav_bytes(s["audio"]) for s in SAMPLES]
print("Suoni caricati:", NAMES)


def build_payload():
    # Il pacchetto che Python manda al browser: limiti + stato dei canali.
    channels = []
    for name, state in zip(NAMES, sampler_state.sampler_state):
        channels.append({"name": name, **state})
    return {"limits": sampler_state.PARAMETER_LIMITS, "channels": channels}


def home():
    return render_template("index.html")


def get_state():
    return jsonify(build_payload())


def get_audio(index):
    return Response(WAV_FILES[index], mimetype="audio/wav")


def set_parameter():
    data = request.get_json()
    value = sampler_state.update_parameter(data["index"], data["key"], data["value"])
    return jsonify({"value": value})


def set_active():
    data = request.get_json()
    sampler_state.update_active(data["index"], data["active"])
    return jsonify({"ok": True})


def randomize():
    sampler_state.randomize_all()
    return jsonify(build_payload())