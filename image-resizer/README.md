# Image Resize & Compress

A simple browser-only web app for preparing JPG images under a selected file size limit.

## Features

- Upload one or multiple images at once.
- Preview imported images before processing.
- Keep original image dimensions when the source file is already under the selected limit.
- Resize files that are over the selected limit to `750 x 750 px`.
- Choose center crop or fit-with-white-padding mode for files that need resizing.
- Convert final output to JPG.
- Place transparent images on a white background before JPG export.
- Choose a saved file size limit: not over `2 MB`, or the `5 MB` option capped at an actual maximum of `4.5 MB`.
- Keep original JPG files untouched when they are already under the selected limit.
- Compress JPG output automatically, starting at high quality and stepping down only when needed to meet the selected limit.
- Preview processed results before download.
- Download individual images or download all processed images when multiple files are ready.

## Usage

1. Open `index.html` in a browser.
2. Choose or drag in image files.
3. Pick the resize mode and saved file size limit.
4. Click **Process / Preview**.
5. Download each JPG or use **Download All** for multiple outputs.

## Files

- `index.html` - page structure.
- `styles.css` - responsive layout and interface styling.
- `app.js` - local image loading, Canvas resizing, JPG compression, previews, and downloads.

No backend, uploads, analytics, or external storage are used.
