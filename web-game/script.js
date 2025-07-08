"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Player properties
const playerWidth = 40;
const playerHeight = 20;
const playerSpeed = 6;
let playerX = (canvasWidth - playerWidth) / 2;
const playerY = canvasHeight - playerHeight - 10;

// Bullet properties
const bulletWidth = 6;
const bulletHeight = 12;
const bulletSpeed = 9;
let bullets = [];

// Invader properties
const invaderRowCount = 4;
const invaderColumnCount = 8;
const invaderWidth = 32;
const invaderHeight = 24;
const invaderPadding = 18;
const invaderOffsetTop = 40;
const invaderOffsetLeft = 40;
let invaders = [];
let invaderDirection = 1; // 1 = right, -1 = left
let invaderSpeed = 1.5;
let invaderDescend = 15;

// Game state
// Input state
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;

// Game state
let score = 0;
let level = 1;
let lives = 3;
let playerHealth = 100;
let gameRunning = false;
let gamePaused = false;
let animationFrameId = null;

// Invader bullets
let invaderBullets = [];
const invaderBulletWidth = 4;
const invaderBulletHeight = 10;
const invaderBulletSpeed = 4;

// Sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  oscillator.start();
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

// Update UI elements
const livesDisplay = document.getElementById("livesDisplay");
const healthDisplay = document.getElementById("healthDisplay");
const statusText = document.getElementById("statusText");

function updateUI() {
  livesDisplay.textContent = "Lives: " + lives;
  healthDisplay.textContent = "Health: " + playerHealth;
  if (!gameRunning) {
    statusText.textContent = "Game Over! Press Restart to play again.";
  } else if (gamePaused) {
    statusText.textContent = "Game Paused";
  } else {
    statusText.textContent = "";
  }
}

// Invader shooting logic
function invadersShoot() {
  if (!gameRunning || gamePaused) return;
  // Randomly select invaders to shoot
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      const invader = invaders[r][c];
      if (invader.status === 1 && Math.random() < 0.002) {
        invaderBullets.push({
          x: invader.x + invaderWidth / 2 - invaderBulletWidth / 2,
          y: invader.y + invaderHeight,
        });
      }
    }
  }
}

// Draw invader bullets
function drawInvaderBullets() {
  ctx.fillStyle = "#ff4500";
  ctx.shadowColor = "#ff4500";
  ctx.shadowBlur = 10;
  invaderBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, invaderBulletWidth, invaderBulletHeight);
  });
  ctx.shadowBlur = 0;
}

// Move invader bullets
function moveInvaderBullets() {
  invaderBullets = invaderBullets.filter((bullet) => bullet.y < canvasHeight);
  invaderBullets.forEach((bullet) => {
    bullet.y += invaderBulletSpeed;
  });
}

// Check collision between invader bullets and player
function checkInvaderBulletCollision() {
  invaderBullets.forEach((bullet, bIndex) => {
    if (
      bullet.x > playerX &&
      bullet.x < playerX + playerWidth &&
      bullet.y + invaderBulletHeight > playerY &&
      bullet.y < playerY + playerHeight
    ) {
      invaderBullets.splice(bIndex, 1);
      playerHealth -= 20;
      playBeep(200, 100);
      if (playerHealth <= 0) {
        lives--;
        playerHealth = 100;
        if (lives <= 0) {
          gameOver();
        }
      }
    }
  });
}

// Game over function
function gameOver() {
  gameRunning = false;
  gamePaused = false;
  cancelAnimationFrame(animationFrameId);
  updateUI();
}

const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");

pauseBtn.addEventListener("click", () => {
  if (!gameRunning || gamePaused) return;
  gamePaused = true;
  pauseBtn.classList.add("hidden");
  resumeBtn.classList.remove("hidden");
  updateUI();
});

resumeBtn.addEventListener("click", () => {
  if (!gameRunning || !gamePaused) return;
  gamePaused = false;
  resumeBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  updateUI();
  gameLoop();
});

// Initialize invaders
function initInvaders() {
  invaders = [];
  for (let r = 0; r < invaderRowCount; r++) {
    invaders[r] = [];
    for (let c = 0; c < invaderColumnCount; c++) {
      invaders[r][c] = { x: 0, y: 0, status: 1 };
    }
  }
}

// Draw player
function drawPlayer() {
  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 10;
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
  ctx.shadowBlur = 0;
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = "#ffff00";
  ctx.shadowColor = "#ffff00";
  ctx.shadowBlur = 10;
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
  });
  ctx.shadowBlur = 0;
}

// Draw invaders
function drawInvaders() {
  ctx.fillStyle = "#ff00ff";
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 10;
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        const invaderX = c * (invaderWidth + invaderPadding) + invaderOffsetLeft;
        const invaderY = r * (invaderHeight + invaderPadding) + invaderOffsetTop;
        invaders[r][c].x = invaderX;
        invaders[r][c].y = invaderY;
        ctx.fillRect(invaderX, invaderY, invaderWidth, invaderHeight);
      }
    }
  }
  ctx.shadowBlur = 0;
}

