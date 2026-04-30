# carproj

This workspace contains a static, Bauhaus-inspired museum website prototype: a curated exhibition on the evolution of sports cars.

Preview locally:

1. Open a terminal in the project root.
2. Run a simple static server (Python):

```bash
python -m http.server 8000
```

3. Open your browser to http://localhost:8000 and explore `index.html`.

Files created:

- `index.html` — main site
- `assets/styles.css` — Bauhaus CSS
- `assets/scripts.js` — client JS to render exhibits
- `exhibits.json` — exhibit metadata and image URLs

New features added:

- `guided-tour.html` — curated tour page with keyboard navigation and thematic paths.
- `exhibit.html` — full exhibit detail pages with curator notes and technical specs.
- Accessibility improvements: modal focus trap, Escape to close, and focus restoration.
- Improved Bauhaus visual coherence, print-ready label rules, and tighter typographic scale.
- `verify_images.js` — quick verifier to ensure local images exist.

Images are pulled from Unsplash (search-based placeholders). Replace the `exhibits.json` image fields with curated, high-resolution images you own or have licensed before final deployment.

How to replace Commons placeholders with licensed originals

1. Put your licensed image files in `assets/images/` using the exhibit id as the filename. Example:

```
assets/images/origins.jpg
assets/images/golden.jpg
assets/images/supercar.jpg
assets/images/modern.jpg
assets/images/electrification.jpg
assets/images/future.jpg
```

2. Restart the local server if it's running. The site prefers local files when present; it will fall back to the Wikimedia Commons images otherwise.

3. If you want me to add image uploads or to fetch licensed stock images under a specific license, tell me which sources and I can either prepare downloads (where licensing permits) or list purchase/attribution details.

Quick local preview (Node):

```bash
node server.js
# open http://localhost:8000
```

Run the image verifier:

```bash
node verify_images.js
```

Node alternative (if Python not available):

1. Install Node.js (if not installed) and then run:

```bash
npm install
npm start
```

This starts a tiny static server at `http://localhost:8000` using `server.js`.