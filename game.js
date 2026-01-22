const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Audio context for sound effects
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case "throw":
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(300, now);
      oscillator.frequency.linearRampToValueAtTime(600, now + 0.15);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      break;

    case "catch":
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.linearRampToValueAtTime(400, now + 0.1);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;

    case "return":
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(523, now);
      oscillator.frequency.setValueAtTime(659, now + 0.1);
      oscillator.frequency.setValueAtTime(784, now + 0.2);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.35);
      oscillator.start(now);
      oscillator.stop(now + 0.35);
      break;

    case "bark":
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.linearRampToValueAtTime(150, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case "bounce":
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(200, now + 0.08);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case "perfect":
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(523, now);
      oscillator.frequency.setValueAtTime(784, now + 0.1);
      oscillator.frequency.setValueAtTime(1047, now + 0.2);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
      break;
  }
}

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameRunning = false;
let score = 0;
let fetchCount = 0;
let lastTime = 0;
let gamePaused = false;

// Machine/Launcher properties
const machine = {
  x: 80,
  y: 450,
  width: 100,
  height: 120,
  slotY: 420,
};

// Ball properties
let ball = {
  x: 130,
  y: 420,
  radius: 12,
  vx: 0,
  vy: 0,
  gravity: 0.4,
  bounce: 0.6,
  friction: 0.99,
  groundFriction: 0.92,
  state: "ready",
  color: "#e74c3c",
};

// Aiming state
let aiming = {
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  power: 0,
  maxPower: 25,
};

// Dog properties
let dog = {
  x: 150,
  y: 484,
  width: 64,
  height: 48,
  speed: 5,
  frame: 0,
  frameTimer: 0,
  frameInterval: 80,
  direction: 1,
  state: "idle",
  hasBall: false,
  targetX: 150,
};

// Ground level
const groundY = 520;

// Clouds for animation
let clouds = [
  { x: 50, y: 80, scale: 0.7, speed: 0.25 },
  { x: 150, y: 60, scale: 1, speed: 0.3 },
  { x: 280, y: 120, scale: 0.5, speed: 0.15 },
  { x: 400, y: 100, scale: 0.8, speed: 0.2 },
  { x: 520, y: 70, scale: 0.9, speed: 0.35 },
  { x: 600, y: 50, scale: 0.6, speed: 0.4 },
  { x: 720, y: 90, scale: 0.75, speed: 0.28 },
];

