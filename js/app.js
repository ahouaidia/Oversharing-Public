/* ============================================================
   Zava Corp – Data Security Assessment
   Interactive JS: Particles, Accordion, Scroll Reveal (v2)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initAccordion();
  initScrollReveal();
  initNavScroll();
  initFindings();
  initKpiCards();
});

/* -------------------------------------------------------
   DATA FLOW NETWORK — Canvas-based security mesh
   Nodes + connections + animated data packets
------------------------------------------------------- */

function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Brand palette (darkened for light bg visibility)
  const COLORS = {
    gold:      { r: 130, g: 108, b: 46 },
    blue:      { r: 18,  g: 140, b: 184 },
    turquoise: { r: 0,   g: 144, b: 134 },
    pink:      { r: 178, g: 50,  b: 100 },
  };

  const NODE_COUNT = 55;
  const CONNECTION_DIST = 180;
  const PACKET_SPEED = 0.6;
  const EDGE_MARGIN = 60;

  let width, height, dpr;
  let nodes = [];
  let packets = [];
  let mouse = { x: 0, y: 0 };
  let animationId;
  let time = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = container.offsetWidth;
    height = container.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function edgeAlpha(x, y) {
    let a = 1;
    if (x < EDGE_MARGIN) a *= x / EDGE_MARGIN;
    else if (x > width - EDGE_MARGIN) a *= (width - x) / EDGE_MARGIN;
    if (y < EDGE_MARGIN) a *= y / EDGE_MARGIN;
    else if (y > height - EDGE_MARGIN) a *= (height - y) / EDGE_MARGIN;
    return Math.max(0, a);
  }

  function createNode() {
    const palette = [COLORS.gold, COLORS.blue, COLORS.turquoise];
    const color = palette[Math.floor(Math.random() * palette.length)];
    const isSecure = Math.random() < 0.12; // 12% are "security" nodes (hexagons)
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      baseSize: isSecure ? 3.2 : (Math.random() * 1.8 + 1),
      color: color,
      isSecure: isSecure,
      pulse: Math.random() * Math.PI * 2, // phase offset
    };
  }

  function createPacket(fromNode, toNode) {
    return {
      from: fromNode,
      to: toNode,
      progress: 0,
      speed: PACKET_SPEED + Math.random() * 0.3,
      color: COLORS.blue,
      alive: true,
    };
  }

  function drawHex(cx, cy, r, alpha, color) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = cx + r * Math.cos(angle);
      const hy = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.7})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.15})`;
    ctx.fill();
  }

  function drawNode(node) {
    const a = edgeAlpha(node.x, node.y);
    if (a <= 0) return;

    const pulseScale = 1 + 0.15 * Math.sin(time * 0.02 + node.pulse);
    const size = node.baseSize * pulseScale;
    const c = node.color;

    if (node.isSecure) {
      // Draw hexagon (security checkpoint)
      drawHex(node.x, node.y, size * 2.2, a, c);
      // Bright center dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${a * 0.8})`;
      ctx.fill();
    } else {
      // Regular data node — circle with glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${a * 0.55})`;
      ctx.fill();

      // Subtle outer ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${a * 0.12})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const strength = 1 - dist / CONNECTION_DIST;
          const aI = edgeAlpha(nodes[i].x, nodes[i].y);
          const aJ = edgeAlpha(nodes[j].x, nodes[j].y);
          const a = Math.min(aI, aJ) * strength;

          if (a < 0.01) continue;

          // Use gold color for connections
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${COLORS.gold.r}, ${COLORS.gold.g}, ${COLORS.gold.b}, ${a * 0.18})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function spawnPackets() {
    // Occasionally spawn data packets along connections
    if (Math.random() > 0.025) return;
    if (packets.length > 20) return;

    // Pick two connected nodes
    for (let attempt = 0; attempt < 5; attempt++) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DIST) {
        packets.push(createPacket(a, b));
        break;
      }
    }
  }

  function updateAndDrawPackets() {
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.progress += p.speed * 0.015;

      if (p.progress >= 1) {
        packets.splice(i, 1);
        continue;
      }

      const x = p.from.x + (p.to.x - p.from.x) * p.progress;
      const y = p.from.y + (p.to.y - p.from.y) * p.progress;
      const a = edgeAlpha(x, y);

      if (a <= 0) continue;

      // Glowing packet dot
      const packetAlpha = a * (1 - Math.abs(p.progress - 0.5) * 0.6);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLORS.blue.r}, ${COLORS.blue.g}, ${COLORS.blue.b}, ${packetAlpha * 0.9})`;
      ctx.fill();

      // Glow halo
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLORS.blue.r}, ${COLORS.blue.g}, ${COLORS.blue.b}, ${packetAlpha * 0.15})`;
      ctx.fill();
    }
  }

  function updateNodes() {
    for (const node of nodes) {
      // Mouse repulsion
      const mdx = node.x - (mouse.x + width / 2);
      const mdy = node.y - (mouse.y + height / 2);
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mouse.x !== 0 && mouse.y !== 0 && mDist < 150) {
        const force = (150 - mDist) / 150 * 0.3;
        node.vx += (mdx / mDist) * force;
        node.vy += (mdy / mDist) * force;
      }

      // Damping
      node.vx *= 0.98;
      node.vy *= 0.98;

      node.x += node.vx;
      node.y += node.vy;

      // Wrap edges
      if (node.x < -20) node.x = width + 20;
      else if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      else if (node.y > height + 20) node.y = -20;
    }
  }

  function animate() {
    time++;
    ctx.clearRect(0, 0, width, height);

    updateNodes();
    drawConnections();
    for (const node of nodes) drawNode(node);
    spawnPackets();
    updateAndDrawPackets();

    animationId = requestAnimationFrame(animate);
  }

  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, createNode);
    packets = [];
    animate();
  }

  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left - width / 2;
    mouse.y = e.clientY - rect.top - height / 2;
  });

  container.addEventListener('mouseleave', () => {
    mouse.x = 0;
    mouse.y = 0;
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animationId);
      init();
    }, 200);
  });

  container.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      const rect = container.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left - width / 2;
      mouse.y = e.touches[0].clientY - rect.top - height / 2;
    }
  }, { passive: true });

  init();
}

/* -------------------------------------------------------
   ACCORDION
------------------------------------------------------- */

