import * as THREE from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { Geoptic } from "./geoptic.js/build/geoptic.module.min.js";
// import { Geoptic } from "./geoptic.js/src/geoptic.js";

import { bunny } from "./disk-bunny.js";

import {
  Vector,
  Mesh,
  MeshIO,
  Geometry,
  indexElements,
  DenseMatrix,
  memoryManager,
  SpectralConformalParameterization,
  HeatMethod,
} from "./geometry-processing-js/build/geometry-processing.module.min.js";

let mesh = undefined;
let geo = undefined;
let sources = [];
let sourceIndices = [];

let gpMesh = undefined;
let gpSources = undefined;

let hm = undefined; // HeatMethod object, stores Laplacian factorization

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
  // TODO: is this a bad idea?
  // console.log(editor.getSession().getValue());
  const vertexFunction = extractVertexFunction();
  const vertexValues = [];
  for (let v of geo.mesh.vertices) {
    vertexValues.push(vertexFunction(geo, v));
  }
  const q = gpMesh.addVertexScalarQuantity("vertexFunction", vertexValues);
  q.setEnabled(true);
  q.guiFolder.open();
}

geoptic.userCallback = () => {};

// Load the bunny mesh
initMesh(bunny);
runVertexCode();
document.getElementById("run-button").onclick = runVertexCode;

geoptic.doneLoading();

// Load the meshes and set up our state
// walkMesh(bunny);

// Start animating with geoptic
// This will call geoptic.userCallback() every frame
geoptic.animate();
