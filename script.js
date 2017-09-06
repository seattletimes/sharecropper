var canvas = document.querySelector("canvas");
var context = canvas.getContext("2d");
var ants = document.querySelector(".resize-container .resizing");

var presetSelect = document.querySelector("select.presets");
var download = document.querySelector("button.download");
var errorOut = document.querySelector(".error");

var cancel = e => e.preventDefault();

var state = {
  mouse: null,
  selection: null,
  ratio: {
    width: 780,
    height: 563
  }
};

var updateAnts = function() {
  ants.classList.toggle("show", state.selection);
  if (state.selection) {
    ants.style.left = state.selection.x + "px";
    ants.style.top = state.selection.y + "px";
    ants.style.width = state.selection.width + "px";
    ants.style.height = state.selection.height + "px";
  }
};

canvas.addEventListener("mousedown", function(e) {
  var bounds = canvas.getBoundingClientRect();
  var x = e.clientX - bounds.left;
  var y = e.clientY - bounds.top;
  state.mouse = { x, y };
  state.selection = null;
  errorOut.innerHTML = "";
});

document.addEventListener("mousemove", function(e) {
  if (!state.mouse) return;
  var bounds = canvas.getBoundingClientRect();
  var x = e.clientX - bounds.left;
  var y = e.clientY - bounds.top;
  var invertX = x < state.mouse.x;
  var invertY = y < state.mouse.y;
  var width = Math.abs(x - state.mouse.x);
  var height = Math.abs(y - state.mouse.y);
  if (width / state.ratio.width < height / state.ratio.height) {
    height = width / state.ratio.width * state.ratio.height;
  } else {
    width = height / state.ratio.height * state.ratio.width;
  }
  state.selection = {
    x: invertX ? state.mouse.x - width : state.mouse.x,
    y: invertY ? state.mouse.y - height : state.mouse.y,
    width, height
  }
  updateAnts();
});

document.addEventListener("mouseup", function() {
  state.mouse = null;
  updateAnts();
});

presetSelect.addEventListener("change", function() {
  var [width, height] = presetSelect.value.split("x").map(Number);
  state.ratio = { width, height };
  state.selection = null;
  updateAnts();
});

canvas.addEventListener("dragenter", cancel);
canvas.addEventListener("dragover", cancel);
canvas.addEventListener("drop", function(e) {
  cancel(e);
  errorOut.innerHTML = "";
  if (!e.dataTransfer || !e.dataTransfer.files) return;
  var f = e.dataTransfer.files[0];
  var reader = new FileReader();
  reader.onload = function() {
    state.image = new Image();
    state.image.onload = function() {
      canvas.width = state.image.width;
      canvas.height = state.image.height;
      context.drawImage(state.image, 0, 0);
    }
    state.image.src = reader.result;
  };
  reader.readAsDataURL(f);
});

var downloadCropped = function() {
  var [width, height] = presetSelect.value.split("x").map(Number);
  var offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  var offscreen = offscreenCanvas.getContext("2d");
  var bounds = canvas.getBoundingClientRect();
  var crop = {
    x: state.selection.x / bounds.width * state.image.width,
    y: state.selection.y / bounds.height * state.image.height,
    width: state.selection.width / bounds.width * state.image.width,
    height: state.selection.height / bounds.height * state.image.height
  };
  if (crop.width < width || crop.height < height) {
    return errorOut.innerHTML = "Crop too small: resulting image will be fuzzy. Please select a larger area or use a bigger source image."
  }
  offscreen.drawImage(state.image, crop.x, crop.y, crop.width, crop.height, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
  var url = offscreenCanvas.toDataURL("image/jpeg");
  var a = document.createElement("a");
  a.href = url;
  a.download = "cropped.jpg";
  a.dispatchEvent(new MouseEvent("click"));
};

download.addEventListener("click", downloadCropped);