// Move invaders
function moveInvaders() {
  let edgeReached = false;
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        const invaderX = invaders[r][c].x + invaderDirection * invaderSpeed;
        if (invaderX + invaderWidth > canvasWidth || invaderX < 0) {
          edgeReached = true;
          break;
        }
      }
    }
    if (edgeReached) break;
  }

  if (edgeReached) {
    invaderDirection *= -1;
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        if (invaders[r][c].status === 1) {
          invaders[r][c].y += invaderDescend;
        }
      }
    }
  } else {
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        if (invaders[r][c].status === 1) {
          invaders[r][c].x += invaderDirection * invaderSpeed;
        }
      }
    }
  }
}

// Move bullets
function moveBullets() {
  bullets = bullets.filter((bullet) => bullet.y > 0);
  bullets.forEach((bullet) => {
    bullet.y -= bulletSpeed;
  });
}

// Collision detection
function collisionDetection() {
  bullets.forEach((bullet, bIndex) => {
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        const invader = invaders[r][c];
        if (invader.status === 1) {
          if (
            bullet.x > invader.x &&
            bullet.x < invader.x + invaderWidth &&
            bullet.y > invader.y &&
            bullet.y < invader.y + invaderHeight
          ) {
            console.log("Hit invader at row " + r + " col " + c);
            invader.status = 0;
            bullets.splice(bIndex, 1);
            score += 10;

            // Check if all invaders are destroyed
            if (isLevelCleared()) {
              console.log("All invaders cleared!");
              levelUp();
            }
          }
        }
      }
    }
  });
}

// Check if level is cleared
function isLevelCleared() {
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        console.log("Invader still alive at row " + r + " col " + c);
        return false;
      }
    }
  }
  return true;
}

function isLevelCleared() {
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        return false;
      }
    }
  }
  return true;
}

// Level up function
function levelUp() {
  console.log("Level up! New level: " + (level + 1));
  level++;
  invaderSpeed += 0.5;
  initInvaders();
  bullets = [];
  playerX = (canvasWidth - playerWidth) / 2;
}

// Draw score and level
function drawScore() {
  ctx.font = "18px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 10;
  ctx.fillText("Score: " + score, 10, 25);
  ctx.fillText("Level: " + level, 10, 50);
  ctx.shadowBlur = 0;
}

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  // Draw starry background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  // Draw fixed stars for consistent background
  const starCount = 100;
  ctx.fillStyle = "white";
  for (let i = 0; i < starCount; i++) {
    const x = (i * 53) % canvasWidth;
    const y = (i * 97) % canvasHeight;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

// Draw everything
function draw() {
  clearCanvas();
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
}

// Update game state
function update() {
  if (gamePaused || !gameRunning) return;

  if (rightPressed && playerX < canvasWidth - playerWidth) {
    playerX += playerSpeed;
  }
  if (leftPressed && playerX > 0) {
    playerX -= playerSpeed;
  }
  moveBullets();
  moveInvaders();
  collisionDetection();

  invadersShoot();
  moveInvaderBullets();
  drawInvaderBullets();
  checkInvaderBulletCollision();

  updateUI();
}

// Game loop
function gameLoop() {
  console.log("Game loop running");
  update();
  draw();
  if (gameRunning) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

// Update game state
function update() {
  console.log("Update running");
  if (rightPressed && playerX < canvasWidth - playerWidth) {
    playerX += playerSpeed;
  }
  if (leftPressed && playerX > 0) {
    playerX -= playerSpeed;
  }
  moveBullets();
  moveInvaders();
  collisionDetection();
}

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") {
    rightPressed = true;
  } else if (e.code === "ArrowLeft") {
    leftPressed = true;
  } else if (e.code === "Space") {
    if (gameRunning) {
      bullets.push({
        x: playerX + playerWidth / 2 - bulletWidth / 2,
        y: playerY,
      });
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowRight") {
    rightPressed = false;
  } else if (e.code === "ArrowLeft") {
    leftPressed = false;
  }
});

// Start and restart buttons
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

startBtn.addEventListener("click", () => {
  console.log("Start button clicked");
  if (!gameRunning) {
    gameRunning = true;
    score = 0;
    bullets = [];
    playerX = (canvasWidth - playerWidth) / 2;
    invaderDirection = 1;
    invaderSpeed = 1.5;
    initInvaders();
    startBtn.classList.add("hidden");
    restartBtn.classList.remove("hidden");
    gameLoop();
  }
});

restartBtn.addEventListener("click", () => {
  gameRunning = false;
  cancelAnimationFrame(animationFrameId);
  score = 0;
  bullets = [];
  playerX = (canvasWidth - playerWidth) / 2;
  invaderDirection = 1;
  invaderSpeed = 1.5;
  initInvaders();
  gameRunning = true;
  gameLoop();
});
