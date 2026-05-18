/* ============================================================
   SPEAKER LAYOUT VISUALIZATIONS (Canvas 2D)
   ============================================================ */
function drawSpeakerLayout(canvasId, speakers, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 300;
  const h = canvas.offsetHeight || 300;
  canvas.width = w * window.devicePixelRatio;
  canvas.height = h * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38;

  ctx.fillStyle = '#0e0e1a';
  ctx.fillRect(0, 0, w, h);

  // Grid rings
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * i / 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,245,212,0.07)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Cross
  ctx.beginPath(); ctx.moveTo(cx - r * 1.1, cy); ctx.lineTo(cx + r * 1.1, cy);
  ctx.moveTo(cx, cy - r * 1.1); ctx.lineTo(cx, cy + r * 1.1);
  ctx.strokeStyle = 'rgba(0,245,212,0.07)'; ctx.lineWidth = 1; ctx.stroke();

  // "You" dot
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f5e642'; ctx.fill();
  ctx.font = '10px Space Mono, monospace';
  ctx.fillStyle = 'rgba(245,230,66,0.6)';
  ctx.textAlign = 'center'; ctx.fillText('YOU', cx, cy + 20);

  speakers.forEach(s => {
    const rad = (s.angle - 90) * Math.PI / 180;
    const dist = s.dist || r;
    const sx = cx + Math.cos(rad) * dist;
    const sy = cy + Math.sin(rad) * dist;

    // Line from center to speaker
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy);
    ctx.strokeStyle = 'rgba(0,245,212,0.1)'; ctx.lineWidth = 1; ctx.stroke();

    // Speaker dot
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fillStyle = color || '#00f5d4';
    ctx.globalAlpha = s.sub ? 0.4 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = color || '#00f5d4'; ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;

    // Label
    const lx = cx + Math.cos(rad) * (dist + 22);
    const ly = cy + Math.sin(rad) * (dist + 22);
    ctx.font = '9px Space Mono, monospace';
    ctx.fillStyle = s.sub ? 'rgba(0,245,212,0.4)' : 'rgba(0,245,212,0.8)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.name, lx, ly);
  });
}

function initSpeakerLayouts() {
  const size = document.getElementById('c31').closest('.speaker-canvas-wrap');
  const sp31 = [
    { angle: 0, name: 'C' }, { angle: -30, name: 'L' }, { angle: 30, name: 'R' },
    { angle: 180, name: 'SUB', sub: true, dist: null }
  ];
  const sp51 = [
    { angle: 0, name: 'C' }, { angle: -30, name: 'L' }, { angle: 30, name: 'R' },
    { angle: -110, name: 'Ls' }, { angle: 110, name: 'Rs' },
    { angle: 180, name: 'LFE', sub: true }
  ];
  const angles8 = [0, 45, 90, 135, 180, -135, -90, -45];
  const spAmb = angles8.map((a, i) => ({ angle: a, name: `S${i+1}` }));

  drawSpeakerLayout('c31', sp31, '#label', '#00f5d4');
  drawSpeakerLayout('c51', sp51, '#label', '#f5e642');
  drawSpeakerLayout('camb', spAmb, '#label', '#f700ff');
}

window.addEventListener('load', initSpeakerLayouts);
window.addEventListener('resize', initSpeakerLayouts);

/* ============================================================
   THREE.JS SPHERICAL HARMONICS VISUALIZATION
   ============================================================ */
