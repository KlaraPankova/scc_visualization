function clearSession() {
  currentSteps = null;
  setSteppingUI(false);
}

function generateGraph() {
    if (appState.mode === null) {
        alert("Please select a mode first.");
        return;
    }
    
    const n = parseInt(document.getElementById("nodeInput").value, 10);
    if (!Number.isInteger(n) || n <= 0) return;

    appState.history = [];
    appState.graph = createGraph(appState.mode, n);

    clearSession();
    lockModeSelection();
    redraw();
}

function resetGraph() {

    document.getElementById("mode-sparse-btn").disabled = false;
    document.getElementById("mode-dense-btn").disabled = false;
    document.getElementById("mode-sparse-btn").classList.remove("active");
    document.getElementById("mode-dense-btn").classList.remove("active");
    document.getElementById("mode-status").textContent = "No mode selected";
    if (cy) cy.elements().remove();
    appState.graph = null;
    appState.mode = null;
    appState.history = [];
    clearSession();
    // document.getElementById("log-panel").innerHTML = "";
}

let currentSteps = null;

function addEdge() {
    if (!appState.graph) {
        alert("Please generate a graph first.");
        return;
    }
    if (currentSteps !== null) {
        alert("Please finish the current edge addition before adding a new edge.");
        return;
    }
    const from = parseInt(document.getElementById("sourceNode").value, 10);
    const to = parseInt(document.getElementById("targetNode").value, 10);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    if (from === to) {
        alert("Self-loops are not allowed.");
        return;
    }
    currentSteps = appState.graph.addEdgeSteps(from, to);
    setSteppingUI(true);
    advanceStep(from, to);
    appState.history.push([from, to]);
}

function addEdgeFast() {
  if (!appState.graph) {
    alert("Generate a graph first.");
    return;
  }
  if (currentSteps !== null) {
    alert("Finish the current edge insertion before adding another.");
    return;
  }

  const from = parseInt(document.getElementById("sourceNode").value, 10);
  const to = parseInt(document.getElementById("targetNode").value, 10);
  const n = appState.graph.vertices.length;

  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= n || to < 0 || to >= n) {
    alert(`Nodes must be integers between 0 and ${n - 1}.`);
    return;
  }
  if (from === to) {
    alert("Self-loops aren't supported by this algorithm.");
    return;
  }

  runToCompletion(appState.graph.addEdgeSteps(from, to), from, to);
  appState.history.push([from, to]);
}


function runToCompletion(generator, from, to) {
  let result = generator.next();
  while (!result.done) {
    if (result.value.message) logMessage(result.value.message);
    result = generator.next();
  }
  addEdgeToCy(from, to);
  updateNodeLabels();
  if(result.value === true){
    relayoutClusters();
  }
}

function nextStep() {
    const from = parseInt(document.getElementById("sourceNode").value, 10);
    const to = parseInt(document.getElementById("targetNode").value, 10);
    advanceStep(from, to);
}

function advanceStep(from, to) {
    const result = currentSteps.next();
    updateNodeLabels();
    if (result.done) {
        currentSteps = null;
        setSteppingUI(false);
        addEdgeToCy(from, to);
        if(result.value === true) relayoutClusters();
        return;
    }
    const step = result.value;
    if (step.redraw) {
        addEdgeToCy(from, to);
        relayoutClusters();
    } else {
        applyStepToRender(step);
    }
    if (step.message) logMessage(step.message);
}

function setSteppingUI(isStepping){
    document.getElementById("add-edge-btn").disabled = isStepping;
    document.getElementById("add-edge-fast-btn").disabled = isStepping;
    document.getElementById("next-step-bnt").disabled = !isStepping;
    document.getElementById("sourceNode").disabled = isStepping;
    document.getElementById("targetNode").disabled = isStepping;
}

function logMessage(text){
    const panel = document.getElementById("log-panel");
    const entry = document.createElement("div");
    entry.textContent = text;
    panel.appendChild(entry);
    panel.scrollTop = panel.scrollHeight;
}

function buildExampleSnippet() {
  const edges = appState.history.map(([a, b]) => `[${a}, ${b}]`).join(", ");
  return [
    "  {",
    `    id: "",`,
    `    name: "",`,
    `    description: "",`,
    `    mode: "${appState.mode}",`,
    `    n: ${appState.graph.vertices.length},`,
    `    edges: [${edges}],`,
    `    suggestedEdge: null,`,
    "  },",
  ].join("\n");
}

async function exportExample() {
  if (!appState.graph) {
    alert("Generate a graph first.");
    return;
  }
  const snippet = buildExampleSnippet();
  const box = document.getElementById("export-output");
  const status = document.getElementById("export-status");

  box.value = snippet;
  box.hidden = false;
  box.select();

  try {
    await navigator.clipboard.writeText(snippet);
    status.textContent = "Copied to clipboard.";
  } catch (e) {
    status.textContent = "Press Ctrl+C to copy the selected text.";
  }
}

function createGraph(mode, n) {
  return mode === "sparse" ? new SparseGraph(n) : new DenseGraph(n);
}


function drain(generator) {
  let result = generator.next();
  while (!result.done) result = generator.next();
  return result.value;
}

function loadExample(id) {
  if (appState.graph !== null) {
    alert("Reset the graph before loading an example.");
    return;
  }
  const ex = EXAMPLES.find((e) => e.id === id);
  if (!ex) return;
  if (ex.mode !== appState.mode) {
    alert(`This example is for ${ex.mode} mode. Select it first.`);
    return;
  }

  const graph = createGraph(ex.mode, ex.n);
  try {
    for (const [from, to] of ex.edges) {
      drain(graph.addEdgeSteps(from, to));
    }
  } catch (e) {
    console.error(`Example "${ex.id}" failed during replay:`, e);
    alert(`Could not load "${ex.name}". See the console for details.`);
    return;
  }

  appState.graph = graph;
  // clearSession();
  appState.history = ex.edges.map(([a, b]) => [a, b]); 
  lockModeSelection();

  const suggested = ex.suggestedEdge;
  document.getElementById("sourceNode").value = suggested ? suggested[0] : "";
  document.getElementById("targetNode").value = suggested ? suggested[1] : "";

  redraw();
}