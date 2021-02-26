import * as THREE from "https://unpkg.com/three@0.125.1/build/three.module.js";
// import { Geoptic } from "./geoptic.js/build/geoptic.module.min.js";
import { Geoptic } from "./geoptic.js/src/geoptic.js";

import { bunny } from "./disk-bunny.js";

// import {
//   Mesh,
//   MeshIO,
//   Geometry,
// } from "./geometry-processing-js/build/geometry-processing.module.min.js";

let mesh = undefined;
let geo = undefined;

let gpMesh = undefined;

// create geoptic manager
let geoptic = new Geoptic({
  parent: document.getElementById("geoptic-panel"),
  picks: false,
});
geoptic.structureGui.close();

function initMesh(meshFile) {
  let soup = MeshIO.readOBJ(meshFile);

  gpMesh = geoptic.registerSurfaceMesh("bunny", soup.v, soup.f);

  mesh = new Mesh();
  mesh.build(soup);
  geo = new Geometry(mesh, soup.v);
}

function runVertexCode() {
  const vertexFunction = extractVertexFunction();
  const vertexValues = [];
  for (let v of geo.mesh.vertices) {
    vertexValues.push(vertexFunction(geo, v));
  }
  const q = gpMesh.addVertexScalarQuantity("vertexFunction", vertexValues);
  q.setEnabled(true);
  q.guiFolder.open();
}

// Load the bunny mesh
initMesh(bunny);
runVertexCode();
document.getElementById("run-button").onclick = runVertexCode;

geoptic.doneLoading();

// Start animating with geoptic
geoptic.animate();

// JS to manage resizing the editor pane. Stolen from
// https://htmldom.dev/create-resizable-split-views/
// Query the element
const resizer = document.getElementById("resizer");
const leftSide = resizer.previousElementSibling;
const rightSide = resizer.nextElementSibling;

// The current position of mouse
let x = 0;
let y = 0;

// Width of right side
// It's important that we manually resize the right side (geoptic)
// and not the left side since geoptic doesn't resize nicely when
// its parent does if the window doesn't change size
let rightWidth = 0;

// Handle the mousedown event
// that's triggered when user drags the resizer
const mouseDownHandler = function (e) {
  // Get the current mouse position
  x = e.clientX;
  y = e.clientY;
  rightWidth = rightSide.getBoundingClientRect().width;

  // Attach the listeners to `document`
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
};

const mouseMoveHandler = function (e) {
  // How far the mouse has been moved
  const dx = e.clientX - x;
  const dy = e.clientY - y;

  const newRightWidth =
    ((rightWidth - dx) * 100) /
    resizer.parentNode.getBoundingClientRect().width;
  rightSide.style.width = `${newRightWidth}%`;
  document.body.style.cursor = "col-resize";
  rightSide.style.userSelect = "none";
  rightSide.style.pointerEvents = "none";

  rightSide.style.userSelect = "none";
  rightSide.style.pointerEvents = "none";
  geoptic.onWindowResize();
};

const mouseUpHandler = function () {
  resizer.style.removeProperty("cursor");
  document.body.style.removeProperty("cursor");

  rightSide.style.removeProperty("user-select");
  rightSide.style.removeProperty("pointer-events");

  rightSide.style.removeProperty("user-select");
  rightSide.style.removeProperty("pointer-events");

  // Remove the handlers of `mousemove` and `mouseup`
  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
};

// Attach the handler
resizer.addEventListener("mousedown", mouseDownHandler);