function initAccordion() {
  const headers = document.querySelectorAll('.risk-card-header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.risk-card');
      const detail = card.querySelector('.risk-detail');
      const isOpen = card.classList.contains('is-open');

      // Close all others
      document.querySelectorAll('.risk-card.is-open').forEach(openCard => {
        if (openCard !== card) {
          openCard.classList.remove('is-open');
          const openDetail = openCard.querySelector('.risk-detail');
          openDetail.style.maxHeight = null;
          openDetail.classList.remove('is-open');
          openCard.querySelector('.risk-card-header').setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        card.classList.remove('is-open');
        detail.style.maxHeight = null;
        detail.classList.remove('is-open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        card.classList.add('is-open');
        detail.style.maxHeight = detail.scrollHeight + 'px';
        detail.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard accessibility
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
}

/* -------------------------------------------------------
   SCROLL REVEAL  (IntersectionObserver)
------------------------------------------------------- */

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));

  // Stagger approach steps
  var steps = document.querySelectorAll('.approach-step');
  if (steps.length) {
    var stepObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var idx = Array.prototype.indexOf.call(steps, entry.target);
          setTimeout(function() { entry.target.classList.add('is-visible'); }, idx * 120);
          stepObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    steps.forEach(function(s) { stepObserver.observe(s); });
  }
}

/* -------------------------------------------------------
   NAV SCROLL BEHAVIOR
------------------------------------------------------- */

function initNavScroll() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          nav.classList.add('nav-scrolled');
        } else {
          nav.classList.remove('nav-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* -------------------------------------------------------
   FINDINGS SLIDER — 10 numbered findings with nav
------------------------------------------------------- */

function initFindings() {
  const container = document.getElementById('findingsSlideContainer');
  const bigNumber = document.getElementById('findingsBigNumber');
  const progressFill = document.getElementById('findingsProgressFill');
  const counter = document.getElementById('findingsCounter');
  const sourceEl = document.getElementById('findingsSource');
  const prevBtn = document.getElementById('findingsPrev');
  const nextBtn = document.getElementById('findingsNext');

  if (!container) return;

  // Create persistent tabs row above the slider
  var sliderEl = document.getElementById('findingsSlider');
  var tabsRow = document.createElement('div');
  tabsRow.className = 'findings-tabs-row';
  sliderEl.parentNode.insertBefore(tabsRow, sliderEl);
  window._findingsTabsRow = tabsRow;

  // Function to align each tab above its corresponding pill
  function alignTabsToPills(slide) {
    if (!window._findingsTabsRow) return;
    var tabs = window._findingsTabsRow.querySelectorAll('.findings-tab');
    tabs.forEach(function(tab) {
      var forAttr = tab.getAttribute('data-for');
      var pill = null;
      if (forAttr === 'risk') pill = slide.querySelector('.findings-risk-pill');
      else if (forAttr === 'phase') {
        var phaseSelect = slide.querySelector('.phase-select');
        pill = phaseSelect ? phaseSelect.closest('.inline-select-wrapper') : null;
      }
      else if (forAttr === 'status') {
        var statusSelect = slide.querySelector('.status-select');
        pill = statusSelect ? statusSelect.closest('.inline-select-wrapper') : null;
      }
      if (pill) {
        // Walk offsetLeft chain up to the slider to get layout position (unaffected by transforms)
        var left = 0;
        var el = pill;
        while (el && el !== sliderEl) {
          left += el.offsetLeft;
          el = el.offsetParent;
        }
        tab.style.position = 'absolute';
        tab.style.left = left + 'px';
        tab.style.width = pill.offsetWidth + 'px';
      }
    });
  }

  // Create persistent owner ribbon on the slider container
  var sliderRibbon = document.createElement('div');
  sliderRibbon.className = 'owner-ribbon owner-ftc';
  sliderRibbon.title = 'Click to toggle owner';
  sliderRibbon.innerHTML = '<span>FTC</span>';
  sliderEl.appendChild(sliderRibbon);

  // Create persistent Post-it note sliding from top edge of the slider
  var postit = document.createElement('div');
  postit.className = 'postit-note';
  postit.innerHTML =
    '<div class="postit-tab">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>' +
        '<line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' +
      '</svg>' +
      '<span>Notes</span>' +
    '</div>' +
    '<div class="postit-body">' +
      '<textarea class="postit-textarea" placeholder="Add your notes here..."></textarea>' +
    '</div>';
  // Wrap slider in a relative container so postit can be positioned relative to the card
  var sliderWrapper = document.createElement('div');
  sliderWrapper.style.position = 'relative';
  sliderEl.parentNode.insertBefore(sliderWrapper, sliderEl);
  sliderWrapper.appendChild(sliderEl);
  sliderWrapper.appendChild(postit);

  var postitTab = postit.querySelector('.postit-tab');
  var postitTextarea = postit.querySelector('.postit-textarea');

  // Toggle post-it open/close
  postitTab.addEventListener('click', function(e) {
    e.stopPropagation();
    postit.classList.toggle('is-open');
    if (postit.classList.contains('is-open')) {
      postitTextarea.focus();
    }
  });

  // Prevent clicks on textarea from closing
  postitTextarea.addEventListener('click', function(e) { e.stopPropagation(); });

  // Save note to localStorage on input
  postitTextarea.addEventListener('input', function() {
    var idx = parseInt(postit.getAttribute('data-index'), 10);
    if (!isNaN(idx) && typeof findings !== 'undefined') {
      findings[idx].notes = this.value;
      saveFindingOverrides();
    }
  });

  // Load findings from external JSON, apply any localStorage overrides
  var findings = [];

  function saveFindingOverrides() {
    var overrides = findings.map(function(f) {
      return { phase: f.phase, status: f.status, owner: f.owner, notes: f.notes || '' };
    });
    localStorage.setItem('findings-overrides', JSON.stringify(overrides));
  }

  function loadFindings(data) {
    data.forEach(function(f) { if (!f.notes) f.notes = ''; });
    findings.length = 0;
    Array.prototype.push.apply(findings, data);

    // Apply localStorage overrides on top
    try {
      var saved = JSON.parse(localStorage.getItem('findings-overrides'));
      if (saved && saved.length === findings.length) {
        saved.forEach(function(o, i) {
          if (o.phase) findings[i].phase = o.phase;
          if (o.status !== undefined) findings[i].status = o.status;
          if (o.owner) findings[i].owner = o.owner;
          if (o.notes !== undefined) findings[i].notes = o.notes;
        });
      }
    } catch(e) {}

    // Migrate any old per-item postit-note-* keys into findings
    findings.forEach(function(f, i) {
      if (!f.notes) {
        try {
          var old = localStorage.getItem('postit-note-' + i);
          if (old) { f.notes = old; localStorage.removeItem('postit-note-' + i); }
        } catch(e) {}
      }
    });

    // Assign category-based IDs (I01, S01, C01, D01, ...)
    var categoryPrefixes = { 'Identify': 'I', 'Switch': 'S', 'Configure': 'C', 'Deploy': 'D' };
    var categoryCounts = {};
    findings.forEach(function(f) {
      var prefix = categoryPrefixes[f.category] || 'X';
      categoryCounts[prefix] = (categoryCounts[prefix] || 0) + 1;
      f.id = prefix + String(categoryCounts[prefix]).padStart(2, '0');
    });

    initFindingsUI();
  }

  // Load findings from inline data (works on file://) or external JSON (HTTP)
  if (window.__FINDINGS_DATA__) {
    loadFindings(window.__FINDINGS_DATA__);
  } else {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'data/findings.json', true);
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
          try { loadFindings(JSON.parse(xhr.responseText)); }
          catch(e) { console.error('Failed to parse findings.json', e); }
        }
      };
      xhr.onerror = function() { console.error('XHR failed for findings.json'); };
      xhr.send();
    } catch(e) { console.error('Failed to load findings.json', e); }
  }

  function initFindingsUI() {

  // Auto-detect which findings have images (Reco##.png in assets/)
  var findingsImageMap = {};
  var imageProbePromises = findings.map(function(_, i) {
    return new Promise(function(resolve) {
      var num = String(i + 1).padStart(2, '0');
      var img = new Image();
      img.onload = function() { findingsImageMap[i] = true; resolve(); };
      img.onerror = function() { resolve(); };
      img.src = 'assets/Reco' + num + '.png';
    });
  });

  // Lightbox
  var lightboxEl = document.getElementById('findingsLightbox');
  var lightboxImg = document.getElementById('findingsLightboxImg');

  function openLightbox(src) {
    lightboxImg.src = src;
    lightboxEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxEl.classList.remove('is-open');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  lightboxEl.addEventListener('click', function(e) {
    if (e.target === lightboxEl || e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightboxEl.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  // Category badge definitions (shared by render and buildTimeline)
  var categoryIcons = {
    'Identify': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'Switch': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'Configure': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z"/></svg>',
    'Deploy': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>'
  };
  var categoryColors = {
    'Identify': 'category-identify',
    'Switch': 'category-switch',
    'Configure': 'category-configure',
    'Deploy': 'category-deploy'
  };

  let current = 0;

  function render(index, direction) {
    const f = findings[index];

    // Remove old slides
    const oldSlide = container.querySelector('.findings-slide.is-active');
    if (oldSlide) {
      oldSlide.classList.remove('is-active');
      oldSlide.classList.add('is-exiting');
      setTimeout(() => oldSlide.remove(), 500);
    }

    // Create new slide
    const slide = document.createElement('div');
    slide.className = 'findings-slide';
    if (direction === 'prev') {
      slide.style.transform = 'translateX(-40px)';
    }

    // Build status select HTML
    var statusOptions = ['', 'Already in place', 'In Progress', 'Not Started'];
    var statusClass = f.status ? 'status-select' : 'status-select status-empty';
    var statusHtml =
      '<span class="inline-select-wrapper">' +
        '<select class="inline-select ' + statusClass + '" data-field="status" data-index="' + index + '">';
    statusOptions.forEach(function(opt) {
      var label = opt || 'No status';
      var selected = opt === f.status ? ' selected' : '';
      statusHtml += '<option value="' + opt + '"' + selected + '>' + label + '</option>';
    });
    statusHtml += '</select></span>';

    // Build phase select HTML
    var phaseOptions = ['Short Term', 'Mid Term', 'Long Term'];
    var phaseClassMap = { 'Short Term': 'phase-short', 'Mid Term': 'phase-mid', 'Long Term': 'phase-long' };
    var currentPhaseClass = phaseClassMap[f.phase] || '';
    var phaseHtml = '';
    if (f.phase) {
      phaseHtml =
        '<span class="inline-select-wrapper">' +
          '<select class="inline-select phase-select ' + currentPhaseClass + '" data-field="phase" data-index="' + index + '">';
      phaseOptions.forEach(function(opt) {
        var selected = opt === f.phase ? ' selected' : '';
        phaseHtml += '<option value="' + opt + '"' + selected + '>' + opt + '</option>';
      });
      phaseHtml += '</select></span>';
    }

    // Build image HTML if mapped image exists
    var imageNum = String(index + 1).padStart(2, '0');
    var imagePath = 'assets/Reco' + imageNum + '.png';
    var imageHtml = '';
    if (findingsImageMap[index]) {
      imageHtml =
        '<div class="findings-image-container" role="button" tabindex="0" aria-label="View full screen" data-src="' + imagePath + '">' +
          '<img src="' + imagePath + '" alt="Recommendation ' + imageNum + ' illustration" loading="lazy" />' +
          '<div class="findings-image-overlay">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
            '<span>View full screen</span>' +
          '</div>' +
        '</div>';
    }

    // Update persistent tabs row above the slider
    if (window._findingsTabsRow) {
      window._findingsTabsRow.innerHTML =
        '<span class="findings-tab" data-for="risk">Risk</span>' +
        (f.phase ? '<span class="findings-tab" data-for="phase">Timeline</span>' : '') +
        '<span class="findings-tab" data-for="status">Status</span>';
    }

    // Build category badge HTML
    var categoryBadgeHtml = '';
    if (f.category) {
      var catClass = categoryColors[f.category] || '';
      var catIcon = categoryIcons[f.category] || '';
      categoryBadgeHtml = '<div class="category-badge ' + catClass + '">' + catIcon + '<span>' + f.category + '</span></div>';
    }

    // Build user-impact pill badge HTML
    var impactBadgeHtml = '';
    var impactLevel = f.userImpact || 'None';
    var impactClassMap = { 'None': 'impact-none', 'Low': 'impact-low', 'Medium': 'impact-medium', 'High': 'impact-high' };
    var impactClass = impactClassMap[impactLevel] || 'impact-none';
    var impactLevels = ['None', 'Low', 'Medium', 'High'];
    var impactIdx = impactLevels.indexOf(impactLevel);
    var impactColorMap = { 'None': '#6b7280', 'Low': '#16ABE0', 'Medium': '#9D833E', 'High': '#D93D7A' };
    var impactActiveColor = impactColorMap[impactLevel] || '#6b7280';
    // Build mini level dots
    var impactDots = '';
    for (var gi = 0; gi < impactLevels.length; gi++) {
      var dotFill = gi <= impactIdx ? impactActiveColor : 'rgba(255,255,255,0.15)';
      impactDots += '<span class="impact-dot" style="background:' + dotFill + ';"></span>';
    }
    impactBadgeHtml =
      '<div class="impact-badge ' + impactClass + '">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>' + impactLevel + '</span>' +
        '<span class="impact-dots">' + impactDots + '</span>' +
        '<div class="impact-tooltip"><strong style="color:' + impactActiveColor + ';">User Impact: ' + impactLevel + '</strong><br>' + (f.userImpactRationale || '') + '</div>' +
      '</div>';

    // Build effort badge HTML
    var effortLabel = {S:'Small',M:'Medium',L:'Large'}[f.effort] || f.effort || '';
    var effortColorMap = {S:'#00B0A3',M:'#9D833E',L:'#D93D7A'};
    var effortColor = effortColorMap[f.effort] || '#6b7280';
    var effortBadgeHtml = '';
    if (f.effort) {
      effortBadgeHtml =
        '<div class="effort-badge" style="border-color:' + effortColor + ';color:' + effortColor + ';">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          '<span>' + effortLabel + '</span>' +
        '</div>';
    }

    slide.innerHTML =
      '<div class="findings-header-row">' +
        '<div class="findings-risk-pill">' +
          '<span class="findings-risk-dot" style="background:' + f.riskColor + ';"></span>' +
          f.risk +
        '</div>' +
        phaseHtml +
        statusHtml +
      '</div>' +
      '<div class="badge-row">' + categoryBadgeHtml + impactBadgeHtml + effortBadgeHtml + '</div>' +
      '<h3 class="findings-title">' + f.title + '</h3>' +
      '<p class="findings-insight">' + f.insight + '</p>' +
      imageHtml;

    // Update the persistent slider ribbon for current finding
    sliderRibbon.setAttribute('data-index', index);
    sliderRibbon.className = 'owner-ribbon ' + (f.owner === 'ISD' ? 'owner-isd' : 'owner-ftc');
    sliderRibbon.querySelector('span').textContent = f.owner || 'FTC';

    // Update Post-it note for current finding
    postit.setAttribute('data-index', index);
    postit.classList.remove('is-open');
    var savedNote = f.notes || '';
    postitTextarea.value = savedNote;
    // Show dot indicator if note has content
    if (savedNote.trim()) {
      postit.classList.add('has-note');
    } else {
      postit.classList.remove('has-note');
    }

    // Attach lightbox click handler to image if present
    var imgContainer = slide.querySelector('.findings-image-container');
    if (imgContainer) {
      imgContainer.addEventListener('click', function() {
        openLightbox(this.getAttribute('data-src'));
      });
      imgContainer.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(this.getAttribute('data-src'));
        }
      });
    }

    container.appendChild(slide);

    // Attach inline select change handlers
    slide.querySelectorAll('.inline-select').forEach(function(sel) {
      sel.addEventListener('click', function(e) { e.stopPropagation(); });
      sel.addEventListener('change', function(e) {
        e.stopPropagation();
        var field = this.getAttribute('data-field');
        var idx = parseInt(this.getAttribute('data-index'), 10);
        var newVal = this.value;
        findings[idx][field] = newVal;
        saveFindingOverrides();

        // Update select styling
        if (field === 'phase') {
          this.className = 'inline-select phase-select ' + ({ 'Short Term': 'phase-short', 'Mid Term': 'phase-mid', 'Long Term': 'phase-long' }[newVal] || '');
          // Rebuild timeline on phase change so grouping updates
          timelineBuilt = false;
        }
        if (field === 'status') {
          this.className = 'inline-select ' + (newVal ? 'status-select' : 'status-select status-empty');
          // Also force timeline rebuild for status changes
          timelineBuilt = false;
        }
      });
    });

    // Trigger reflow then activate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slide.classList.add('is-active');
        // Align each tab above its corresponding pill
        alignTabsToPills(slide);
      });
    });

    // Update chrome
    const num = f.id || String(index + 1).padStart(2, '0');
    bigNumber.textContent = num;
    counter.textContent = num + ' / ' + String(findings.length).padStart(2, '0');
    progressFill.style.height = ((index + 1) / findings.length * 100) + '%';
    sourceEl.textContent = f.tool;
  }

  function goNext() {
    current = (current + 1) % findings.length;
    render(current, 'next');
  }

  function goPrev() {
    current = (current - 1 + findings.length) % findings.length;
    render(current, 'prev');
  }

  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // Owner ribbon toggle on slider
  sliderRibbon.addEventListener('click', function(e) {
    e.stopPropagation();
    var idx = parseInt(this.getAttribute('data-index'), 10);
    findings[idx].owner = findings[idx].owner === 'FTC' ? 'ISD' : 'FTC';
    var newOwner = findings[idx].owner;
    this.querySelector('span').textContent = newOwner;
    this.className = 'owner-ribbon ' + (newOwner === 'ISD' ? 'owner-isd' : 'owner-ftc');
    saveFindingOverrides();
    timelineBuilt = false;
  });

  // Keyboard support
  document.getElementById('findingsSlider').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // Initial render after image probes resolve
  Promise.all(imageProbePromises).then(function() {
    render(0, 'next');
  });

  /* ---- Timeline View ---- */
  var timelineContainer = document.getElementById('timelineContainer');
  var listView = document.getElementById('listView');
  var timelineView = document.getElementById('timelineView');
  var quadrantView = document.getElementById('quadrantView');
  var viewToggle = document.getElementById('viewToggle');
  var timelineBuilt = false;
  var quadrantBuilt = false;

  var timelineGroupBy = 'phase';

  function buildTimeline() {
    if (timelineBuilt) return;
    timelineBuilt = true;

    // Group definitions
    var phases = [
      { key: 'Short Term', nodeClass: 'node-short', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
      { key: 'Mid Term',   nodeClass: 'node-mid',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
      { key: 'Long Term',  nodeClass: 'node-long',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' }
    ];

    var categories = [
      { key: 'Identify',  nodeClass: 'node-identify' },
      { key: 'Switch',    nodeClass: 'node-switch' },
      { key: 'Configure', nodeClass: 'node-configure' },
      { key: 'Deploy',    nodeClass: 'node-deploy' }
    ];

    var groups = timelineGroupBy === 'category' ? categories : phases;
    var groupField = timelineGroupBy === 'category' ? 'category' : 'phase';

    var html = '<div class="timeline-progress-line" id="timelineProgressLine"></div>';

    groups.forEach(function(group) {
      var items = [];
      findings.forEach(function(f, i) {
        if (f[groupField] === group.key) items.push({ finding: f, index: i });
      });
      if (items.length === 0) return;

      html += '<div class="timeline-phase-group">';
      html += '<div class="timeline-phase-header">';
      html += '<div class="timeline-phase-node ' + group.nodeClass + '"></div>';
      html += '<span class="timeline-phase-label">' + group.key + '</span>';
      html += '<span class="timeline-phase-count">' + items.length + ' action' + (items.length > 1 ? 's' : '') + '</span>';
      html += '</div>';

      items.forEach(function(item) {
        var f = item.finding;
        var num = f.id || String(item.index + 1).padStart(2, '0');

        // Editable status select
        var statusOpts = ['', 'Already in place', 'In Progress', 'Not Started'];
        var stClass = f.status ? 'status-select' : 'status-select status-empty';
        var statusHtml =
          '<span class="inline-select-wrapper">' +
            '<select class="inline-select ' + stClass + '" data-field="status" data-index="' + item.index + '">';
        statusOpts.forEach(function(opt) {
          var label = opt || 'No status';
          var sel = opt === f.status ? ' selected' : '';
          statusHtml += '<option value="' + opt + '"' + sel + '>' + label + '</option>';
        });
        statusHtml += '</select></span>';

        // Editable phase select
        var phaseOpts = ['Short Term', 'Mid Term', 'Long Term'];
        var phClassMap = { 'Short Term': 'phase-short', 'Mid Term': 'phase-mid', 'Long Term': 'phase-long' };
        var phaseHtml =
          '<span class="inline-select-wrapper">' +
            '<select class="inline-select phase-select ' + (phClassMap[f.phase] || '') + '" data-field="phase" data-index="' + item.index + '">';
        phaseOpts.forEach(function(opt) {
          var sel = opt === f.phase ? ' selected' : '';
          phaseHtml += '<option value="' + opt + '"' + sel + '>' + opt + '</option>';
        });
        phaseHtml += '</select></span>';

        var riskHtml = '<div class="findings-risk-pill"><span class="findings-risk-dot" style="background:' + f.riskColor + ';"></span>' + f.risk + '</div>';

        var ownerCls = f.owner === 'ISD' ? 'owner-isd' : 'owner-ftc';
        var ownerRibbon = '<div class="owner-ribbon ' + ownerCls + '" data-index="' + item.index + '" title="Click to toggle owner"><span>' + (f.owner || 'FTC') + '</span></div>';

        html += '<div class="timeline-item">';
        html += '<div class="timeline-card">';
        html += ownerRibbon;
        html += '<div class="timeline-card-header">';
        html += '<span class="timeline-card-number">' + num + '</span>';
        html += riskHtml;
        html += phaseHtml;
        html += statusHtml;
        html += '</div>';
        // Category badge + impact badge row
        var badgeRowHtml = '';
        if (f.category) {
          var catClass = categoryColors[f.category] || '';
          var catIcon = categoryIcons[f.category] || '';
          badgeRowHtml += '<div class="category-badge ' + catClass + '">' + catIcon + '<span>' + f.category + '</span></div>';
        }
        // Impact pill
        var tlImpact = f.userImpact || 'None';
        var tlImpactClassMap = { 'None': 'impact-none', 'Low': 'impact-low', 'Medium': 'impact-medium', 'High': 'impact-high' };
        var tlImpactColorMap = { 'None': '#6b7280', 'Low': '#16ABE0', 'Medium': '#9D833E', 'High': '#D93D7A' };
        var tlImpactLevels = ['None', 'Low', 'Medium', 'High'];
        var tlIdx = tlImpactLevels.indexOf(tlImpact);
        var tlColor = tlImpactColorMap[tlImpact] || '#6b7280';
        var tlDots = '';
        for (var di = 0; di < 4; di++) {
          tlDots += '<span class="impact-dot" style="background:' + (di <= tlIdx ? tlColor : 'rgba(255,255,255,0.15)') + ';"></span>';
        }
        badgeRowHtml += '<div class="impact-badge ' + tlImpactClassMap[tlImpact] + '">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          '<span>' + tlImpact + '</span>' +
          '<span class="impact-dots">' + tlDots + '</span>' +
          '<div class="impact-tooltip"><strong style="color:' + tlColor + ';">User Impact: ' + tlImpact + '</strong><br>' + (f.userImpactRationale || '') + '</div>' +
          '</div>';
        // Effort badge
        var tlEffortLabel = {S:'Small',M:'Medium',L:'Large'}[f.effort] || f.effort;
        var tlEffortColorMap = {S:'#00B0A3',M:'#9D833E',L:'#D93D7A'};
        var tlEffortColor = tlEffortColorMap[f.effort] || '#6b7280';
        badgeRowHtml += '<div class="effort-badge" style="border-color:' + tlEffortColor + ';color:' + tlEffortColor + ';">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          '<span>' + tlEffortLabel + '</span>' +
          '</div>';
        html += '<div class="badge-row">' + badgeRowHtml + '</div>';
        html += '<div class="timeline-card-title">' + f.title + '</div>';
        html += '<div class="timeline-card-detail">' + f.insight + '</div>';
        html += '<div class="timeline-card-footer">';
        html += '<span class="timeline-card-tool">' + f.tool + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });

      html += '</div>';
    });

    timelineContainer.innerHTML = html;

    // Attach change handlers on timeline selects
    timelineContainer.querySelectorAll('.inline-select').forEach(function(sel) {
      sel.addEventListener('click', function(e) { e.stopPropagation(); });
      sel.addEventListener('change', function(e) {
        e.stopPropagation();
        var field = this.getAttribute('data-field');
        var idx = parseInt(this.getAttribute('data-index'), 10);
        var newVal = this.value;
        findings[idx][field] = newVal;
        saveFindingOverrides();

        if (field === 'phase') {
          this.className = 'inline-select phase-select ' + ({ 'Short Term': 'phase-short', 'Mid Term': 'phase-mid', 'Long Term': 'phase-long' }[newVal] || '');
          // Rebuild timeline to re-group by new phase
          timelineBuilt = false;
          buildTimeline();
          animateTimelineItems();
        }
        if (field === 'status') {
          this.className = 'inline-select ' + (newVal ? 'status-select' : 'status-select status-empty');
        }
      });
    });

    // Attach owner ribbon toggle handlers on timeline
    timelineContainer.querySelectorAll('.owner-ribbon').forEach(function(ribbon) {
      ribbon.addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-index'), 10);
        findings[idx].owner = findings[idx].owner === 'FTC' ? 'ISD' : 'FTC';
        var newOwner = findings[idx].owner;
        this.querySelector('span').textContent = newOwner;
        this.className = 'owner-ribbon ' + (newOwner === 'ISD' ? 'owner-isd' : 'owner-ftc');
        saveFindingOverrides();
      });
    });
  }

  function animateTimelineItems() {
    var items = timelineContainer.querySelectorAll('.timeline-item');
    items.forEach(function(item, i) {
      item.classList.remove('is-visible');
      setTimeout(function() {
        item.classList.add('is-visible');
      }, 60 * i);
    });

    // Grow the progress line
    var progressLine = document.getElementById('timelineProgressLine');
    if (progressLine) {
      progressLine.style.height = timelineContainer.scrollHeight + 'px';
      progressLine.classList.remove('is-grown');
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          progressLine.classList.add('is-grown');
        });
      });
    }
  }

  /* ---- Quadrant / Priority Matrix View ---- */
  var quadrantContainer = document.getElementById('quadrantContainer');

  function buildQuadrant() {
    if (quadrantBuilt) return;
    quadrantBuilt = true;

    // Layout constants
    var MARGIN = { top: 50, right: 30, bottom: 80, left: 100 };
    var svgWidth = 900;
    var svgHeight = 600;
    var plotW = svgWidth - MARGIN.left - MARGIN.right;
    var plotH = svgHeight - MARGIN.top - MARGIN.bottom;

    // Mapping axes — X: complexity, Y: risk severity
    var complexityMap = { 'Complex': 0, 'Average': 1, 'Easy': 2 };
    var riskMap = {
      'var(--severity-medium)': 0,   // Medium
      'var(--severity-high)': 1,     // High
      'var(--severity-critical)': 2  // Critical
    };
    var riskLabels = ['Medium', 'High', 'Critical'];
    var complexityLabels = ['Complex', 'Average', 'Easy'];
    var categoryHints = ['Deploy', 'Configure', 'Identify / Switch'];
    var priorityColors = { 1: '#D93D7A', 2: '#9D833E', 3: '#16ABE0' };
    var priorityLabels = { 1: 'Priority 1', 2: 'Priority 2', 3: 'Priority 3' };

    // Compute dot positions — group by cell, then spread within cell
    var cells = {};
    findings.forEach(function(f, i) {
      var cx = complexityMap[f.complexity];
      var ry = riskMap[f.riskColor];
      if (cx === undefined) cx = 1;
      if (ry === undefined) ry = 1;
      var key = ry + '-' + cx;
      if (!cells[key]) cells[key] = [];
      cells[key].push({ finding: f, index: i });
    });

    var cellW = plotW / 3;
    var cellH = plotH / 3;
    var effortRadius = { 'S': 10, 'M': 16, 'L': 22 };

    // Build SVG
    var svg = '<svg class="quadrant-svg" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" xmlns="http://www.w3.org/2000/svg">';

    // Defs for glow filter
    var diagLen = Math.sqrt(plotW * plotW + plotH * plotH);
    svg += '<defs>';
    svg += '<filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">';
    svg += '<feGaussianBlur stdDeviation="3" result="blur"/>';
    svg += '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
    svg += '</filter>';
    // Clip path to constrain zones within plot area
    svg += '<clipPath id="plotClip">';
    svg += '<rect x="' + MARGIN.left + '" y="' + MARGIN.top + '" width="' + plotW + '" height="' + plotH + '" />';
    svg += '</clipPath>';
    // Vertical line gradient: pink top → blue bottom
    svg += '<linearGradient id="gridV" x1="0" y1="' + MARGIN.top + '" x2="0" y2="' + (MARGIN.top + plotH) + '" gradientUnits="userSpaceOnUse">';
    svg += '<stop offset="0%" stop-color="#D93D7A" stop-opacity="0.25"/>';
    svg += '<stop offset="100%" stop-color="#16ABE0" stop-opacity="0.25"/>';
    svg += '</linearGradient>';
    // Horizontal line gradient: blue left → pink right
    svg += '<linearGradient id="gridH" x1="' + MARGIN.left + '" y1="0" x2="' + (MARGIN.left + plotW) + '" y2="0" gradientUnits="userSpaceOnUse">';
    svg += '<stop offset="0%" stop-color="#16ABE0" stop-opacity="0.25"/>';
    svg += '<stop offset="100%" stop-color="#D93D7A" stop-opacity="0.25"/>';
    svg += '</linearGradient>';
    svg += '</defs>';

    // ── Concentric radial zone bands ──
    // Origin: top-right corner of plot (Easy + High Risk)
    var zoneCx = MARGIN.left + plotW;
    var zoneCy = MARGIN.top;
    var maxR = diagLen * 1.05;
    // Bands drawn largest-first; smaller ones paint over, creating visible arcs
    var zoneBands = [
      { r: maxR,        opacity: 0.025 },
      { r: maxR * 0.70, opacity: 0.04  },
      { r: maxR * 0.50, opacity: 0.06  },
      { r: maxR * 0.34, opacity: 0.085 },
      { r: maxR * 0.20, opacity: 0.12  }
    ];
    svg += '<g clip-path="url(#plotClip)">';
    for (var zi = 0; zi < zoneBands.length; zi++) {
      svg += '<circle cx="' + zoneCx + '" cy="' + zoneCy + '" r="' + zoneBands[zi].r + '" fill="#16ABE0" opacity="' + zoneBands[zi].opacity + '" />';
    }
    svg += '</g>';

    // ── Gradient grid lines (cell boundaries + outer border) ──
    // Outer border
    svg += '<line x1="' + MARGIN.left + '" y1="' + MARGIN.top + '" x2="' + (MARGIN.left + plotW) + '" y2="' + MARGIN.top + '" stroke="url(#gridH)" stroke-width="1" />';
    svg += '<line x1="' + MARGIN.left + '" y1="' + (MARGIN.top + plotH) + '" x2="' + (MARGIN.left + plotW) + '" y2="' + (MARGIN.top + plotH) + '" stroke="url(#gridH)" stroke-width="1" />';
    svg += '<line x1="' + MARGIN.left + '" y1="' + MARGIN.top + '" x2="' + MARGIN.left + '" y2="' + (MARGIN.top + plotH) + '" stroke="url(#gridV)" stroke-width="1" />';
    svg += '<line x1="' + (MARGIN.left + plotW) + '" y1="' + MARGIN.top + '" x2="' + (MARGIN.left + plotW) + '" y2="' + (MARGIN.top + plotH) + '" stroke="url(#gridV)" stroke-width="1" />';
    // Inner cell boundary lines
    for (var gi = 1; gi < 3; gi++) {
      svg += '<line x1="' + (MARGIN.left + gi * cellW) + '" y1="' + MARGIN.top + '" x2="' + (MARGIN.left + gi * cellW) + '" y2="' + (MARGIN.top + plotH) + '" stroke="url(#gridV)" stroke-width="1" />';
      svg += '<line x1="' + MARGIN.left + '" y1="' + (MARGIN.top + gi * cellH) + '" x2="' + (MARGIN.left + plotW) + '" y2="' + (MARGIN.top + gi * cellH) + '" stroke="url(#gridH)" stroke-width="1" />';
    }
    // Mid-cell dashed lines (bisect each cell)
    for (var mi = 0; mi < 3; mi++) {
      var midX = MARGIN.left + mi * cellW + cellW / 2;
      var midY = MARGIN.top + mi * cellH + cellH / 2;
      svg += '<line x1="' + midX + '" y1="' + MARGIN.top + '" x2="' + midX + '" y2="' + (MARGIN.top + plotH) + '" stroke="url(#gridV)" stroke-width="0.6" stroke-dasharray="4 4" />';
      svg += '<line x1="' + MARGIN.left + '" y1="' + midY + '" x2="' + (MARGIN.left + plotW) + '" y2="' + midY + '" stroke="url(#gridH)" stroke-width="0.6" stroke-dasharray="4 4" />';
    }

    // Y-axis labels
    for (var ri = 0; ri < 3; ri++) {
      var ly = MARGIN.top + (2 - ri) * cellH + cellH / 2;
      svg += '<text x="' + (MARGIN.left - 14) + '" y="' + ly + '" text-anchor="end" dominant-baseline="middle" fill="rgba(255,255,255,0.5)" font-family="Montserrat,sans-serif" font-size="11" font-weight="600">' + riskLabels[ri] + '</text>';
    }

    // X-axis labels with category hints
    for (var ci = 0; ci < 3; ci++) {
      var lx = MARGIN.left + ci * cellW + cellW / 2;
      svg += '<text x="' + lx + '" y="' + (MARGIN.top + plotH + 24) + '" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Montserrat,sans-serif" font-size="11" font-weight="600">' + complexityLabels[ci] + '</text>';
      svg += '<text x="' + lx + '" y="' + (MARGIN.top + plotH + 40) + '" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="Montserrat,sans-serif" font-size="9" font-style="italic">' + categoryHints[ci] + '</text>';
    }

    // Axis titles
    svg += '<text x="' + (MARGIN.left + plotW / 2) + '" y="' + (svgHeight - 10) + '" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" letter-spacing="0.1em">COMPLEXITY</text>';
    svg += '<text x="16" y="' + (MARGIN.top + plotH / 2) + '" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="Montserrat,sans-serif" font-size="10" font-weight="600" letter-spacing="0.1em" transform="rotate(-90,16,' + (MARGIN.top + plotH / 2) + ')">RISK</text>';

    // Place dots
    findings.forEach(function(f, i) {
      var cx = complexityMap[f.complexity] !== undefined ? complexityMap[f.complexity] : 1;
      var ry = riskMap[f.riskColor] !== undefined ? riskMap[f.riskColor] : 1;
      var key = ry + '-' + cx;
      var cellItems = cells[key] || [];
      var posInCell = 0;
      for (var ci2 = 0; ci2 < cellItems.length; ci2++) {
        if (cellItems[ci2].index === i) { posInCell = ci2; break; }
      }
      var count = cellItems.length;

      // Spread dots in a grid pattern within the cell
      var cols = Math.ceil(Math.sqrt(count));
      var rows2 = Math.ceil(count / cols);
      var dotCol = posInCell % cols;
      var dotRow = Math.floor(posInCell / cols);
      var spacingX = cellW / (cols + 1);
      var spacingY = cellH / (rows2 + 1);

      var dx = MARGIN.left + cx * cellW + spacingX * (dotCol + 1);
      var dy = MARGIN.top + (2 - ry) * cellH + spacingY * (dotRow + 1);
      var color = priorityColors[f.priority] || '#9D833E';
      var num = f.id || String(i + 1).padStart(2, '0');
      var dotRadius = effortRadius[f.effort] || effortRadius['M'];

      svg += '<g class="quadrant-dot" data-index="' + i + '" style="cursor:pointer;">';
      svg += '<circle cx="' + dx + '" cy="' + dy + '" r="' + dotRadius + '" fill="' + color + '" opacity="0.85" filter="url(#dotGlow)" />';
      var dotFontSize = dotRadius <= 10 ? 6.5 : (num.length > 2 ? 7.5 : 9);
      svg += '<text x="' + dx + '" y="' + (dy + 1) + '" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Montserrat,sans-serif" font-size="' + dotFontSize + '" font-weight="700">' + num + '</text>';
      svg += '</g>';
    });

    svg += '</svg>';

    // Legend
    var legend = '<div class="quadrant-legend">';
    legend += '<span class="quadrant-legend-label">Priority:</span>';
    [1, 2, 3].forEach(function(p) {
      legend += '<span class="quadrant-legend-item"><span class="quadrant-legend-dot" style="background:' + priorityColors[p] + ';"></span>' + priorityLabels[p] + '</span>';
    });
    legend += '<span class="quadrant-legend-sep">|</span>';
    legend += '<span class="quadrant-legend-label" style="font-style:italic;opacity:0.5;">Bubble size = implementation effort</span>';
    legend += '</div>';

    // Tooltip container
    var tooltip = '<div class="quadrant-tooltip" id="quadrantTooltip"></div>';

    quadrantContainer.innerHTML = svg + legend + tooltip;

    // Hover and click handlers
    var tooltipEl = document.getElementById('quadrantTooltip');
    quadrantContainer.querySelectorAll('.quadrant-dot').forEach(function(dot) {
      dot.addEventListener('mouseenter', function(e) {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        var f = findings[idx];
        var num = f.id || String(idx + 1).padStart(2, '0');
        tooltipEl.innerHTML = '<div class="quadrant-tooltip-num">' + num + '</div>' +
          '<div class="quadrant-tooltip-title">' + f.title + '</div>' +
          '<div class="quadrant-tooltip-meta">' +
          '<span class="quadrant-tooltip-risk" style="color:' + (priorityColors[f.priority] || '#fff') + ';">' + f.risk + '</span>' +
          '<span class="quadrant-tooltip-sep">&middot;</span>' +
          '<span>' + f.complexity + '</span>' +
          '<span class="quadrant-tooltip-sep">&middot;</span>' +
          '<span>' + (f.category || '') + '</span>' +
          '<span class="quadrant-tooltip-sep">&middot;</span>' +
          '<span>Effort: ' + ({S:'Small',M:'Medium',L:'Large'}[f.effort] || f.effort) + '</span>' +
          '</div>';
        tooltipEl.classList.add('is-visible');

        // Position near cursor
        var rect = quadrantContainer.getBoundingClientRect();
        var ex = e.clientX - rect.left + 16;
        var ey = e.clientY - rect.top - 10;
        // Keep tooltip within container
        if (ex + 280 > rect.width) ex = ex - 296;
        if (ey + 100 > rect.height) ey = ey - 100;
        tooltipEl.style.left = ex + 'px';
        tooltipEl.style.top = ey + 'px';
      });
      dot.addEventListener('mousemove', function(e) {
        var rect = quadrantContainer.getBoundingClientRect();
        var ex = e.clientX - rect.left + 16;
        var ey = e.clientY - rect.top - 10;
        if (ex + 280 > rect.width) ex = ex - 296;
        if (ey + 100 > rect.height) ey = ey - 100;
        tooltipEl.style.left = ex + 'px';
        tooltipEl.style.top = ey + 'px';
      });
      dot.addEventListener('mouseleave', function() {
        tooltipEl.classList.remove('is-visible');
      });
      dot.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        // Switch to list view and navigate to this finding
        viewToggle.querySelectorAll('.view-toggle-btn').forEach(function(b) { b.classList.remove('is-active'); });
        viewToggle.querySelector('[data-view="list"]').classList.add('is-active');
        quadrantView.classList.remove('is-active-view');
        listView.classList.add('is-active-view');
        current = idx;
        render(current);
      });
    });
  }

  function animateQuadrantDots() {
    var dots = quadrantContainer.querySelectorAll('.quadrant-dot');
    dots.forEach(function(dot, i) {
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0)';
      setTimeout(function() {
        dot.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        dot.style.opacity = '1';
        dot.style.transform = 'scale(1)';
      }, 30 * i);
    });
  }

  // Group-by toggle handler (one-time setup)
  var groupToggle = document.getElementById('timelineGroupToggle');
  if (groupToggle) {
    groupToggle.querySelectorAll('.timeline-group-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = this.getAttribute('data-group');
        if (mode === timelineGroupBy) return;
        timelineGroupBy = mode;
        groupToggle.querySelectorAll('.timeline-group-btn').forEach(function(b) { b.classList.remove('is-active'); });
        this.classList.add('is-active');
        timelineBuilt = false;
        buildTimeline();
        animateTimelineItems();
      });
    });
  }

  // View toggle handler
  var allViews = { list: listView, timeline: timelineView, quadrant: quadrantView };
  if (viewToggle) {
    viewToggle.addEventListener('click', function(e) {
      var btn = e.target.closest('.view-toggle-btn');
      if (!btn || btn.classList.contains('is-active')) return;

      var view = btn.getAttribute('data-view');

      // Update toggle buttons
      viewToggle.querySelectorAll('.view-toggle-btn').forEach(function(b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');

      // Find current active view
      var currentViewEl = null;
      Object.keys(allViews).forEach(function(key) {
        if (allViews[key] && allViews[key].classList.contains('is-active-view')) {
          currentViewEl = allViews[key];
        }
      });
      var nextViewEl = allViews[view];

      // Build on first switch
      if (view === 'timeline') buildTimeline();
      if (view === 'quadrant') buildQuadrant();

      // Animate out
      if (currentViewEl) {
        currentViewEl.classList.remove('is-active-view');
        currentViewEl.classList.add('is-exiting-view');
      }

      setTimeout(function() {
        if (currentViewEl) currentViewEl.classList.remove('is-exiting-view');
        // Animate in
        if (nextViewEl) nextViewEl.classList.add('is-active-view');

        if (view === 'timeline') {
          animateTimelineItems();
        }
        if (view === 'quadrant') {
          animateQuadrantDots();
        }
      }, 300);
    });
  }

  // ─── Export Button ───
  var exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      var json = JSON.stringify(findings, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'findings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ─── Export CSV Button ───
  var exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function() {
      var headers = ['id','category','complexity','effort','priority','userImpact','userImpactRationale','risk','title','insight','tool','status','phase','owner','notes'];
      var rows = [headers.join(',')];
      findings.forEach(function(f) {
        var row = headers.map(function(h) {
          var val = (f[h] || '').toString();
          // Strip HTML tags from insight
          if (h === 'insight') val = val.replace(/<[^>]*>/g, '');
          // Replace newlines with spaces to prevent row breaks
          val = val.replace(/[\r\n]+/g, ' ').trim();
          // Escape double quotes and wrap in quotes
          return '"' + val.replace(/"/g, '""') + '"';
        });
        rows.push(row.join(','));
      });
      var csv = '\uFEFF' + 'sep=,\r\n' + rows.join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      var d = new Date();
      var stamp = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
      a.download = 'DataSecurity_Recommendations_' + stamp + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ─── Reset Button ───
  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm('Reset all changes? This will revert phase, status, owner, and notes to the original values.')) {
        localStorage.removeItem('findings-overrides');
        location.reload();
      }
    });
  }

  } // end initFindingsUI
}

