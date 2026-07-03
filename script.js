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

// ==================== MAIN RENDER LOOP ====================
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

  requestAnimationFrame(draw);
}

draw();
