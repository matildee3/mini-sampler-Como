// main.js: tutto il lato browser in un solo file, diviso in 4 parti.
//   1. PYTHON         parla con il server
//   2. AUDIO          produce il suono (Web Audio)
//   3. INTERFACCIA    disegna e legge gli slider
//   4. COLLEGAMENTO   decide chi parla con chi


// ======================================================
// 1. PYTHON: l'unica parte che parla con il server.
//    Ogni funzione corrisponde a un indirizzo di app.py.
// ======================================================

async function post(url, data) {
  const reply = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return reply.json();
}

async function getState() {
  const reply = await fetch("/api/state");
  return reply.json();            // { limits, channels }
}

async function getAudio(index) {
  const reply = await fetch(`/api/audio/${index}`);
  return reply.arrayBuffer();     // i byte del file WAV
}

function sendParameter(index, key, value) {
  return post("/api/parameter", { index, key, value });
}

function sendActive(index, active) {
  return post("/api/active", { index, active });
}

function requestRandomize() {
  return post("/api/randomize", {});   // Python sceglie i nuovi valori
}


// ======================================================
// 2. AUDIO: l'unica parte che produce suono.
//    Non sa nulla di Python ne' degli slider.
// ======================================================

let ctx = null;          // il "motore audio" del browser
let master = null;       // volume generale
let buffers = [];        // i suoni decodificati
let voices = [];         // i canali che stanno suonando

function isRunning() { return ctx !== null; }

function startEngine() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.connect(ctx.destination);
}

function stopEngine() {
  voices.forEach((_, i) => stopVoice(i));
  ctx.close();
  ctx = null;
  buffers = [];
}

async function loadBuffer(index, wavBytes) {
  buffers[index] = await ctx.decodeAudioData(wavBytes);
}

function stopVoice(index) {
  if (voices[index]) {
    voices[index].source.stop();
    voices[index] = null;
  }
}

function startVoice(index, s) {
  stopVoice(index);
  if (!s.active || !buffers[index]) return;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  //FILTRO

//   const filter = ctx.createBiquadFilter();
//   filter.type = "lowpass";
//   filter.frequency.value = s.cutoff;

  source.buffer = buffers[index];
  source.loop = true;
  source.playbackRate.value = s.rate;
  gain.gain.value = s.gain;
  pan.pan.value = s.pan;

  const offset = Math.min(s.start * source.buffer.duration, source.buffer.duration - 0.01);
  source.loopStart = offset;
  source.loopEnd = source.buffer.duration;

   //FILTRO
  source.connect(gain).connect(pan).connect(master);
  //source.connect(filter).connect(gain).connect(pan).connect(master);
  source.start(0, offset);
  //FILTRO
  voices[index] = { source, gain, pan };
  // voices[index] = { source, gain, pan, filter };
}

// Cambia un parametro mentre il suono sta suonando.
function applyParameter(index, key, value, s) {
  const voice = voices[index];
  if (!voice) return;
  const now = ctx.currentTime;
  if (key === "gain") voice.gain.gain.setTargetAtTime(value, now, 0.015);
  if (key === "rate") voice.source.playbackRate.setTargetAtTime(value, now, 0.015);
  if (key === "pan")  voice.pan.pan.setTargetAtTime(value, now, 0.015);
  //FILTRO
//   if (key === "cutoff") voice.filter.frequency.setTargetAtTime(value, now, 0.015);
  if (key === "start") startVoice(index, s);   // il punto di partenza richiede di ripartire
}


// ======================================================
// 3. INTERFACCIA: l'unica parte che tocca gli slider.
//    Non sa nulla di audio ne' di Python.
// ======================================================

const container = document.getElementById("channels");
//FILTRO
const KEYS = ["gain", "rate", "pan", "start"];
// const KEYS = ["gain", "rate", "pan", "start", "cutoff"];

function sliderHtml(index, key, limits, value) {
  const [min, max] = limits[key];
  return `
    <div class="control">
      <label>${key} <span id="${key}-${index}-value">${value.toFixed(2)}</span></label>
      <input type="range" min="${min}" max="${max}" step="0.01" value="${value}"
             data-index="${index}" data-key="${key}">
    </div>`;
}

function buildChannels(data, onSlider, onActive) {
  data.channels.forEach((channel, i) => {
    const card = document.createElement("div");
    card.className = "channel";
    card.innerHTML = `
      <div class="channel-name"></div>
      <label><input type="checkbox" class="active" data-index="${i}"> Attivo</label>
      ${KEYS.map(key => sliderHtml(i, key, data.limits, channel[key])).join("")}`;
    card.querySelector(".channel-name").textContent = `${i + 1}. ${channel.name}`;
    container.appendChild(card);
  });

  container.addEventListener("input", event => {
    const el = event.target;
    if (el.type !== "range") return;
    const value = Number(el.value);
    document.getElementById(`${el.dataset.key}-${el.dataset.index}-value`).textContent = value.toFixed(2);
    onSlider(Number(el.dataset.index), el.dataset.key, value);
  });

  container.addEventListener("change", event => {
    const el = event.target;
    if (el.type === "checkbox") onActive(Number(el.dataset.index), el.checked);
  });

  showState(data.channels);
}

// Mette sugli slider e sulle caselle i valori ricevuti.
function showState(channels) {
  channels.forEach((channel, i) => {
    container.querySelector(`.active[data-index="${i}"]`).checked = channel.active;
    KEYS.forEach(key => {
      container.querySelector(`input[data-index="${i}"][data-key="${key}"]`).value = channel[key];
      document.getElementById(`${key}-${i}-value`).textContent = channel[key].toFixed(2);
    });
  });
}


// ======================================================
// 4. COLLEGAMENTO: qui si vede chi parla con chi.
// ======================================================

let state = [];   // copia dello stato: la "verita'" resta in Python

// All'apertura: chiedo a Python lo stato e disegno gli slider.
async function init() {
  const data = await getState();
  state = data.channels;
  buildChannels(data, onSlider, onActive);
}

// Muovo uno slider: il suono cambia SUBITO, poi avviso Python.
function onSlider(index, key, value) {
  state[index][key] = value;
  if (isRunning()) applyParameter(index, key, value, state[index]);
  sendParameter(index, key, value);
}

function onActive(index, active) {
  state[index].active = active;
  if (isRunning()) startVoice(index, state[index]);
  sendActive(index, active);
}

// Randomise: e' PYTHON a scegliere i numeri. Il browser li mostra e li suona.
document.getElementById("randomButton").addEventListener("click", async () => {
  const data = await requestRandomize();
  state = data.channels;
  showState(state);
  if (isRunning()) state.forEach((s, i) => startVoice(i, s));
});

// Start / Stop audio (il browser vuole un click prima di suonare).
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", async () => {
  if (isRunning()) {
    stopEngine();
    startButton.textContent = "Start Audio";
    return;
  }
  startButton.disabled = true;
  startEngine();
  for (let i = 0; i < state.length; i++) {
    await loadBuffer(i, await getAudio(i));   // scarico i suoni da Python
  }
  state.forEach((s, i) => startVoice(i, s));
  startButton.textContent = "Stop Audio";
  startButton.disabled = false;
});

init();