/* -------------------------------------------------------
   KPI FLIP CARDS — click to flip
------------------------------------------------------- */

function initKpiCards() {
  document.querySelectorAll('.kpi-flip-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't flip if clicking the chart toggle button
      if (e.target.closest('.kpi-chart-toggle')) return;
      card.classList.toggle('is-flipped');
    });
  });

  // Initialize chart toggle buttons (open modal)
  document.querySelectorAll('.kpi-chart-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-chart-target');
      const modal = document.getElementById(targetId);
      if (!modal) return;

      // Open modal
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';

      // Initialize chart on first open
      if (!modal.dataset.initialized) {
        modal.dataset.initialized = 'true';
        if (targetId === 'kpi5-chart-panel') {
          initKpi5DonutChart();
        }
        if (targetId === 'kpi2-chart-panel') {
          initKpi2AreaChart();
        }
        if (targetId === 'kpi6-chart-panel') {
          initKpi6DonutChart();
        }
        if (targetId === 'kpi7-chart-panel') {
          initKpi7DonutChart();
        }
      }
    });
  });

  // Close modal handlers
  document.querySelectorAll('.kpi-chart-modal').forEach(modal => {
    const backdrop = modal.querySelector('.kpi-chart-modal-backdrop');
    const closeBtn = modal.querySelector('.kpi-chart-modal-close');

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      modal.addEventListener('transitionend', function handler(e) {
        if (e.target === modal.querySelector('.kpi-chart-modal-content')) {
          if (!modal.classList.contains('is-open')) {
            modal.style.display = 'none';
          }
          modal.removeEventListener('transitionend', handler);
        }
      });
      // Deactivate toggle button
      const toggle = document.querySelector(`[data-chart-target="${modal.id}"]`);
      if (toggle) toggle.classList.remove('is-active');
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  });
}

