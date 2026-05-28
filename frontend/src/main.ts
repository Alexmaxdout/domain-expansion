import './style.css';

type DomainName =
  | 'unlimited_void'
  | 'malevolent_shrine'
  | 'chimera_shadow_garden'
  | 'authentic_mutual_love'
  | 'idle_death_gamble'
  | 'deadly_sentencing';

type DomainMessage = {
  domain?: DomainName;
  error?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  spin?: number;
  shape?: 'circle' | 'slash' | 'heart' | 'card' | 'gavel';
};

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#domain-canvas');
const statusEl = requiredElement<HTMLParagraphElement>('#status');
const domainNameEl = requiredElement<HTMLHeadingElement>('#domain-name');
const rawCtx = canvas.getContext('2d');

if (!rawCtx) {
  throw new Error('Canvas 2D context is unavailable.');
}

const ctx: CanvasRenderingContext2D = rawCtx;

const domainLabels: Record<DomainName, string> = {
  unlimited_void: 'Unlimited Void',
  malevolent_shrine: 'Malevolent Shrine',
  chimera_shadow_garden: 'Chimera Shadow Garden',
  authentic_mutual_love: 'Authentic Mutual Love',
  idle_death_gamble: 'Idle Death Gamble',
  deadly_sentencing: 'Deadly Sentencing',
};

