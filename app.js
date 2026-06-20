const state = {
  watermarkMode: "text",
  sourceFiles: [],
  watermarkImageFile: null,
  results: [],
  selectedPreviewUrls: [],
};

const elements = {
  sourceImages: document.getElementById("sourceImages"),
  watermarkImage: document.getElementById("watermarkImage"),
  watermarkImageName: document.getElementById("watermarkImageName"),
  watermarkText: document.getElementById("watermarkText"),
  fontFamily: document.getElementById("fontFamily"),
  textColor: document.getElementById("textColor"),
  position: document.getElementById("position"),
  margin: document.getElementById("margin"),
  opacity: document.getElementById("opacity"),
  scale: document.getElementById("scale"),
  rotation: document.getElementById("rotation"),
  quality: document.getElementById("quality"),
  outputFormat: document.getElementById("outputFormat"),
  repeatDiagonal: document.getElementById("repeatDiagonal"),
  processButton: document.getElementById("processButton"),
  downloadAllButton: document.getElementById("downloadAllButton"),
  emptyState: document.getElementById("emptyState"),
  resultsGrid: document.getElementById("resultsGrid"),
  selectedPreviewSection: document.getElementById("selectedPreviewSection"),
  selectedPreviewGrid: document.getElementById("selectedPreviewGrid"),
  selectedPreviewCount: document.getElementById("selectedPreviewCount"),
  statusText: document.getElementById("statusText"),
  textWatermarkFields: document.getElementById("textWatermarkFields"),
  imageWatermarkFields: document.getElementById("imageWatermarkFields"),
  resultCardTemplate: document.getElementById("resultCardTemplate"),
  marginValue: document.getElementById("marginValue"),
  opacityValue: document.getElementById("opacityValue"),
  scaleValue: document.getElementById("scaleValue"),
  rotationValue: document.getElementById("rotationValue"),
  qualityValue: document.getElementById("qualityValue"),
  imagePreviewDialog: document.getElementById("imagePreviewDialog"),
  dialogImage: document.getElementById("dialogImage"),
  dialogTitle: document.getElementById("dialogTitle"),
  closeDialogButton: document.getElementById("closeDialogButton"),
  toggleButtons: [...document.querySelectorAll(".toggle-button")],
};

const INPUT_ACCEPTS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function setStatus(text) {
  elements.statusText.textContent = text;
}

function updateRangeLabels() {
  elements.marginValue.textContent = `${elements.margin.value}px`;
  elements.opacityValue.textContent = `${elements.opacity.value}%`;
  elements.scaleValue.textContent = `${elements.scale.value}%`;
  elements.rotationValue.textContent = `${elements.rotation.value}°`;
  elements.qualityValue.textContent = `${elements.quality.value}%`;
}

function revokeSelectedPreviews() {
  state.selectedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  state.selectedPreviewUrls = [];
}

function renderSelectedPreviews() {
  elements.selectedPreviewGrid.innerHTML = "";
  const shouldShow = state.sourceFiles.length > 0 && state.results.length === 0;
  elements.selectedPreviewSection.classList.toggle("is-hidden", !shouldShow);

  if (!shouldShow) {
    return;
  }

  revokeSelectedPreviews();
  elements.selectedPreviewCount.textContent = `${state.sourceFiles.length} รูป`;

  state.sourceFiles.forEach((file) => {
    const previewUrl = URL.createObjectURL(file);
    state.selectedPreviewUrls.push(previewUrl);

    const card = document.createElement("article");
    card.className = "selected-preview-card";

    const thumb = document.createElement("div");
    thumb.className = "selected-preview-thumb";

    const image = document.createElement("img");
    image.src = previewUrl;
    image.alt = file.name;

    const name = document.createElement("p");
    name.className = "selected-preview-name";
    name.textContent = file.name;

    thumb.appendChild(image);
    card.appendChild(thumb);
    card.appendChild(name);
    elements.selectedPreviewGrid.appendChild(card);
  });
}

function toggleMode(mode) {
  state.watermarkMode = mode;
  elements.toggleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  elements.textWatermarkFields.classList.toggle("is-hidden", mode !== "text");
  elements.imageWatermarkFields.classList.toggle("is-hidden", mode !== "image");
}

