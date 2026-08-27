# PhotoBooth

A browser-based photo booth — capture a strip of photos with your webcam, apply filters and frames, decorate with stickers and text, and download the result. No build step, no backend.

**Live demo:** https://eyandc.github.io/PhotoBooth/

## Features

- **7 strip layouts** — Classic 2×2, Vertical Strip, Wide Layout, Six-Cut, Horizontal Strip, Grid 3×3, Single Shot
- **10 filters** with a live camera preview per filter so you can see the effect before shooting
- **10 themed frames** (Birthday, Wedding, Neon, Christmas, and more), drawn procedurally on canvas
- **Automatic or Manual capture** — hands-free countdown, or tap when you're ready
- **Stickers and custom text** — drag to position, drag the handle to resize, click to delete
- **Per-photo reframing** — drag to pan and scroll to zoom each photo independently after capture
- **Download as PNG or JPG**

## Running locally

Camera access requires a secure context, so opening `index.html` directly (`file://`) won't work in most browsers. Serve it locally instead:

```
python -m http.server 8000
```

or

```
npx serve .
```

Then open the printed `http://localhost` URL.

## Tech

Plain HTML, CSS, and JavaScript — no framework, no build tools, no dependencies. Camera capture via `getUserMedia`, compositing and export via the Canvas API.