const SH_INFO = {
  '0,0': { title: 'Y(0,0) — Omnidirectional', desc: 'The zeroth-order harmonic is a perfect sphere — equal response in all directions. This is the W channel in B-format ambisonics, capturing the overall pressure of the soundfield.' },
  '1,-1': { title: 'Y(1,-1)', desc: 'First-order with two lobes along the Y axis (left-right). This is the Y channel in B-format, capturing left-right directional information.' },
  '1,0': { title: 'Y(1,0)', desc: 'First-order with two lobes along the Z axis (up-down). This is the Z channel in B-format, capturing height information.' },
  '1,1': { title: 'Y(1,1)', desc: 'First-order with two lobes along the X axis (front-back). This is the X channel in B-format, capturing front-back directionality.' },
  '2,-2': { title: 'Y(2,-2)', desc: 'Second-order with four lobes rotated 45° from the axes. These tesseral harmonics provide enhanced spatial detail.' },
  '2,-1': { title: 'Y(2,-1)', desc: 'Second-order with four lobes in a tilted vertical arrangement.' },
  '2,0': { title: 'Y(2,0)', desc: 'Second-order zonal harmonic with four lobes and a suppression band at the equator.' },
  '2,1': { title: 'Y(2,1)', desc: 'Second-order with four lobes, mirror symmetry of Y(2,-1).' },
  '2,2': { title: 'Y(2,2)', desc: 'Second-order with four lobes aligned to the axes, complementing Y(2,-2).' },
  '3,-3': { title: 'Y(3,-3)', desc: 'Third-order sectoral harmonic with six lobes arranged symmetrically around the sphere.' },
  '3,-2': { title: 'Y(3,-2)', desc: 'Third-order with eight lobes in a tilted arrangement.' },
  '3,-1': { title: 'Y(3,-1)', desc: 'Third-order with six lobes, complex vertical structure.' },
  '3,0': { title: 'Y(3,0)', desc: 'Third-order zonal harmonic with six lobes and strong equatorial suppression.' },
  '3,1': { title: 'Y(3,1)', desc: 'Third-order with six lobes, mirror of Y(3,-1).' },
  '3,2': { title: 'Y(3,2)', desc: 'Third-order with eight lobes in diagonal arrangement.' },
  '3,3': { title: 'Y(3,3)', desc: 'Third-order sectoral harmonic with six equatorial lobes.' },
  '4,-4': { title: 'Y(4,-4)', desc: 'Fourth-order sectoral harmonic with eight lobes.' },
  '4,-3': { title: 'Y(4,-3)', desc: 'Fourth-order with eight lobes in complex arrangement.' },
  '4,-2': { title: 'Y(4,-2)', desc: 'Fourth-order with eight lobes.' },
  '4,-1': { title: 'Y(4,-1)', desc: 'Fourth-order with eight lobes and vertical structure.' },
  '4,0': { title: 'Y(4,0)', desc: 'Fourth-order zonal harmonic with eight lobes and pronounced polar suppression.' },
  '4,1': { title: 'Y(4,1)', desc: 'Fourth-order with eight lobes, mirror of Y(4,-1).' },
  '4,2': { title: 'Y(4,2)', desc: 'Fourth-order with eight lobes.' },
  '4,3': { title: 'Y(4,3)', desc: 'Fourth-order with eight lobes, mirror of Y(4,-3).' },
  '4,4': { title: 'Y(4,4)', desc: 'Fourth-order sectoral harmonic with eight equatorial lobes.' },
  '5,-5': { title: 'Y(5,-5)', desc: 'Fifth-order sectoral harmonic with ten lobes.' },
  '5,-4': { title: 'Y(5,-4)', desc: 'Fifth-order with ten lobes.' },
  '5,-3': { title: 'Y(5,-3)', desc: 'Fifth-order with ten lobes in complex arrangement.' },
  '5,-2': { title: 'Y(5,-2)', desc: 'Fifth-order with ten lobes.' },
  '5,-1': { title: 'Y(5,-1)', desc: 'Fifth-order with ten lobes and vertical banding.' },
  '5,0': { title: 'Y(5,0)', desc: 'Fifth-order zonal harmonic with ten lobes.' },
  '5,1': { title: 'Y(5,1)', desc: 'Fifth-order with ten lobes, mirror of Y(5,-1).' },
  '5,2': { title: 'Y(5,2)', desc: 'Fifth-order with ten lobes.' },
  '5,3': { title: 'Y(5,3)', desc: 'Fifth-order with ten lobes.' },
  '5,4': { title: 'Y(5,4)', desc: 'Fifth-order with ten lobes.' },
  '5,5': { title: 'Y(5,5)', desc: 'Fifth-order sectoral harmonic with ten equatorial lobes.' },
  '6,-6': { title: 'Y(6,-6)', desc: 'Sixth-order sectoral harmonic with twelve lobes.' },
  '6,-5': { title: 'Y(6,-5)', desc: 'Sixth-order with twelve lobes.' },
  '6,-4': { title: 'Y(6,-4)', desc: 'Sixth-order with twelve lobes.' },
  '6,-3': { title: 'Y(6,-3)', desc: 'Sixth-order with twelve lobes.' },
  '6,-2': { title: 'Y(6,-2)', desc: 'Sixth-order with twelve lobes.' },
  '6,-1': { title: 'Y(6,-1)', desc: 'Sixth-order with twelve lobes and vertical banding.' },
  '6,0': { title: 'Y(6,0)', desc: 'Sixth-order zonal harmonic with twelve lobes.' },
  '6,1': { title: 'Y(6,1)', desc: 'Sixth-order with twelve lobes.' },
  '6,2': { title: 'Y(6,2)', desc: 'Sixth-order with twelve lobes.' },
  '6,3': { title: 'Y(6,3)', desc: 'Sixth-order with twelve lobes.' },
  '6,4': { title: 'Y(6,4)', desc: 'Sixth-order with twelve lobes.' },
  '6,5': { title: 'Y(6,5)', desc: 'Sixth-order with twelve lobes.' },
  '6,6': { title: 'Y(6,6)', desc: 'Sixth-order sectoral harmonic with twelve equatorial lobes.' },
  '7,-7': { title: 'Y(7,-7)', desc: 'Seventh-order sectoral harmonic with fourteen lobes.' },
  '7,-6': { title: 'Y(7,-6)', desc: 'Seventh-order with fourteen lobes.' },
  '7,-5': { title: 'Y(7,-5)', desc: 'Seventh-order with fourteen lobes.' },
  '7,-4': { title: 'Y(7,-4)', desc: 'Seventh-order with fourteen lobes.' },
  '7,-3': { title: 'Y(7,-3)', desc: 'Seventh-order with fourteen lobes.' },
  '7,-2': { title: 'Y(7,-2)', desc: 'Seventh-order with fourteen lobes.' },
  '7,-1': { title: 'Y(7,-1)', desc: 'Seventh-order with fourteen lobes and vertical banding.' },
  '7,0': { title: 'Y(7,0)', desc: 'Seventh-order zonal harmonic with fourteen lobes.' },
  '7,1': { title: 'Y(7,1)', desc: 'Seventh-order with fourteen lobes.' },
  '7,2': { title: 'Y(7,2)', desc: 'Seventh-order with fourteen lobes.' },
  '7,3': { title: 'Y(7,3)', desc: 'Seventh-order with fourteen lobes.' },
  '7,4': { title: 'Y(7,4)', desc: 'Seventh-order with fourteen lobes.' },
  '7,5': { title: 'Y(7,5)', desc: 'Seventh-order with fourteen lobes.' },
  '7,6': { title: 'Y(7,6)', desc: 'Seventh-order with fourteen lobes.' },
  '7,7': { title: 'Y(7,7)', desc: 'Seventh-order sectoral harmonic with fourteen equatorial lobes.' },
};