// Pixel art dachshund frames
const dogSprites = {
  frames: [
    [
      "       .....              ",
      "      .kkkkk.             ",
      "     .kkkkkkk.            ",
      "    .kkkkkkkk.    ....    ",
      "    .kWWkkkkkk...kkkk.    ",
      "    .kWKkbbkkkkkkkkkkk.   ",
      "    .kkkkbbkkkkkkkkkkkk.  ",
      "     .kkkkkkkkkkkkkkkkk.t ",
      "     .kkkkkkkkkkkkkkkk.t  ",
      "      .kkkkkkkkkkkkkk.    ",
      "       .bb.      .bb.     ",
      "       .bb.      .bb.     ",
    ],
    [
      "       .....              ",
      "      .kkkkk.             ",
      "     .kkkkkkk.            ",
      "    .kkkkkkkk.    ....    ",
      "    .kWWkkkkkk...kkkk.    ",
      "    .kWKkbbkkkkkkkkkkk.   ",
      "    .kkkkbbkkkkkkkkkkkk.  ",
      "     .kkkkkkkkkkkkkkkkk.t ",
      "     .kkkkkkkkkkkkkkkk.t  ",
      "      .kkkkkkkkkkkkkk.    ",
      "      .bb.       .bb.     ",
      "     .bb.         .bb.    ",
    ],
    [
      "       .....              ",
      "      .kkkkk.             ",
      "     .kkkkkkk.            ",
      "    .kkkkkkkk.    ....    ",
      "    .kWWkkkkkk...kkkk.    ",
      "    .kWKkbbkkkkkkkkkkk.   ",
      "    .kkkkbbkkkkkkkkkkkk.  ",
      "     .kkkkkkkkkkkkkkkkk. t",
      "     .kkkkkkkkkkkkkkkk. t ",
      "      .kkkkkkkkkkkkkk.    ",
      "        .bbbb..bbbb.      ",
      "         .bb.  .bb.       ",
    ],
    [
      "       .....              ",
      "      .kkkkk.             ",
      "     .kkkkkkk.            ",
      "    .kkkkkkkk.    ....    ",
      "    .kWWkkkkkk...kkkk.    ",
      "    .kWKkbbkkkkkkkkkkk.   ",
      "    .kkkkbbkkkkkkkkkkkk.  ",
      "     .kkkkkkkkkkkkkkkkk.t ",
      "     .kkkkkkkkkkkkkkkk.t  ",
      "      .kkkkkkkkkkkkkk.    ",
      "        .bb.     .bb.     ",
      "         .bb.   .bb.      ",
    ],
  ],
  colors: {
    k: "#3d3d3d",
    K: "#222222",
    b: "#c4875a",
    W: "#FFFFFF",
    t: "#3d3d3d",
    ".": "#1a1a1a",
    " ": null,
  },
};

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  if (aiming.active) {
    aiming.currentX = mouseX;
    aiming.currentY = mouseY;

    const dx = aiming.startX - aiming.currentX;
    const dy = aiming.startY - aiming.currentY;
    aiming.power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, aiming.maxPower);
  }
});

canvas.addEventListener("mousedown", (e) => {
  if (!gameRunning || gamePaused) return;
  if (ball.state !== "ready") return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const distToBall = Math.sqrt(
    Math.pow(clickX - ball.x, 2) + Math.pow(clickY - ball.y, 2),
  );

  if (distToBall < 80) {
    aiming.active = true;
    aiming.startX = ball.x;
    aiming.startY = ball.y;
    aiming.currentX = clickX;
    aiming.currentY = clickY;
    aiming.power = 0;
  }
});

canvas.addEventListener("mouseup", () => {
  if (!gameRunning || gamePaused) return;
  if (aiming.active && aiming.power > 2) {
    throwBall();
  }
  aiming.active = false;
});

canvas.addEventListener("mouseleave", () => {
  if (aiming.active && aiming.power > 2) {
    throwBall();
  }
  aiming.active = false;
});

function throwBall() {
  const dx = aiming.startX - aiming.currentX;
  const dy = aiming.startY - aiming.currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    const power = Math.min(distance / 10, aiming.maxPower);
    ball.vx = (dx / distance) * power;
    ball.vy = (dy / distance) * power - 5;
    ball.state = "flying";

    playSound("throw");
    playSound("bark");

    dog.state = "chasing";
  }
}

// Button listeners
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);

document.getElementById("exit-btn").addEventListener("click", () => {
  gamePaused = true;
  document.getElementById("exit-confirm").classList.remove("hidden");
});

document.getElementById("exit-yes").addEventListener("click", () => {
  gamePaused = false;
  gameRunning = false;
  document.getElementById("exit-confirm").classList.add("hidden");
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("start-screen").classList.remove("hidden");
});

document.getElementById("exit-no").addEventListener("click", () => {
  gamePaused = false;
  document.getElementById("exit-confirm").classList.add("hidden");
});

function startGame() {
  initAudio();
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-over").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");

  score = 0;
  fetchCount = 0;

  resetBall();
  dog.x = 150;
  dog.y = groundY - 36;
  dog.state = "idle";
  dog.hasBall = false;
  dog.direction = 1;

  gameRunning = true;
  updateHUD();

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function resetBall() {
  ball.x = machine.x + machine.width / 2;
  ball.y = machine.slotY;
  ball.vx = 0;
  ball.vy = 0;
  ball.state = "ready";
}

function updateHUD() {
  // Score display removed
  // Fetches display removed
}