/* -------------------------------------------------------
   KPI 5 — INTERACTIVE DONUT CHART (Privacy Distribution)
------------------------------------------------------- */

function initKpi5DonutChart() {
  const data = [
    { label: 'Private',  value: 125532, color: '#00B0A3' },
    { label: 'None',     value: 44206,  color: '#9D833E' },
    { label: 'Public',   value: 2237,   color: '#D93D7A' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  const svg = document.getElementById('kpi5-donut');
  const centerLabel = document.getElementById('kpi5-donut-center');
  const legendContainer = document.getElementById('kpi5-legend');
  if (!svg || !centerLabel || !legendContainer) return;

  const cx = 100, cy = 100, outerR = 82, innerR = 55;
  const gap = 0.02; // radians gap between segments

  // Calculate angles
  let currentAngle = -Math.PI / 2;
  const segments = data.map(d => {
    const pct = d.value / total;
    const sweep = pct * (2 * Math.PI) - gap;
    const start = currentAngle + gap / 2;
    const end = start + sweep;
    currentAngle = start + sweep + gap / 2;
    return { ...d, pct, startAngle: start, endAngle: end };
  });

  // Helper: arc path
  function arcPath(cxp, cyp, oR, iR, startA, endA) {
    const x1 = cxp + oR * Math.cos(startA);
    const y1 = cyp + oR * Math.sin(startA);
    const x2 = cxp + oR * Math.cos(endA);
    const y2 = cyp + oR * Math.sin(endA);
    const x3 = cxp + iR * Math.cos(endA);
    const y3 = cyp + iR * Math.sin(endA);
    const x4 = cxp + iR * Math.cos(startA);
    const y4 = cyp + iR * Math.sin(startA);
    const large = (endA - startA) > Math.PI ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${oR} ${oR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${iR} ${iR} 0 ${large} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  }

  // Create SVG segments
  const paths = [];
  segments.forEach((seg, i) => {
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    const midAngle = (seg.startAngle + seg.endAngle) / 2;

    path.setAttribute('d', arcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle));
    path.setAttribute('fill', seg.color);
    path.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease';
    path.style.transformOrigin = `${cx}px ${cy}px`;
    path.style.cursor = 'pointer';
    path.dataset.index = i;

    // Explode direction
    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    path.addEventListener('mouseenter', () => {
      highlightSegment(i, explodeX, explodeY);
    });
    path.addEventListener('mouseleave', () => {
      resetSegments();
    });

    svg.appendChild(path);
    paths.push({ el: path, seg, explodeX, explodeY });
  });

  // Build legend
  segments.forEach((seg, i) => {
    const row = document.createElement('div');
    row.className = 'kpi-legend-row';
    row.dataset.index = i;

    const midAngle = (seg.startAngle + seg.endAngle) / 2;
    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    row.innerHTML = `
      <span class="kpi-legend-dot" style="background:${seg.color}"></span>
      <div class="kpi-legend-info">
        <div class="kpi-legend-label">${seg.label}</div>
        <div class="kpi-legend-meta">${seg.label === 'None' ? 'Missing privacy value' : seg.label + ' containers'}</div>
      </div>
      <span class="kpi-legend-value">${seg.value.toLocaleString()}</span>
      <span class="kpi-legend-pct">${Math.round(seg.pct * 100)}%</span>
    `;

    row.addEventListener('mouseenter', () => {
      highlightSegment(i, explodeX, explodeY);
    });
    row.addEventListener('mouseleave', () => {
      resetSegments();
    });

    legendContainer.appendChild(row);
  });

  // Animate segments in
  paths.forEach((p, i) => {
    p.el.style.opacity = '0';
    p.el.style.transform = 'scale(0.8)';
    setTimeout(() => {
      p.el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease, opacity 0.4s ease';
      p.el.style.opacity = '1';
      p.el.style.transform = 'scale(1)';
    }, 100 + i * 120);
  });

  function highlightSegment(idx, ex, ey) {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach((p, i) => {
      if (i === idx) {
        p.el.style.transform = `translate(${ex}px, ${ey}px)`;
        p.el.style.filter = `drop-shadow(0 0 10px ${p.seg.color}80) brightness(1.15)`;
      } else {
        p.el.style.transform = 'scale(1)';
        p.el.style.filter = 'opacity(0.35)';
      }
    });

    // Highlight legend row
    legendContainer.querySelectorAll('.kpi-legend-row').forEach((row, i) => {
      row.classList.toggle('is-hovered', i === idx);
    });

    // Update center label
    const seg = segments[idx];
    centerValue.textContent = seg.value.toLocaleString();
    centerDesc.textContent = seg.label + ' · ' + Math.round(seg.pct * 100) + '%';
  }

  function resetSegments() {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach(p => {
      p.el.style.transform = 'scale(1)';
      p.el.style.filter = 'none';
    });

    legendContainer.querySelectorAll('.kpi-legend-row').forEach(row => {
      row.classList.remove('is-hovered');
    });

    centerValue.textContent = total.toLocaleString();
    centerDesc.textContent = 'Total';
  }
}

/* -------------------------------------------------------
   KPI 7 — INTERACTIVE DONUT CHART (Broken Permissions)
------------------------------------------------------- */

function initKpi7DonutChart() {
  const data = [
    { label: '0',              sites: 114431, avgFiles: 39,        color: '#00B0A3' },
    { label: '1 to 9',         sites: 42096,  avgFiles: 284,       color: '#16ABE0' },
    { label: '10 to 99',       sites: 13090,  avgFiles: 1643,      color: '#9D833E' },
    { label: '100 to 999',     sites: 2163,   avgFiles: 9108,      color: '#E07816' },
    { label: '1,000 to 9,999', sites: 181,    avgFiles: 62155,     color: '#D93D7A' },
    { label: '\u2265 10,000',  sites: 14,     avgFiles: 719404,    color: '#8B5CF6' },
  ];
  const total = data.reduce((s, d) => s + d.sites, 0);

  const svg = document.getElementById('kpi7-donut');
  const centerLabel = document.getElementById('kpi7-donut-center');
  const legendContainer = document.getElementById('kpi7-legend');
  if (!svg || !centerLabel || !legendContainer) return;

  const cx = 100, cy = 100, outerR = 82, innerR = 55;
  const gap = 0.02;

  let currentAngle = -Math.PI / 2;
  const segments = data.map(d => {
    const pct = d.sites / total;
    const sweep = pct * (2 * Math.PI) - gap;
    const start = currentAngle + gap / 2;
    const end = start + sweep;
    currentAngle = start + sweep + gap / 2;
    return { ...d, pct, startAngle: start, endAngle: end };
  });

  function arcPath(cxp, cyp, oR, iR, startA, endA) {
    const x1 = cxp + oR * Math.cos(startA);
    const y1 = cyp + oR * Math.sin(startA);
    const x2 = cxp + oR * Math.cos(endA);
    const y2 = cyp + oR * Math.sin(endA);
    const x3 = cxp + iR * Math.cos(endA);
    const y3 = cyp + iR * Math.sin(endA);
    const x4 = cxp + iR * Math.cos(startA);
    const y4 = cyp + iR * Math.sin(startA);
    const large = (endA - startA) > Math.PI ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${oR} ${oR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${iR} ${iR} 0 ${large} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  }

  const paths = [];
  segments.forEach((seg, i) => {
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    const midAngle = (seg.startAngle + seg.endAngle) / 2;

    path.setAttribute('d', arcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle));
    path.setAttribute('fill', seg.color);
    path.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease';
    path.style.transformOrigin = `${cx}px ${cy}px`;
    path.style.cursor = 'pointer';
    path.dataset.index = i;

    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    path.addEventListener('mouseenter', () => highlightSegment(i, explodeX, explodeY));
    path.addEventListener('mouseleave', () => resetSegments());

    svg.appendChild(path);
    paths.push({ el: path, seg, explodeX, explodeY });
  });

  // Build table legend
  const tbody = legendContainer.querySelector('tbody');
  segments.forEach((seg, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = i;

    const midAngle = (seg.startAngle + seg.endAngle) / 2;
    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    tr.innerHTML = `
      <td><span class="kpi7-legend-dot" style="background:${seg.color}"></span></td>
      <td>${seg.label}</td>
      <td>${seg.sites.toLocaleString()}</td>
      <td>${seg.avgFiles.toLocaleString()}</td>
    `;

    tr.addEventListener('mouseenter', () => highlightSegment(i, explodeX, explodeY));
    tr.addEventListener('mouseleave', () => resetSegments());

    tbody.appendChild(tr);
  });

  // Animate segments in
  paths.forEach((p, i) => {
    p.el.style.opacity = '0';
    p.el.style.transform = 'scale(0.8)';
    setTimeout(() => {
      p.el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease, opacity 0.4s ease';
      p.el.style.opacity = '1';
      p.el.style.transform = 'scale(1)';
    }, 100 + i * 120);
  });

  function highlightSegment(idx, ex, ey) {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach((p, i) => {
      if (i === idx) {
        p.el.style.transform = `translate(${ex}px, ${ey}px)`;
        p.el.style.filter = `drop-shadow(0 0 10px ${p.seg.color}80) brightness(1.15)`;
      } else {
        p.el.style.transform = 'scale(1)';
        p.el.style.filter = 'opacity(0.35)';
      }
    });

    tbody.querySelectorAll('tr').forEach((row, i) => {
      if (i === idx) {
        row.classList.add('is-hovered');
        row.classList.remove('is-dimmed');
      } else {
        row.classList.remove('is-hovered');
        row.classList.add('is-dimmed');
      }
    });

    const seg = segments[idx];
    centerValue.textContent = seg.sites.toLocaleString();
    centerDesc.textContent = seg.label + ' broken';
  }

  function resetSegments() {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach(p => {
      p.el.style.transform = 'scale(1)';
      p.el.style.filter = 'none';
    });

    tbody.querySelectorAll('tr').forEach(row => {
      row.classList.remove('is-hovered', 'is-dimmed');
    });

    centerValue.textContent = total.toLocaleString();
    centerDesc.textContent = 'Total Sites';
  }
}

/* -------------------------------------------------------
   KPI 6 — INTERACTIVE DONUT CHART (Guest Users Permissions)
------------------------------------------------------- */

function initKpi6DonutChart() {
  const data = [
    { label: '0',       sites: 162521, pctEstate: '94.5%', color: '#00B0A3' },
    { label: '1 to 9',  sites: 6470,   pctEstate: '3.8%',  color: '#16ABE0' },
    { label: '10 to 99', sites: 2237,  pctEstate: '1.3%',  color: '#9D833E' },
    { label: '> 100',   sites: 747,    pctEstate: '0.4%',  color: '#D93D7A' },
  ];
  const total = data.reduce((s, d) => s + d.sites, 0);

  const svg = document.getElementById('kpi6-donut');
  const centerLabel = document.getElementById('kpi6-donut-center');
  const legendContainer = document.getElementById('kpi6-legend');
  if (!svg || !centerLabel || !legendContainer) return;

  const cx = 100, cy = 100, outerR = 82, innerR = 55;
  const gap = 0.02;

  let currentAngle = -Math.PI / 2;
  const segments = data.map(d => {
    const pct = d.sites / total;
    const sweep = pct * (2 * Math.PI) - gap;
    const start = currentAngle + gap / 2;
    const end = start + sweep;
    currentAngle = start + sweep + gap / 2;
    return { ...d, pct, startAngle: start, endAngle: end };
  });

  function arcPath(cxp, cyp, oR, iR, startA, endA) {
    const x1 = cxp + oR * Math.cos(startA);
    const y1 = cyp + oR * Math.sin(startA);
    const x2 = cxp + oR * Math.cos(endA);
    const y2 = cyp + oR * Math.sin(endA);
    const x3 = cxp + iR * Math.cos(endA);
    const y3 = cyp + iR * Math.sin(endA);
    const x4 = cxp + iR * Math.cos(startA);
    const y4 = cyp + iR * Math.sin(startA);
    const large = (endA - startA) > Math.PI ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${oR} ${oR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${iR} ${iR} 0 ${large} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  }

  const paths = [];
  segments.forEach((seg, i) => {
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    const midAngle = (seg.startAngle + seg.endAngle) / 2;

    path.setAttribute('d', arcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle));
    path.setAttribute('fill', seg.color);
    path.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease';
    path.style.transformOrigin = `${cx}px ${cy}px`;
    path.style.cursor = 'pointer';
    path.dataset.index = i;

    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    path.addEventListener('mouseenter', () => highlightSegment(i, explodeX, explodeY));
    path.addEventListener('mouseleave', () => resetSegments());

    svg.appendChild(path);
    paths.push({ el: path, seg, explodeX, explodeY });
  });

  // Build table legend
  const tbody = legendContainer.querySelector('tbody');
  segments.forEach((seg, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = i;

    const midAngle = (seg.startAngle + seg.endAngle) / 2;
    const explodeX = Math.cos(midAngle) * 8;
    const explodeY = Math.sin(midAngle) * 8;

    tr.innerHTML = `
      <td><span class="kpi7-legend-dot" style="background:${seg.color}"></span></td>
      <td>${seg.label}</td>
      <td>${seg.sites.toLocaleString()}</td>
      <td>${seg.pctEstate}</td>
    `;

    tr.addEventListener('mouseenter', () => highlightSegment(i, explodeX, explodeY));
    tr.addEventListener('mouseleave', () => resetSegments());

    tbody.appendChild(tr);
  });

  // Animate segments in
  paths.forEach((p, i) => {
    p.el.style.opacity = '0';
    p.el.style.transform = 'scale(0.8)';
    setTimeout(() => {
      p.el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease, opacity 0.4s ease';
      p.el.style.opacity = '1';
      p.el.style.transform = 'scale(1)';
    }, 100 + i * 120);
  });

  function highlightSegment(idx, ex, ey) {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach((p, i) => {
      if (i === idx) {
        p.el.style.transform = `translate(${ex}px, ${ey}px)`;
        p.el.style.filter = `drop-shadow(0 0 10px ${p.seg.color}80) brightness(1.15)`;
      } else {
        p.el.style.transform = 'scale(1)';
        p.el.style.filter = 'opacity(0.35)';
      }
    });

    tbody.querySelectorAll('tr').forEach((row, i) => {
      if (i === idx) {
        row.classList.add('is-hovered');
        row.classList.remove('is-dimmed');
      } else {
        row.classList.remove('is-hovered');
        row.classList.add('is-dimmed');
      }
    });

    const seg = segments[idx];
    centerValue.textContent = seg.sites.toLocaleString();
    centerDesc.textContent = seg.label + ' guests';
  }

  function resetSegments() {
    const centerValue = centerLabel.querySelector('.kpi-donut-center-value');
    const centerDesc = centerLabel.querySelector('.kpi-donut-center-desc');

    paths.forEach(p => {
      p.el.style.transform = 'scale(1)';
      p.el.style.filter = 'none';
    });

    tbody.querySelectorAll('tr').forEach(row => {
      row.classList.remove('is-hovered', 'is-dimmed');
    });

    centerValue.textContent = total.toLocaleString();
    centerDesc.textContent = 'Total Sites';
  }
}

/* -------------------------------------------------------
   KPI 2 — FILLED LINE / AREA CHART (Sensitive Files by User Threshold)
------------------------------------------------------- */

function initKpi2AreaChart() {
  const data = [
    { threshold: 10,    files: 823832 },
    { threshold: 100,   files: 403777 },
    { threshold: 1000,  files: 120233 },
    { threshold: 10000, files: 0 },
  ];

  const container = document.getElementById('kpi2-area-chart');
  if (!container || container.querySelector('svg')) return;

  const width = 620, height = 340;
  const pad = { top: 40, right: 40, bottom: 55, left: 75 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'kpi2-area-svg');
  svg.style.width = '100%';
  svg.style.height = 'auto';

  // Gradient fill
  const defs = document.createElementNS(ns, 'defs');
  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', 'kpi2-area-fill');
  grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
  grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
  const stop1 = document.createElementNS(ns, 'stop');
  stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#16ABE0'); stop1.setAttribute('stop-opacity', '0.5');
  const stop2 = document.createElementNS(ns, 'stop');
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#16ABE0'); stop2.setAttribute('stop-opacity', '0.05');
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Scales (log X, linear Y)
  const xMin = Math.log10(data[0].threshold);
  const xMax = Math.log10(data[data.length - 1].threshold);
  const yMax = data[0].files;

  function xScale(val) {
    return pad.left + ((Math.log10(val) - xMin) / (xMax - xMin)) * plotW;
  }
  function yScale(val) {
    return pad.top + plotH - (val / yMax) * plotH;
  }

  // Horizontal grid lines
  const yTicks = [0, 200000, 400000, 600000, 800000];
  yTicks.forEach(t => {
    const y = yScale(t);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', pad.left); line.setAttribute('x2', width - pad.right);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.06)'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', pad.left - 10); label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', 'rgba(255,255,255,0.4)'); label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'Montserrat, sans-serif');
    label.textContent = t === 0 ? '0' : t.toLocaleString();
    svg.appendChild(label);
  });

  // X axis labels
  data.forEach(d => {
    const x = xScale(d.threshold);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x); label.setAttribute('y', height - pad.bottom + 28);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'rgba(255,255,255,0.4)'); label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'Montserrat, sans-serif');
    label.textContent = d.threshold.toLocaleString();
    svg.appendChild(label);
  });

  // Axis titles
  const xTitle = document.createElementNS(ns, 'text');
  xTitle.setAttribute('x', pad.left + plotW / 2); xTitle.setAttribute('y', height - 5);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('fill', 'rgba(255,255,255,0.5)'); xTitle.setAttribute('font-size', '12');
  xTitle.setAttribute('font-family', 'Montserrat, sans-serif');
  xTitle.textContent = 'Number of unique users';
  svg.appendChild(xTitle);

  const yTitle = document.createElementNS(ns, 'text');
  yTitle.setAttribute('x', 16); yTitle.setAttribute('y', pad.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('transform', `rotate(-90, 16, ${pad.top + plotH / 2})`);
  yTitle.setAttribute('fill', 'rgba(255,255,255,0.5)'); yTitle.setAttribute('font-size', '12');
  yTitle.setAttribute('font-family', 'Montserrat, sans-serif');
  yTitle.textContent = 'Number of sensitive files';
  svg.appendChild(yTitle);

  // Build path points
  const points = data.map(d => ({ x: xScale(d.threshold), y: yScale(d.files) }));

  // Area fill
  const areaPath = document.createElementNS(ns, 'path');
  let areaD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) areaD += ` L ${points[i].x} ${points[i].y}`;
  areaD += ` L ${points[points.length - 1].x} ${yScale(0)} L ${points[0].x} ${yScale(0)} Z`;
  areaPath.setAttribute('d', areaD);
  areaPath.setAttribute('fill', 'url(#kpi2-area-fill)');
  areaPath.style.opacity = '0';
  areaPath.style.transition = 'opacity 0.6s ease';
  svg.appendChild(areaPath);

  // Line
  const linePath = document.createElementNS(ns, 'path');
  let lineD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) lineD += ` L ${points[i].x} ${points[i].y}`;
  linePath.setAttribute('d', lineD);
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke', '#16ABE0');
  linePath.setAttribute('stroke-width', '2.5');
  linePath.setAttribute('stroke-linecap', 'round');
  linePath.setAttribute('stroke-linejoin', 'round');
  linePath.style.strokeDasharray = '600';
  linePath.style.strokeDashoffset = '600';
  linePath.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)';
  svg.appendChild(linePath);

  // Data points + labels
  data.forEach((d, i) => {
    const cx = points[i].x, cy = points[i].y;

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#16ABE0'); dot.setAttribute('stroke', '#212129'); dot.setAttribute('stroke-width', '2');
    dot.style.transition = 'r 0.2s ease, filter 0.2s ease';
    dot.style.cursor = 'pointer';

    const valLabel = document.createElementNS(ns, 'text');
    valLabel.setAttribute('x', cx + 8);
    valLabel.setAttribute('y', cy - 12);
    valLabel.setAttribute('text-anchor', 'start');
    valLabel.setAttribute('fill', '#fff'); valLabel.setAttribute('font-size', '12');
    valLabel.setAttribute('font-weight', '600');
    valLabel.setAttribute('font-family', 'Montserrat, sans-serif');
    valLabel.textContent = d.files.toLocaleString();
    valLabel.style.opacity = '0';
    valLabel.style.transition = 'opacity 0.4s ease';

    svg.appendChild(dot);
    svg.appendChild(valLabel);

    dot.addEventListener('mouseenter', () => {
      dot.setAttribute('r', '8');
      dot.style.filter = 'drop-shadow(0 0 8px #16ABE080)';
      valLabel.style.opacity = '1';
    });
    dot.addEventListener('mouseleave', () => {
      dot.setAttribute('r', '5');
      dot.style.filter = 'none';
      valLabel.style.opacity = '0.85';
    });
  });

  container.appendChild(svg);

  // Animate in
  requestAnimationFrame(() => {
    areaPath.style.opacity = '1';
    linePath.style.strokeDashoffset = '0';
    svg.querySelectorAll('text').forEach(t => {
      if (t.style.opacity === '0') {
        setTimeout(() => { t.style.opacity = '0.85'; }, 600);
      }
    });
  });
}
