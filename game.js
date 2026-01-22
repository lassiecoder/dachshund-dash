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
    case "levelUp":
      // Rising triumphant sound
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(600, now + 0.1);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.2);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case "gameOver":
      // Sad descending sound
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(100, now + 0.5);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      break;

    case "victory":
      // Happy victory fanfare
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(523, now); // C5
      oscillator.frequency.setValueAtTime(659, now + 0.15); // E5
      oscillator.frequency.setValueAtTime(784, now + 0.3); // G5
      oscillator.frequency.setValueAtTime(1047, now + 0.45); // C6
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.setValueAtTime(0.15, now + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.7);
      oscillator.start(now);
      oscillator.stop(now + 0.7);
      break;

    case "bark":
      // Quick bark sound
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.linearRampToValueAtTime(150, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case "tick":
      // Subtle tick for each second
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;
  }
}

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem("dogChaseHighScore") || 0;
let lastTime = 0;
let scoreTimer = 0;
let currentLevel = 1;
let levelTimer = 0;

// Level settings - 5 levels, 10 seconds each, increasing speed
const levels = [
  { speed: 1.5, duration: 5 }, // Level 1 - slow
  { speed: 2.5, duration: 5 }, // Level 2 - medium
  { speed: 3.5, duration: 5 }, // Level 3 - fast
  { speed: 4.5, duration: 5 }, // Level 4 - faster
  { speed: 5.5, duration: 5 }, // Level 5 - very fast
];

// Mouse/Laser position
let laser = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  glowRadius: 15,
};

// Dog properties
let dog = {
  x: 100,
  y: 100,
  width: 48,
  height: 32,
  speed: 2.5,
  maxSpeed: 6,
  frame: 0,
  frameTimer: 0,
  frameInterval: 80, // Faster animation for lively feel
  direction: 1, // 1 = right, -1 = left
  catchRadius: 30,
};

// Pixel art dachshund frames (running animation) - matches reference image
const dogSprites = {
  // Each frame is a 2D array representing pixels - dog facing RIGHT
  frames: [
    // Frame 1 - standing
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
    // Frame 2 - walk (legs spread)
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
    // Frame 3 - walk (legs together)
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
    // Frame 4 - walk (opposite spread)
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
    k: "#3d3d3d", // Black/dark body
    K: "#222222", // Darker (pupil)
    b: "#c4875a", // Brown/tan (snout & paws)
    W: "#FFFFFF", // White eye
    t: "#3d3d3d", // Tail
    ".": "#1a1a1a", // Outline
    " ": null, // Transparent
  },
};

// Laser trail particles
let particles = [];
let gamePaused = false;

// Mouse tracking
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  laser.x = e.clientX - rect.left;
  laser.y = e.clientY - rect.top;
});

// Keep laser in bounds
canvas.addEventListener("mouseleave", () => {
  // Laser stays at last position
});

// Start button
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("victory-btn").addEventListener("click", startGame);