function gameLoop(currentTime) {
  if (!gameRunning) return;

  if (gamePaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  // Update clouds
  updateClouds();

  // Ball physics
  if (ball.state === "flying" || ball.state === "stopped") {
    ball.vy += ball.gravity;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ground collision
    if (ball.y + ball.radius > groundY) {
      ball.y = groundY - ball.radius;
      ball.vy = -ball.vy * ball.bounce;
      ball.vx *= ball.groundFriction;

      if (Math.abs(ball.vy) > 2) {
        playSound("bounce");
      }

      if (Math.abs(ball.vy) < 1 && Math.abs(ball.vx) < 0.5) {
        ball.vy = 0;
        ball.vx = 0;
        if (ball.state === "flying") {
          ball.state = "stopped";
        }
      }
    }

    // Wall collisions
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * ball.bounce;
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -ball.vx * ball.bounce;
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy * ball.bounce;
    }
  }

  // Update dog
  updateDog(deltaTime);

  // Dog catches ball
  if ((ball.state === "flying" || ball.state === "stopped") && !dog.hasBall) {
    const distToBall = Math.sqrt(
      Math.pow(dog.x + dog.width / 2 - ball.x, 2) +
        Math.pow(dog.y + dog.height / 2 - ball.y, 2),
    );

    if (distToBall < 40) {
      dog.hasBall = true;
      ball.state = "returning";
      dog.state = "returning";
      playSound("catch");

      const throwDistance = ball.x - machine.x;
      const distanceScore = Math.floor(throwDistance / 10);
      score += Math.max(distanceScore, 10);
      updateHUD();
    }
  }

  // Dog returning ball
  if (dog.state === "returning" && dog.hasBall) {
    if (dog.x < machine.x + machine.width + 20) {
      dog.hasBall = false;
      dog.state = "idle";
      fetchCount++;
      playSound("return");

      score += 50;
      updateHUD();
      showFetchNotification();

      setTimeout(() => {
        resetBall();
      }, 500);
    }
  }
}

function showFetchNotification() {
  const notification = document.getElementById("fetch-notify");
  notification.textContent = `FETCH #${fetchCount}!`;
  notification.classList.remove("hidden");
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.add("hidden");
  }, 1000);
}

function updateDog(deltaTime) {
  dog.frameTimer += deltaTime;
  if (dog.frameTimer >= dog.frameInterval) {
    dog.frameTimer = 0;
    if (dog.state !== "idle") {
      dog.frame = (dog.frame + 1) % 4;
    }
  }

  if (dog.state === "chasing") {
    dog.targetX = ball.x - dog.width / 2;

    if (Math.abs(dog.x - dog.targetX) > 5) {
      if (dog.x < dog.targetX) {
        dog.x += dog.speed;
        dog.direction = 1;
      } else {
        dog.x -= dog.speed;
        dog.direction = -1;
      }
    }
  } else if (dog.state === "returning") {
    dog.targetX = machine.x + machine.width;

    if (dog.x > dog.targetX) {
      dog.x -= dog.speed;
      dog.direction = -1;
    }
  }

  dog.y = groundY - 36;
  dog.x = Math.max(0, Math.min(canvas.width - dog.width, dog.x));
}

