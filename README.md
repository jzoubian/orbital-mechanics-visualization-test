# orbital-mechanics-visualization-test

A simple web-based orbital mechanics teaching demo built with plain HTML, CSS, and vanilla JavaScript.

## Run locally

Open `index.html` in a browser.

## Features

- Canvas-based 2D animation
- N-body Newtonian gravity simulation (Sun + any number of planets)
- Editable list of bodies with sliders for mass, initial distance, and initial velocity
- Add or remove bodies at any time; simulation resets automatically
- GitHub Actions workflow to deploy to GitHub Pages on pushes to `main`

## How to add a new body

### In the UI

Click the **+ Add body** button below the body list. A new planet card appears with default values. Adjust the name, mass, distance, and velocity sliders as desired — the simulation restarts automatically.

### In the source code

Open `script.js` and add an entry to the `bodyDefs` array near the top of the file:

```js
let bodyDefs = [
  { name: "Sun",     mass: 200, distance: 0,   velocity: 0,    color: "#ffd166", radius: 10, isStar: true },
  { name: "Mercury", mass: 1,   distance: 80,  velocity: 1.58, color: "#7fffd4", radius: 3 },
  // ... existing planets ...
  { name: "Jupiter", mass: 10,  distance: 280, velocity: 0.78, color: "#ffc43d", radius: 7 }, // new body
];
```

Each body object accepts the following fields:

| Field      | Type    | Description                                                  |
|------------|---------|--------------------------------------------------------------|
| `name`     | string  | Display name shown in the control panel                      |
| `mass`     | number  | Body mass (arbitrary units; Sun is typically 150–250)        |
| `distance` | number  | Initial distance from the origin in canvas pixels            |
| `velocity` | number  | Initial tangential velocity (positive = counter-clockwise)   |
| `color`    | string  | CSS color string used for the dot and orbital trail          |
| `radius`   | number  | Rendered dot radius in pixels                                |
| `isStar`   | boolean | If `true`, the body is treated as the central star (no trail, no distance/velocity sliders) |