function getOutputMimeType(fileType) {
  const requested = elements.outputFormat.value;

  if (requested !== "auto") {
    return requested;
  }

  if (INPUT_ACCEPTS.includes(fileType)) {
    return fileType;
  }

  return "image/png";
}

function getFileExtension(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/bmp":
      return "bmp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "png";
  }
}

function makeDownloadName(index, mimeType) {
  const extension = getFileExtension(mimeType);
  const paddedNumber = String(index + 1).padStart(2, "0");
  return `watermarked_${paddedNumber}.${extension}`;
}

async function loadImageFromFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return loadImageFromUrl(dataUrl);
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ไม่สามารถเปิดรูปภาพนี้ได้"));
    image.src = url;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพนี้ได้"));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("ไม่สามารถสร้างไฟล์ผลลัพธ์ได้"));
      }
    }, mimeType, quality);
  });
}

async function canvasToSvgBlob(canvas) {
  const pngDataUrl = canvas.toDataURL("image/png");
  const svgMarkup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
    `<image href="${pngDataUrl}" width="${canvas.width}" height="${canvas.height}"/>`,
    "</svg>",
  ].join("");

  return new Blob([svgMarkup], { type: "image/svg+xml" });
}

function computeWatermarkBox(canvasWidth, canvasHeight) {
  const scale = Number(elements.scale.value) / 100;
  const margin = Number(elements.margin.value);
  const maxWidth = canvasWidth * scale;
  const maxHeight = canvasHeight * scale;
  return { maxWidth, maxHeight, margin };
}

