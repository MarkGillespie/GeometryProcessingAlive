import * as THREE from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { Geoptic } from "./geoptic.js/build/geoptic.module.min.js";
// import { Geoptic } from "./geoptic.js/src/geoptic.js";

import { bunny } from "./disk-bunny.js";

import {
  Mesh,
  MeshIO,
  Geometry,
} from "./geometry-processing-js/build/geometry-processing.module.min.js";

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
