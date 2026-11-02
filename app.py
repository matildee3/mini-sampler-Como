# app.py: il punto di partenza. Avvia il server e collega
# ogni indirizzo (URL) alla funzione di handlers.py che risponde.
# Per partire:   python app.py     poi apri http://127.0.0.1:5001
from flask import Flask
import handlers

app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0   # niente cache: vedi subito le modifiche a JS e CSS

#                 indirizzo               funzione
app.add_url_rule("/",                      view_func=handlers.home)
app.add_url_rule("/api/state",             view_func=handlers.get_state)
app.add_url_rule("/api/audio/<int:index>", view_func=handlers.get_audio)
app.add_url_rule("/api/parameter",         view_func=handlers.set_parameter, methods=["POST"])
app.add_url_rule("/api/active",            view_func=handlers.set_active,    methods=["POST"])
app.add_url_rule("/api/randomize",         view_func=handlers.randomize,     methods=["POST"])

if __name__ == "__main__":
    print("Pronto! Apri http://127.0.0.1:5001 nel browser.")
    app.run(port=5001)



#tutti i file vengono convertiti in mono a 22.050 Hz, quindi le frequenze oltre ~11 kHz si perdono e un file stereo diventa mono