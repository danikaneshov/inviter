import './style.css';


// ===========================
// CONFIG
// ===========================
const WEDDING_DATE = new Date('2026-08-20T17:00:00+06:00');



// ===========================
// SCROLL ANIMATIONS
// ===========================
function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.anim-on-scroll').forEach(el => {
    observer.observe(el);
  });
}



// ===========================
// BACKGROUND PARTICLES
// ===========================
class Particles {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pts: { x:number; y:number; s:number; vy:number; vx:number; o:number; ph:number }[] = [];

  constructor() {
    this.canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.init();
    this.loop();
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private init() {
    const n = Math.min(Math.floor(window.innerWidth / 30), 40);
    for (let i = 0; i < n; i++) {
      this.pts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        s: Math.random() * 2 + 0.5,
        vy: -(Math.random() * 0.3 + 0.1), // slightly faster up
        vx: (Math.random() - 0.5) * 0.2,
        o: Math.random() * 0.2 + 0.05,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  private loop = () => {
    const { width: w, height: h } = this.canvas;
    this.ctx.clearRect(0, 0, w, h);

    for (const p of this.pts) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(Date.now() * 0.001 + p.ph) * 0.05;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const pulse = Math.sin(Date.now() * 0.002 + p.ph) * 0.05;
      const a = Math.max(0.02, Math.min(0.3, p.o + pulse));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(184,134,11,${a})`;
      this.ctx.fill();
    }

    requestAnimationFrame(this.loop);
  }
}

// ===========================
// CONFETTI
// ===========================
class Confetti {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pieces: { x:number; y:number; r:number; vx:number; vy:number; va:number; a:number; c:string; w:number; h:number; o:number }[] = [];
  private active = false;

  constructor() {
    this.canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst() {
    const colors = ['#b8860b','#d4a843','#e8c547','#ffd700','#c9a84c','#f0e68c','#fff8dc','#daa520'];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      this.pieces.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        r: Math.random() * Math.PI * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        va: (Math.random() - 0.5) * 0.2,
        a: Math.random() * Math.PI * 2,
        c: colors[Math.floor(Math.random() * colors.length)],
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        o: 1
      });
    }

    if (!this.active) {
      this.active = true;
      this.animate();
    }
  }

  private animate = () => {
    const { width: w, height: h } = this.canvas;
    this.ctx.clearRect(0, 0, w, h);

    this.pieces = this.pieces.filter(p => p.o > 0.01);

    if (this.pieces.length === 0) {
      this.active = false;
      return;
    }

    for (const p of this.pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.vx *= 0.98;
      p.r += p.va;
      p.o -= 0.005;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.r);
      this.ctx.globalAlpha = Math.max(0, p.o);
      this.ctx.fillStyle = p.c;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    }

    requestAnimationFrame(this.animate);
  }
}

// ===========================
// COUNTDOWN
// ===========================
class Countdown {
  private els: { d: HTMLElement; h: HTMLElement; m: HTMLElement; s: HTMLElement };

  constructor() {
    this.els = {
      d: document.getElementById('cd-days')!,
      h: document.getElementById('cd-hours')!,
      m: document.getElementById('cd-mins')!,
      s: document.getElementById('cd-secs')!
    };
    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  private tick() {
    const diff = WEDDING_DATE.getTime() - Date.now();
    if (diff <= 0) return;
    this.set(this.els.d, Math.floor(diff / 86400000));
    this.set(this.els.h, Math.floor((diff % 86400000) / 3600000));
    this.set(this.els.m, Math.floor((diff % 3600000) / 60000));
    this.set(this.els.s, Math.floor((diff % 60000) / 1000));
  }

  private set(el: HTMLElement, val: number) {
    const str = String(val).padStart(2, '0');
    if (el.textContent !== str) {
      el.textContent = str;
      el.classList.add('flip');
      setTimeout(() => el.classList.remove('flip'), 500);
    }
  }
}

// ===========================
// RSVP LOGIC
// ===========================
function initRSVP(confetti: Confetti) {
  const step2 = document.getElementById('rsvp-step2')!;
  const thanks = document.getElementById('rsvp-thanks')!;

  const submitBtn = document.getElementById('rsvp-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      // In a real app, you would collect the values of #guest-name and #guest-companions here
      // and send them to a server.
      
      step2.classList.add('hidden');
      thanks.classList.remove('hidden');
      confetti.burst();
    });
  }
}

// ===========================
// INTERACTIVE EFFECTS
// ===========================
function initInteractiveEffects() {
  // 3D Tilt Effect for Couple Cards
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const mouseEvent = e as MouseEvent;
      const el = card as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = mouseEvent.clientX - rect.left; // x position within the element.
      const y = mouseEvent.clientY - rect.top;  // y position within the element.
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
      const rotateY = ((x - centerX) / centerX) * 10;
      
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      const el = card as HTMLElement;
      el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
      el.style.transition = 'transform 0.5s var(--ease)';
      setTimeout(() => el.style.transition = '', 500);
    });
  });


}



// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  initScrollObserver();
  initInteractiveEffects();
  
  new Particles();
  const confetti = new Confetti();
  new Countdown();
  
  initRSVP(confetti);
});
