/**
 * Scientific Simulators & Interactive Cross-Sections
 * 1. Paschen's Law Dynamic Breakdown Calculator & Curve Plotter
 * 2. DASH-IB Multi-Layer Conductor Architecture Interactive Explorer
 * 3. SIH Hackathon Acrylic Vacuum Chamber Arcing & EHD Suppression Simulator (with Web Audio crackle synthesis)
 */

// ==========================================
// 1. PASCHEN'S LAW CALCULATOR & GRAPH
// ==========================================

class PaschenSimulator {
  constructor(canvasId, resultContainerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(resultContainerId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Default parameters (Air standard: A = 15 cm^-1 Torr^-1, B = 365 V cm^-1 Torr^-1)
    this.p = 0.25; // atm (Ladakh / Drone flight altitude ~25 kPa)
    this.d = 1.5;  // mm gap
    this.gammaSeStandard = 0.02;
    this.gammaSeDash = 0.001; // Ultra-low electron emission from nanocellulose matrix
    this.activeMode = 'dash'; // 'standard' | 'dash'

    this.init();
  }

  init() {
    this.bindControls();
    this.updateCalculations();
    this.renderGraph();
  }

  bindControls() {
    const pressureSlider = document.getElementById('paschen-pressure');
    const pressureVal = document.getElementById('paschen-pressure-val');
    const distanceSlider = document.getElementById('paschen-distance');
    const distanceVal = document.getElementById('paschen-distance-val');

    if (pressureSlider && pressureVal) {
      pressureSlider.addEventListener('input', (e) => {
        this.p = parseFloat(e.target.value);
        pressureVal.textContent = `${this.p.toFixed(2)} atm (${(this.p * 101.325).toFixed(1)} kPa)`;
        this.updateCalculations();
        this.renderGraph();
      });
    }

    if (distanceSlider && distanceVal) {
      distanceSlider.addEventListener('input', (e) => {
        this.d = parseFloat(e.target.value);
        distanceVal.textContent = `${this.d.toFixed(1)} mm`;
        this.updateCalculations();
        this.renderGraph();
      });
    }

    const modeBtns = document.querySelectorAll('.paschen-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active', 'bg-blue-600', 'text-white'));
        btn.classList.add('active', 'bg-blue-600', 'text-white');
        this.activeMode = btn.dataset.mode;
        this.updateCalculations();
        this.renderGraph();
      });
    });
  }

  calculateBreakdownVoltage(pressureAtm, distanceMm, gammaSe) {
    // Convert to Torr and cm
    const pTorr = pressureAtm * 760;
    const dCm = distanceMm / 10;
    const pd = pTorr * dCm;

    const A = 15; // cm^-1 Torr^-1 for air
    const B = 365; // V/(cm Torr)

    const denom = Math.log(A * pd) - Math.log(Math.log(1 + 1 / gammaSe));
    if (denom <= 0 || isNaN(denom)) {
      return 25000; // asymptotic high
    }
    const Vb = (B * pd) / denom;
    return Math.max(120, Math.min(Vb, 30000));
  }

  updateCalculations() {
    const vbStandard = this.calculateBreakdownVoltage(this.p, this.d, this.gammaSeStandard);
    const vbDash = this.calculateBreakdownVoltage(this.p, this.d, this.gammaSeDash);

    const stdElem = document.getElementById('paschen-vb-standard');
    const dashElem = document.getElementById('paschen-vb-dash');
    const riskElem = document.getElementById('paschen-risk-badge');

    if (stdElem) stdElem.textContent = `${Math.round(vbStandard)} V`;
    if (dashElem) dashElem.textContent = `${Math.round(vbDash)} V`;

    if (riskElem) {
      if (vbStandard < 1000) {
        riskElem.innerHTML = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/40">CRITICAL ARC DANGER: Paschen Minimum Zone</span>`;
      } else if (vbStandard < 3500) {
        riskElem.innerHTML = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">ELEVATED BREAKDOWN RISK</span>`;
      } else {
        riskElem.innerHTML = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">STABLE DIELECTRIC ZONE</span>`;
      }
    }
  }

  renderGraph() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width = this.canvas.parentElement.clientWidth || 460;
    const h = this.canvas.height = 240;

    ctx.clearRect(0, 0, w, h);

    const padding = { top: 25, right: 25, bottom: 40, left: 60 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;

    // Background Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (graphH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y-axis labels (Voltage in kV)
      const vLabel = ((4 - i) * 3).toFixed(0) + ' kV';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(vLabel, padding.left - 8, y + 4);
    }

    // X-axis log scale representing p * d (Torr * cm)
    // 0.1 to 100
    const logMin = Math.log10(0.08);
    const logMax = Math.log10(150);

    const getX = (pdVal) => {
      const logVal = Math.log10(Math.max(0.08, Math.min(150, pdVal)));
      return padding.left + ((logVal - logMin) / (logMax - logMin)) * graphW;
    };

    const getY = (vVal) => {
      const clampedV = Math.max(0, Math.min(12000, vVal));
      return padding.top + graphH - (clampedV / 12000) * graphH;
    };

    // Draw Paschen curve for Standard PVC / Conventional Wire
    this.plotCurve(ctx, this.gammaSeStandard, getX, getY, '#ef4444', 2, [4, 4]);

    // Draw Paschen curve for DASH-IB Technology
    this.plotCurve(ctx, this.gammaSeDash, getX, getY, '#38bdf8', 3, []);

    // Plot current operating point
    const currentPd = (this.p * 760) * (this.d / 10);
    const curX = getX(currentPd);
    const vStd = this.calculateBreakdownVoltage(this.p, this.d, this.gammaSeStandard);
    const vDash = this.calculateBreakdownVoltage(this.p, this.d, this.gammaSeDash);

    // Standard marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curX, getY(vStd), 6, 0, Math.PI * 2);
    ctx.fill();

    // DASH-IB marker
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(curX, getY(vDash), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical line through current p*d
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, padding.top);
    ctx.lineTo(curX, padding.top + graphH);
    ctx.stroke();
    ctx.setLineDash([]);

    // X Axis Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('p · d Parameter (Pressure × Gap Distance) →', padding.left + graphW / 2, h - 8);

    // Legend
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(w - 220, 10, 10, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'left';
    ctx.font = '11px sans-serif';
    ctx.fillText('Standard PVC / Conventional', w - 205, 19);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w - 220, 26, 10, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('DASH-IB Low-Emission Matrix', w - 205, 35);
  }

  plotCurve(ctx, gammaSe, getX, getY, color, lineWidth, dash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.beginPath();

    let started = false;
    for (let logVal = Math.log10(0.1); logVal <= Math.log10(140); logVal += 0.04) {
      const pd = Math.pow(10, logVal);
      const A = 15;
      const B = 365;
      const denom = Math.log(A * pd) - Math.log(Math.log(1 + 1 / gammaSe));
      if (denom > 0) {
        const Vb = (B * pd) / denom;
        const x = getX(pd);
        const y = getY(Vb);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}


// ==========================================
// 2. DASH-IB MULTI-LAYER INTERACTIVE CROSS SECTION
// ==========================================

class DashIbCrossSection {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.layers = [
      {
        id: 'layer-core',
        name: 'Central Electrical Core',
        material: 'High-Purity Copper / Aluminum Strand Matrix',
        thickness: '2.5 mm diameter',
        color: '#f59e0b',
        func: 'Low-impedance primary conductor conveying power and high-frequency sensor signal lines in airborne drones and aerospace crafts.',
        mechanism: 'Ohmic conduction with high thermal dissipation to reduce hotspot genesis.'
      },
      {
        id: 'layer-gel',
        name: 'Sub-Layer 1: Piezo-Chemical Bio-Gel Interlayer',
        material: 'Cholinium Ionic Salts + Sodium Alginate Polymer Matrix',
        thickness: '0.4 mm dielectric barrier',
        color: '#06b6d4',
        func: 'Dynamic self-healing reservoir. When mechanical cracks or voids form, localized electric field gradients trigger electro-osmotic ionic migration, sealing the defect before corona discharge occurs.',
        mechanism: 'Reversible hydrogen bonding & coordination networks enable rapid microscopic autonomous self-repair without external thermal activation.'
      },
      {
        id: 'layer-nano',
        name: 'Sub-Layer 2: Nanocellulose Hydrophobic Matrix',
        material: 'Cellulose Nanocrystals (CNC) + Functionalized SiO₂ Nanoparticles',
        thickness: '0.6 mm insulation layer',
        color: '#10b981',
        func: 'Elevates Paschen breakdown voltage ($V_B$) by suppressing secondary electron emission coefficient ($\\gamma_{se}$) to ultra-low levels and blocking moisture absorption in high-altitude clouds.',
        mechanism: 'High dielectric breakdown strength (>40 kV/mm) and tortuous electron-avalanche barrier.'
      },
      {
        id: 'layer-mesh',
        name: 'Outer Layer: EHD Field Deflector Mesh',
        material: 'Micro-Porous Conductive Graphite & Eco-Polymer Composite Mesh',
        thickness: '0.3 mm external jacket',
        color: '#818cf8',
        func: 'Serves as a distributed corona ring. Smooths intense electric field gradients ($\\nabla E$) around bends and micro-scratches, eliminating high-potential stress points.',
        mechanism: 'Electrohydrodynamic (EHD) passive boundary charge dissipation prevents localized gas ionization under 0.1–0.5 atm vacuum.'
      }
    ];

    this.selectedLayer = this.layers[1]; // Default to Bio-Gel
    this.init();
  }

  init() {
    this.render();
  }

  selectLayer(layerIndex) {
    this.selectedLayer = this.layers[layerIndex];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- SVG Visual Cross-Section -->
        <div class="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-2xl border border-slate-700/60 shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>

          <h4 class="text-xs font-semibold tracking-wider uppercase text-cyan-400 mb-4">Interactive 4-Layer Concentric Anatomy</h4>

          <svg class="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-2xl cursor-pointer" viewBox="0 0 400 400">
            <defs>
              <radialGradient id="grad-core" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#fbbf24"/>
                <stop offset="70%" stop-color="#d97706"/>
                <stop offset="100%" stop-color="#b45309"/>
              </radialGradient>
              <radialGradient id="grad-gel" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#22d3ee"/>
                <stop offset="80%" stop-color="#0891b2"/>
                <stop offset="100%" stop-color="#155e75"/>
              </radialGradient>
              <radialGradient id="grad-nano" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="80%" stop-color="#059669"/>
                <stop offset="100%" stop-color="#065f46"/>
              </radialGradient>
              <radialGradient id="grad-mesh" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#a5b4fc"/>
                <stop offset="75%" stop-color="#4f46e5"/>
                <stop offset="100%" stop-color="#312e81"/>
              </radialGradient>
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            <!-- Layer 4: EHD Mesh (Outer) -->
            <circle cx="200" cy="200" r="170" fill="url(#grad-mesh)" 
              class="transition-all duration-300 ${this.selectedLayer.id === 'layer-mesh' ? 'filter-glow stroke-cyan-300 stroke-[4]' : 'stroke-indigo-900 stroke-2 hover:stroke-indigo-400'}"
              onclick="dashIbViewer.selectLayer(3)"/>
            
            <!-- Mesh pattern overlay rings -->
            <circle cx="200" cy="200" r="162" fill="none" stroke="rgba(255,255,255,0.25)" stroke-dasharray="6,4" stroke-width="2"/>

            <!-- Layer 3: Nanocellulose Hydrophobic Matrix -->
            <circle cx="200" cy="200" r="130" fill="url(#grad-nano)"
              class="transition-all duration-300 ${this.selectedLayer.id === 'layer-nano' ? 'filter-glow stroke-emerald-300 stroke-[4]' : 'stroke-emerald-950 stroke-2 hover:stroke-emerald-400'}"
              onclick="dashIbViewer.selectLayer(2)"/>

            <!-- Layer 2: Bio-Gel Interlayer (Self Healing) -->
            <circle cx="200" cy="200" r="90" fill="url(#grad-gel)"
              class="transition-all duration-300 ${this.selectedLayer.id === 'layer-gel' ? 'filter-glow stroke-cyan-300 stroke-[4]' : 'stroke-cyan-950 stroke-2 hover:stroke-cyan-400'}"
              onclick="dashIbViewer.selectLayer(1)"/>

            <!-- Self-healing micro-particles simulation inside gel -->
            <circle cx="180" cy="140" r="4" fill="#ffffff" opacity="0.8"/>
            <circle cx="230" cy="170" r="3.5" fill="#a5f3fc" opacity="0.9"/>
            <circle cx="160" cy="230" r="4.5" fill="#ffffff" opacity="0.75"/>
            <circle cx="210" cy="250" r="3" fill="#a5f3fc" opacity="0.85"/>

            <!-- Layer 1: Central Conductor Core -->
            <circle cx="200" cy="200" r="50" fill="url(#grad-core)"
              class="transition-all duration-300 ${this.selectedLayer.id === 'layer-core' ? 'filter-glow stroke-amber-200 stroke-[4]' : 'stroke-amber-900 stroke-2 hover:stroke-amber-300'}"
              onclick="dashIbViewer.selectLayer(0)"/>

            <text x="200" y="205" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle" pointer-events="none">Cu / Al Core</text>
          </svg>

          <p class="text-xs text-slate-400 mt-4 text-center">Click or tap any circular layer ring to inspect chemistry & mechanism</p>
        </div>

        <!-- Telemetry & Specs Card -->
        <div class="lg:col-span-6 space-y-4">
          <!-- Layer selector buttons -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${this.layers.map((l, idx) => `
              <button onclick="dashIbViewer.selectLayer(${idx})" 
                class="px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left truncate
                ${this.selectedLayer.id === l.id 
                  ? 'bg-slate-800 text-white border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'}">
                <span class="w-2 h-2 rounded-full inline-block mr-1.5" style="background-color: ${l.color}"></span>
                ${l.name.split(':')[0]}
              </button>
            `).join('')}
          </div>

          <!-- Detailed inspector box -->
          <div class="p-6 bg-slate-900/80 rounded-2xl border border-slate-700/80 shadow-2xl relative">
            <div class="flex items-center justify-between mb-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase" style="color: ${this.selectedLayer.color}; background: ${this.selectedLayer.color}20; border: 1px solid ${this.selectedLayer.color}40;">
                ${this.selectedLayer.thickness}
              </span>
              <span class="text-xs text-slate-400 font-mono">DASH-IB Hackathon Prototype</span>
            </div>

            <h3 class="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${this.selectedLayer.color}"></span>
              ${this.selectedLayer.name}
            </h3>

            <p class="text-sm font-medium text-cyan-300 mb-4">${this.selectedLayer.material}</p>

            <div class="space-y-3 text-sm">
              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">Primary Engineering Role:</span>
                <p class="text-slate-200 leading-relaxed">${this.selectedLayer.func}</p>
              </div>

              <div class="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">Underlying Physical Phenomenon:</span>
                <p class="text-slate-300 leading-relaxed">${this.selectedLayer.mechanism}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-render math in case formulas exist
    if (window.renderMathInElement) {
      window.renderMathInElement(this.container);
    }
  }
}


// ==========================================
// 3. SIH HACKATHON VACUUM CHAMBER ARCING SIMULATOR
// ==========================================

class VacuumChamberSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Simulation states
    this.voltage = 10; // kV (0 to 15 kV)
    this.pressure = 0.25; // atm (0.05 to 1.0 atm / 5 to 101.3 kPa)
    this.activeWire = 'split'; // 'standard' | 'dash' | 'split'
    this.hasDefect = true; // 0.5mm intentional defect
    this.isPowerOn = true;
    this.isAudioEnabled = false;

    // Web Audio Synthesizer for electric spark sound (zero external files)
    this.audioCtx = null;
    this.sparkGain = null;

    // Sparks & plasma particle arrays
    this.sparkBolts = [];
    this.particles = [];
    this.time = 0;

    this.init();
  }

  init() {
    this.bindControls();
    this.animate();
  }

  initAudio() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.sparkGain = this.audioCtx.createGain();
      this.sparkGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.sparkGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  playSparkSound(intensity) {
    if (!this.isAudioEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      const now = this.audioCtx.currentTime;
      // White noise buffer for spark snap
      const bufferSize = this.audioCtx.sampleRate * 0.05;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(Math.min(0.25, intensity * 0.2), now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      whiteNoise.start(now);
    } catch (err) {}
  }

  bindControls() {
    const voltSlider = document.getElementById('chamber-voltage');
    const voltVal = document.getElementById('chamber-voltage-val');
    const presSlider = document.getElementById('chamber-pressure');
    const presVal = document.getElementById('chamber-pressure-val');
    const powerBtn = document.getElementById('chamber-power-toggle');
    const soundBtn = document.getElementById('chamber-audio-toggle');
    const defectCheckbox = document.getElementById('chamber-defect-toggle');

    if (voltSlider && voltVal) {
      voltSlider.addEventListener('input', (e) => {
        this.voltage = parseFloat(e.target.value);
        voltVal.textContent = `${this.voltage.toFixed(1)} kV`;
      });
    }

    if (presSlider && presVal) {
      presSlider.addEventListener('input', (e) => {
        this.pressure = parseFloat(e.target.value);
        presVal.textContent = `${this.pressure.toFixed(2)} atm (${(this.pressure * 101.3).toFixed(0)} kPa)`;
      });
    }

    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        this.isPowerOn = !this.isPowerOn;
        powerBtn.textContent = this.isPowerOn ? '⚡ Generator: ACTIVE' : '⭕ Generator: OFF';
        powerBtn.classList.toggle('bg-red-600', this.isPowerOn);
        powerBtn.classList.toggle('bg-slate-700', !this.isPowerOn);
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.initAudio();
        this.isAudioEnabled = !this.isAudioEnabled;
        soundBtn.textContent = this.isAudioEnabled ? '🔊 Audio FX: ON' : '🔇 Audio FX: OFF';
        soundBtn.classList.toggle('text-cyan-400', this.isAudioEnabled);
      });
    }

    if (defectCheckbox) {
      defectCheckbox.addEventListener('change', (e) => {
        this.hasDefect = e.target.checked;
      });
    }

    const wireTabs = document.querySelectorAll('.chamber-wire-tab');
    wireTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        wireTabs.forEach(t => t.classList.remove('active', 'bg-blue-600', 'text-white'));
        tab.classList.add('active', 'bg-blue-600', 'text-white');
        this.activeWire = tab.dataset.wire;
      });
    });
  }

  animate() {
    this.time += 1;
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  render() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width = this.canvas.parentElement.clientWidth || 580;
    const h = this.canvas.height = 360;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Acrylic Vacuum Chamber Cylinder
    this.drawChamberFrame(ctx, w, h);

    if (!this.isPowerOn) {
      this.drawPowerOffState(ctx, w, h);
      return;
    }

    // 2. Determine ionization probability based on Paschen's Law
    // Under low pressure (0.1 - 0.4 atm) and high voltage (> 3 kV), standard wire experiences rapid Townsend breakdown
    const isPaschenDangerZone = this.pressure <= 0.45 && this.voltage >= 3.0 && this.hasDefect;
    const arcIntensity = isPaschenDangerZone ? Math.min(1.0, (this.voltage / 15) * (1 - this.pressure * 0.7)) : 0;

    // Draw wires depending on mode
    if (this.activeWire === 'split') {
      // Split Chamber: Top Half Standard PVC, Bottom Half DASH-IB
      this.drawWireStation(ctx, 40, 50, w - 80, 120, 'Standard PVC Wire (0.5mm Crack)', 'pvc', arcIntensity);
      this.drawWireStation(ctx, 40, 190, w - 80, 120, 'DASH-IB Novel Cable (0.5mm Defect)', 'dash', 0);
    } else if (this.activeWire === 'standard') {
      this.drawWireStation(ctx, 40, 100, w - 80, 170, 'Standard PVC Insulated Wire in Vacuum', 'pvc', arcIntensity);
    } else {
      this.drawWireStation(ctx, 40, 100, w - 80, 170, 'DASH-IB Self-Healing Conductor in Vacuum', 'dash', 0);
    }

    // Play periodic spark sound
    if (arcIntensity > 0.2 && Math.random() < 0.25) {
      this.playSparkSound(arcIntensity);
    }
  }

  drawChamberFrame(ctx, w, h) {
    // Outer metallic vacuum housing
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Vacuum chamber cylinder interior
    const chamberGrad = ctx.createLinearGradient(0, 20, 0, h - 20);
    chamberGrad.addColorStop(0, '#0f172a');
    chamberGrad.addColorStop(0.5, '#070b14');
    chamberGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = chamberGrad;
    ctx.roundRect(25, 20, w - 50, h - 40, 16);
    ctx.fill();

    // Acrylic cylinder border & glass reflection
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.roundRect(25, 20, w - 50, h - 40, 16);
    ctx.stroke();

    // Specular diagonal glare
    const glare = ctx.createLinearGradient(30, 20, w * 0.5, h - 20);
    glare.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glare.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
    glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.moveTo(35, 25);
    ctx.lineTo(w * 0.45, 25);
    ctx.lineTo(w * 0.35, h - 25);
    ctx.lineTo(35, h - 25);
    ctx.closePath();
    ctx.fill();

    // Flange bolts
    ctx.fillStyle = '#475569';
    for (let x = 60; x < w - 60; x += 60) {
      ctx.beginPath();
      ctx.arc(x, 26, 3, 0, Math.PI * 2);
      ctx.arc(x, h - 26, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Telemetry HUD overlay in top-right
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.roundRect(w - 200, 30, 165, 52, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`P_CHAMBER: ${(this.pressure * 101.3).toFixed(1)} kPa`, w - 190, 48);
    ctx.fillText(`V_GENERATOR: ${this.voltage.toFixed(1)} kV DC`, w - 190, 62);
    ctx.fillStyle = this.pressure <= 0.4 ? '#ef4444' : '#10b981';
    ctx.fillText(`REGIME: ${this.pressure <= 0.4 ? 'LOW-P IONIZATION' : 'SUB-ATMOSPHERIC'}`, w - 190, 75);
  }

  drawPowerOffState(ctx, w, h) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(30, 25, w - 60, h - 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DC Generator Offline. Activate generator to initiate high-voltage test.', w / 2, h / 2);
    ctx.textAlign = 'left';
  }

  drawWireStation(ctx, x, y, width, height, label, type, arcIntensity) {
    const centerY = y + height / 2;

    // Station background card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = type === 'pvc' && arcIntensity > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();

    // Wire Label
    ctx.font = '11px sans-serif';
    ctx.fillStyle = type === 'pvc' ? '#fca5a5' : '#7dd3fc';
    ctx.fillText(label, x + 14, y + 20);

    // Electrodes on both ends
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 10, centerY - 14, 20, 28);
    ctx.fillRect(x + width - 30, centerY - 14, 20, 28);

    // Wire Cable Body
    const wireX1 = x + 30;
    const wireX2 = x + width - 30;
    const wireW = wireX2 - wireX1;
    const defectX = wireX1 + wireW * 0.5;

    if (type === 'pvc') {
      // Red standard PVC Wire
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(wireX1, centerY - 8, wireW, 16);

      // Conductor core visible inside
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wireX1, centerY - 2, wireW, 4);

      if (this.hasDefect) {
        // Cutout notch defect (0.5 mm)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(defectX - 5, centerY - 9, 10, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(defectX - 4, centerY - 3, 8, 6);

        // Arc Flash & Sparks if ionized
        if (arcIntensity > 0) {
          this.drawViolentArc(ctx, defectX, centerY, arcIntensity);
        } else {
          // Subtle glow
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.beginPath();
          ctx.arc(defectX, centerY, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Status indicator tag
      ctx.font = '10px monospace';
      if (arcIntensity > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`⚡ AVALANCHE BREAKDOWN DETECTED!`, x + 14, y + height - 12);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`STATUS: No breakdown under current threshold`, x + 14, y + height - 12);
      }
    } else {
      // DASH-IB Novel Cable (Multi-layered aesthetic)
      // Layer 4: EHD Mesh (Graphite)
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(wireX1, centerY - 11, wireW, 22);

      // Layer 3: Nanocellulose
      ctx.fillStyle = '#059669';
      ctx.fillRect(wireX1, centerY - 8, wireW, 16);

      // Layer 2: Bio-gel
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(wireX1, centerY - 5, wireW, 10);

      // Layer 1: Core
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(wireX1, centerY - 2, wireW, 4);

      if (this.hasDefect) {
        // Defect has been sealed by migrating ionic bio-gel!
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(defectX, centerY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing self-healing halo
        const haloR = 12 + Math.sin(this.time * 0.1) * 4;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(defectX, centerY, haloR, 0, Math.PI * 2);
        ctx.stroke();

        // EHD field lines smoothing gradient
        this.drawEhdFieldLines(ctx, defectX, centerY);
      }

      // Status indicator tag
      ctx.font = '10px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`🛡️ EHD GRADIENT SMOOTHED • GEL SELF-SEALED (0 ARCS)`, x + 14, y + height - 12);
    }
  }

  drawViolentArc(ctx, cx, cy, intensity) {
    // Corona Blue/Violet Plasma Cloud
    const plasma = ctx.createRadialGradient(cx, cy, 4, cx, cy, 38 * intensity);
    plasma.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    plasma.addColorStop(0.3, 'rgba(96, 165, 250, 0.8)');
    plasma.addColorStop(0.7, 'rgba(147, 51, 234, 0.4)');
    plasma.addColorStop(1, 'rgba(147, 51, 234, 0)');

    ctx.fillStyle = plasma;
    ctx.beginPath();
    ctx.arc(cx, cy, 42 * intensity, 0, Math.PI * 2);
    ctx.fill();

    // Lightning Arc Bolts
    const boltCount = Math.floor(3 + intensity * 4);
    for (let b = 0; b < boltCount; b++) {
      ctx.strokeStyle = Math.random() > 0.3 ? '#ffffff' : '#60a5fa';
      ctx.lineWidth = 1.5 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      let curX = cx;
      let curY = cy;
      const targetAngle = (Math.random() - 0.5) * Math.PI * 2;
      const totalLen = (20 + Math.random() * 25) * intensity;
      const steps = 4;

      for (let s = 0; s < steps; s++) {
        curX += Math.cos(targetAngle) * (totalLen / steps) + (Math.random() - 0.5) * 12;
        curY += Math.sin(targetAngle) * (totalLen / steps) + (Math.random() - 0.5) * 12;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }
  }

  drawEhdFieldLines(ctx, cx, cy) {
    // Concentric smooth equipotential curves demonstrating no localized field spikes
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let r = 14; r <= 32; r += 6) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.5, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ==========================================
// 4. RADIATION SHIELDING COMPOSITE STACK
// ==========================================

class RadiationLayerStackViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.layers = [
      {
        id: 'rad-pmma',
        name: 'Outer Layer: Hybrid PMMA Nanocomposite',
        material: 'PMMA matrix + surface-passivated rutile TiO₂ and ZnO nanoparticles',
        thickness: '40–60 µm dry film',
        color: '#38bdf8',
        role: 'Absorbs and scatters high-energy incident UV; reflects visible and near-infrared (NIR) solar radiation to minimize solar thermal loading at super high altitudes.',
        physics: 'Bandgap absorption (ZnO/TiO₂ Eg ≈ 3.2–3.4 eV) converts dangerous UV-C/UV-B (<380 nm) into harmless thermal micro-dissipation while scattering incident solar flux.'
      },
      {
        id: 'rad-pcasa',
        name: 'Intermediate Structural Shell (PC/ASA Blend)',
        material: 'Opaque pigmented Polycarbonate / Acrylonitrile Styrene Acrylate (PC/ASA)',
        thickness: '5–10 mm structural wall',
        color: '#a78bfa',
        role: 'Primary structural rigidity and secondary UV barrier. Shields internal cabling, seals, and electronics from residual UV photodegradation while maintaining high Charpy impact strength at sub-zero cold (-40°C).',
        physics: 'The saturated ASA acrylate rubber phase resists photo-oxidation and yellowing, while the high molecular weight polycarbonate backbone resists brittle cryogenic cracking under mechanical vibration.'
      },
      {
        id: 'rad-primer',
        name: 'Interfacial Primer Tie Layer',
        material: 'UV-stable acrylic-silane functionalized copolymer',
        thickness: '3–4 mm (minimum 2.5 mm)',
        color: '#34d399',
        role: 'Promotes molecular adhesion between outer PMMA coating and inner PC/ASA shell; provides an elastomeric compliance cushion absorbing severe diurnal thermal-expansion mismatches.',
        physics: 'Silane coupling agents (Si-O-Si bonds) chemically anchor to substrate while elastomeric acrylic segments yield elastically under extreme Ladakh temperature swings (-40°C to +30°C).'
      },
      {
        id: 'rad-hdpe',
        name: 'Inner Cosmic-Secondary Neutron Liner',
        material: 'Borated High-Density Polyethylene (HDPE) with 5–10% Boron-10 by weight',
        thickness: '20 mm (range 10–20 mm)',
        color: '#f59e0b',
        role: 'Encloses the MCU (ESP32), memory registers, and precision voltage references. Attenuates and captures high-altitude secondary cosmic neutrons that trigger Single-Event Upsets (SEUs).',
        physics: 'High hydrogen density (CH₂ chains) moderates fast atmospheric neutrons via elastic collisions, while Boron-10 captures thermalized neutrons via the ¹⁰B(n,α)⁷Li reaction with negligible secondary gamma emission.'
      }
    ];

    this.selectedLayer = this.layers[3]; // Default to Borated HDPE
    this.init();
  }

  init() {
    this.render();
  }

  selectLayer(index) {
    this.selectedLayer = this.layers[index];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Interactive Layer Cross-Section Graphic -->
        <div class="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-700/70 shadow-2xl relative overflow-hidden">
          <div class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span>🛡️</span> Enclosure Wall Cross-Section (Outer → Core)
          </div>

          <div class="w-full max-w-sm space-y-2.5 cursor-pointer py-2">
            ${this.layers.map((l, idx) => `
              <div onclick="radiationLayerViewer.selectLayer(${idx})"
                class="group p-3.5 rounded-xl border transition-all duration-300 transform hover:scale-[1.02]
                ${this.selectedLayer.id === l.id 
                  ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'}">
                <div class="flex items-center justify-between text-xs mb-1">
                  <div class="flex items-center gap-2 font-bold text-white">
                    <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${l.color}"></span>
                    <span>Layer ${idx + 1}: ${l.name.split(':')[0]}</span>
                  </div>
                  <span class="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700" style="color: ${l.color}">
                    ${l.thickness}
                  </span>
                </div>
                <div class="text-[11px] text-slate-300 truncate pl-5">
                  ${l.material}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span class="text-cyan-300">☀️ Incident UV / Cosmic Rays</span>
            <span class="text-amber-300">Protected MCU Core 💻</span>
          </div>
        </div>

        <!-- Telemetry & Physics Breakdown Card -->
        <div class="lg:col-span-7 space-y-4">
          <div class="p-6 bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl relative">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase font-mono" 
                style="color: ${this.selectedLayer.color}; background: ${this.selectedLayer.color}20; border: 1px solid ${this.selectedLayer.color}50;">
                Thickness: ${this.selectedLayer.thickness}
              </span>
              <span class="text-xs text-slate-400 font-mono">HAA/SHAA Electronic Enclosure Stack</span>
            </div>

            <h3 class="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-full flex-shrink-0" style="background-color: ${this.selectedLayer.color}"></span>
              ${this.selectedLayer.name}
            </h3>

            <p class="text-sm font-medium text-cyan-300 mb-4 font-mono">${this.selectedLayer.material}</p>

            <div class="space-y-3 text-xs sm:text-sm">
              <div class="bg-slate-800/70 p-4 rounded-xl border border-slate-700/50">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">Functional Shielding Role:</span>
                <p class="text-slate-200 leading-relaxed">${this.selectedLayer.role}</p>
              </div>

              <div class="bg-slate-800/70 p-4 rounded-xl border border-slate-700/50">
                <span class="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">Governing Physical & Radiation Mechanism:</span>
                <p class="text-slate-300 leading-relaxed">${this.selectedLayer.physics}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.renderMathInElement) {
      window.renderMathInElement(this.container);
    }
  }
}

// ==========================================
// 5. 3-LEVEL SENSOR VALIDATION & VOTING SIMULATOR
// ==========================================

class SensorFaultToleranceSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Default sensor states (°C)
    this.t1 = -10.2;
    this.t2 = -10.8;
    this.t3 = -10.5;

    // Previous cycle values for rate-of-change check
    this.prevT1 = -10.0;
    this.prevT2 = -10.5;
    this.prevT3 = -10.3;

    // Thresholds
    this.minRange = -50.0;
    this.maxRange = +85.0;
    this.maxRateOfChange = 15.0; // °C jump between samples
    this.clusterDelta = 3.5;    // °C cluster agreement tolerance

    this.activePreset = 'normal';
    this.watchdogTicks = 0;
    this.watchdogState = 'HEALTHY'; // 'HEALTHY' | 'TRIGGERED_RESET'

    this.init();
  }

  init() {
    this.render();
  }

  applyPreset(presetKey) {
    this.activePreset = presetKey;

    if (presetKey === 'normal') {
      this.prevT1 = -11.0; this.t1 = -10.5;
      this.prevT2 = -11.2; this.t2 = -10.8;
      this.prevT3 = -10.9; this.t3 = -10.6;
      this.watchdogState = 'HEALTHY';
    } else if (presetKey === 'seu_spike') {
      // Cosmic ray single event upset glitch on T3
      this.prevT1 = -10.4; this.t1 = -10.2;
      this.prevT2 = -10.8; this.t2 = -10.8;
      this.prevT3 = -10.5; this.t3 = +80.0; // Sudden jump from -10 to +80
      this.watchdogState = 'HEALTHY';
    } else if (presetKey === 'out_of_range') {
      // Physical sensor wire disconnection or register saturation (+160°C)
      this.prevT1 = +160.0; this.t1 = +160.0;
      this.prevT2 = -12.1; this.t2 = -11.9;
      this.prevT3 = -12.4; this.t3 = -12.2;
      this.watchdogState = 'HEALTHY';
    } else if (presetKey === 'critical_conflict') {
      // Severe multi-fault causing unresolvable voting conflict
      this.prevT1 = -10.0; this.t1 = -10.0;
      this.prevT2 = +45.0; this.t2 = +45.0;
      this.prevT3 = +80.0; this.t3 = +80.0;
      this.watchdogState = 'SAFE_STATE_ALARM';
    }

    this.render();
  }

  evaluatePipeline() {
    // Level 1: Range Check ([-50°C, +85°C])
    const l1_t1 = this.t1 >= this.minRange && this.t1 <= this.maxRange;
    const l1_t2 = this.t2 >= this.minRange && this.t2 <= this.maxRange;
    const l1_t3 = this.t3 >= this.minRange && this.t3 <= this.maxRange;

    // Level 2: Rate of Change Check (|T_curr - T_prev| <= 15°C)
    const roc_t1 = Math.abs(this.t1 - this.prevT1);
    const roc_t2 = Math.abs(this.t2 - this.prevT2);
    const roc_t3 = Math.abs(this.t3 - this.prevT3);

    const l2_t1 = l1_t1 && roc_t1 <= this.maxRateOfChange;
    const l2_t2 = l1_t2 && roc_t2 <= this.maxRateOfChange;
    const l2_t3 = l1_t3 && roc_t3 <= this.maxRateOfChange;

    // Candidates entering Level 3 (Majority Voting)
    const validCandidates = [];
    if (l2_t1) validCandidates.push({ id: 'T1', val: this.t1 });
    if (l2_t2) validCandidates.push({ id: 'T2', val: this.t2 });
    if (l2_t3) validCandidates.push({ id: 'T3', val: this.t3 });

    let finalTemp = null;
    let votingStatus = '';
    let excludedSensors = [];
    let isSafeState = false;

    if (!l1_t1) excludedSensors.push('T1 (Out of Range)');
    else if (!l2_t1) excludedSensors.push(`T1 (Rate-of-Change Jump: +${roc_t1.toFixed(1)}°C)`);

    if (!l1_t2) excludedSensors.push('T2 (Out of Range)');
    else if (!l2_t2) excludedSensors.push(`T2 (Rate-of-Change Jump: +${roc_t2.toFixed(1)}°C)`);

    if (!l1_t3) excludedSensors.push('T3 (Out of Range)');
    else if (!l2_t3) excludedSensors.push(`T3 (Rate-of-Change Jump: +${roc_t3.toFixed(1)}°C)`);

    if (validCandidates.length === 3) {
      const d12 = Math.abs(this.t1 - this.t2);
      const d13 = Math.abs(this.t1 - this.t3);
      const d23 = Math.abs(this.t2 - this.t3);

      if (d12 <= this.clusterDelta && d13 <= this.clusterDelta) {
        finalTemp = (this.t1 + this.t2 + this.t3) / 3;
        votingStatus = 'Full Tri-Sensor Consensus (3/3 Agreed)';
      } else if (d12 <= this.clusterDelta) {
        finalTemp = (this.t1 + this.t2) / 2;
        votingStatus = 'Majority Consensus T1 + T2 (T3 Outlier Excluded)';
        excludedSensors.push('T3 (Divergent from T1/T2 cluster)');
      } else if (d13 <= this.clusterDelta) {
        finalTemp = (this.t1 + this.t3) / 2;
        votingStatus = 'Majority Consensus T1 + T3 (T2 Outlier Excluded)';
        excludedSensors.push('T2 (Divergent from T1/T3 cluster)');
      } else if (d23 <= this.clusterDelta) {
        finalTemp = (this.t2 + this.t3) / 2;
        votingStatus = 'Majority Consensus T2 + T3 (T1 Outlier Excluded)';
        excludedSensors.push('T1 (Divergent from T2/T3 cluster)');
      } else {
        isSafeState = true;
        votingStatus = 'No 2-of-3 Cluster Agreement! Safe State Triggered.';
      }
    } else if (validCandidates.length === 2) {
      const diff = Math.abs(validCandidates[0].val - validCandidates[1].val);
      if (diff <= this.clusterDelta) {
        finalTemp = (validCandidates[0].val + validCandidates[1].val) / 2;
        votingStatus = `Pair Agreement between ${validCandidates[0].id} & ${validCandidates[1].id}`;
      } else {
        isSafeState = true;
        votingStatus = `Disagreement between ${validCandidates[0].id} & ${validCandidates[1].id}! Safe State Triggered.`;
      }
    } else if (validCandidates.length === 1) {
      isSafeState = true;
      votingStatus = 'Only 1 valid sensor remaining! Insufficient for majority decision.';
    } else {
      isSafeState = true;
      votingStatus = 'All sensors failed validity checks! Full Safe State Active.';
    }

    return {
      l1: { t1: l1_t1, t2: l1_t2, t3: l1_t3 },
      l2: { t1: l2_t1, t2: l2_t2, t3: l2_t3, roc1: roc_t1, roc2: roc_t2, roc3: roc_t3 },
      finalTemp,
      votingStatus,
      excludedSensors,
      isSafeState
    };
  }

  updateSensor(id, val) {
    const num = parseFloat(val);
    if (id === 't1') { this.prevT1 = this.t1; this.t1 = num; }
    if (id === 't2') { this.prevT2 = this.t2; this.t2 = num; }
    if (id === 't3') { this.prevT3 = this.t3; this.t3 = num; }
    this.render();
  }

  render() {
    if (!this.container) return;

    const res = this.evaluatePipeline();
    const isCold = res.finalTemp !== null && res.finalTemp < 0;

    this.container.innerHTML = `
      <div class="space-y-6">
        <!-- Preset Action Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Scenarios:</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="sensorVotingSim.applyPreset('normal')" 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
              ${this.activePreset === 'normal' ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}">
              ✓ Normal Cold (-11°C)
            </button>
            <button onclick="sensorVotingSim.applyPreset('seu_spike')" 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
              ${this.activePreset === 'seu_spike' ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}">
              ⚡ Cosmic Ray SEU on T3 (+80°C)
            </button>
            <button onclick="sensorVotingSim.applyPreset('out_of_range')" 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
              ${this.activePreset === 'out_of_range' ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}">
              ⚠️ Hardware Range Fault T1 (+160°C)
            </button>
            <button onclick="sensorVotingSim.applyPreset('critical_conflict')" 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
              ${this.activePreset === 'critical_conflict' ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}">
              🚨 Watchdog Safe State Trip
            </button>
          </div>
        </div>

        <!-- 3 Sensor Inputs & Live Evaluation Pipeline -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Sensor 1 -->
          <div class="p-5 rounded-2xl bg-slate-900/80 border ${res.l2.t1 ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-red-500/50 shadow-red-500/10'} shadow-lg space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white uppercase font-mono">Sensor T1 (PT1000)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${res.l2.t1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                ${res.l2.t1 ? 'VALID' : 'REJECTED'}
              </span>
            </div>
            <div class="text-2xl font-black font-mono text-white flex items-baseline justify-between">
              <span>${this.t1 >= 0 ? '+' : ''}${this.t1.toFixed(1)}°C</span>
              <span class="text-xs text-slate-400 font-sans font-normal">Prev: ${this.prevT1.toFixed(1)}°C</span>
            </div>
            <input type="range" min="-50" max="170" step="0.5" value="${this.t1}"
              oninput="sensorVotingSim.updateSensor('t1', this.value)"
              class="w-full accent-cyan-400">
            <div class="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 font-mono">
              <div class="flex justify-between">
                <span>L1 Range [-50, +85]:</span>
                <span class="${res.l1.t1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l1.t1 ? 'PASS' : 'FAIL'}</span>
              </div>
              <div class="flex justify-between">
                <span>L2 |ΔT| (max 15°C):</span>
                <span class="${res.l2.t1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l2.roc1.toFixed(1)}°C (${res.l2.t1 ? 'PASS' : 'FAIL'})</span>
              </div>
            </div>
          </div>

          <!-- Sensor 2 -->
          <div class="p-5 rounded-2xl bg-slate-900/80 border ${res.l2.t2 ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-red-500/50 shadow-red-500/10'} shadow-lg space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white uppercase font-mono">Sensor T2 (Digital IC)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${res.l2.t2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                ${res.l2.t2 ? 'VALID' : 'REJECTED'}
              </span>
            </div>
            <div class="text-2xl font-black font-mono text-white flex items-baseline justify-between">
              <span>${this.t2 >= 0 ? '+' : ''}${this.t2.toFixed(1)}°C</span>
              <span class="text-xs text-slate-400 font-sans font-normal">Prev: ${this.prevT2.toFixed(1)}°C</span>
            </div>
            <input type="range" min="-50" max="170" step="0.5" value="${this.t2}"
              oninput="sensorVotingSim.updateSensor('t2', this.value)"
              class="w-full accent-cyan-400">
            <div class="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 font-mono">
              <div class="flex justify-between">
                <span>L1 Range [-50, +85]:</span>
                <span class="${res.l1.t2 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l1.t2 ? 'PASS' : 'FAIL'}</span>
              </div>
              <div class="flex justify-between">
                <span>L2 |ΔT| (max 15°C):</span>
                <span class="${res.l2.t2 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l2.roc2.toFixed(1)}°C (${res.l2.t2 ? 'PASS' : 'FAIL'})</span>
              </div>
            </div>
          </div>

          <!-- Sensor 3 -->
          <div class="p-5 rounded-2xl bg-slate-900/80 border ${res.l2.t3 ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-red-500/50 shadow-red-500/10'} shadow-lg space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white uppercase font-mono">Sensor T3 (Thermistor)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${res.l2.t3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                ${res.l2.t3 ? 'VALID' : 'REJECTED'}
              </span>
            </div>
            <div class="text-2xl font-black font-mono text-white flex items-baseline justify-between">
              <span>${this.t3 >= 0 ? '+' : ''}${this.t3.toFixed(1)}°C</span>
              <span class="text-xs text-slate-400 font-sans font-normal">Prev: ${this.prevT3.toFixed(1)}°C</span>
            </div>
            <input type="range" min="-50" max="170" step="0.5" value="${this.t3}"
              oninput="sensorVotingSim.updateSensor('t3', this.value)"
              class="w-full accent-cyan-400">
            <div class="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 font-mono">
              <div class="flex justify-between">
                <span>L1 Range [-50, +85]:</span>
                <span class="${res.l1.t3 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l1.t3 ? 'PASS' : 'FAIL'}</span>
              </div>
              <div class="flex justify-between">
                <span>L2 |ΔT| (max 15°C):</span>
                <span class="${res.l2.t3 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}">${res.l2.roc3.toFixed(1)}°C (${res.l2.t3 ? 'PASS' : 'FAIL'})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Level 3 Voting & Controller Telemetry Result -->
        <div class="p-6 bg-slate-900/90 rounded-2xl border ${res.isSafeState ? 'border-red-500/60 bg-red-950/20' : 'border-emerald-500/40 bg-emerald-950/20'} shadow-xl space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Level 3: Cross-Sensor Majority Voting Result</span>
              <h4 class="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span>${res.isSafeState ? '🚨' : '🛡️'}</span>
                <span>${res.votingStatus}</span>
              </h4>
            </div>

            <!-- Validated Temperature Display -->
            <div class="text-right">
              <span class="text-xs text-slate-400 block font-mono">Validated T_control</span>
              <span class="text-2xl sm:text-3xl font-black font-mono ${res.isSafeState ? 'text-red-400' : 'text-emerald-300'}">
                ${res.finalTemp !== null ? (res.finalTemp >= 0 ? '+' : '') + res.finalTemp.toFixed(2) + '°C' : 'N/A (LOCKED)'}
              </span>
            </div>
          </div>

          <!-- Actuator Control & Safe State Status -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 space-y-1">
              <span class="text-slate-400 font-bold uppercase font-mono block">Enclosure Heater:</span>
              <span class="font-bold text-sm ${res.isSafeState ? 'text-slate-400' : (isCold ? 'text-amber-400' : 'text-slate-400')}">
                ${res.isSafeState ? '⭕ SAFE OFF' : (isCold ? '🔥 ACTIVE (Heating Battery)' : '⭕ STANDBY (Temp OK)')}
              </span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 space-y-1">
              <span class="text-slate-400 font-bold uppercase font-mono block">Cooling Fan:</span>
              <span class="font-bold text-sm ${res.isSafeState ? 'text-cyan-300' : 'text-slate-300'}">
                ${res.isSafeState ? '🌀 RECOVERY MODE' : 'Adaptive Speed Control'}
              </span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 space-y-1">
              <span class="text-slate-400 font-bold uppercase font-mono block">Watchdog Supervision:</span>
              <span class="font-bold text-sm ${res.isSafeState ? 'text-red-400' : 'text-emerald-400'}">
                ${res.isSafeState ? '⚠️ TIMEOUT TRIP INITIATED' : '✓ Loop Healthy (Reset Serviced)'}
              </span>
            </div>
          </div>

          ${res.excludedSensors.length > 0 ? `
            <div class="p-3 bg-slate-950/70 rounded-xl border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span><strong>Isolated Outliers:</strong> ${res.excludedSensors.join(', ')}. The controller excluded these corruptions from decision-making without crashing!</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

window.PaschenSimulator = PaschenSimulator;
window.DashIbCrossSection = DashIbCrossSection;
window.VacuumChamberSimulator = VacuumChamberSimulator;
window.RadiationLayerStackViewer = RadiationLayerStackViewer;
window.SensorFaultToleranceSimulator = SensorFaultToleranceSimulator;

