
let cy = null;

function ensureCy() {
  if (cy) return cy;
  cy = cytoscape({
    container: document.getElementById("cy"),
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "text-wrap": "wrap",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": 12,
          color: "#000000",
          width: 44,
          height: 44,
          "border-width": 2,
          "border-color": "#ffffff",
  },
      },
      {
        selector: "edge",
        style: {
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          "line-color": "#c7c2b3",
          "target-arrow-color": "#c7c2b3",
        },
      },
      { selector: "node[color]", style: { "background-color": "data(color)" } },
        {
          selector: "node.canonical[borderColor]",
          style: { "border-color": "data(borderColor)", "border-width": 6, "border-style": "double" },
        },
      { selector: "node.step-highlight", style: { "border-color": "#e07b1f", "border-width": 4 } },
      // { selector: "edge.step-highlight", style: { "line-color": "#e07b1f", "target-arrow-color": "#e07b1f", width: 3 } },
    ],
    wheelSensitivity: 0.25,
  });
  cy.on("tap", "node", (evt) => {
    const key = parseInt(evt.target.id(), 10);
    showVertexDetails(key);
  });
  return cy;
}

function colorForKey(key) {
  const hue = (key * 137.508) % 360;     
  const lightness = 45 + (key % 3) * 8; 
  return { fill: `hsl(${hue}, 65%, ${lightness}%)`, border: `hsl(${hue}, 70%, ${lightness - 25}%)` };
}

function colorComponents() {
  const components = appState.graph.getComponents(); // Map<root, keys[]>, the keys are the canonical vertices
  for (const [root, members] of components) {
    const { fill, border } = colorForKey(root);
    for (const key of members) {
      cy.getElementById(String(key))
        .data({ color: fill, borderColor: border })
        .toggleClass("canonical", key === root);
    }
  }
}

function updateNodeLabels() {
  for (const v of appState.graph.vertices) {
    cy.getElementById(String(v.key)).data("label", `${v.key}\nK${v.level}`);
  }
}

function redraw() {
  const graph = appState.graph;
  if (!graph) return;

  ensureCy();
  cy.elements().remove();

  const nodeEls = graph.vertices.map((v) => ({ data: { id: String(v.key) } }));
  const edgeEls = graph.edges.map(({ from, to }) => ({
    data: { id: `e-${from}-${to}`, source: String(from), target: String(to) },
  }));
  cy.add([...nodeEls, ...edgeEls]);
  colorComponents();
  updateNodeLabels();

  const components = graph.getComponents();
  const clusters = [...components.values()].filter((members) => members.length > 0);
  cy.layout({ name: "cise", clusters, animate: false }).run();
}


function applyStepToRender(step) {
  cy.elements(".step-highlight").removeClass("step-highlight");

  step.path.forEach((key) => {
    const node = cy.getElementById(String(key));
    if (node.length) node.addClass("step-highlight");
  });

  if (step.highlightEdges === false) return;

  /*for (let i = 0; i < step.path.length - 1; i++) {
    const a = step.path[i];
    const b = step.path[i + 1];

    //const forwardEdge = cy.getElementById(`e-${a}-${b}`);
    //const backwardEdge = cy.getElementById(`e-${b}-${a}`);

    //if (forwardEdge.length) forwardEdge.addClass("step-highlight");
    //else if (backwardEdge.length) backwardEdge.addClass("step-highlight");
  }*/
}

function addEdgeToCy(from, to) {
  const id = `e-${from}-${to}`;
  if (!cy.getElementById(id).length) {
    cy.add({ data: { id, source: String(from), target: String(to) } });
  }
   cy.elements(".step-highlight").removeClass("step-highlight");

}

function relayoutClusters() {
  const graph = appState.graph;
  const components = graph.getComponents();

  colorComponents();

  const clusters = [...components.values()].filter((m) => m.length > 0);
  cy.layout({ name: "cise", clusters, animate: false }).run();
}

function showVertexDetails(key){
  const details = appState.graph.getVertex(key);
  const panel = document.getElementById("vertex-details");
  panel.innerHTML = "";

  for (const [field, value] of Object.entries(details)) {
    const line = document.createElement("div");
    if (Array.isArray(value)) {
      line.textContent = `${field}: [${value.join(", ")}]`;
    } else if (typeof value === "object" && value !== null) {
      line.textContent = `${field}: ${JSON.stringify(value)}`;
    } else {
      line.textContent = `${field}: ${value}`;
    }
    panel.appendChild(line);
  }
}