const particles: Particle[] = [];
let activeDomain: DomainName | null = null;
let startedAt = 0;
let reconnectTimer = 0;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function resizeCanvas(): void {
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function setStatus(text: string, connected: boolean): void {
  statusEl.textContent = text;
  statusEl.dataset.connected = String(connected);
}

function spawnParticle(particle: Particle): void {
  particles.push(particle);
}

function spawnBurst(domain: DomainName): void {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  if (domain === 'unlimited_void') {
    for (let i = 0; i < 190; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(2.5, 9);
      spawnParticle({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: randomBetween(55, 95),
        size: randomBetween(1, 3),
        color: Math.random() > 0.35 ? '#dff7ff' : '#6bbcff',
        shape: 'circle',
      });
    }
    return;
  }

  if (domain === 'malevolent_shrine') {
    for (let i = 0; i < 110; i += 1) {
      const angle = randomBetween(-0.35, 0.35) + (i % 2 === 0 ? -0.85 : 0.85);
      const speed = randomBetween(7, 15);
      spawnParticle({
        x: centerX + randomBetween(-100, 100),
        y: centerY + randomBetween(-70, 70),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: randomBetween(28, 54),
        size: randomBetween(3, 8),
        color: Math.random() > 0.4 ? '#ff273d' : '#ffd6d6',
        spin: randomBetween(-0.3, 0.3),
        shape: 'slash',
      });
    }
    return;
  }

  if (domain === 'chimera_shadow_garden') {
    for (let i = 0; i < 170; i += 1) {
      spawnParticle({
        x: randomBetween(0, window.innerWidth),
        y: window.innerHeight + randomBetween(0, 120),
        vx: randomBetween(-1.4, 1.4),
        vy: randomBetween(-7, -2),
        life: 0,
        maxLife: randomBetween(72, 135),
        size: randomBetween(2, 9),
        color: Math.random() > 0.5 ? '#8b5cf6' : '#111018',
        shape: 'circle',
      });
    }
    return;
  }

  if (domain === 'authentic_mutual_love') {
    for (let i = 0; i < 130; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(1.5, 6);
      spawnParticle({
        x: centerX + randomBetween(-40, 40),
        y: centerY + randomBetween(-35, 35),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0,
        maxLife: randomBetween(70, 120),
        size: randomBetween(5, 13),
        color: Math.random() > 0.45 ? '#ffb4d2' : '#fef3c7',
        spin: randomBetween(-0.12, 0.12),
        shape: 'heart',
      });
    }
    return;
  }

  if (domain === 'idle_death_gamble') {
    for (let i = 0; i < 95; i += 1) {
      spawnParticle({
        x: randomBetween(-80, window.innerWidth + 80),
        y: randomBetween(-40, window.innerHeight * 0.65),
        vx: randomBetween(-2.5, 2.5),
        vy: randomBetween(2.5, 8),
        life: 0,
        maxLife: randomBetween(75, 130),
        size: randomBetween(12, 24),
        color: Math.random() > 0.5 ? '#facc15' : '#22c55e',
        spin: randomBetween(-0.22, 0.22),
        shape: 'card',
      });
    }
    return;
  }

  for (let i = 0; i < 80; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    spawnParticle({
      x: centerX + side * randomBetween(20, window.innerWidth * 0.48),
      y: randomBetween(60, window.innerHeight - 80),
      vx: -side * randomBetween(3, 8),
      vy: randomBetween(-1.5, 1.5),
      life: 0,
      maxLife: randomBetween(50, 90),
      size: randomBetween(8, 18),
      color: Math.random() > 0.45 ? '#e5e7eb' : '#fb7185',
      spin: randomBetween(-0.18, 0.18),
      shape: 'gavel',
    });
  }
}

function playDomain(domain: DomainName): void {
  activeDomain = domain;
  startedAt = performance.now();
  domainNameEl.textContent = domainLabels[domain];
  particles.length = 0;
  spawnBurst(domain);
}

function drawBackground(): void {
  const gradient = ctx.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight / 2,
    Math.max(window.innerWidth, window.innerHeight),
  );

  gradient.addColorStop(0, '#111827');
  gradient.addColorStop(1, '#030712');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawRing(elapsed: number, color: string): void {
  const progress = Math.min(elapsed / 1100, 1);
  const radius = progress * Math.max(window.innerWidth, window.innerHeight);

  ctx.strokeStyle = color;
  ctx.lineWidth = 8 * (1 - progress);
  ctx.globalAlpha = 1 - progress;
  ctx.beginPath();
  ctx.arc(window.innerWidth / 2, window.innerHeight / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHeart(size: number): void {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size, -size * 0.25, -size * 0.55, -size, 0, -size * 0.45);
  ctx.bezierCurveTo(size * 0.55, -size, size, -size * 0.25, 0, size * 0.35);
  ctx.fill();
}

function drawParticle(particle: Particle): void {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate((particle.spin || 0) * particle.life);
  ctx.fillStyle = particle.color;

  if (particle.shape === 'slash') {
    ctx.rotate(-0.75);
    ctx.fillRect(-particle.size * 3, -particle.size / 2, particle.size * 6, particle.size);
  } else if (particle.shape === 'heart') {
    drawHeart(particle.size);
  } else if (particle.shape === 'card') {
    ctx.fillRect(-particle.size * 0.7, -particle.size, particle.size * 1.4, particle.size * 2);
    ctx.fillStyle = '#052e16';
    ctx.fillRect(-particle.size * 0.42, -particle.size * 0.55, particle.size * 0.84, particle.size * 1.1);
  } else if (particle.shape === 'gavel') {
    ctx.fillRect(-particle.size, -particle.size * 0.35, particle.size * 2, particle.size * 0.7);
    ctx.fillRect(-particle.size * 0.15, -particle.size * 0.1, particle.size * 0.3, particle.size * 1.7);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawParticles(): void {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life += 1;
    particle.x += particle.vx;
    particle.y += particle.vy;

    const alpha = Math.max(1 - particle.life / particle.maxLife, 0);
    ctx.globalAlpha = alpha;
    drawParticle(particle);

    if (particle.life >= particle.maxLife) {
      particles.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
}

function drawDomainOverlay(elapsed: number): void {
  if (activeDomain === 'unlimited_void') {
    drawRing(elapsed, '#b9efff');
  } else if (activeDomain === 'malevolent_shrine') {
    ctx.fillStyle = `rgba(120, 0, 12, ${Math.max(0.1, 0.35 - elapsed / 5000)})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawRing(elapsed, '#ff2038');
  } else if (activeDomain === 'chimera_shadow_garden') {
    ctx.fillStyle = `rgba(35, 12, 55, ${0.18 + Math.sin(elapsed / 120) * 0.05})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  } else if (activeDomain === 'authentic_mutual_love') {
    ctx.fillStyle = `rgba(137, 34, 82, ${0.12 + Math.sin(elapsed / 160) * 0.04})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawRing(elapsed, '#ffb4d2');
  } else if (activeDomain === 'idle_death_gamble') {
    ctx.fillStyle = `rgba(20, 83, 45, ${0.14 + Math.sin(elapsed / 130) * 0.04})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawRing(elapsed, '#facc15');
  } else if (activeDomain === 'deadly_sentencing') {
    ctx.fillStyle = `rgba(15, 23, 42, ${0.2 + Math.sin(elapsed / 180) * 0.05})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawRing(elapsed, '#e5e7eb');
  }
}

function renderFrame(now: number): void {
  drawBackground();

  if (activeDomain) {
    const elapsed = now - startedAt;
    drawDomainOverlay(elapsed);
    drawParticles();

    if (particles.length === 0 && elapsed > 1200) {
      activeDomain = null;
      domainNameEl.textContent = 'Awaiting sign';
    }
  }

  requestAnimationFrame(renderFrame);
}

function connectWebSocket(): void {
  window.clearTimeout(reconnectTimer);
  setStatus('Connecting to ws://localhost:8000/ws', false);

  const socket = new WebSocket('ws://localhost:8000/ws');

  socket.addEventListener('open', () => {
    setStatus('Connected', true);
  });

  socket.addEventListener('message', (event: MessageEvent<string>) => {
    const message = JSON.parse(event.data) as DomainMessage;

    if (message.error) {
      setStatus(message.error, false);
      return;
    }

    if (message.domain && message.domain in domainLabels) {
      playDomain(message.domain);
    }
  });

  socket.addEventListener('close', () => {
    setStatus('Disconnected. Reconnecting...', false);
    reconnectTimer = window.setTimeout(connectWebSocket, 1500);
  });

  socket.addEventListener('error', () => {
    setStatus('WebSocket error. Is the backend running?', false);
  });
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(renderFrame);
connectWebSocket();
