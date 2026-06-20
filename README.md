# Image Resize & Compress

A simple browser-only web app for preparing square JPG images.

## Features

- Upload one or multiple images at once.
- Preview imported images before processing.
- Resize every output to exactly `750 x 750 px`.
- Choose center crop or fit-with-white-padding mode.
- Convert final output to JPG.
- Place transparent images on a white background before JPG export.
- Compress JPG output automatically, starting at `0.92` quality and stepping down until the file is under `2 MB`.
- Preview processed results before download.
- Download individual images or download all processed images when multiple files are ready.

## Usage

1. Open `index.html` in a browser.
2. Choose or drag in image files.
3. Pick the resize mode.
4. Click **Process / Preview**.
5. Download each JPG or use **Download All** for multiple outputs.

## Files

- `index.html` - page structure.
- `styles.css` - responsive layout and interface styling.
- `app.js` - local image loading, Canvas resizing, JPG compression, previews, and downloads.

No backend, uploads, analytics, or external storage are used.
