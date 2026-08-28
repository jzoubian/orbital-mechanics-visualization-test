const canvas = document.getElementById("orbit-canvas");
const ctx = canvas.getContext("2d");
const bodyListEl = document.getElementById("body-list");
const addBodyBtn = document.getElementById("add-body-btn");

const G = 1;
const simulationSpeed = 12;
const trailLength = 400;

const PLANET_COLORS = [
  "#7fffd4", "#ff8fab", "#a0c4ff", "#ffd166", "#c77dff",
  "#06d6a0", "#ef476f", "#118ab2", "#ffc43d", "#b7e4c7",
];

let bodyDefs = [
  { name: "Sun",     mass: 200,  distance: 0,   velocity: 0,    color: "#ffd166", radius: 10, isStar: true },
  { name: "Mercury", mass: 1,    distance: 80,  velocity: 1.58, color: "#7fffd4", radius: 3 },
  { name: "Venus",   mass: 2,    distance: 120, velocity: 1.29, color: "#ff8fab", radius: 4 },
  { name: "Earth",   mass: 3,    distance: 160, velocity: 1.12, color: "#a0c4ff", radius: 4.5 },
  { name: "Mars",    mass: 1.5,  distance: 210, velocity: 0.95, color: "#c77dff", radius: 3.5 },
];

let state = null;
let lastTimestamp;

function buildBodyRows() {
  bodyListEl.innerHTML = "";
  bodyDefs.forEach((def, i) => {
    const section = document.createElement("section");
    section.className = "control-group";

    const header = document.createElement("div");
    header.className = "body-row-header";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "body-name-input";
    nameInput.value = def.name;
    nameInput.addEventListener("change", (e) => {
      bodyDefs[i].name = e.target.value;
      resetSimulation();
    });

    header.appendChild(nameInput);

    if (!def.isStar) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-body-btn";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        bodyDefs.splice(i, 1);
        buildBodyRows();
        resetSimulation();
      });
      header.appendChild(removeBtn);
    }

    section.appendChild(header);

    function addSlider(label, key, min, max, step) {
      const lbl = document.createElement("label");
      const span = document.createElement("span");
      span.className = "slider-value";
      span.textContent = def[key].toFixed(step < 1 ? 2 : 0);
      lbl.textContent = label + ": ";
      lbl.appendChild(span);

      const input = document.createElement("input");
      input.type = "range";
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = def[key];
      input.addEventListener("input", () => {
        bodyDefs[i][key] = Number(input.value);
        span.textContent = Number(input.value).toFixed(step < 1 ? 2 : 0);
        resetSimulation();
      });

      section.appendChild(lbl);
      section.appendChild(input);
    }

    addSlider("Mass", "mass", def.isStar ? 50 : 0, def.isStar ? 500 : 30, def.isStar ? 10 : 0.5);
    if (!def.isStar) {
      addSlider("Initial distance", "distance", 40, 320, 5);
      addSlider("Initial velocity", "velocity", 0.1, 5.0, 0.05);
    }

    bodyListEl.appendChild(section);
  });
}

function resetSimulation() {
  const starDef = bodyDefs[0];
  const starBody = {
    key: "star",
    mass: starDef.mass,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    color: starDef.color,
    radius: starDef.radius,
    trail: [],
    isStar: true,
  };

  const planetBodies = bodyDefs.slice(1).map((def, pi) => ({
    key: def.name,
    mass: def.mass,
    x: def.distance,
    y: 0,
    vx: 0,
    vy: def.velocity,
    color: def.color || PLANET_COLORS[pi % PLANET_COLORS.length],
    radius: def.radius || 4,
    trail: [],
  }));

  const totalMomentumY = planetBodies.reduce((sum, b) => sum + b.mass * b.vy, 0);
  starBody.vy = starBody.mass > 0 ? -totalMomentumY / starBody.mass : 0;

  state = { bodies: [starBody, ...planetBodies] };
  lastTimestamp = undefined;
}

function getAccelerations(bodies) {
  return bodies.map((body, index) => {
    let ax = 0;
    let ay = 0;

    bodies.forEach((otherBody, otherIndex) => {
      if (index === otherIndex) {
        return;
      }

      const dx = otherBody.x - body.x;
      const dy = otherBody.y - body.y;
      const softenedDistance = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-6);
      const factor = (G * otherBody.mass) / (softenedDistance * softenedDistance * softenedDistance);

      ax += factor * dx;
      ay += factor * dy;
    });

    return { ax, ay };
  });
}

function step(stepDt) {
  const accelerations = getAccelerations(state.bodies);

  state.bodies.forEach((body, index) => {
    body.vx += accelerations[index].ax * stepDt;
    body.vy += accelerations[index].ay * stepDt;
  });

  state.bodies.forEach((body) => {
    body.x += body.vx * stepDt;
    body.y += body.vy * stepDt;

    if (!body.isStar) {
      body.trail.push({ x: body.x, y: body.y });
      if (body.trail.length > trailLength) {
        body.trail.shift();
      }
    }
  });
}

function draw() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const totalMass = state.bodies.reduce((sum, body) => sum + body.mass, 0);
  const centerOfMass = state.bodies.reduce(
    (accumulator, body) => ({
      x: accumulator.x + body.x * body.mass,
      y: accumulator.y + body.y * body.mass,
    }),
    { x: 0, y: 0 },
  );
  const offsetX = centerX - centerOfMass.x / totalMass;
  const offsetY = centerY - centerOfMass.y / totalMass;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.bodies.forEach((body) => {
    if (body.isStar || body.trail.length < 2) {
      return;
    }

    ctx.strokeStyle = body.color;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1;
    ctx.beginPath();
    body.trail.forEach((point, index) => {
      const px = offsetX + point.x;
      const py = offsetY + point.y;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();
  });

  ctx.globalAlpha = 1;

  state.bodies.forEach((body) => {
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(offsetX + body.x, offsetY + body.y, body.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function tick(timestamp) {
  if (lastTimestamp === undefined) {
    lastTimestamp = timestamp;
    draw();
    requestAnimationFrame(tick);
    return;
  }
  const elapsedSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  step(elapsedSeconds * simulationSpeed);
  draw();
  requestAnimationFrame(tick);
}

addBodyBtn.addEventListener("click", () => {
  const planetCount = bodyDefs.length - 1;
  const maxDistance = bodyDefs.reduce((max, d) => Math.max(max, d.distance || 0), 0);
  bodyDefs.push({
    name: `Planet ${planetCount + 1}`,
    mass: 2,
    distance: maxDistance + 40,
    velocity: 1.0,
    color: PLANET_COLORS[(planetCount) % PLANET_COLORS.length],
    radius: 4,
  });
  buildBodyRows();
  resetSimulation();
});

buildBodyRows();
resetSimulation();
requestAnimationFrame(tick);