function getOrderDesc(order) {
  const descs = [
    'Zeroth order — single omnidirectional channel. No spatial information, just overall loudness.',
    'First order B-format. Four channels (W, X, Y, Z) capture the complete soundfield in 3D. Classic ambisonics.',
    'Second order — 9 channels. Noticeably improved angular resolution and larger sweet spot.',
    'Third order — 16 channels. High spatial resolution, standard for research and high-end VR audio.',
    'Fourth order — 25 channels. Professional spatial audio standard. Angular resolution ~18°, widely used in advanced VR.',
    'Fifth order — 36 channels. Used in cutting-edge concert hall auralizations and research systems. ~14° resolution.',
    'Sixth order — 49 channels. Near-transparent spatial reproduction for large loudspeaker arrays. ~11° resolution.',
    'Seventh order — 64 channels. The current practical limit for real-time HOA processing. Sub-5° localization, requires dense speaker arrays.'
  ];
  return descs[order] || `Order ${order} — ${(order+1)*(order+1)} channels.`;
}

let scene, camera, renderer, mesh, points, wireframe, axisGroup;
let currentOrder = 0, currentL = 0, currentM = 0;
let autoRotate = true, rotSpeed = 0.002;
let vizMode = 'shape';
let animId;

function realSphericalHarmonic(l, m, theta, phi) {
  function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  function assocLegendre(l, m, x) {
    let pmm = 1;
    if (m > 0) {
      let somx2 = Math.sqrt((1 - x) * (1 + x));
      let fact2 = 1;
      for (let i = 1; i <= m; i++) { pmm *= (-1) * fact2 * somx2; fact2 += 2; }
    }
    if (l === m) return pmm;
    let pmmp1 = x * (2 * m + 1) * pmm;
    if (l === m + 1) return pmmp1;
    let pll = 0;
    for (let ll = m + 2; ll <= l; ll++) {
      pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
      pmm = pmmp1; pmmp1 = pll;
    }
    return pll;
  }
  const absM = Math.abs(m);
  const K = Math.sqrt((2 * l + 1) / (4 * Math.PI) * fact(l - absM) / fact(l + absM));
  const P = assocLegendre(l, absM, Math.cos(theta));
  if (m === 0) return K * P;
  if (m > 0) return Math.SQRT2 * K * Math.cos(m * phi) * P;
  return Math.SQRT2 * K * Math.sin(-m * phi) * P;
}

