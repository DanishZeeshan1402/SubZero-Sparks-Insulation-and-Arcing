/**
 * Photorealistic Scroll-Driven Landscape Engine
 * 
 * Features:
 * 1. Photorealistic Panoramic Base (ladakh_valley_panoramic.jpg):
 *    - Majestic snow-covered Karakoram peaks with glacial ice.
 *    - Expansive green valley floor with a winding clear mountain stream.
 *    - Traditional stone-and-timber mountain sheep farmhouse/shelter.
 *    - Strictly NO waterfalls.
 * 2. Dynamic Scroll-Driven Celestial & Atmospheric Lighting (0% to 100% Scroll):
 *    - 0% - 20% (Dawn to Morning): Warm golden sunrise over snow peaks; morning mist burning off the stream.
 *    - 25% - 55% (Bright Midday): Clear blue sky; brilliant midday sun with natural sunbeams; drifting cirrus clouds; stream light reflections.
 *    - 60% - 85% (Sunset & Dusk): Sun dips behind the snow mountains; long valley shadows; rich orange, pink, and deep indigo twilight.
 *    - 85% - 100% (Night & Moonrise): Deep dark night sky with 120+ twinkling stars; glowing silver crescent moon; moonlight on snow and stream; warm barn lantern light glowing from within the farmhouse!
 * 3. Photorealistic Sheep Behavioral Cycle:
 *    - 0% - 20%: Farmhouse gate opens. Sheep emerge one by one and walk out into the valley floor.
 *    - 25% - 55%: Sheep spread across pasture, grazing near the winding stream and roaming the valley.
 *    - 60% - 85%: Sheep turn around and walk back toward the farmhouse in line.
 *    - 85% - 100%: All sheep return safely inside the shelter; barn light glows warm amber.
 *    - Reverses smoothly when scrolling back up!
 */

class LadakhCanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.isPlaying = true;
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.scrollVelocity = 0;
    this.time = 0;

    // Viewport dimensions
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Load Photorealistic Panoramic Landscape Base
    this.bgImage = new Image();
    this.bgLoaded = false;
    this.bgImage.src = 'asset/ladakh_valley_panoramic.jpg';
    this.bgImage.onload = () => { this.bgLoaded = true; };
    this.bgImage.onerror = () => { this.bgImage.src = 'assest/ladakh_valley_panoramic.jpg'; };

    // 2. Load High-Resolution Photographic Sheep Sprites
    this.sheepSprites = [];
    this.sheepLoadedCount = 0;
    const sheepFiles = [
      'sheep_hires_1_grazing.png',
      'sheep_hires_2_walking.png',
      'sheep_hires_3_black.png',
      'sheep_hires_4_mid_graze.png',
      'sheep_hires_5_stream.png'
    ];

    sheepFiles.forEach((file) => {
      const img = new Image();
      img.src = `asset/${file}`;
      img.onload = () => { this.sheepLoadedCount++; };
      img.onerror = () => { img.src = `assest/${file}`; };
      this.sheepSprites.push(img);
    });

    // 3. Star Field for Clear Himalayan Night Sky
    this.stars = [];
    for (let i = 0; i < 130; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.44, // upper sky & mountain crests
        size: 0.8 + Math.random() * 2.0,
        baseAlpha: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 0.015 + Math.random() * 0.035,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 4. High-Altitude Cirrus Clouds
    this.clouds = [
      { x: 0.15, y: 0.12, w: 260, h: 48, speed: 0.00014 },
      { x: 0.48, y: 0.08, w: 340, h: 60, speed: 0.00010 },
      { x: 0.82, y: 0.15, w: 280, h: 52, speed: 0.00012 }
    ];

    // 5. Morning Stream Mist Particles
    this.streamMist = [];
    for (let i = 0; i < 35; i++) {
      this.streamMist.push({
        t: Math.random(), // position along winding stream
        yOffset: (Math.random() - 0.5) * 14,
        size: 10 + Math.random() * 18,
        maxSize: 28 + Math.random() * 16,
        alpha: 0.2 + Math.random() * 0.25,
        vx: 0.1 + Math.random() * 0.2,
        life: Math.random() * 60,
        maxLife: 60
      });
    }

    // 6. Photographic Sheep Flock
    this.flock = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    this.initFlock();
    this.onScroll();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.targetScrollProgress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
  }

  togglePlayPause(forceState) {
    if (typeof forceState === 'boolean') {
      this.isPlaying = forceState;
    } else {
      this.isPlaying = !this.isPlaying;
    }
    return this.isPlaying;
  }

  initFlock() {
    // Farmhouse gate is positioned on the right mountain fold (~0.81 W, 0.65 H in image space)
    // Each sheep has a designated grazing home in the meadow / near the stream
    this.flock = [
      {
        spriteIdx: 1, // walking white sheep
        grazeX: 0.22,
        grazeY: 0.88,
        scale: 1.15,
        staggerStart: 0.00,
        staggerEnd: 0.18,
        returnStart: 0.62,
        returnEnd: 0.84,
        stepPhase: 0
      },
      {
        spriteIdx: 0, // grazing head down
        grazeX: 0.36,
        grazeY: 0.89,
        scale: 1.25,
        staggerStart: 0.03,
        staggerEnd: 0.20,
        returnStart: 0.64,
        returnEnd: 0.86,
        stepPhase: 1.6
      },
      {
        spriteIdx: 2, // black Himalayan lamb
        grazeX: 0.50,
        grazeY: 0.84,
        scale: 1.3,
        staggerStart: 0.05,
        staggerEnd: 0.22,
        returnStart: 0.66,
        returnEnd: 0.88,
        stepPhase: 3.2
      },
      {
        spriteIdx: 4, // stream-side sheep
        grazeX: 0.62,
        grazeY: 0.86,
        scale: 1.1,
        staggerStart: 0.07,
        staggerEnd: 0.24,
        returnStart: 0.68,
        returnEnd: 0.90,
        stepPhase: 4.8
      },
      {
        spriteIdx: 3, // mid-pasture grazing
        grazeX: 0.44,
        grazeY: 0.78,
        scale: 0.85,
        staggerStart: 0.02,
        staggerEnd: 0.19,
        returnStart: 0.63,
        returnEnd: 0.85,
        stepPhase: 2.4
      },
      {
        spriteIdx: 1, // far left meadow
        grazeX: 0.12,
        grazeY: 0.82,
        scale: 0.9,
        staggerStart: 0.04,
        staggerEnd: 0.21,
        returnStart: 0.65,
        returnEnd: 0.87,
        stepPhase: 5.5
      }
    ];
  }

  animate() {
    if (this.isPlaying) {
      this.time += 1;

      // Smooth scroll interpolation
      const prevP = this.scrollProgress;
      this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.065;
      this.scrollVelocity = this.scrollProgress - prevP;

      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. Photorealistic Panoramic Base (Mountains, Valley, Stream & Farmhouse)
      this.renderLandscapeBase();

      // 2. Stream Water Shimmer & Morning Mist
      this.renderStreamDynamics();

      // 3. Atmospheric Day-to-Night Engine (0% - 100%)
      this.renderAtmosphericLighting();

      // 4. Sun (0% - 60%) with Soft Lens Flares & Natural Sunbeams
      this.renderSun();

      // 5. Starry Night Sky & Glowing Silver Moon (85% - 100%)
      this.renderNightSky();

      // 6. Traditional Farmhouse Warm Interior Light (Nighttime)
      this.renderFarmhouseBarnLight();

      // 7. Photorealistic Sheep Flock with Gate Emergence & Return Cycle
      this.renderSheepFlock();
    }

    requestAnimationFrame(() => this.animate());
  }

  getCoverBounds(imgW, imgH, targetW, targetH) {
    const imgRatio = imgW / imgH;
    const targetRatio = targetW / targetH;
    let renderW, renderH, offsetX, offsetY;

    if (targetRatio > imgRatio) {
      renderW = targetW;
      renderH = targetW / imgRatio;
      offsetX = 0;
      offsetY = (targetH - renderH) / 2;
    } else {
      renderH = targetH;
      renderW = targetH * imgRatio;
      offsetX = (targetW - renderW) / 2;
      offsetY = 0;
    }
    return { x: offsetX, y: offsetY, w: renderW, h: renderH };
  }

  renderLandscapeBase() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.scrollProgress;

    if (this.bgLoaded && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const bounds = this.getCoverBounds(this.bgImage.naturalWidth, this.bgImage.naturalHeight, w, h);
      // Subtle vertical parallax camera tracking
      const yOffset = bounds.y - (p - 0.5) * 25;
      ctx.drawImage(this.bgImage, bounds.x, yOffset, bounds.w, bounds.h);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, h);
      fallback.addColorStop(0, '#1e3a8a');
      fallback.addColorStop(0.45, '#60a5fa');
      fallback.addColorStop(0.65, '#cbd5e1');
      fallback.addColorStop(1, '#065f46');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderStreamDynamics() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.scrollProgress;

    // Stream coordinates: winds from center-back (~0.44 W, 0.55 H) to foreground-center (~0.52 W, 1.0 H)
    const streamStartX = w * 0.44;
    const streamStartY = h * 0.55;
    const streamMidX = w * 0.52;
    const streamMidY = h * 0.72;
    const streamEndX = w * 0.48;
    const streamEndY = h * 0.98;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Water Surface Sun / Moon Glints (shimmering reflections)
    const glintCount = 14;
    for (let i = 0; i < glintCount; i++) {
      const u = (i / glintCount + (this.time * 0.003) % 1) % 1;
      // Interpolate along the winding curve
      const gx = (1 - u) * (1 - u) * streamStartX + 2 * (1 - u) * u * streamMidX + u * u * streamEndX + Math.sin(this.time * 0.05 + i) * 12;
      const gy = (1 - u) * (1 - u) * streamStartY + 2 * (1 - u) * u * streamMidY + u * u * streamEndY;

      const glintAlpha = p > 0.8 ? 0.25 : (p > 0.6 ? 0.35 : 0.6);
      const glintCol = p > 0.8 ? 'rgba(199, 210, 254, ' : (p > 0.6 ? 'rgba(254, 215, 170, ' : 'rgba(255, 255, 255, ');

      ctx.fillStyle = `${glintCol}${glintAlpha * (0.5 + Math.sin(this.time * 0.1 + i) * 0.5)})`;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 4 + Math.sin(this.time * 0.08 + i) * 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Morning Mist Burning Off the Stream (0% - 20% Scroll)
    if (p < 0.25) {
      const mistBurnout = Math.max(0, 1.0 - (p / 0.22));
      for (let m of this.streamMist) {
        m.life += 1;
        m.t += 0.002;
        if (m.t > 1.0) m.t = 0;

        if (m.life >= m.maxLife) {
          m.life = 0;
        }

        const u = m.t;
        const mx = (1 - u) * (1 - u) * streamStartX + 2 * (1 - u) * u * streamMidX + u * u * streamEndX + m.vx * 15;
        const my = (1 - u) * (1 - u) * streamStartY + 2 * (1 - u) * u * streamMidY + u * u * streamEndY + m.yOffset;

        const lifeRatio = m.life / m.maxLife;
        const curSize = m.size + (m.maxSize - m.size) * lifeRatio;
        const curAlpha = m.alpha * (1 - lifeRatio) * mistBurnout;

        ctx.fillStyle = `rgba(240, 248, 255, ${curAlpha})`;
        ctx.beginPath();
        ctx.arc(mx, my, curSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderAtmosphericLighting() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.scrollProgress; // 0 to 1

    ctx.save();

    // 0% - 20%: Soft warm golden sunrise
    if (p < 0.22) {
      const dawnAlpha = Math.max(0, 1.0 - p / 0.22) * 0.45;
      const dawnGrad = ctx.createLinearGradient(0, 0, 0, h);
      dawnGrad.addColorStop(0, `rgba(254, 215, 170, ${dawnAlpha * 0.6})`);
      dawnGrad.addColorStop(0.4, `rgba(251, 146, 60, ${dawnAlpha * 0.4})`);
      dawnGrad.addColorStop(1, `rgba(254, 243, 199, ${dawnAlpha * 0.2})`);

      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = dawnGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 60% - 85%: Sunset & Dusk (Alpenglow, rich orange, pink & deep indigo)
    if (p > 0.55 && p < 0.90) {
      const duskAlpha = p < 0.75 
        ? (p - 0.55) / 0.20 
        : Math.max(0, 1.0 - (p - 0.75) / 0.15);

      // Color burn for fiery alpenglow on snow peaks
      ctx.globalCompositeOperation = 'color-burn';
      const alpenGrad = ctx.createLinearGradient(0, 0, 0, h);
      alpenGrad.addColorStop(0, `rgba(107, 33, 168, ${duskAlpha * 0.45})`); // deep indigo twilight
      alpenGrad.addColorStop(0.4, `rgba(225, 29, 72, ${duskAlpha * 0.4})`);  // rich pink/crimson
      alpenGrad.addColorStop(0.7, `rgba(234, 88, 12, ${duskAlpha * 0.45})`); // fiery orange
      alpenGrad.addColorStop(1, `rgba(180, 83, 9, ${duskAlpha * 0.3})`);
      ctx.fillStyle = alpenGrad;
      ctx.fillRect(0, 0, w, h);

      // Soft amber radiance
      ctx.globalCompositeOperation = 'soft-light';
      const amberGrad = ctx.createLinearGradient(0, 0, w, h);
      amberGrad.addColorStop(0, `rgba(251, 146, 60, ${duskAlpha * 0.6})`);
      amberGrad.addColorStop(0.5, `rgba(245, 158, 11, ${duskAlpha * 0.5})`);
      amberGrad.addColorStop(1, `rgba(146, 64, 14, ${duskAlpha * 0.4})`);
      ctx.fillStyle = amberGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 85% - 100%: Deep dark Himalayan night
    if (p > 0.78) {
      const nightAlpha = Math.min(1.0, (p - 0.78) / 0.18);

      // Deep dark midnight multiply filter
      ctx.globalCompositeOperation = 'multiply';
      const nightGrad = ctx.createLinearGradient(0, 0, 0, h);
      nightGrad.addColorStop(0, `rgba(5, 10, 28, ${nightAlpha * 0.94})`); // dark night sky
      nightGrad.addColorStop(0.45, `rgba(12, 20, 48, ${nightAlpha * 0.90})`); // dark mountain silhouettes
      nightGrad.addColorStop(1, `rgba(4, 18, 18, ${nightAlpha * 0.86})`); // nocturnal valley floor
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, w, h);

      // Cool silvery moonlight sheen on snow-capped peaks and stream
      ctx.globalCompositeOperation = 'screen';
      const moonSheen = ctx.createLinearGradient(w * 0.75, 0, w * 0.35, h * 0.75);
      moonSheen.addColorStop(0, `rgba(199, 210, 254, ${nightAlpha * 0.35})`);
      moonSheen.addColorStop(0.4, `rgba(147, 197, 253, ${nightAlpha * 0.20})`);
      moonSheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonSheen;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  renderSun() {
    const p = this.scrollProgress;
    if (p >= 0.72) return; // Sun sinks behind mountains after sunset

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const sunAlpha = p < 0.5 ? 1.0 : Math.max(0, 1.0 - (p - 0.5) / 0.22);
    if (sunAlpha <= 0) return;

    // Celestial trajectory: 0% East sunrise -> 40% Midday high sky -> 70% West sunset
    const sunX = (0.78 - p * 0.54) * w;
    const sunArc = Math.sin(p * Math.PI) * 0.08 * h;
    const sunY = (0.09 + p * 0.30 - sunArc) * h;
    const sunR = 26 + p * 8;

    ctx.save();
    ctx.globalAlpha = sunAlpha;
    ctx.globalCompositeOperation = 'screen';

    // Corona & Atmospheric Bloom
    const corona = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 7);
    const coreCol = p > 0.4 ? 'rgba(255, 237, 160, 0.8)' : 'rgba(255, 255, 245, 0.9)';
    const midCol = p > 0.4 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(191, 219, 254, 0.35)';
    corona.addColorStop(0, coreCol);
    corona.addColorStop(0.35, midCol);
    corona.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 7, 0, Math.PI * 2);
    ctx.fill();

    // Solid Solar Core
    ctx.fillStyle = p > 0.45 ? '#fef08a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Natural Sunbeams
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(this.time * 0.001);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rayLen = sunR * (4.5 + Math.sin(this.time * 0.03 + i) * 1.2);
      ctx.fillStyle = p > 0.35 ? 'rgba(254, 215, 170, 0.18)' : 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rayLen, angle - 0.1, angle + 0.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  renderNightSky() {
    const p = this.scrollProgress;
    if (p < 0.70) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const nightIntensity = Math.min(1.0, (p - 0.70) / 0.22);

    ctx.save();
    ctx.globalAlpha = nightIntensity;

    // 1. Twinkling Stars across clear Himalayan sky
    for (let s of this.stars) {
      const twinkle = Math.sin(this.time * s.twinkleSpeed + s.phase);
      const curAlpha = Math.max(0.2, s.baseAlpha + twinkle * 0.35);

      ctx.fillStyle = `rgba(255, 255, 255, ${curAlpha})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
      ctx.fill();

      if (s.size > 1.6 && twinkle > 0.4) {
        ctx.strokeStyle = `rgba(224, 231, 255, ${curAlpha * 0.55})`;
        ctx.lineWidth = 0.6;
        const sx = s.x * w;
        const sy = s.y * h;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }

    // 2. Glowing Silver Crescent Moon rising over snow peaks
    const moonX = w * 0.80;
    const moonY = h * 0.14;
    const moonR = 20;

    // Lunar halo
    ctx.globalCompositeOperation = 'screen';
    const moonHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 4.5);
    moonHalo.addColorStop(0, 'rgba(224, 231, 255, 0.45)');
    moonHalo.addColorStop(0.5, 'rgba(165, 180, 252, 0.15)');
    moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Solid crescent
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Dark side cutout
    ctx.fillStyle = '#060c22';
    ctx.beginPath();
    ctx.arc(moonX + 6, moonY - 3, moonR * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFarmhouseBarnLight() {
    // Barn light softly glows from within at nighttime (85% - 100% Scroll)
    const p = this.scrollProgress;
    if (p < 0.78) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const glowAlpha = Math.min(1.0, (p - 0.78) / 0.18);

    // Farmhouse doorway & window coordinates on the right side
    const doorX = w * 0.85;
    const doorY = h * 0.66;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Warm radial amber lantern glow emanating from the doorway
    const barnGlow = ctx.createRadialGradient(doorX, doorY, 5, doorX, doorY, 65);
    barnGlow.addColorStop(0, `rgba(254, 240, 138, ${glowAlpha * 0.95})`); // warm yellow core
    barnGlow.addColorStop(0.35, `rgba(245, 158, 11, ${glowAlpha * 0.75})`); // rich amber
    barnGlow.addColorStop(0.7, `rgba(180, 83, 9, ${glowAlpha * 0.35})`);  // threshold spill
    barnGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = barnGlow;
    ctx.beginPath();
    ctx.arc(doorX, doorY, 65, 0, Math.PI * 2);
    ctx.fill();

    // Secondary warm window light
    const winX = w * 0.88;
    const winY = h * 0.64;
    const winGlow = ctx.createRadialGradient(winX, winY, 2, winX, winY, 35);
    winGlow.addColorStop(0, `rgba(254, 240, 138, ${glowAlpha * 0.85})`);
    winGlow.addColorStop(0.4, `rgba(245, 158, 11, ${glowAlpha * 0.5})`);
    winGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = winGlow;
    ctx.beginPath();
    ctx.arc(winX, winY, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSheepFlock() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.scrollProgress;

    // Farmhouse gate coordinate where sheep emerge and return
    const gateX = 0.81;
    const gateY = 0.65;

    // Sun / Moon light source position for cast shadows
    const lightSourceX = p < 0.70 ? (0.78 - p * 0.54) * w : w * 0.80;

    this.flock.forEach((sheep) => {
      let curX, curY, dir, opacity, isWalking;

      // 1. DAWN TO MORNING: 0% - 20% (Emerge from farmhouse doorway)
      if (p <= sheep.staggerEnd) {
        if (p <= sheep.staggerStart) {
          // Still inside barn
          curX = gateX;
          curY = gateY;
          dir = -1; // facing left to walk out
          opacity = 0;
          isWalking = false;
        } else {
          // Emerging and walking out into the valley
          const progress = (p - sheep.staggerStart) / (sheep.staggerEnd - sheep.staggerStart);
          curX = gateX + (sheep.grazeX - gateX) * progress;
          curY = gateY + (sheep.grazeY - gateY) * progress;
          dir = -1; // walk left toward meadow
          opacity = Math.min(1.0, progress * 2.0);
          isWalking = true;
          sheep.stepPhase += Math.abs(this.scrollVelocity) * 60 + 0.05;
        }
      }
      // 2. BRIGHT MIDDAY: 25% - 55% (Grazing & roaming in pasture)
      else if (p < sheep.returnStart) {
        // Fully out in the pasture
        // Subtle local roaming around grazing spot
        const roamOffset = Math.sin(this.time * 0.015 + sheep.stepPhase) * 0.015;
        curX = sheep.grazeX + roamOffset;
        curY = sheep.grazeY;
        dir = Math.sin(this.time * 0.01 + sheep.stepPhase) > 0 ? 1 : -1;
        opacity = 1.0;
        isWalking = false;
        sheep.stepPhase += 0.02; // gentle breathing & nibbling
      }
      // 3. SUNSET & DUSK: 60% - 85% (Turn around and walk back toward farmhouse)
      else if (p <= sheep.returnEnd) {
        const progress = (p - sheep.returnStart) / (sheep.returnEnd - sheep.returnStart);
        curX = sheep.grazeX + (gateX - sheep.grazeX) * progress;
        curY = sheep.grazeY + (gateY - sheep.grazeY) * progress;
        dir = 1; // walk right toward farmhouse
        opacity = progress > 0.85 ? Math.max(0, 1.0 - (progress - 0.85) / 0.15) : 1.0;
        isWalking = true;
        sheep.stepPhase += Math.abs(this.scrollVelocity) * 60 + 0.05;
      }
      // 4. NIGHTTIME: 85% - 100% (Safely inside farmhouse)
      else {
        curX = gateX;
        curY = gateY;
        dir = 1;
        opacity = 0; // safely inside the barn!
        isWalking = false;
      }

      if (opacity <= 0.01) return;

      const sx = curX * w;
      const sy = curY * h;
      const bobbing = isWalking ? Math.abs(Math.sin(sheep.stepPhase)) * 3 : Math.sin(this.time * 0.05) * 0.8;

      this.drawPhotographicSheep(sx, sy - bobbing, sheep, dir, opacity, lightSourceX, p);
    });
  }

  drawPhotographicSheep(x, y, sheep, dir, opacity, lightX, p) {
    const ctx = this.ctx;
    const sprite = this.sheepSprites[sheep.spriteIdx];
    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return;

    const baseW = sprite.naturalWidth;
    const baseH = sprite.naturalHeight;
    const renderW = baseW * sheep.scale * 0.85;
    const renderH = baseH * sheep.scale * 0.85;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);

    // 1. Cast Ground Shadow on Meadow Grass
    // In sunset (p ~0.65 - 0.85), shadows stretch dramatically long!
    const shadowStretch = (p > 0.55 && p < 0.85) ? 1.8 : 1.0;
    const shadowOffset = (x - lightX) * 0.04 * shadowStretch;
    ctx.save();
    ctx.fillStyle = p > 0.75 ? 'rgba(2, 12, 10, 0.45)' : 'rgba(4, 52, 38, 0.55)';
    ctx.beginPath();
    ctx.ellipse(shadowOffset, renderH * 0.44, renderW * 0.45 * shadowStretch, renderH * 0.14, shadowOffset * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Directional Flip (Facing Left vs Right)
    if (dir === -1) {
      ctx.scale(-1, 1);
    }

    // 3. Draw Photographic Sheep Sprite
    ctx.drawImage(sprite, -renderW / 2, -renderH / 2, renderW, renderH);

    // 4. Photometric Color Grading matching Day/Sunset/Night
    if (p > 0.25) {
      ctx.save();
      if (p > 0.75) {
        // Cool Moonlight overlay
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(15, 23, 55, ${Math.min(0.75, (p - 0.75) * 2.2)})`;
        ctx.fillRect(-renderW / 2, -renderH / 2, renderW, renderH);
      } else if (p > 0.55) {
        // Sunset Golden Amber overlay
        ctx.globalCompositeOperation = 'color-burn';
        ctx.fillStyle = `rgba(245, 158, 11, ${(p - 0.55) * 0.55})`;
        ctx.fillRect(-renderW / 2, -renderH / 2, renderW, renderH);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

window.LadakhCanvasEngine = LadakhCanvasEngine;
