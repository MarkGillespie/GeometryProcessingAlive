import * as THREE from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { Geoptic } from "./geoptic.js/build/geoptic.module.min.js";
// import { Geoptic } from "./geoptic.js/src/geoptic.js";

import { bunny } from "./bunny.js";

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
    try {
      vertexValues.push(vertexFunction(geo, v));
    } catch (e) {
      reportError(e);

      // Print error, using console.error if available but falling back to console.log otherwise
      (console.error || console.log).call(console, e);
      return;
    }
  }
  // If we got here, there must not have been an error
  clearError();

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

function exportFile(filename, text) {
  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function loadFile(text) {
  editor.getSession().setValue(text);
}

document.getElementById("fileInput").addEventListener("change", function (e) {
  let file = document.getElementById("fileInput").files[0];
  const filename = file.name;

  if (filename.endsWith(".js")) {
    let reader = new FileReader();
    reader.onload = function (e) {
      loadFile(reader.result);
    };

    reader.onerror = function (e) {
      alert("Unable to load file " + filename);
    };

    reader.readAsText(file);
  } else {
    alert("Please load a *.js file");
  }
});

document.getElementById("save-button").addEventListener("click", () => {
  const code = editor.getSession().getValue();
  console.log(code);
  exportFile("geometry-processing-alive.js", code);
});

document.getElementById("load-button").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

function reportError(e) {
  const stack = e.stack.split(/\r?\n/); // Allow windows line endings

  // Chrome starts the stack with a description of the error. We'll trim that off
  if (stack[0] == e.toString()) stack.shift();

  document.getElementById("error-msgs").classList.add("bad");
  document.getElementById("error-summary").innerHTML =
    e.name + ": " + e.message;
  const errorDetailBox = document.getElementById("error-details");
  errorDetailBox.innerHTML = "";

  let first = true;
  for (let i = 0; i < stack.length; i++) {
    // Remove excess whitespace
    stack[i] = stack[i].trim();
    // Chrome errors start with 'at '. We'll trim that off
    if (stack[i].substring(0, 3) == "at ") {
      stack[i] = stack[i].substring(3);
    }

    // Only report errors in the 'eval'ed part of the code
    if (stack[i].includes("eval")) {
      // split line on whitespace
      const tokens = stack[i].split(/\s+/);
      let fnName = tokens[0];
      // Firefox reports name@url - we trim off the @url for brevity
      const iAt = fnName.indexOf("@");
      if (iAt >= 0) {
        fnName = fnName.substring(0, iAt);
      }

      let lineNo = tokens[tokens.length - 1];
      // On both Firefox and Chrome, lineNo has the form name:row:col
      // We'll just extract the row.
      // First, drop everything up to and including the first ':'
      lineNo = lineNo.substring(lineNo.indexOf(":") + 1);
      // Now, drop everything after the remaining ':'
      lineNo = lineNo.substring(0, lineNo.indexOf(":"));

      // <div errReport>
      //     <span nameReport>fnName</span>
      //     <span lineReport class="line-number">lineNo</span>
      // </div>
      const errReport = document.createElement("div");
      const nameReport = document.createElement("span");
      nameReport.innerHTML = fnName;
      const lineReport = document.createElement("span");
      lineReport.classList.add("line-number");
      lineReport.innerHTML = lineNo;
      errReport.appendChild(nameReport);
      errReport.appendChild(lineReport);

      // If this is the top-level error, also show it in the summary box
      if (first) {
        const topNameReport = document.createElement("span");
        topNameReport.innerHTML = fnName;
        const topLineReport = document.createElement("span");
        topLineReport.classList.add("line-number");
        topLineReport.innerHTML = lineNo;

        // These get added in reverse order because they're styled with float: right
        document.getElementById("error-summary").appendChild(topLineReport);
        document.getElementById("error-summary").appendChild(topNameReport);

        first = false;
      }

      errorDetailBox.appendChild(errReport);
    }
  }

  // Open the message box to measure its height so that we can animate it
  const msgBox = document.getElementById("error-msgs");
  const wasOpen = msgBox.open;
  msgBox.open = true;
  const errHeight = msgBox.scrollHeight;
  msgBox.open = wasOpen;

  // Tell the error box how tall it is so that it can animate opening and closing
  msgBox.style.setProperty("--height-open", errHeight + "px");
}

function clearError() {
  document.getElementById("error-msgs").classList.remove("bad");
  document.getElementById("error-summary").innerHTML = "No errors";
  document.getElementById("error-details").innerHTML = "";
}
