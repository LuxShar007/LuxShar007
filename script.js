const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initStarfield();
  initMatrix();
});

// Interactive mouse coordinates
let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
window.addEventListener('mousemove', (e) => {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;
  
  if (humActive && audioCtx && filter && oscillator) {
    const baseFreq = 50 + (e.clientX / window.innerWidth) * 35;
    oscillator.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.1);
    const cutFreq = 80 + (1 - e.clientY / window.innerHeight) * 200;
    filter.frequency.setTargetAtTime(cutFreq, audioCtx.currentTime, 0.1);
  }
});

// Themes configuration
const themes = [
  { name: 'Sith Crimson', pColor: '#a855f7', mColor: '#f43f5e', cColor: '#00d2ff', bgGrad: ['#a855f7', '#f43f5e', '#00d2ff'] },
  { name: 'Cyber Cyan', pColor: '#00d2ff', mColor: '#a855f7', cColor: '#fbbf24', bgGrad: ['#00d2ff', '#a855f7', '#fbbf24'] },
  { name: 'Matrix Green', pColor: '#10b981', mColor: '#00d2ff', cColor: '#fbbf24', bgGrad: ['#10b981', '#00d2ff', '#fbbf24'] }
];
let currentThemeIdx = 0;

// Animation modes configuration
const animModes = ['3D Grid', 'Star Field', 'Matrix Rain'];
let currentAnimModeIdx = 0;

// Setup Theme Click Event
const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    const theme = themes[currentThemeIdx];
    themeBtn.textContent = `🎨 ACCENT: ${theme.name.toUpperCase()}`;
    
    // Dynamically update CSS variables
    document.documentElement.style.setProperty('--purple-accent', theme.pColor);
    document.documentElement.style.setProperty('--magenta-accent', theme.mColor);
    document.documentElement.style.setProperty('--cyan-accent', theme.cColor);
  });
}

// Setup Animation Click Event
const animBtn = document.getElementById('animation-btn');
if (animBtn) {
  animBtn.addEventListener('click', () => {
    currentAnimModeIdx = (currentAnimModeIdx + 1) % animModes.length;
    animBtn.textContent = `🌀 BACKGROUND: ${animModes[currentAnimModeIdx].toUpperCase()}`;
  });
}

// ==================== MODE 1: 3D GRID ====================
const cols = 28;
const rows = 20;
const points = [];
const focalLength = 320;

for (let c = 0; c < cols; c++) {
  points[c] = [];
  for (let r = 0; r < rows; r++) {
    points[c][r] = {
      x: (c - cols / 2) * 50,
      y: (r - rows / 2) * 50,
      z: 0,
      baseZ: 0
    };
  }
}

function drawGrid(time) {
  // Update grid dynamics
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const pt = points[c][r];
      const waveVal = Math.sin(pt.x * 0.004 + time) * Math.cos(pt.y * 0.004 + time) * 65 +
                      Math.sin((pt.x + pt.y) * 0.002 + time * 1.3) * 25;
      const screenX = width / 2 + pt.x;
      const screenY = height / 2 + pt.y;
      const dist = Math.hypot(mouse.x - screenX, mouse.y - screenY);
      const mouseDisp = dist < 280 ? (280 - dist) * 0.45 : 0;
      pt.z = waveVal + mouseDisp;
    }
  }

  function project(x, y, z) {
    const angleY = (mouse.x - width / 2) * 0.00025;
    const angleX = (mouse.y - height / 2) * 0.00025;
    let rx = x * Math.cos(angleY) - z * Math.sin(angleY);
    let rz = z * Math.cos(angleY) + x * Math.sin(angleY);
    let ry = y * Math.cos(angleX) - rz * Math.sin(angleX);
    rz = rz * Math.cos(angleX) + y * Math.sin(angleX);
    const zShift = rz + 420;
    const scale = focalLength / Math.max(1, zShift);
    return { x: width / 2 + rx * scale, y: height / 2 + ry * scale };
  }

  const theme = themes[currentThemeIdx];
  ctx.lineWidth = 0.65;

  // Draw columns
  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const pt = points[c][r];
      const proj = project(pt.x, pt.y, pt.z);
      if (r === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    const colRatio = c / (cols - 1);
    ctx.strokeStyle = `${theme.pColor}${Math.floor(18 + colRatio * 18).toString(16)}`;
    ctx.stroke();
  }

  // Draw rows
  for (let r = 0; r < rows; r++) {
    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      const pt = points[c][r];
      const proj = project(pt.x, pt.y, pt.z);
      if (c === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    const rowRatio = r / (rows - 1);
    ctx.strokeStyle = `${theme.mColor}${Math.floor(18 + rowRatio * 18).toString(16)}`;
    ctx.stroke();
  }
}