function drawTextWatermark(ctx, canvasWidth, canvasHeight) {
  const text = elements.watermarkText.value.trim() || "Watermark";
  const opacity = Number(elements.opacity.value) / 100;
  const rotation = Number(elements.rotation.value) * (Math.PI / 180);
  const color = elements.textColor.value;
  const position = elements.position.value;
  const { maxWidth, maxHeight, margin } = computeWatermarkBox(canvasWidth, canvasHeight);

  const baseFontSize = Math.max(18, Math.round(Math.min(maxWidth * 0.28, canvasWidth * 0.08)));
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  let fontSize = baseFontSize;
  ctx.font = `700 ${fontSize}px "${elements.fontFamily.value}"`;
  let metrics = ctx.measureText(text);

  if (metrics.width > maxWidth) {
    fontSize = Math.max(14, Math.floor(fontSize * (maxWidth / metrics.width)));
    ctx.font = `700 ${fontSize}px "${elements.fontFamily.value}"`;
    metrics = ctx.measureText(text);
  }

  const textHeight = Math.min(maxHeight, fontSize * 1.2);
  const tileStepX = metrics.width + margin * 2;
  const tileStepY = textHeight + margin * 2;

  if (position === "tile") {
    drawTiledWatermark(ctx, canvasWidth, canvasHeight, rotation, tileStepX, tileStepY, () => {
      ctx.fillText(text, 0, 0);
    });
    ctx.restore();
    return;
  }

  const { x, y } = resolveAnchorPosition(position, canvasWidth, canvasHeight, metrics.width, textHeight, margin);
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawImageWatermark(ctx, canvasWidth, canvasHeight, watermarkImage) {
  const opacity = Number(elements.opacity.value) / 100;
  const rotation = Number(elements.rotation.value) * (Math.PI / 180);
  const position = elements.position.value;
  const { maxWidth, maxHeight, margin } = computeWatermarkBox(canvasWidth, canvasHeight);

  const ratio = Math.min(maxWidth / watermarkImage.width, maxHeight / watermarkImage.height);
  const width = Math.max(24, watermarkImage.width * ratio);
  const height = Math.max(24, watermarkImage.height * ratio);
  const tileStepX = width + margin * 2;
  const tileStepY = height + margin * 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (position === "tile") {
    drawTiledWatermark(ctx, canvasWidth, canvasHeight, rotation, tileStepX, tileStepY, () => {
      ctx.drawImage(watermarkImage, -width / 2, -height / 2, width, height);
    });
    ctx.restore();
    return;
  }

  const { x, y } = resolveAnchorPosition(position, canvasWidth, canvasHeight, width, height, margin);
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(watermarkImage, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawTiledWatermark(ctx, canvasWidth, canvasHeight, rotation, tileStepX, tileStepY, paint) {
  const diagonalOffset = elements.repeatDiagonal.checked ? tileStepX / 2 : 0;

  for (let y = tileStepY / 2; y < canvasHeight + tileStepY; y += tileStepY) {
    const rowShift = elements.repeatDiagonal.checked && Math.round(y / tileStepY) % 2 ? diagonalOffset : 0;

    for (let x = tileStepX / 2; x < canvasWidth + tileStepX; x += tileStepX) {
      ctx.save();
      ctx.translate(x + rowShift, y);
      ctx.rotate(rotation);
      paint();
      ctx.restore();
    }
  }
}

function resolveAnchorPosition(position, canvasWidth, canvasHeight, boxWidth, boxHeight, margin) {
  switch (position) {
    case "top-left":
      return { x: margin + boxWidth / 2, y: margin + boxHeight / 2 };
    case "top-right":
      return { x: canvasWidth - margin - boxWidth / 2, y: margin + boxHeight / 2 };
    case "bottom-left":
      return { x: margin + boxWidth / 2, y: canvasHeight - margin - boxHeight / 2 };
    case "center":
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    case "bottom-right":
    default:
      return { x: canvasWidth - margin - boxWidth / 2, y: canvasHeight - margin - boxHeight / 2 };
  }
}

async function renderWatermarkedFile(file, watermarkImage, index) {
  const sourceImage = await loadImageFromFile(file);
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(sourceImage, 0, 0, width, height);

  if (state.watermarkMode === "text") {
    drawTextWatermark(ctx, width, height);
  } else if (watermarkImage) {
    drawImageWatermark(ctx, width, height, watermarkImage);
  } else {
    throw new Error("กรุณาเลือกรูปลายน้ำก่อนเริ่มประมวลผล");
  }

  const mimeType = getOutputMimeType(file.type);
  const quality = Number(elements.quality.value) / 100;
  const blob = mimeType === "image/svg+xml"
    ? await canvasToSvgBlob(canvas)
    : await canvasToBlob(canvas, mimeType, quality);

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    fileName: makeDownloadName(index, mimeType),
    width,
    height,
    mimeType,
  };
}

function revokeResults() {
  state.results.forEach((result) => URL.revokeObjectURL(result.previewUrl));
  state.results = [];
}

function openPreviewDialog(imageUrl, title) {
  elements.dialogImage.src = imageUrl;
  elements.dialogImage.alt = title;
  elements.dialogTitle.textContent = title;
  elements.imagePreviewDialog.showModal();
}

function closePreviewDialog() {
  if (elements.imagePreviewDialog.open) {
    elements.imagePreviewDialog.close();
  }
}

function renderResults() {
  elements.resultsGrid.innerHTML = "";
  const hasResults = state.results.length > 0;
  elements.emptyState.hidden = hasResults || state.sourceFiles.length > 0;
  elements.downloadAllButton.disabled = !hasResults;
  elements.selectedPreviewSection.classList.toggle("is-hidden", hasResults || state.sourceFiles.length === 0);

  state.results.forEach((result) => {
    const fragment = elements.resultCardTemplate.content.cloneNode(true);
    const cardImage = fragment.querySelector("img");
    const fileName = fragment.querySelector(".file-name");
    const fileDetail = fragment.querySelector(".file-detail");
    const viewButton = fragment.querySelector(".view-button");
    const downloadButton = fragment.querySelector(".download-button");

    cardImage.src = result.previewUrl;
    cardImage.alt = result.fileName;
    fileName.textContent = result.fileName;
    fileDetail.textContent = `${result.width} x ${result.height}px • ${formatBytes(result.blob.size)}`;
    viewButton.addEventListener("click", () => openPreviewDialog(result.previewUrl, result.fileName));
    downloadButton.addEventListener("click", () => downloadBlob(result.blob, result.fileName));

    elements.resultsGrid.appendChild(fragment);
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function processImages() {
  if (state.sourceFiles.length === 0) {
    setStatus("กรุณาเลือกรูปภาพหลักอย่างน้อย 1 ไฟล์");
    return;
  }

  if (state.watermarkMode === "image" && !state.watermarkImageFile) {
    setStatus("กรุณาเลือกรูปลายน้ำก่อนเริ่มประมวลผล");
    return;
  }

  elements.processButton.disabled = true;
  elements.downloadAllButton.disabled = true;
  setStatus(`กำลังประมวลผล ${state.sourceFiles.length} ไฟล์...`);
  revokeResults();
  renderResults();

  try {
    const watermarkImage = state.watermarkMode === "image"
      ? await loadImageFromFile(state.watermarkImageFile)
      : null;

    for (let index = 0; index < state.sourceFiles.length; index += 1) {
      const file = state.sourceFiles[index];
      setStatus(`กำลังประมวลผล ${index + 1}/${state.sourceFiles.length}: ${file.name}`);
      const result = await renderWatermarkedFile(file, watermarkImage, index);
      state.results.push(result);
      renderResults();
    }

    setStatus(`เสร็จแล้ว ${state.results.length} ไฟล์ พร้อมดาวน์โหลด`);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "เกิดข้อผิดพลาดระหว่างประมวลผล");
  } finally {
    elements.processButton.disabled = false;
    elements.downloadAllButton.disabled = state.results.length === 0;
  }
}

function downloadAll() {
  state.results.forEach((result, index) => {
    setTimeout(() => downloadBlob(result.blob, result.fileName), index * 180);
  });
}

function handleSourceSelection(files) {
  state.sourceFiles = [...files].filter((file) => file.type.startsWith("image/") || /\.svg$/i.test(file.name));
  revokeResults();
  elements.resultsGrid.innerHTML = "";

  if (state.sourceFiles.length === 0) {
    revokeSelectedPreviews();
    elements.emptyState.hidden = false;
    renderSelectedPreviews();
    setStatus("ยังไม่มีไฟล์ภาพที่รองรับ");
    return;
  }

  setStatus(`เลือกแล้ว ${state.sourceFiles.length} ไฟล์`);
  elements.emptyState.hidden = true;
  renderSelectedPreviews();
}

function setupUploadZone(zone, input, onFilesSelected) {
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.style.borderColor = "rgba(203, 92, 50, 0.9)";
      zone.style.background = "rgba(255, 248, 240, 0.96)";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.style.borderColor = "";
      zone.style.background = "";
    });
  });

  zone.addEventListener("drop", (event) => {
    const files = event.dataTransfer?.files;
    if (files?.length) {
      onFilesSelected(files);
      input.files = files;
    }
  });
}

