const opts = {
    textos: ['FELIZ', 'CUMPLEAÑOS!', 'WENDY'],
    charSize: 60,
    sampleGap: 4,
    particleRadius: 1.6,
    formSpeed: 0.06,
    holdTime: 2600,
    explodeSpeed: 15,
    colors: ['#ff3b6b', '#ff9f1c', '#ffe066', '#5cff9d', '#4ea8ff', '#b967ff', '#ff67c9'],
    sparks: true
};

const c = document.getElementById('c');
const ctx = c.getContext('2d');
let w, h, hw, hh;

window.addEventListener('resize', resize);
function resize(){
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    hw = w / 2;
    hh = h / 2;
    opts.charSize = Math.max(28, Math.min(60, Math.floor(w / 9)));
    ctx.font = `bold ${opts.charSize}px verdana`;
    buildTargets();
}

class TextParticles {
    constructor(tx, ty, color){
        this.tx = tx;
        this.ty = ty;
        this.color = color;
        this.reset();
    }
    reset(){
        this.x = this.tx + (Math.random()-0.5)*w;
        this.y = h + Math.random() * h * 0.5;
        this.vx = 0;
        this.vy = 0;
        this.phase = 'forming';
        this.alpha = 0;
    }
    explode(){
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * opts.explodeSpeed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.phase = 'exploding';
    }
    update() {
        if (this.phase === 'forming') {
            this.x += (this.tx - this.x) * opts.formSpeed;
            this.y += (this.ty - this.y) * opts.formSpeed;
            this.alpha += (1 - this.alpha) * 0.08;
            const dist = Math.hypot(this.tx - this.x, this.ty - this.y);
            if (dist < 0.6) this.phase = 'holding';
        } else if (this.phase === 'holding') {
            // pequeño brillo/temblor mientras está formado
            this.x = this.tx + Math.sin(Date.now() * 0.005 + this.tx) * 0.4;
            this.y = this.ty + Math.cos(Date.now() * 0.005 + this.ty) * 0.4;
        } else if (this.phase === 'exploding') {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05; // gravedad leve
            this.alpha -= 0.02;
        }
    }
    draw() {
    if (this.alpha <= 0) return;
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, opts.particleRadius, 0, Math.PI * 2);
    ctx.fill();
    }
}

let particles = [];

function buildTargets() {
  particles = [];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  octx.fillStyle = '#fff';
  octx.font = `bold ${opts.charSize}px Verdana`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';

  const lineHeight = opts.charSize * 1.2;
  const startY = hh - ((opts.textos.length - 1) * lineHeight) / 2;

  opts.textos.forEach((linea, i) => {
    octx.fillText(linea, hw, startY + i * lineHeight);
  });

  const data = octx.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y += opts.sampleGap) {
    for (let x = 0; x < w; x += opts.sampleGap) {
      const idx = (y * w + x) * 4 + 3; // canal alpha
      if (data[idx] > 128) {
        const color = opts.colors[Math.floor(Math.random() * opts.colors.length)];
        particles.push(new TextParticles(x, y, color));
      }
    }
  }
}

// ============================================
// CHISPAS DE FONDO
// ============================================
class Spark {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * w;
    this.y = h + 10;
    this.vy = -(2 + Math.random() * 4);
    this.vx = (Math.random() - 0.5) * 0.5;
    this.life = 1;
    this.color = opts.colors[Math.floor(Math.random() * opts.colors.length)];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.012;
    if (this.life <= 0 || this.y < 0) this.reset();
  }
  draw() {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
    ctx.stroke();
  }
}

let sparks = [];
function buildSparks() {
  sparks = [];
  if (!opts.sparks) return;
  for (let i = 0; i < 40; i++) sparks.push(new Spark());
}

// ============================================
// CICLO DE ANIMACIÓN (formar -> mantener -> explotar -> repetir)
// ============================================
let state = 'forming';
let holdStart = 0;

function loop() {
  requestAnimationFrame(loop);

  // estela suave en vez de borrar todo de golpe
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, w, h);

  sparks.forEach(s => { s.update(); s.draw(); });

  particles.forEach(p => { p.update(); p.draw(); });
  ctx.globalAlpha = 1;

  if (state === 'forming') {
    const allFormed = particles.every(p => p.phase !== 'forming');
    if (allFormed) {
      state = 'holding';
      holdStart = Date.now();
    }
  } else if (state === 'holding') {
    if (Date.now() - holdStart > opts.holdTime) {
      particles.forEach(p => p.explode());
      state = 'exploding';
    }
  } else if (state === 'exploding') {
    const allGone = particles.every(p => p.alpha <= 0);
    if (allGone) {
      particles.forEach(p => p.reset());
      state = 'forming';
    }
  }
}
resize();
buildSparks();
loop();

const musicBtn = document.getElementById('musicBtn');
const bgMusic = document.getElementById('bgMusic');

musicBtn.addEventListener('click', () => {
    if(bgMusic.paused){
        bgMusic.play();
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '🎶';
    }else{
        bgMusic.pause();
        musicBtn.classList.remove('playing');
        musicBtn.innerHTML = '🎵';
    }
    
});