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
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;
let gameRunning = false;
// Game state
let score = 0;
let level = 1;
let animationFrameId = null;

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