elements.toggleButtons.forEach((button) => {
  button.addEventListener("click", () => toggleMode(button.dataset.mode));
});

elements.sourceImages.addEventListener("change", (event) => {
  handleSourceSelection(event.target.files || []);
});

elements.watermarkImage.addEventListener("change", (event) => {
  const file = event.target.files?.[0] || null;
  state.watermarkImageFile = file;
  elements.watermarkImageName.textContent = file ? file.name : "ยังไม่ได้เลือกรูป";
});

elements.processButton.addEventListener("click", processImages);
elements.downloadAllButton.addEventListener("click", downloadAll);
elements.closeDialogButton.addEventListener("click", closePreviewDialog);
elements.imagePreviewDialog.addEventListener("click", (event) => {
  if (event.target === elements.imagePreviewDialog) {
    closePreviewDialog();
  }
});

[elements.margin, elements.opacity, elements.scale, elements.rotation, elements.quality].forEach((input) => {
  input.addEventListener("input", updateRangeLabels);
});

setupUploadZone(document.querySelector('label[for="sourceImages"]'), elements.sourceImages, handleSourceSelection);
setupUploadZone(document.querySelector('label[for="watermarkImage"]'), elements.watermarkImage, (files) => {
  const file = files[0] || null;
  state.watermarkImageFile = file;
  elements.watermarkImageName.textContent = file ? file.name : "ยังไม่ได้เลือกรูป";
});

updateRangeLabels();
toggleMode("text");
renderResults();
