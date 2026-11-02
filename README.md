# Mini Sampler

Un sampler a 8 canali che gira nel browser.

- **Python è il cervello:** carica i suoni, tiene lo stato di ogni canale, controlla i valori e sceglie i numeri casuali.
- **Il browser è la faccia:** mostra gli slider e produce il suono.

---

## 1. Come si avvia

```
pip install -r requirements.txt
python app.py
```

Poi apri **http://127.0.0.1:5000** nel browser e premi **Start Audio**.

Se modifichi un file `.py`, ferma il programma con `Ctrl+C` e rilancia `python app.py`.
Se modifichi HTML, CSS o JavaScript, basta ricaricare la pagina.

---

## 2. I suoni

### Scegliere da dove arrivano

Apri `config.py`. Ci sono due righe: **tieni attiva una sola** (togli il `#` a una e mettilo all'altra).

```python
SOUND_SOURCE = "default"       # i suoni di esempio di librosa
# SOUND_SOURCE = "folder"      # i tuoi file nella cartella audio/
```

- `"default"`: otto suoni di esempio di librosa. La prima volta vengono scaricati, quindi serve internet.
- `"folder"`: i tuoi file, presi dalla cartella `audio/`.

Dopo ogni cambio di `config.py`, riavvia `python app.py`.

### Usare i tuoi file

1. Metti **fino a 8 file** nella cartella `audio/`, direttamente dentro (non in sottocartelle).
2. Formati accettati: `.wav .mp3 .flac .ogg .aif .aiff`.
3. I file vengono letti in **ordine alfabetico**. Per decidere l'ordine dei canali chiamali `1_kick.wav`, `2_voce.wav`, ...
4. Attiva la riga `"folder"` in `config.py` e riavvia.

All'avvio il terminale scrive l'elenco dei suoni caricati, per esempio:

```
Suoni caricati: ['1_kick', '2_voce', '3_bass', ...]
```

I file con un formato non supportato, i file nascosti e quelli che non si riescono a leggere vengono **ignorati**, e il terminale dice quali.

### Cosa succede ai tuoi file

| Caso | Cosa fa il programma |
|---|---|
| Meno di 8 file | i canali che mancano restano in silenzio (`vuoto_6`, `vuoto_7`, ...) |
| Più di 8 file | vengono usati solo i primi 8 (in ordine alfabetico) |
| File lunghissimo (es. 20 minuti) | viene letto solo il **primo minuto**; il limite è `MAX_SECONDS` in `config.py` |
| File corto (es. 2 secondi) | resta di 2 secondi: il limite è un tetto, non una durata fissa |
| File stereo | diventa **mono**: il pan agisce poi su quel canale mono |
| Qualsiasi frequenza di campionamento | viene portato a **22.050 Hz** (le frequenze sopra ~11 kHz non ci sono più) |

---

## 3. Come suona ogni canale

Ogni canale ha quattro slider e una casella:

| Controllo | Cosa fa | Limiti |
|---|---|---|
| **Attivo** | accende o spegne il canale | sì / no |
| **gain** | il volume | 0 – 1,5 |
| **rate** | velocità di lettura (cambia anche l'altezza) | 0,5 – 2 |
| **pan** | posizione tra sinistra (−1) e destra (+1) | −1 – 1 |
| **start** | punto da cui il suono parte e ripete | 0 – 0,95 |

**Ogni canale va in loop.** Il suono parte dal punto *start*, arriva alla fine e **torna al punto start** (non all'inizio del file).

- Con `start = 0` gira tutto il file.
- Con `start` più alto, la parte prima di quel punto si sente solo la prima volta.
- Un file molto breve (pochi decimi di secondo) ripetuto in loop diventa quasi un tono.
- Il loop è "secco", senza dissolvenza: se l'inizio e la fine del suono non combaciano si può sentire un piccolo click quando riparte.

I valori di *start* sono una frazione della durata del file **dopo il taglio a 60 secondi**.

---

## 4. Com'è fatto il progetto

```
mini_sampler/
├── app.py               avvia il server e collega gli indirizzi alle funzioni
├── config.py            le impostazioni
├── samples.py           legge i file audio e li prepara per il browser
├── sampler_state.py     lo stato dei canali, i limiti e i valori casuali
├── handlers.py          le funzioni che rispondono al browser
├── requirements.txt     le librerie da installare
├── audio/               qui vanno i tuoi file
├── templates/
│   └── index.html       la struttura della pagina
└── static/
    ├── css/style.css    l'aspetto
    └── js/main.js       tutto il lato browser
```

| File | Compito | Linguaggio |
|---|---|---|
| `config.py` | da dove prendere i suoni, quanti canali, durata massima | Python |
| `samples.py` | legge i file audio (di esempio o dalla cartella) e li trasforma in WAV per il browser | Python |
| `sampler_state.py` | lo stato di ogni canale, i limiti dei parametri, i valori casuali | Python |
| `handlers.py` | carica i suoni all'avvio e risponde alle richieste del browser | Python |
| `app.py` | avvia il server e collega ogni indirizzo (URL) alla sua funzione | Python |
| `templates/index.html` | la struttura della pagina | HTML |
| `static/css/style.css` | colori e disposizione | CSS |
| `static/js/main.js` | comunica con Python, produce il suono, disegna gli slider | JavaScript |

`main.js` è un unico file diviso in **quattro parti**, ognuna con il suo titolo:

1. **PYTHON:** l'unica parte che parla con il server
2. **AUDIO:** l'unica parte che produce suono
3. **INTERFACCIA:** l'unica parte che disegna e legge gli slider
4. **COLLEGAMENTO:** decide chi parla con chi

---

## 5. Come si parlano i file

```
   BROWSER (tutto in main.js)                 |            PYTHON
                                              |
   INTERFACCIA <--> COLLEGAMENTO --- richieste ---> app.py
                         |            <-- risposte --    |
                       AUDIO                         handlers.py
                                              |       /        \
                                              |  sampler_state.py  samples.py
                                              |                       |
                                              |                    config.py
```

`COLLEGAMENTO` è il direttore d'orchestra: riceve gli eventi dell'interfaccia, dà gli ordini all'audio e parla con Python (con le funzioni della parte PYTHON di `main.js`).

Gli indirizzi tra browser e Python sono tutti elencati in `app.py`:

| Indirizzo | Cosa fa |
|---|---|
| `/` | manda la pagina |
| `/api/state` | manda lo stato dei canali e i limiti dei parametri |
| `/api/audio/<n>` | manda il suono del canale *n* |
| `/api/parameter` | riceve un valore da uno slider |
| `/api/active` | riceve lo stato della casella "Attivo" |
| `/api/randomize` | sceglie nuovi valori casuali e li rimanda |

**Quando apri la pagina**
1. `main.js` chiede a Python lo stato (`/api/state`)
2. Python risponde con i limiti e i valori di ogni canale
3. `main.js` disegna gli slider usando proprio questi limiti: **gli slider sono costruiti da quello che dice Python**

**Quando muovi uno slider**
1. `main.js` si accorge dello slider
2. Cambia il suono **subito**, senza aspettare Python
3. Manda il valore a Python (`/api/parameter`)
4. `sampler_state.py` controlla che sia nei limiti (se non lo è, lo corregge) e lo salva

**Quando premi Randomise All**
1. `main.js` chiede a Python (`/api/randomize`)
2. `sampler_state.py` sceglie i nuovi numeri casuali
3. `handlers.py` rimanda lo stato nuovo
4. `main.js` sposta gli slider e cambia il suono

---

## 6. Da provare

### Cambiare l'aspetto
In cima a `static/css/style.css` ci sono i colori (`--accento`, `--sfondo`, ...). Cambiali e ricarica la pagina.

### Cambiare i numeri casuali
In `sampler_state.py` cambia gli intervalli di `RANDOM_RANGES`. Per esempio, per un `rate` solo verso il basso: `"rate": (0.5, 1.0)`.

### Cambiare i limiti degli slider
In `sampler_state.py` cambia `PARAMETER_LIMITS`. Riavvia: gli slider si adattano da soli.

### Aggiungere un filtro passa-basso

Un nuovo parametro `cutoff` per ogni canale. Python decide il parametro e i suoi limiti; il browser lo applica al suono.

**In `sampler_state.py` (3 righe)**
- in `PARAMETER_LIMITS` aggiungi `"cutoff": (200.0, 10000.0),`
- nello stato iniziale di ogni canale aggiungi `"cutoff": 10000.0` (filtro tutto aperto)
- in `RANDOM_RANGES` aggiungi `"cutoff": (500.0, 10000.0),`

**In `main.js` (5 punti)**
1. nella parte INTERFACCIA: `const KEYS = ["gain", "rate", "pan", "start", "cutoff"];`
2. in `startVoice`, dopo `const pan = ...`:
   ```js
   const filter = ctx.createBiquadFilter();
   filter.type = "lowpass";
   filter.frequency.value = s.cutoff;
   ```
3. nella catena: `source.connect(filter).connect(gain).connect(pan).connect(master);`
4. `voices[index] = { source, gain, pan, filter };`
5. in `applyParameter` aggiungi: `if (key === "cutoff") voice.filter.frequency.setTargetAtTime(value, now, 0.015);`

`handlers.py` e `app.py` **non cambiano**: controllano e salvano i parametri in modo generico.

---

## 7. Se qualcosa non va

**Il programma non parte**
- Leggi l'ultima riga del messaggio nel terminale.
- Controlla di aver installato le librerie: `pip install -r requirements.txt`.
- Se hai scelto `"folder"`, controlla che in `audio/` ci sia almeno un file valido.

**Mancano dei suoni**
Apri **http://127.0.0.1:5000/api/state** nel browser. Ogni `"name"` è un suono caricato da Python.
- Compaiono nomi come `vuoto_5`? Python ha trovato meno di 8 file validi. Guarda nel terminale quali sono stati ignorati e perché.
- Se Python ha caricato tutto ma nel browser qualcosa non va, premi **F12**, apri la scheda **Console** e cerca un messaggio rosso.

**Dopo una modifica non cambia nulla**
- File `.py`: riavvia `python app.py`.
- HTML, CSS, JavaScript: ricarica la pagina con `Ctrl+Maiusc+R` (su Mac `Cmd+Maiusc+R`).

**Non si sente niente**
- Hai premuto **Start Audio**? Il browser non suona finché non clicchi.
- Controlla che i canali abbiano la casella **Attivo** e che `gain` non sia a zero.