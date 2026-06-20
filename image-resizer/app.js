const OUTPUT_SIZE = 750;
const START_QUALITY = 0.92;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.06;
const FILE_SIZE_LIMITS = {
  "2mb": {
    bytes: 2 * 1024 * 1024,
    label: "2 MB",
    statusText: "under 2 MB",
  },
  "5mb": {
    bytes: 4.5 * 1024 * 1024,
    label: "4.5 MB",
    statusText: "under 4.5 MB",
  },
};

const state = {
  files: [],
  originalUrls: [],
  results: [],
};

const elements = {
  imageInput: document.getElementById("imageInput"),
  uploadZone: document.querySelector(".upload-zone"),
  imageCount: document.getElementById("imageCount"),
  originalGrid: document.getElementById("originalGrid"),
  processedGrid: document.getElementById("processedGrid"),
  fileSizeLimit: document.getElementById("fileSizeLimit"),
  processButton: document.getElementById("processButton"),
  downloadAllButton: document.getElementById("downloadAllButton"),
  statusText: document.getElementById("statusText"),
  originalCardTemplate: document.getElementById("originalCardTemplate"),
  processedCardTemplate: document.getElementById("processedCardTemplate"),
};

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function setStatus(message, type = "neutral") {
  elements.statusText.textContent = message;
  elements.statusText.classList.toggle("is-error", type === "error");
  elements.statusText.classList.toggle("is-success", type === "success");
}

function getResizeMode() {
  return document.querySelector('input[name="resizeMode"]:checked')?.value || "cover";
}

function getFileSizeLimit() {
  return FILE_SIZE_LIMITS[elements.fileSizeLimit.value] || FILE_SIZE_LIMITS["2mb"];
}

function getBaseName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "") || "image";
}

function getOutputName(fileName) {
  return `${getBaseName(fileName)}-750x750.jpg`;
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create the JPG output."));
      }
    }, "image/jpeg", quality);
  });
}

function revokeOriginalUrls() {
  state.originalUrls.forEach((url) => URL.revokeObjectURL(url));
  state.originalUrls = [];
}

function revokeResultUrls() {
  state.results.forEach((result) => {
    if (result.previewUrl) {
      URL.revokeObjectURL(result.previewUrl);
    }
  });
  state.results = [];
}

function clearProcessedPreviews() {
  revokeResultUrls();
  renderProcessedPreviews();
  elements.downloadAllButton.disabled = true;
}

function renderEmptyGrid(grid, message) {
  grid.classList.add("empty-grid");
  grid.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderOriginalPreviews() {
  elements.imageCount.textContent = `Imported images: ${state.files.length}`;

  if (state.files.length === 0) {
    renderEmptyGrid(elements.originalGrid, "No imported images yet.");
    return;
  }

  elements.originalGrid.classList.remove("empty-grid");
  elements.originalGrid.innerHTML = "";
  revokeOriginalUrls();

  state.files.forEach((file) => {
    const previewUrl = URL.createObjectURL(file);
    state.originalUrls.push(previewUrl);

    const card = elements.originalCardTemplate.content.cloneNode(true);
    const image = card.querySelector("img");
    const fileName = card.querySelector(".file-name");
    const fileMeta = card.querySelector(".file-meta");

    image.src = previewUrl;
    image.alt = file.name;
    fileName.textContent = file.name;
    fileMeta.textContent = `${formatBytes(file.size)} original file`;
    elements.originalGrid.appendChild(card);
  });
}

function renderProcessedPreviews() {
  if (state.results.length === 0) {
    renderEmptyGrid(elements.processedGrid, "Processed results will appear here.");
    return;
  }

  elements.processedGrid.classList.remove("empty-grid");
  elements.processedGrid.innerHTML = "";

  state.results.forEach((result) => {
    const card = elements.processedCardTemplate.content.cloneNode(true);
    const image = card.querySelector("img");
    const fileName = card.querySelector(".file-name");
    const originalSize = card.querySelector(".original-size");
    const finalSize = card.querySelector(".final-size");
    const dimensions = card.querySelector(".dimensions");
    const fileLimit = card.querySelector(".file-limit");
    const message = card.querySelector(".result-message");
    const downloadButton = card.querySelector(".download-button");

    image.alt = result.outputName;
    fileName.textContent = result.originalName;
    originalSize.textContent = formatBytes(result.originalBytes);
    dimensions.textContent = `${OUTPUT_SIZE} x ${OUTPUT_SIZE} px`;
    fileLimit.textContent = result.limitLabel || getFileSizeLimit().label;

    if (result.error) {
      image.removeAttribute("src");
      finalSize.textContent = "Not available";
      message.textContent = result.error;
      message.classList.add("is-error");
      downloadButton.disabled = true;
    } else {
      image.src = result.previewUrl;
      finalSize.textContent = formatBytes(result.blob.size);
      message.textContent = `JPG ready at quality ${Math.round(result.quality * 100)}%, capped at ${result.limitLabel}.`;
      message.classList.add("is-success");
      downloadButton.addEventListener("click", () => downloadBlob(result.blob, result.outputName));
    }

    elements.processedGrid.appendChild(card);
  });

  const downloadableCount = state.results.filter((result) => result.blob).length;
  elements.downloadAllButton.disabled = downloadableCount < 2;
}

function loadImage(file) {
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened by the browser."));
    };

    image.src = url;
  });
}