function buildSHGeometry(l, m, resolution) {
  resolution = resolution || 80;
  const positions = [], colors = [], normals = [];
  const c1 = new THREE.Color(0x00f5d4);
  const c2 = new THREE.Color(0xf700ff);

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const theta = (i / resolution) * Math.PI;
      const phi = (j / resolution) * 2 * Math.PI;
      const sh = realSphericalHarmonic(l, m, theta, phi);
      const r = Math.abs(sh);
      const sign = sh >= 0;
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);
      positions.push(x, y, z);
      const col = sign ? c1 : c2;
      colors.push(col.r, col.g, col.b);
      normals.push(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
    }
  }

  const indices = [];
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j;
      const b = a + resolution + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

function initThreeJS() {
  const wrap = document.getElementById('sh-canvas-wrap');
  const canvas = document.getElementById('sh-canvas');
  const W = wrap.offsetWidth, H = wrap.offsetHeight;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  camera.position.set(0, 0, 3.5);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0x00f5d4, 0.8);
  dir.position.set(2, 3, 2); scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xf700ff, 0.4);
  dir2.position.set(-2, -1, -2); scene.add(dir2);

  // Axis helpers with labels
  axisGroup = new THREE.Group();
  scene.add(axisGroup);
  
  const axMat = (color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
  const axGeo = (a, b) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b], 3)); return g; };
  
  // X axis (red)
  axisGroup.add(new THREE.Line(axGeo([0,0,0],[1.8,0,0]), axMat(0xff6666)));
  // Y axis (green)
  axisGroup.add(new THREE.Line(axGeo([0,0,0],[0,1.8,0]), axMat(0x66ff66)));
  // Z axis (blue)
  axisGroup.add(new THREE.Line(axGeo([0,0,0],[0,0,1.8]), axMat(0x6666ff)));
  
  // Create canvas textures for axis labels
  function makeTextSprite(text, color, scale = 0.03) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = 'Bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(scale, scale, scale);
    return sprite;
  }
  
  const xLabel = makeTextSprite('X', '#ff6666');
  xLabel.position.set(2.0, 0, 0);
  axisGroup.add(xLabel);
  
  const yLabel = makeTextSprite('Y', '#66ff66');
  yLabel.position.set(0, 2.0, 0);
  axisGroup.add(yLabel);
  
  const zLabel = makeTextSprite('Z', '#6666ff');
  zLabel.position.set(0, 0, 2.0);
  axisGroup.add(zLabel);
  
  buildAndAddMesh(0, 0);

  let isDragging = false, prevX = 0, prevY = 0, groupRot = { x: 0, y: 0 };
  const group = new THREE.Group(); scene.add(group);

  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  window.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX, dy = e.clientY - prevY;
    const rotX = dy * 0.01, rotY = dx * 0.01;
    if (mesh) { mesh.rotation.y += rotY; mesh.rotation.x += rotX; }
    if (points) { points.rotation.y += rotY; points.rotation.x += rotX; }
    if (wireframe) { wireframe.rotation.y += rotY; wireframe.rotation.x += rotX; }
    axisGroup.rotation.y += rotY;
    axisGroup.rotation.x += rotX;
    prevX = e.clientX; prevY = e.clientY;
  });

  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', () => isDragging = false);
  canvas.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevX, dy = e.touches[0].clientY - prevY;
    const rotX = dy * 0.01, rotY = dx * 0.01;
    if (mesh) { mesh.rotation.y += rotY; mesh.rotation.x += rotX; }
    if (points) { points.rotation.y += rotY; points.rotation.x += rotX; }
    if (wireframe) { wireframe.rotation.y += rotY; wireframe.rotation.x += rotX; }
    axisGroup.rotation.y += rotY;
    axisGroup.rotation.x += rotX;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  }, { passive: true });

  document.getElementById('rotSpeed').addEventListener('input', function() {
    rotSpeed = this.value * 0.001;
  });

  function animate() {
    animId = requestAnimationFrame(animate);
    const speed = parseFloat(document.getElementById('rotSpeed').value) * 0.001;
    if (mesh) mesh.rotation.y += speed;
    if (points) points.rotation.y += speed;
    if (wireframe) wireframe.rotation.y += speed;
    axisGroup.rotation.y += speed;
    renderer.render(scene, camera);
  }
  animate();
}

