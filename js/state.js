const appState = {
  mode: null,   // "sparse" | "dense" | null
  graph: null,  // set once generateGraph() succeeds
  history: [],   // array of [from, to] edges added
};

function selectMode(mode) {
  if (appState.graph !== null) return;
  appState.mode = mode;

  document.getElementById("mode-sparse-btn").classList.toggle("active", mode === "sparse");
  document.getElementById("mode-dense-btn").classList.toggle("active", mode === "dense");
  document.getElementById("mode-status").textContent = `Mode: ${mode}`;
}

function lockModeSelection() {
  document.getElementById("mode-sparse-btn").disabled = true;
  document.getElementById("mode-dense-btn").disabled = true;
}
