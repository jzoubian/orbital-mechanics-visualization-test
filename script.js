const canvas = document.getElementById("orbit-canvas");
const ctx = canvas.getContext("2d");

const starMassInput = document.getElementById("star-mass");
const distanceInput = document.getElementById("distance");
const velocityInput = document.getElementById("velocity");
const secondaryMassInput = document.getElementById("secondary-mass");
const secondaryDistanceInput = document.getElementById("secondary-distance");
const secondaryVelocityInput = document.getElementById("secondary-velocity");

const starMassValue = document.getElementById("star-mass-value");
const distanceValue = document.getElementById("distance-value");
const velocityValue = document.getElementById("velocity-value");
const secondaryMassValue = document.getElementById("secondary-mass-value");
const secondaryDistanceValue = document.getElementById("secondary-distance-value");
const secondaryVelocityValue = document.getElementById("secondary-velocity-value");

const G = 1;
const simulationSpeed = 12;
const primaryBodyMass = 1.5;
const trailLength = 400;

let state = null;
let lastTimestamp;

function currentSettings() {
  return {
    starMass: Number(starMassInput.value),
    distance: Number(distanceInput.value),
    velocity: Number(velocityInput.value),
    secondaryMass: Number(secondaryMassInput.value),
    secondaryDistance: Number(secondaryDistanceInput.value),
    secondaryVelocity: Number(secondaryVelocityInput.value),
  };
}

function resetSimulation() {
  const {
    starMass,
    distance,
    velocity,
    secondaryMass,
    secondaryDistance,
    secondaryVelocity,
  } = currentSettings();

  const primaryBody = {
    key: "primary",
    mass: primaryBodyMass,
    x: distance,
    y: 0,
    vx: 0,
    vy: velocity,
    color: "#7fffd4",
    radius: 5,
    trail: [],
  };

  const secondaryBody = {
    key: "secondary",
    mass: secondaryMass,
    x: -secondaryDistance,
    y: 0,
    vx: 0,
    vy: -secondaryVelocity,
    color: "#ff8fab",
    radius: 4.5,
    trail: [],
  };

  const starBody = {
    key: "star",
    mass: starMass,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    color: "#ffd166",
    radius: 10,
    trail: [],
  };

  const totalMomentumY = primaryBody.mass * primaryBody.vy + secondaryBody.mass * secondaryBody.vy;
  starBody.vy = totalMomentumY === 0 ? 0 : -totalMomentumY / starBody.mass;

  state = {
    bodies: [starBody, primaryBody, secondaryBody],
  };

  lastTimestamp = undefined;
  updateValueLabels();
}

function updateValueLabels() {
  starMassValue.textContent = state.bodies[0].mass.toFixed(0);
  distanceValue.textContent = state.bodies[1].x.toFixed(0);
  velocityValue.textContent = state.bodies[1].vy.toFixed(2);
  secondaryMassValue.textContent = state.bodies[2].mass.toFixed(1);
  secondaryDistanceValue.textContent = Math.abs(state.bodies[2].x).toFixed(0);
  secondaryVelocityValue.textContent = Math.abs(state.bodies[2].vy).toFixed(2);
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

    if (body.key !== "star") {
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
    if (body.key === "star" || body.trail.length < 2) {
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

[starMassInput, distanceInput, velocityInput, secondaryMassInput, secondaryDistanceInput, secondaryVelocityInput].forEach((input) => {
  input.addEventListener("input", resetSimulation);
});

resetSimulation();
requestAnimationFrame(tick);