function buildAndAddMesh(l, m) {
  if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
  if (points) { scene.remove(points); points.geometry.dispose(); }
  if (wireframe) { scene.remove(wireframe); wireframe.geometry.dispose(); }

  const geo = buildSHGeometry(l, m, 64);

  if (vizMode === 'shape' || vizMode === 'wireframe') {
    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 60,
      side: THREE.DoubleSide,
      wireframe: vizMode === 'wireframe',
      transparent: vizMode === 'wireframe',
      opacity: vizMode === 'wireframe' ? 0.7 : 1
    });
    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
  }

  if (vizMode === 'points') {
    const pMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.025 });
    points = new THREE.Points(geo, pMat);
    scene.add(points);
  }

  updateSHInfo(l, m);
  updateOrderInfo();
}

function resetSHRotation() {
  if (mesh) mesh.rotation.set(0, 0, 0);
  if (points) points.rotation.set(0, 0, 0);
  if (wireframe) wireframe.rotation.set(0, 0, 0);
  if (axisGroup) axisGroup.rotation.set(0, 0, 0);
}

function updateSHInfo(l, m) {
  const key = `${l},${m}`;
  const info = SH_INFO[key] || { title: `Y(${l},${m})`, desc: `Spherical harmonic of order ${l}, degree ${m}. Part of the ${l === 0 ? 'zeroth' : l === 1 ? 'first' : l === 2 ? 'second' : 'third'}-order ambisonics channel set.` };
  document.getElementById('shTitle').textContent = info.title;
  document.getElementById('shDesc').textContent = info.desc;
}

function updateOrderInfo() {
  const l = currentOrder;
  const n = (l + 1) * (l + 1);
  const labels = ['Order 0 — Mono', 'Order 1 — B-Format', 'Order 2 — HOA', 'Order 3 — HOA'];
  document.getElementById('currentLabel').textContent = labels[l] || `Order ${l}`;
  document.getElementById('channelCount').textContent = n;
  document.getElementById('orderDesc').textContent = getOrderDesc(l);
}

function buildHarmonicGrid(order) {
  const grid = document.getElementById('harmonicGrid');
  grid.innerHTML = '';
  
  for (let l = 0; l <= order; l++) {
    // Create order group container
    const orderGroup = document.createElement('div');
    orderGroup.className = 'sh-order-group';
    
    // Add order label
    const orderLabel = document.createElement('div');
    orderLabel.className = 'sh-order-label';
    orderLabel.textContent = `Order ${l}`;
    orderGroup.appendChild(orderLabel);
    
    // Create buttons container for this order
    const orderBtns = document.createElement('div');
    orderBtns.className = 'sh-order-buttons';
    
    // Add all harmonics for this order
    for (let m = -l; m <= l; m++) {
      const btn = document.createElement('button');
      btn.className = 'sh-harmonic-btn' + (l === currentL && m === currentM ? ' active' : '');
      btn.textContent = `(${l},${m})`;
      btn.onclick = () => {
        currentL = l; currentM = m;
        document.querySelectorAll('.sh-harmonic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buildAndAddMesh(l, m);
        resetSHRotation();
      };
      orderBtns.appendChild(btn);
    }
    
    orderGroup.appendChild(orderBtns);
    grid.appendChild(orderGroup);
  }
}

window.setMode = function(mode) {
  vizMode = mode;
  document.getElementById('modeShape').classList.toggle('active', mode === 'shape');
  document.getElementById('modeWireframe').classList.toggle('active', mode === 'wireframe');
  document.getElementById('modePoints').classList.toggle('active', mode === 'points');
  buildAndAddMesh(currentL, currentM);
};

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  buildHarmonicGrid(0);

  document.querySelectorAll('#orderBtns .sh-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = parseInt(btn.dataset.order);
      currentOrder = order;
      currentL = order; currentM = 0;
      document.querySelectorAll('#orderBtns .sh-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildHarmonicGrid(order);
      buildAndAddMesh(currentL, currentM);
      resetSHRotation();
    });
  });

  // Resize handler
  window.addEventListener('resize', () => {
    const wrap = document.getElementById('sh-canvas-wrap');
    const W = wrap.offsetWidth, H = wrap.offsetHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    initSpeakerLayouts();
  });

  // Fade-in observer
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
