import './style.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ===========================
// CONFIG
// ===========================
const WEDDING_DATE = new Date('2026-08-20T17:00:00+06:00');
let lang: 'kk' | 'ru' = 'kk';

// ===========================
// LANGUAGE
// ===========================
function applyLang(l: 'kk' | 'ru') {
  lang = l;
  document.querySelectorAll(`[data-${l}]`).forEach(el => {
    const text = el.getAttribute(`data-${l}`);
    if (text) el.textContent = text;
  });
}

function initLanguageOverlay() {
  const overlay = document.getElementById('lang-overlay')!;
  const mainContent = document.getElementById('main-content')!;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = (btn as HTMLElement).dataset.lang as 'kk' | 'ru';
      applyLang(l);
      
      // Hide overlay
      overlay.classList.add('hidden');
      
      // Show main content
      mainContent.classList.remove('hidden');
      
      // Trigger observers and resize for 3D canvas since it was display:none
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      }, 50);
    });
  });
}

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
// THREE.JS RINGS
// ===========================
class Rings3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ringsGroup: THREE.Group;
  private isVisible = false;

  constructor() {
    this.container = document.getElementById('three-container')!;
    this.scene = new THREE.Scene();
    
    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.z = 18;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth || 1, this.container.clientHeight || 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Ultra-realistic glossy reflections using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    this.ringsGroup = new THREE.Group();
    this.scene.add(this.ringsGroup);

    this.createRings();
    this.setupLighting();

    // Intersection observer to only render when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
      });
    }, { threshold: 0 });
    observer.observe(this.container);

    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  private createRings() {
    // High-poly geometry
    const geometry = new THREE.TorusGeometry(3.2, 0.45, 64, 128);
    
    // Ultra glossy gold material
    const materialGold = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.05, // very glossy
    });

    const ring1 = new THREE.Mesh(geometry, materialGold);
    ring1.position.x = -1.4;
    ring1.rotation.y = 0.5;
    ring1.rotation.x = 0.5;

    const ring2 = new THREE.Mesh(geometry, materialGold);
    ring2.position.x = 1.4;
    ring2.rotation.y = -0.5;
    ring2.rotation.x = -0.5;

    this.ringsGroup.add(ring1);
    this.ringsGroup.add(ring2);
  }

  private setupLighting() {
    // Ambient light provides a base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Main directional light for specular highlights
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 5, 5);
    this.scene.add(dirLight1);

    // Fill light
    const dirLight2 = new THREE.DirectionalLight(0xffddaa, 1.5);
    dirLight2.position.set(-5, -5, 5);
    this.scene.add(dirLight2);
  }

  private resize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    
    if (this.isVisible) {
      this.ringsGroup.rotation.y += 0.005;
      this.ringsGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
      this.renderer.render(this.scene, this.camera);
    }
  }
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
  const step1 = document.getElementById('rsvp-step1')!;
  const step2 = document.getElementById('rsvp-step2')!;
  const declined = document.getElementById('rsvp-declined')!;
  const thanks = document.getElementById('rsvp-thanks')!;

  document.getElementById('rsvp-yes')!.addEventListener('click', () => {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    // Trigger scroll event to ensure any inner elements animate if needed
    window.dispatchEvent(new Event('scroll'));
  });

  document.getElementById('rsvp-no')!.addEventListener('click', () => {
    step1.classList.add('hidden');
    declined.classList.remove('hidden');
  });

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
      const el = card as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
      
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

  // Interactive Schedule Scroll
  const scheduleSection = document.getElementById('schedule-section');
  const progressBar = document.getElementById('schedule-progress');
  const items = document.querySelectorAll('.schedule-item');
  
  if (scheduleSection && progressBar && items.length > 0) {
    window.addEventListener('scroll', () => {
      const rect = scheduleSection.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      // Calculate how far the section is scrolled
      // Start when top hits center of screen
      const start = viewHeight / 2;
      const total = rect.height - viewHeight/2; 
      const current = start - rect.top;
      
      let percentage = (current / total) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      
      progressBar.style.height = `${percentage}%`;
      
      // Highlight active items
      items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        if (itemRect.top < viewHeight / 2 + 50) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    });
  }
}

// ===========================
// GUESTBOOK LOGIC (MOCK)
// ===========================
function initGuestbook() {
  const fileInput = document.getElementById('gb-file') as HTMLInputElement;
  const filePreview = document.getElementById('file-preview') as HTMLElement;
  const submitBtn = document.getElementById('gb-submit') as HTMLElement;
  
  const formArea = document.getElementById('guestbook-form-area') as HTMLElement;
  const loadingArea = document.getElementById('guestbook-loading') as HTMLElement;
  const successArea = document.getElementById('guestbook-success') as HTMLElement;

  if (fileInput && filePreview) {
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        filePreview.innerHTML = ''; // clear
        filePreview.classList.remove('hidden');
        
        const fileURL = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = fileURL;
          filePreview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = fileURL;
          video.controls = true;
          filePreview.appendChild(video);
        }
      } else {
        filePreview.classList.add('hidden');
        filePreview.innerHTML = '';
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      // 1. Hide form, show loading
      formArea.classList.add('hidden');
      loadingArea.classList.remove('hidden');
      
      // MOCK UPLOAD TO FIREBASE
      // In reality: 
      // await firebase.storage().ref().put(file);
      // await firebase.firestore().collection('wishes').add({name, text, fileUrl});

      setTimeout(() => {
        // 2. Hide loading, show success
        loadingArea.classList.add('hidden');
        successArea.classList.remove('hidden');
        
        const confetti = new Confetti();
        confetti.burst();
      }, 2500);
    });
  }
}

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  initLanguageOverlay();
  initScrollObserver();
  initInteractiveEffects();
  initGuestbook();
  
  new Particles();
  const confetti = new Confetti();
  new Countdown();
  new Rings3D();
  
  initRSVP(confetti);
});
