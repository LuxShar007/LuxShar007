const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Interactive mouse coordinates
let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
window.addEventListener('mousemove', (e) => {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;
});

// Mesh Grid parameters
const cols = 28;
const rows = 20;
const points = [];
const focalLength = 320;

// Initialize 3D coordinate vertices
for (let c = 0; c < cols; c++) {
  points[c] = [];
  for (let r = 0; r < rows; r++) {
    const x = (c - cols / 2) * 50;
    const y = (r - rows / 2) * 50;
    const z = 0;
    points[c][r] = { x, y, z, baseZ: z };
  }
}

let time = 0;

function draw() {
  // Deep space background
  ctx.fillStyle = '#03030c';
  ctx.fillRect(0, 0, width, height);

  // Smooth mouse coordinates interpolation
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;

  time += 0.015;

  // Wave equations & mouse proximity displacement calculations
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const pt = points[c][r];
      
      // Complex high-framerate fluid waves
      const waveVal = Math.sin(pt.x * 0.004 + time) * Math.cos(pt.y * 0.004 + time) * 65 +
                      Math.sin((pt.x + pt.y) * 0.002 + time * 1.3) * 25;

      // Mouse interactive field distortion (144Hz responsive ripple)
      const screenX = width / 2 + pt.x;
      const screenY = height / 2 + pt.y;
      const dist = Math.hypot(mouse.x - screenX, mouse.y - screenY);
      const mouseDisp = dist < 280 ? (280 - dist) * 0.45 : 0;

      pt.z = pt.baseZ + waveVal + mouseDisp;
    }
  }

  // Perspective 3D rotation and projection mapping
  function project(x, y, z) {
    const angleY = (mouse.x - width / 2) * 0.00025;
    const angleX = (mouse.y - height / 2) * 0.00025;

    // Y rotation
    let rx = x * Math.cos(angleY) - z * Math.sin(angleY);
    let rz = z * Math.cos(angleY) + x * Math.sin(angleY);
    
    // X rotation
    let ry = y * Math.cos(angleX) - rz * Math.sin(angleX);
    rz = rz * Math.cos(angleX) + y * Math.sin(angleX);

    const zShift = rz + 420;
    const scale = focalLength / Math.max(1, zShift);
    
    const projX = width / 2 + rx * scale;
    const projY = height / 2 + ry * scale;

    return { x: projX, y: projY, z: zShift };
  }

  // Draw vertical connecting grid lines
  ctx.lineWidth = 0.65;
  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const pt = points[c][r];
      const proj = project(pt.x, pt.y, pt.z);
      
      if (r === 0) {
        ctx.moveTo(proj.x, proj.y);
      } else {
        ctx.lineTo(proj.x, proj.y);
      }
    }
    
    // Interpolate neon grid stroke colors
    const colRatio = c / (cols - 1);
    ctx.strokeStyle = `rgba(${Math.floor(168 + colRatio * 86)}, ${Math.floor(85 - colRatio * 22)}, ${Math.floor(247 - colRatio * 153)}, 0.12)`;
    ctx.stroke();
  }

  // Draw horizontal connecting grid lines
  for (let r = 0; r < rows; r++) {
    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      const pt = points[c][r];
      const proj = project(pt.x, pt.y, pt.z);
      
      if (c === 0) {
        ctx.moveTo(proj.x, proj.y);
      } else {
        ctx.lineTo(proj.x, proj.y);
      }
    }
    
    const rowRatio = r / (rows - 1);
    ctx.strokeStyle = `rgba(${Math.floor(244 - rowRatio * 76)}, ${Math.floor(63 + rowRatio * 22)}, ${Math.floor(94 + rowRatio * 153)}, 0.12)`;
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

// Start visualizer animation
draw();