// Exit button functionality
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
  document.getElementById("victory").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");

  // Reset game state
  score = 0;
  scoreTimer = 0;
  currentLevel = 1;
  levelTimer = 0;
  dog.x = 100;
  dog.y = 100;
  dog.speed = levels[0].speed;
  particles = [];
  gameRunning = true;

  document.getElementById("score").textContent = "0";
  document.getElementById("level").textContent = "1";
  document.getElementById("level-up").classList.add("hidden");

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function showLevelUp(level) {
  playSound("levelUp");
  const levelUpEl = document.getElementById("level-up");
  document.getElementById("level-up-num").textContent = level;
  levelUpEl.classList.remove("hidden");

  // Hide after 1.5 seconds
  setTimeout(() => {
    levelUpEl.classList.add("hidden");
  }, 1500);
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
  // Update score timer
  scoreTimer += deltaTime;
  if (scoreTimer >= 1000) {
    score++;
    playSound("tick");
    scoreTimer -= 1000;
    document.getElementById("score").textContent = score;

    // Update level timer and check for level up
    levelTimer++;
    if (currentLevel < 5 && levelTimer >= levels[currentLevel - 1].duration) {
      levelTimer = 0;
      currentLevel++;
      dog.speed = levels[currentLevel - 1].speed;
      document.getElementById("level").textContent = currentLevel;
      showLevelUp(currentLevel);
    }

    // Check for victory - survive 5 seconds in level 5
    if (currentLevel === 5 && levelTimer >= 5) {
      victory();
      return;
    }
  }

  // Update dog animation
  dog.frameTimer += deltaTime;
  if (dog.frameTimer >= dog.frameInterval) {
    dog.frame = (dog.frame + 1) % dogSprites.frames.length;
    dog.frameTimer = 0;
  }

  // Move dog towards laser
  const dx = laser.x - dog.x;
  const dy = laser.y - dog.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    dog.x += (dx / distance) * dog.speed;
    dog.y += (dy / distance) * dog.speed;
    dog.direction = dx > 0 ? 1 : -1;
  }

  // Add laser trail particles
  if (Math.random() < 0.3) {
    particles.push({
      x: laser.x + (Math.random() - 0.5) * 10,
      y: laser.y + (Math.random() - 0.5) * 10,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
    });
  }

  // Update particles
  particles = particles.filter((p) => {
    p.life -= p.decay;
    return p.life > 0;
  });

  // Check collision
  const catchDist = Math.sqrt(
    Math.pow(laser.x - dog.x, 2) + Math.pow(laser.y - dog.y, 2),
  );

  if (catchDist < dog.catchRadius) {
    gameOver();
  }
}

function render() {
  // Clear canvas with grass gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#4a6741");
  gradient.addColorStop(1, "#3d5a35");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grass/ground pattern
  ctx.fillStyle = "#3a5a32";
  for (let x = 0; x < canvas.width; x += 24) {
    for (let y = 0; y < canvas.height; y += 24) {
      if ((x + y) % 48 === 0) {
        ctx.fillRect(x, y, 24, 24);
      }
    }
  }

  // Draw particles
  particles.forEach((p) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Draw laser pointer with glow
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 20;

  // Outer glow
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(laser.x, laser.y, laser.glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner laser dot
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(laser.x, laser.y, laser.radius, 0, Math.PI * 2);
  ctx.fill();

  // Core bright center
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(laser.x, laser.y, laser.radius / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Draw dog
  drawPixelDog();
}

function drawPixelDog() {
  const sprite = dogSprites.frames[dog.frame];
  const pixelSize = 4;
  const spriteWidth = sprite[0].length * pixelSize;
  const spriteHeight = sprite.length * pixelSize;

  ctx.save();

  // Position dog centered
  const drawX = dog.x - spriteWidth / 2;
  const drawY = dog.y - spriteHeight / 2;

  // Flip if moving right (sprite faces left by default)
  if (dog.direction === 1) {
    ctx.translate(dog.x, dog.y);
    ctx.scale(-1, 1);
    ctx.translate(-dog.x, -dog.y);
  }

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(
    dog.x,
    dog.y + spriteHeight / 2 + 5,
    spriteWidth / 2,
    8,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Draw each pixel
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const char = sprite[row][col];
      const color = dogSprites.colors[char];

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          drawX + col * pixelSize,
          drawY + row * pixelSize,
          pixelSize,
          pixelSize,
        );

        // Add pixel border for retro look
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          drawX + col * pixelSize,
          drawY + row * pixelSize,
          pixelSize,
          pixelSize,
        );
      }
    }
  }

  // Draw tongue when running (hanging from mouth)
  if (dog.frame === 1 || dog.frame === 3) {
    ctx.fillStyle = "#e85a6b";
    ctx.fillRect(
      drawX + 6 * pixelSize,
      drawY + 7 * pixelSize,
      pixelSize * 0.7,
      pixelSize * 1.3,
    );
  }

  ctx.restore();
}

function gameOver() {
  gameRunning = false;
  playSound("bark");
  setTimeout(() => playSound("gameOver"), 150);

  document.getElementById("hud").classList.add("hidden");
  document.getElementById("final-score").textContent = score;
  document.getElementById("final-level").textContent = currentLevel;
  document.getElementById("game-over").classList.remove("hidden");
}

function victory() {
  gameRunning = false;
  playSound("victory");

  document.getElementById("hud").classList.add("hidden");
  document.getElementById("victory-score").textContent = score;
  document.getElementById("victory").classList.remove("hidden");
}

// Initial render
render();