// ==================== MODE 2: STAR FIELD ====================
const numStars = 150;
const stars = [];

function initStarfield() {
  stars.length = 0;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 400
    });
  }
}
initStarfield();

function drawStarfield() {
  const theme = themes[currentThemeIdx];
  const angleY = (mouse.x - width / 2) * 0.0003;
  const angleX = (mouse.y - height / 2) * 0.0003;

  for (let i = 0; i < numStars; i++) {
    const star = stars[i];
    star.z -= 1.8; // move star forward

    // Reset stars when they pass the camera
    if (star.z <= 0) {
      star.x = (Math.random() - 0.5) * width * 2;
      star.y = (Math.random() - 0.5) * height * 2;
      star.z = 400;
    }

    // Apply interactive rotation
    let rx = star.x * Math.cos(angleY) - star.y * Math.sin(angleY);
    let ry = star.y * Math.cos(angleY) + star.x * Math.sin(angleY);
    
    const scale = focalLength / star.z;
    const px = width / 2 + rx * scale;
    const py = height / 2 + ry * scale;

    if (px >= 0 && px <= width && py >= 0 && py <= height) {
      const radius = Math.max(0.5, (1 - star.z / 400) * 3);
      const alpha = (1 - star.z / 400);
      
      // Draw star particle
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${theme.pColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();

      // Constellation linkages: draw line between close stars
      for (let j = i + 1; j < numStars; j++) {
        const other = stars[j];
        const dx = star.x - other.x;
        const dy = star.y - other.y;
        const dz = star.z - other.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < 100) {
          const ox = width / 2 + other.x * (focalLength / other.z);
          const oy = height / 2 + other.y * (focalLength / other.z);
          const linkAlpha = (1 - dist / 100) * 0.15;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ox, oy);
          ctx.strokeStyle = `${theme.mColor}${Math.floor(linkAlpha * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
  }
}

// ==================== MODE 3: MATRIX CODE RAIN ====================
const font_size = 14;
let columns = 0;
let drops = [];

function initMatrix() {
  columns = Math.floor(width / font_size);
  drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100; // random offset starting drops above screen
  }
}
initMatrix();

const matrixChars = "010101XYZΩΔΨΦΞΛΠΣΘΓ0101";

function drawMatrix() {
  const theme = themes[currentThemeIdx];
  ctx.font = `${font_size}px monospace`;

  for (let i = 0; i < columns; i++) {
    if (Math.random() > 0.96) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const x = i * font_size;
      const y = drops[i] * font_size;

      // Draw character
      ctx.fillStyle = theme.pColor;
      ctx.fillText(char, x, y);

      // Add a trailing glow node
      if (Math.random() > 0.7) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, x, y);
      }
    }

    // Move drop down
    drops[i] += 0.5;

    // Reset drops returning to top
    if (drops[i] * font_size > height && Math.random() > 0.985) {
      drops[i] = 0;
    }
  }
}

// ==================== MAIN RENDER LOOP & PARTICLES ====================
const customParticles = [];

function createSparks(x, y, color = '#fbbf24') {
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    customParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      alpha: 1.0,
      size: 1.5 + Math.random() * 3,
      color: color
    });
  }
}

function drawParticles() {
  for (let i = customParticles.length - 1; i >= 0; i--) {
    const p = customParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.025;
    
    if (p.alpha <= 0) {
      customParticles.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.restore();
  }
}

let timeCounter = 0;

function draw() {
  // Semi-transparent clean sweep for trail effects in Starfield & Matrix
  if (animModes[currentAnimModeIdx] === '3D Grid') {
    ctx.fillStyle = '#03030c';
    ctx.fillRect(0, 0, width, height);
    timeCounter += 0.015;
    drawGrid(timeCounter);
  } else if (animModes[currentAnimModeIdx] === 'Star Field') {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.1)';
    ctx.fillRect(0, 0, width, height);
    drawStarfield();
  } else if (animModes[currentAnimModeIdx] === 'Matrix Rain') {
    ctx.fillStyle = 'rgba(3, 3, 12, 0.06)';
    ctx.fillRect(0, 0, width, height);
    drawMatrix();
  }

  // Draw any game battle sparks
  drawParticles();

  requestAnimationFrame(draw);
}

draw();


// ==================== CUDA SIMULATOR HUB ====================
const cudaGrid = document.getElementById('cuda-thread-grid');
const cudaLaunchBtn = document.getElementById('cuda-launch-btn');
const cudaConsole = document.getElementById('cuda-console-output');

const cudaCells = [];
const numThreads = 256; // 16x16

// Initialize CUDA grid cells on page load
if (cudaGrid) {
  for (let i = 0; i < numThreads; i++) {
    const cell = document.createElement('div');
    cell.className = 'cuda-cell';
    cudaGrid.appendChild(cell);
    cudaCells.push(cell);
  }
}

let cudaRunning = false;

function logCuda(message, color = '#cbd5e1') {
  if (!cudaConsole) return;
  const line = document.createElement('div');
  line.style.color = color;
  line.textContent = message;
  cudaConsole.appendChild(line);
  cudaConsole.parentElement.scrollTop = cudaConsole.parentElement.scrollHeight;
}

if (cudaLaunchBtn) {
  cudaLaunchBtn.addEventListener('click', () => {
    if (cudaRunning) return;
    cudaRunning = true;
    cudaLaunchBtn.disabled = true;
    cudaLaunchBtn.textContent = '⚡ KERNEL RUNNING...';
    
    // Reset Grid and Console
    cudaCells.forEach(cell => {
      cell.className = 'cuda-cell';
    });
    if (cudaConsole) cudaConsole.innerHTML = '';
    
    // Launch timeline sequence
    logCuda('>>> [SYSTEM] Initializing CUDA compiler check...', '#64748b');
    
    setTimeout(() => {
      logCuda('>>> [COMPILER] nvcc spatial_ops.cu -o spatial_ops -lcudart -O3... SUCCESS', '#10b981');
    }, 600);
    
    setTimeout(() => {
      logCuda('>>> [MEMCPY] Host-to-Device (HtoD): Copying 256MB vectors to L2 cache...', '#fbbf24');
    }, 1200);
    
    // Block thread simulation sequentially
    const blockRows = 8; // 8 blocks of 32 threads (2 rows each)
    for (let b = 0; b < blockRows; b++) {
      setTimeout(() => {
        logCuda(`>>> [KERNEL] SM Block ${b}: Launching spatial_ops_kernel<<<8, 32>>>...`, 'var(--cyan-accent)');
        // Make 32 cells (2 rows) active
        for (let t = b * 32; t < (b + 1) * 32; t++) {
          if (cudaCells[t]) cudaCells[t].classList.add('active');
        }
      }, 1800 + b * 250);
    }
    
    // Sync block
    setTimeout(() => {
      logCuda('>>> [SYNC] __syncthreads() barrier hit: Synchronizing shared memory cache...', '#fbbf24');
      cudaCells.forEach(cell => {
        if (cell.classList.contains('active')) {
          cell.classList.remove('active');
          cell.classList.add('sync');
        }
      });
    }, 1800 + blockRows * 250 + 200);

    // Done block
    setTimeout(() => {
      logCuda('>>> [COMPUTE] Kernel block execution complete. Threads writing back to global memory...', '#10b981');
      cudaCells.forEach(cell => {
        if (cell.classList.contains('sync')) {
          cell.classList.remove('sync');
          cell.classList.add('done');
        }
      });
    }, 1800 + blockRows * 250 + 900);
    
    // Final copy back
    setTimeout(() => {
      logCuda('>>> [MEMCPY] Device-to-Host (DtoH): Copying output matrices back to CPU... SUCCESS', '#fbbf24');
      logCuda('>>> [RUNTIME] spatial_ops_kernel completed in 0.42ms. GPU Grid synchronized.', 'var(--purple-accent)');
      cudaRunning = false;
      cudaLaunchBtn.disabled = false;
      cudaLaunchBtn.textContent = '⚡ LAUNCH CUDA KERNEL';
    }, 1800 + blockRows * 250 + 1700);
  });
}


// ==================== LIGHTSABER DUEL GAME ====================
let playerHp = 100;
let vaderHp = 100;
let gameOver = false;
let defendActive = false;
let vaderCounterTimeout = null;

const battleLog = document.getElementById('battle-log');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpVal = document.getElementById('player-hp-val');
const vaderHpBar = document.getElementById('vader-hp-bar');
const vaderHpVal = document.getElementById('vader-hp-val');
const btnStrike = document.getElementById('btn-strike');
const btnDeflect = document.getElementById('btn-deflect');
const btnFocus = document.getElementById('btn-focus');

function logBattle(message, color = '#cbd5e1') {
  if (!battleLog) return;
  const line = document.createElement('div');
  line.style.color = color;
  line.textContent = `>>> ${message}`;
  battleLog.appendChild(line);
  battleLog.scrollTop = battleLog.scrollHeight;
}

function updateHpUI() {
  if (playerHpBar) playerHpBar.style.width = `${playerHp}%`;
  if (playerHpVal) playerHpVal.textContent = `${playerHp}%`;
  if (vaderHpBar) vaderHpBar.style.width = `${vaderHp}%`;
  if (vaderHpVal) vaderHpVal.textContent = `${vaderHp}%`;
}

function resetGame(winner) {
  gameOver = true;
  if (winner === 'player') {
    logBattle('VICTORY! Darth Vader has retreated. Kyber matrix stabilized.', 'var(--purple-accent)');
  } else {
    logBattle('DEFEAT! System shields depleted. Reinitializing matrices...', 'var(--magenta-accent)');
  }
  
  setTimeout(() => {
    playerHp = 100;
    vaderHp = 100;
    gameOver = false;
    defendActive = false;
    updateHpUI();
    if (battleLog) battleLog.innerHTML = '<div style="color: #64748b;">// Combat matrix reinitialized. Strike to begin.</div>';
  }, 4000);
}

function triggerVaderAttack() {
  if (gameOver) return;
  
  logBattle('WARNING: Darth Vader is charging a crimson Force Sweep! DEFLECT NOW!', '#f43f5e');
  defendActive = false;
  
  vaderCounterTimeout = setTimeout(() => {
    if (gameOver) return;
    
    if (defendActive) {
      logBattle('DEFLECT: Crimson strike deflected! Kyber shield intact.', '#00d2ff');
      createSparks(width / 2, height / 2, '#00d2ff');
    } else {
      const dmg = Math.floor(15 + Math.random() * 15);
      playerHp = Math.max(0, playerHp - dmg);
      logBattle(`DAMAGE: Vader strikes you with crimson rage! You lose ${dmg}% HP.`, '#f43f5e');
      createSparks(width / 2, height / 2, '#f43f5e');
      updateHpUI();
      
      if (playerHp <= 0) {
        resetGame('vader');
      }
    }
  }, 1300);
}

if (btnStrike) {
  btnStrike.addEventListener('click', () => {
    if (gameOver) return;
    
    // Cancel pending counter timer if clicked strike repeatedly
    if (vaderCounterTimeout) clearTimeout(vaderCounterTimeout);
    
    const dmg = Math.floor(10 + Math.random() * 12);
    vaderHp = Math.max(0, vaderHp - dmg);
    logBattle(`STRIKE: Slashed Darth Vader! Vader takes ${dmg}% damage.`, 'var(--purple-accent)');
    
    // Spark burst center of screen
    createSparks(width / 2, height / 2, 'var(--purple-accent)');
    updateHpUI();
    
    if (vaderHp <= 0) {
      resetGame('player');
    } else {
      // Trigger counter after 1.5 seconds
      vaderCounterTimeout = setTimeout(triggerVaderAttack, 1400);
    }
  });
}

if (btnDeflect) {
  btnDeflect.addEventListener('click', () => {
    if (gameOver) return;
    defendActive = true;
    logBattle('DEFLECTION BLOCK INITIALIZED. Shield active.', '#00d2ff');
  });
}

if (btnFocus) {
  btnFocus.addEventListener('click', () => {
    if (gameOver) return;
    const heal = Math.floor(12 + Math.random() * 10);
    playerHp = Math.min(100, playerHp + heal);
    logBattle(`FORCE HEAL: Restored ${heal}% HP.`, '#10b981');
    updateHpUI();
  });
}


// ==================== WEB AUDIO OSCILLATOR & HUM WAVE ====================
const btnHum = document.getElementById('btn-hum');
const humCanvas = document.getElementById('hum-canvas');
let humCtx = humCanvas ? humCanvas.getContext('2d') : null;

let audioCtx = null;
let oscillator = null;
let filter = null;
let gainNode = null;
let humActive = false;
let humTime = 0;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  oscillator = audioCtx.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(65, audioCtx.currentTime); // C2 low pitch
  
  filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(120, audioCtx.currentTime); // low bass hum filter
  
  gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // start muted
  
  oscillator.connect(filter).connect(gainNode).connect(audioCtx.destination);
  oscillator.start();
}

if (btnHum) {
  btnHum.addEventListener('click', () => {
    if (!audioCtx) initAudio();
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (!humActive) {
      gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.15);
      humActive = true;
      btnHum.textContent = '🔊 MUTE KYBER HUM MATRIX';
      btnHum.style.borderColor = 'var(--purple-accent)';
      btnHum.style.background = 'rgba(168, 85, 247, 0.1)';
    } else {
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      humActive = false;
      btnHum.textContent = '🔊 INITIALIZE KYBER HUM MATRIX';
      btnHum.style.borderColor = '';
      btnHum.style.background = '';
    }
  });
}

function drawHumWave() {
  if (!humCanvas || !humCtx) return;
  
  humCtx.fillStyle = '#03030c';
  humCtx.fillRect(0, 0, humCanvas.width, humCanvas.height);
  
  humCtx.beginPath();
  humCtx.lineWidth = 1.5;
  
  const theme = themes[currentThemeIdx];
  humCtx.strokeStyle = theme.pColor;
  
  const pointsCount = humCanvas.width;
  const centerY = humCanvas.height / 2;
  
  humTime += 0.12;
  
  // Amplitude increases if active
  let amp = humActive ? 12 : 1;
  // Frequency shifts reactive to mouse coordinates
  let freqVal = humActive ? 0.05 + (mouse.x / window.innerWidth) * 0.05 : 0.03;
  
  for (let x = 0; x < pointsCount; x++) {
    let sine = Math.sin(x * freqVal - humTime) * Math.cos(x * 0.005 + humTime * 0.5);
    if (humActive) {
      sine += Math.sin(x * 0.45 + humTime * 2.1) * 0.15;
    }
    const y = centerY + sine * amp;
    
    if (x === 0) humCtx.moveTo(x, y);
    else humCtx.lineTo(x, y);
  }
  
  humCtx.shadowBlur = humActive ? 8 : 0;
  humCtx.shadowColor = theme.pColor;
  humCtx.stroke();
  humCtx.shadowBlur = 0; // reset
  
  requestAnimationFrame(drawHumWave);
}

// Start wave rendering loop
if (humCanvas) {
  drawHumWave();
}