function render() {
  // Sky
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun
  ctx.beginPath();
  ctx.arc(700, 80, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#f39c12";
  ctx.fill();

  // Clouds
  clouds.forEach((cloud) => {
    drawCloud(cloud.x, cloud.y, cloud.scale);
  });

  // Grass/ground
  ctx.fillStyle = "#4a7c23";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Grass texture
  ctx.fillStyle = "#5a9c33";
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.fillRect(x, groundY, 10, 5);
  }

  // Draw machine
  drawMachine();

  // Draw aiming line
  if (aiming.active) {
    drawAimingLine();
  }

  // Draw ball
  if (!dog.hasBall) {
    drawBall();
  }

  // Draw dog
  drawPixelDog();

  // Draw ball in dog's mouth
  if (dog.hasBall) {
    const ballOffsetX = dog.direction === 1 ? -5 : dog.width + 5;
    ctx.beginPath();
    ctx.arc(dog.x + ballOffsetX, dog.y + 15, ball.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Power meter
  if (aiming.active) {
    drawPowerMeter();
  }

  // Instructions hint
  if (ball.state === "ready" && !aiming.active) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "14px 'Press Start 2P', Arial";
    ctx.textAlign = "center";
    ctx.fillText("Click & drag ball to throw!", canvas.width / 2, 50);
  }
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 50 * scale, y, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function updateClouds() {
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    // Wrap around when cloud goes off left side
    if (cloud.x + 75 * cloud.scale < 0) {
      cloud.x = canvas.width + 50;
    }
  });
}

function drawMachine() {
  // Machine shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(machine.x + 10, groundY + 5, machine.width, 10);

  // Machine body
  ctx.fillStyle = "#5d6d7e";
  ctx.fillRect(machine.x, machine.y, machine.width, machine.height);

  // Machine top panel
  ctx.fillStyle = "#85929e";
  ctx.fillRect(machine.x + 5, machine.y + 5, machine.width - 10, 25);

  // Ball slot
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.arc(machine.x + machine.width / 2, machine.slotY, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#34495e";
  ctx.beginPath();
  ctx.arc(machine.x + machine.width / 2, machine.slotY, 18, 0, Math.PI * 2);
  ctx.fill();

  // Machine label
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 8px Arial";
  ctx.textAlign = "center";
  ctx.fillText("FETCH-O-MATIC", machine.x + machine.width / 2, machine.y + 20);

  // Decorative lights
  ctx.fillStyle = ball.state === "ready" ? "#27ae60" : "#7f8c8d";
  ctx.beginPath();
  ctx.arc(machine.x + 20, machine.y + 45, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ball.state === "flying" ? "#e74c3c" : "#7f8c8d";
  ctx.beginPath();
  ctx.arc(machine.x + machine.width - 20, machine.y + 45, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall() {
  // Ball shadow
  ctx.beginPath();
  ctx.ellipse(ball.x, groundY + 5, ball.radius * 0.8, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  // Main ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();

  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Ball highlight
  ctx.beginPath();
  ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fill();
}

function drawAimingLine() {
  const dx = aiming.startX - aiming.currentX;
  const dy = aiming.startY - aiming.currentY;

  // Trajectory preview
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(ball.x + dx * 2, ball.y + dy * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pull line
  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(aiming.currentX, aiming.currentY);
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.arc(aiming.currentX, aiming.currentY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
}

function drawPowerMeter() {
  const meterWidth = 100;
  const meterHeight = 15;
  const meterX = machine.x;
  const meterY = machine.y - 30;

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

  const fillWidth = (aiming.power / aiming.maxPower) * meterWidth;
  const powerColor =
    aiming.power < aiming.maxPower * 0.5
      ? "#27ae60"
      : aiming.power < aiming.maxPower * 0.8
        ? "#f39c12"
        : "#e74c3c";
  ctx.fillStyle = powerColor;
  ctx.fillRect(meterX, meterY, fillWidth, meterHeight);

  ctx.strokeStyle = "#ecf0f1";
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("POWER", meterX + meterWidth / 2, meterY - 5);
}

function drawPixelDog() {
  const sprite = dogSprites.frames[dog.frame];
  const pixelSize = 3;

  // Dog shadow
  ctx.beginPath();
  ctx.ellipse(
    dog.x + dog.width / 2,
    groundY + 5,
    dog.width / 2,
    6,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fill();

  ctx.save();

  if (dog.direction === 1) {
    ctx.translate(dog.x + dog.width, dog.y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(dog.x, dog.y);
  }

  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const char = sprite[row][col];
      const color = dogSprites.colors[char];

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  ctx.restore();
}

// Initial render
render();
