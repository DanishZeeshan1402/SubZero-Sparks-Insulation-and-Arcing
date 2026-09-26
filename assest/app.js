/**
 * Main Application Orchestrator
 * - Initializes Background Landscape Canvas Engine
 * - Manages KaTeX vs. Raw LaTeX Toggle
 * - Manages Animation Play / Pause State
 * - Manages Currency Switcher (USD / INR) for Cost Table
 * - Coordinates Thermal Insulation Step Timeline & Option A/B Tabs
 * - Bootstraps Paschen & Vacuum Chamber Simulators
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Landscape Canvas Engine
  const canvasEngine = new LadakhCanvasEngine('ladakh-canvas');
  window.canvasEngine = canvasEngine;

  // 2. Play / Pause Button in Header
  const animToggleBtn = document.getElementById('btn-anim-toggle');
  const animIcon = document.getElementById('anim-icon');
  const animText = document.getElementById('anim-text');

  if (animToggleBtn) {
    animToggleBtn.addEventListener('click', () => {
      const isPlaying = canvasEngine.togglePlayPause();
      if (animIcon) animIcon.textContent = isPlaying ? '⏸️' : '▶️';
      if (animText) animText.textContent = isPlaying ? 'Pause Canvas' : 'Resume Canvas';
      animToggleBtn.classList.toggle('text-amber-400', !isPlaying);
    });
  }

  // 2b. Scenic Landscape Peek Toggle
  const scenicBtn = document.getElementById('btn-scenic-toggle');
  const scenicText = document.getElementById('scenic-text');
  let isScenic = false;

  if (scenicBtn) {
    scenicBtn.addEventListener('click', () => {
      isScenic = !isScenic;
      document.body.classList.toggle('scenic-mode', isScenic);
      if (scenicText) scenicText.textContent = isScenic ? 'Exit Scenic' : 'Scenic View';
      scenicBtn.classList.toggle('bg-emerald-600', isScenic);
      scenicBtn.classList.toggle('text-white', isScenic);
    });
  }

  // 3. LaTeX / Raw Math View Toggle
  const mathToggleBtn = document.getElementById('btn-math-toggle');
  const mathToggleStatus = document.getElementById('math-toggle-status');
  let isRawMath = false;

  if (mathToggleBtn) {
    mathToggleBtn.addEventListener('click', () => {
      isRawMath = !isRawMath;
      document.body.classList.toggle('mode-raw-view', isRawMath);
      document.body.classList.toggle('mode-katex-view', !isRawMath);

      if (mathToggleStatus) {
        mathToggleStatus.textContent = isRawMath ? 'Raw LaTeX' : 'KaTeX Render';
      }
      mathToggleBtn.classList.toggle('border-cyan-400', !isRawMath);
      mathToggleBtn.classList.toggle('border-amber-400', isRawMath);
    });
  }

  // Render KaTeX if available
  renderAllFormulas();

  // 4. Currency Switcher (USD / INR)
  const currencyBtns = document.querySelectorAll('.currency-toggle-btn');
  const costRows = [
    { id: 'cost-wool', usd: 0.48, inr: 40 },
    { id: 'cost-scrap', usd: 0.10, inr: 8 },
    { id: 'cost-borax', usd: 0.04, inr: 3 },
    { id: 'cost-scour', usd: 0.05, inr: 4 },
    { id: 'cost-energy', usd: 0.35, inr: 29 },
    { id: 'cost-total', usdMin: 1.00, usdMax: 1.30, inrMin: 84, inrMax: 110 },
    { id: 'cost-comm', usdMin: 12.00, usdMax: 20.00, inrMin: 1000, inrMax: 1650 }
  ];

  let currentCurrency = 'USD';

  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyBtns.forEach(b => b.classList.remove('bg-emerald-600', 'text-white'));
      btn.classList.add('bg-emerald-600', 'text-white');
      currentCurrency = btn.dataset.currency;
      updateCostTable(currentCurrency);
    });
  });

  function updateCostTable(curr) {
    costRows.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;
      if (item.usd !== undefined) {
        el.textContent = curr === 'USD' ? `$${item.usd.toFixed(2)}` : `₹${item.inr}`;
      } else {
        el.textContent = curr === 'USD' 
          ? `$${item.usdMin.toFixed(2)} - $${item.usdMax.toFixed(2)}` 
          : `₹${item.inrMin} - ₹${item.inrMax}`;
      }
    });

    const unitHeaders = document.querySelectorAll('.currency-unit-label');
    unitHeaders.forEach(lbl => {
      lbl.textContent = curr === 'USD' ? 'USD ($)' : 'INR (₹)';
    });
  }

  // 5. Interactive Horizontal Timeline (Section 2)
  const timelineSteps = [
    {
      step: 1,
      title: 'Raw Material Sourcing & Fiber Ratio',
      subtitle: 'Grease Wool (Ladakh Agri-Waste) + Textile Offcuts',
      badge: 'Ratio: 60:40 to 70:30',
      description: 'Collect coarse sheep wool discarded by pastoralists in the Changthang / Ladakh plateau and combine with post-industrial cotton/denim cutting scraps. The coarse wool provides resilient 3D spring crimp, while the cellulosic textile fibers interlock to form structural bulk.',
      keyPoints: [
        'Coarse sheep wool: 60–70% by mass (high nitrogen content, natural crimp).',
        'Textile scraps: 30–40% by mass (cotton/denim post-industrial waste).',
        'Directly diverts landfill scrap and generates secondary income for high-altitude pastoralists.'
      ]
    },
    {
      step: 2,
      title: 'Washing, Scouring & Chemical Protection',
      subtitle: '60°C Soda Ash Bath + 1–2% Borax Treatment',
      badge: 'Eco-Degreasing & Fireproofing',
      description: 'Raw wool undergoes mild alkaline scouring at 60°C with sodium carbonate and bio-detergent to strip excess grease and dirt. The scoured fiber is then treated with an aqueous solution of Disodium Octaborate Tetrahydrate (Borax).',
      keyPoints: [
        'Scouring: 60°C aqueous solution of sodium carbonate (soda ash).',
        'Flame Retardancy: 1–2% Borax bath confers dual protection against fire and mold.',
        'Insect Resistance: Prevents moth larval infestation in cold, remote storage.'
      ]
    },
    {
      step: 3,
      title: 'Mechanical Carding & Web Formation',
      subtitle: 'Rotary Garnetting & Web Homogenization',
      badge: 'Micro-Air Entrapment',
      description: 'Shredded denim scraps and cleaned wool are processed through a rotary carding brush / garnetting machine. Fibers are disentangled and aligned into homogeneous continuous gossamer-thin fiber webs with high loft.',
      keyPoints: [
        'High air pocket fraction creates dead-air insulation zones.',
        'Homogeneous fiber matrix eliminates cold bridges.',
        'Produces uniform density webs ready for bonding.'
      ]
    },
    {
      step: 4,
      title: 'Felting & Mat Fabrication',
      subtitle: 'Wet Felting (Manual) vs. Needle Punching (Industrial)',
      badge: 'Option A / B Available',
      description: 'Fiber webs are consolidated into dense 20 mm mats (800–1000 g/m²). Choose between cottage manual production or continuous automated needle felting.',
      options: true
    },
    {
      step: 5,
      title: 'Hydrophobic Seal & Installation',
      subtitle: 'Bio-Derived Lanolin/Beeswax Emulsion & Battery Protection',
      badge: 'Enclosure Integration',
      description: 'Exterior mat faces receive a breathable micro-spray of bio-derived hydrophobic emulsion (lanolin or beeswax). Cut to custom patterns and fitted around electronics enclosures, drone battery banks, and solar power stations.',
      keyPoints: [
        'Breathable water-repellent surface blocks bulk liquid ingress.',
        'Vibration damping shields fragile PCBs from mechanical shocks.',
        'Zero thermal bridging at enclosure corners.'
      ]
    }
  ];

  let currentStepIndex = 0;

  function renderTimelineStep(idx) {
    currentStepIndex = idx;
    const stepData = timelineSteps[idx];

    // Highlight timeline nodes
    document.querySelectorAll('.timeline-node').forEach((node, nIdx) => {
      const isCurrent = nIdx === idx;
      node.classList.toggle('ring-4', isCurrent);
      node.classList.toggle('ring-cyan-400', isCurrent);
      node.classList.toggle('bg-cyan-500', isCurrent);
      node.classList.toggle('text-slate-950', isCurrent);
    });

    const cardContainer = document.getElementById('timeline-detail-card');
    if (!cardContainer) return;

    if (stepData.options) {
      cardContainer.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Step ${stepData.step} of 5</span>
              <h4 class="text-xl font-bold text-white">${stepData.title}</h4>
              <p class="text-sm text-slate-300">${stepData.subtitle}</p>
            </div>
            <div class="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button id="tab-felting-a" class="px-3 py-1.5 text-xs font-bold rounded-md bg-cyan-600 text-white transition-all">Option A: Manual Wet Felting</button>
              <button id="tab-felting-b" class="px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition-all">Option B: Industrial Needle Punching</button>
            </div>
          </div>

          <div id="felting-tab-content" class="text-sm text-slate-300 leading-relaxed">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <h5 class="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <span>🖐️</span> Manual Wet Felting (Cottage / Low Capex)
                </h5>
                <p class="text-slate-300 mb-2">Cross-lap webs (2–4 cm thick) on a bamboo mat, saturate with warm soapy water (50°C), roll, and apply mechanical pressure and friction to lock microscopic wool scales together.</p>
                <span class="text-xs text-emerald-400 font-semibold block">Ideal for remote Ladakh village co-operatives with zero electric machinery.</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <h5 class="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <span>⚙️</span> Needle Punching (Automated Scale)
                </h5>
                <p class="text-slate-300 mb-2">Feed layered batts continuously through reciprocating needle boards equipped with thousands of barbed needles. Mechanical entanglement locks fibers without drying ovens.</p>
                <span class="text-xs text-cyan-400 font-semibold block">High throughput: 15–20 m²/hour, consistent 20 mm thickness control.</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Option tab switching
      const tabA = document.getElementById('tab-felting-a');
      const tabB = document.getElementById('tab-felting-b');
      if (tabA && tabB) {
        tabA.addEventListener('click', () => {
          tabA.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-cyan-600 text-white transition-all';
          tabB.className = 'px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition-all';
        });
        tabB.addEventListener('click', () => {
          tabB.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-amber-600 text-white transition-all';
          tabA.className = 'px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition-all';
        });
      }
    } else {
      cardContainer.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Step ${stepData.step} of 5</span>
              <h4 class="text-xl font-bold text-white">${stepData.title}</h4>
              <p class="text-sm text-slate-300">${stepData.subtitle}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ${stepData.badge}
            </span>
          </div>

          <p class="text-sm text-slate-300 leading-relaxed">${stepData.description}</p>

          <div class="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/40 space-y-2">
            <span class="text-xs uppercase font-bold text-slate-400 tracking-wider block">Key Engineering Highlights:</span>
            <ul class="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
              ${stepData.keyPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
  }

  // Bind Timeline Node Clicks
  document.querySelectorAll('.timeline-node').forEach((node, idx) => {
    node.addEventListener('click', () => renderTimelineStep(idx));
  });

  const nextStepBtn = document.getElementById('btn-timeline-next');
  const prevStepBtn = document.getElementById('btn-timeline-prev');

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      const nextIdx = (currentStepIndex + 1) % timelineSteps.length;
      renderTimelineStep(nextIdx);
    });
  }
  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      const prevIdx = (currentStepIndex - 1 + timelineSteps.length) % timelineSteps.length;
      renderTimelineStep(prevIdx);
    });
  }

  // Initial Step Render
  renderTimelineStep(0);

  // 6. Bootstrap DASH-IB, Radiation Shielding & Simulators
  window.dashIbViewer = new DashIbCrossSection('dash-ib-cross-section-container');
  window.paschenSim = new PaschenSimulator('paschen-curve-canvas', 'paschen-results-container');
  window.vacuumSim = new VacuumChamberSimulator('vacuum-chamber-canvas');
  window.radiationLayerViewer = new RadiationLayerStackViewer('radiation-layer-stack-container');
  window.sensorVotingSim = new SensorFaultToleranceSimulator('sensor-voting-simulator-container');

  // 7. Mobile Navigation Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-nav-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    // Close menu when clicking nav item
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  // 8. Navigation ScrollSpy
  const navLinks = document.querySelectorAll('.nav-anchor');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.pageYOffset >= top) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('text-cyan-400', link.getAttribute('href') === `#${currentId}`);
      link.classList.toggle('font-bold', link.getAttribute('href') === `#${currentId}`);
    });
  }, { passive: true });
});

// KaTeX formula renderer with graceful offline fallback
function renderAllFormulas() {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('KaTeX rendering error:', e);
    }
  }
}

// ==========================================
// 9. FIELD DEPLOYMENT LIGHTBOX MODAL
// ==========================================
const deploymentData = [
  {
    title: 'Alpine Stream & Valley Floor Station',
    badge: '3,500 m MSL • Nubra Valley Basin',
    img: 'asset/enclosure_valley_stream.jpg',
    alt: '3,500 m MSL (Nubra Valley Floor)',
    temp: '+14.2°C (Diurnal High)',
    flux: '1,040 W/m² (Clear Alpine Sunlight)',
    status: '0 SEU Flips • Shielding Nominal',
    desc: 'Installed on solid ground near the winding mountain stream with sheep grazing in lush pastures. Evaluates high-altitude diurnal humidity cycling, ground thermal conductivity, and solar reflection off water surfaces using the hybrid PMMA rutile TiO₂/ZnO thin film.'
  },
  {
    title: 'High-Altitude Rocky Ridge Outpost',
    badge: '4,800 m MSL • South Pullu Ridge Crag',
    img: 'asset/enclosure_ridge_deployment.jpg',
    alt: '4,800 m MSL (Exposed Ridge Crag)',
    temp: '-4.8°C (Sub-Zero Ridge Wind)',
    flux: '1,180 W/m² (Extreme UV Index 12.8)',
    status: '0 SEU Flips • Watchdog Healthy',
    desc: 'Bolted to solid granite crags on an exposed alpine ridge with wide panoramic views of Ladakh mountain chains. Validates extreme solar UV-C/UV-B index (>12.5) protection, heavy aerodynamic wind buffeting, and primary cosmic neutron shower flux.'
  },
  {
    title: 'Sunset Alpenglow Radiation Terrace',
    badge: '4,200 m MSL • Chang La Foothills',
    img: 'asset/enclosure_sunset_alpenglow.jpg',
    alt: '4,200 m MSL (Chang La Plateau)',
    temp: '-8.1°C (Rapid Twilight Descent)',
    flux: '410 W/m² (Alpenglow / Low Angle)',
    status: '0 SEU Flips • Tie Layer Compliant',
    desc: 'Perched on a mountain terrace overlooking sunset peaks. Validates acute diurnal thermal shock (+22°C to -15°C within 90 minutes) and elastomeric compliance of the acrylic-silane primer tie layer preventing delamination between PMMA and PC/ASA.'
  },
  {
    title: 'Khardung La Summit Snow Pass',
    badge: '5,359 m MSL • Khardung La Pass',
    img: 'asset/enclosure_winter_pass.jpg',
    alt: '5,359 m MSL (Khardung La Summit)',
    temp: '-24.5°C (Extreme Cryogenic Cold)',
    flux: '980 W/m² (Snow Albedo 80% Reflected)',
    status: '0 SEU Flips • Borated HDPE Active',
    desc: 'Operating amidst snow drifts, rime frost, and granite boulders under intense secondary cosmic neutron flux. Demonstrates cryogenic PC/ASA fracture toughness at -38°C and borated HDPE neutron moderation/capture with 100% MCU uptime.'
  }
];

window.openDeploymentLightbox = function(index) {
  const item = deploymentData[index];
  if (!item) return;
  const modal = document.getElementById('deployment-lightbox');
  if (!modal) return;
  
  const titleEl = document.getElementById('lightbox-title');
  const badgeEl = document.getElementById('lightbox-badge');
  const imgEl = document.getElementById('lightbox-img');
  const altEl = document.getElementById('lightbox-alt');
  const tempEl = document.getElementById('lightbox-temp');
  const fluxEl = document.getElementById('lightbox-flux');
  const statusEl = document.getElementById('lightbox-status');
  const descEl = document.getElementById('lightbox-desc');

  if (titleEl) titleEl.textContent = item.title;
  if (badgeEl) badgeEl.textContent = item.badge;
  if (imgEl) {
    imgEl.src = item.img;
    imgEl.alt = item.title;
  }
  if (altEl) altEl.textContent = item.alt;
  if (tempEl) tempEl.textContent = item.temp;
  if (fluxEl) fluxEl.textContent = item.flux;
  if (statusEl) statusEl.textContent = item.status;
  if (descEl) descEl.textContent = item.desc;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeDeploymentLightbox = function() {
  const modal = document.getElementById('deployment-lightbox');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Global escape key and backdrop click listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDeploymentLightbox();
  }
});

document.addEventListener('click', (e) => {
  const modal = document.getElementById('deployment-lightbox');
  if (modal && e.target === modal) {
    closeDeploymentLightbox();
  }
});