function getImageSize(image) {
  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
}

function getDrawRect(sourceWidth, sourceHeight, mode) {
  const scale = mode === "cover"
    ? Math.max(OUTPUT_SIZE / sourceWidth, OUTPUT_SIZE / sourceHeight)
    : Math.min(OUTPUT_SIZE / sourceWidth, OUTPUT_SIZE / sourceHeight);

  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (OUTPUT_SIZE - width) / 2,
    y: (OUTPUT_SIZE - height) / 2,
    width,
    height,
  };
}

function createOutputCanvas(image, mode) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  // Canvas output is sRGB in current browsers; request it explicitly where supported.
  const contextOptions = { alpha: false, colorSpace: "srgb" };
  const ctx = canvas.getContext("2d", contextOptions) || canvas.getContext("2d");
  const sourceSize = getImageSize(image);
  const rect = getDrawRect(sourceSize.width, sourceSize.height, mode);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);

  return canvas;
}

async function compressCanvasToLimit(canvas, sizeLimit) {
  const qualityValues = [];

  for (let quality = START_QUALITY; quality > MIN_QUALITY; quality -= QUALITY_STEP) {
    qualityValues.push(Number(quality.toFixed(2)));
  }

  qualityValues.push(MIN_QUALITY);

  for (const quality of qualityValues) {
    const blob = await canvasToJpegBlob(canvas, quality);

    if (blob.size <= sizeLimit.bytes) {
      return { blob, quality };
    }
  }

  throw new Error(`Could not compress this image ${sizeLimit.statusText}. Try a simpler source image.`);
}

async function processFile(file, mode, sizeLimit) {
  const image = await loadImage(file);
  const canvas = createOutputCanvas(image, mode);
  const { blob, quality } = await compressCanvasToLimit(canvas, sizeLimit);

  return {
    blob,
    quality,
    previewUrl: URL.createObjectURL(blob),
    originalName: file.name,
    originalBytes: file.size,
    outputName: getOutputName(file.name),
    limitLabel: sizeLimit.label,
  };
}

async function processImages() {
  if (state.files.length === 0) {
    setStatus("Select one or more images before processing.", "error");
    return;
  }

  const mode = getResizeMode();
  const sizeLimit = getFileSizeLimit();
  elements.processButton.disabled = true;
  elements.downloadAllButton.disabled = true;
  revokeResultUrls();
  renderProcessedPreviews();
  setStatus(`Processing 0/${state.files.length} images...`);

  for (let index = 0; index < state.files.length; index += 1) {
    const file = state.files[index];
    setStatus(`Processing ${index + 1}/${state.files.length}: ${file.name}`);

    try {
      const result = await processFile(file, mode, sizeLimit);
      state.results.push(result);
    } catch (error) {
      state.results.push({
        originalName: file.name,
        originalBytes: file.size,
        outputName: getOutputName(file.name),
        limitLabel: sizeLimit.label,
        error: error.message || "This image could not be processed.",
      });
    }

    renderProcessedPreviews();
  }

  const successCount = state.results.filter((result) => result.blob).length;
  const errorCount = state.results.length - successCount;

  if (successCount === 0) {
    setStatus("No images could be processed. Check the error message on each file.", "error");
  } else if (errorCount > 0) {
    setStatus(`Processed ${successCount} image(s). ${errorCount} image(s) need attention.`, "error");
  } else {
    setStatus(`Processed ${successCount} image(s). Every JPG is 750 x 750 px and ${sizeLimit.statusText}.`, "success");
  }

  elements.processButton.disabled = false;
  elements.downloadAllButton.disabled = successCount < 2;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadAll() {
  state.results
    .filter((result) => result.blob)
    .forEach((result, index) => {
      setTimeout(() => downloadBlob(result.blob, result.outputName), index * 160);
    });
}

function handleFiles(files) {
  const selectedFiles = [...files].filter((file) => file.type.startsWith("image/"));

  state.files = selectedFiles;
  clearProcessedPreviews();
  renderOriginalPreviews();

  if (selectedFiles.length === 0) {
    setStatus("No supported image files were selected.", "error");
  } else {
    setStatus(`${selectedFiles.length} image(s) imported. Click Process / Preview when ready.`);
  }
}

function setupDragAndDrop() {
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadZone.classList.remove("is-dragging");
    });
  });

  elements.uploadZone.addEventListener("drop", (event) => {
    const files = event.dataTransfer?.files;

    if (files?.length) {
      handleFiles(files);
    }
  });
}

elements.imageInput.addEventListener("change", (event) => {
  handleFiles(event.target.files || []);
});

elements.processButton.addEventListener("click", processImages);
elements.downloadAllButton.addEventListener("click", downloadAll);

document.querySelectorAll('input[name="resizeMode"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (state.results.length > 0) {
      clearProcessedPreviews();
      setStatus("Resize mode changed. Click Process / Preview to create updated JPG files.");
    }
  });
});

elements.fileSizeLimit.addEventListener("change", () => {
  if (state.results.length > 0) {
    clearProcessedPreviews();
    setStatus("File size limit changed. Click Process / Preview to create updated JPG files.");
  }
});

setupDragAndDrop();
renderOriginalPreviews();
renderProcessedPreviews();
