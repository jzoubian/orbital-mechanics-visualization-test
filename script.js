const canvas = document.getElementById("orbit-canvas");
const ctx = canvas.getContext("2d");

const starMassInput = document.getElementById("star-mass");
const distanceInput = document.getElementById("distance");
const velocityInput = document.getElementById("velocity");

const starMassValue = document.getElementById("star-mass-value");
const distanceValue = document.getElementById("distance-value");
const velocityValue = document.getElementById("velocity-value");

const G = 1;
const simulationSpeed = 12;

let state = null;
let trail = [];
let lastTimestamp;

function currentSettings() {
  return {
    starMass: Number(starMassInput.value),
    distance: Number(distanceInput.value),
    velocity: Number(velocityInput.value),
  };
}

function resetSimulation() {
  const { starMass, distance, velocity } = currentSettings();

  state = {
    starMass,
    distance,
    velocity,
    x: distance,
    y: 0,
    vx: 0,
    vy: velocity,
  };

  trail = [];
  lastTimestamp = undefined;
  updateValueLabels();
}

function updateValueLabels() {
  starMassValue.textContent = state.starMass.toFixed(0);
  distanceValue.textContent = state.distance.toFixed(0);
  velocityValue.textContent = state.velocity.toFixed(2);
}

function step(stepDt) {
  const rSquared = state.x * state.x + state.y * state.y;
  const r = Math.sqrt(rSquared);
  const safeR = Math.max(r, 1e-6);
  const accelMagnitude = (G * state.starMass) / (safeR * safeR);
  const ax = -(accelMagnitude * state.x) / safeR;
  const ay = -(accelMagnitude * state.y) / safeR;

  state.vx += ax * stepDt;
  state.vy += ay * stepDt;
  state.x += state.vx * stepDt;
  state.y += state.vy * stepDt;

  trail.push({ x: state.x, y: state.y });
  if (trail.length > 400) {
    trail.shift();
  }
}

function draw() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8ec5ff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  trail.forEach((point, index) => {
    const px = centerX + point.x;
    const py = centerY + point.y;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#7fffd4";
  ctx.beginPath();
  ctx.arc(centerX + state.x, centerY + state.y, 5, 0, Math.PI * 2);
  ctx.fill();
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

[starMassInput, distanceInput, velocityInput].forEach((input) => {
  input.addEventListener("input", resetSimulation);
});

resetSimulation();
requestAnimationFrame(tick);
