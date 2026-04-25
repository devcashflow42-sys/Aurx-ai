'use strict';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const CATEGORIES = {
  code:  { label: 'Programación', color: '#10b981', rgb: '16,185,129',  badge: 'cat-code'  },
  web:   { label: 'Diseño Web',   color: '#8b5cf6', rgb: '139,92,246',  badge: 'cat-web'   },
  image: { label: 'Imágenes',     color: '#ec4899', rgb: '236,72,153',  badge: 'cat-image' },
  text:  { label: 'Texto',        color: '#f59e0b', rgb: '245,158,11',  badge: 'cat-text'  },
};

const LANG_COLORS = {
  'Node.js':    '#5fa04e',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python':     '#3572a5',
  'Rust':       '#dea584',
  'Go':         '#00add8',
};

const STATUS_LABELS = {
  running:     'En ejecución',
  completed:   'Completado',
  error:       'Error',
  deployed:    'Desplegado',
  staging:     'Staging',
  development: 'Desarrollo',
  generated:   'Generado',
  processing:  'Procesando',
  draft:       'Borrador',
  published:   'Publicado',
  review:      'En revisión',
};

const CAT_ICONS = {
  code: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  web:  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  image:`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  text: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>`,
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const T = Date.now();
const h = (n) => T - n * 3_600_000;
const d = (n) => T - n * 86_400_000;
const w = (n) => T - n * 604_800_000;

const PROJECTS = [
  /* ── PROGRAMACIÓN ── */
  {
    id: 'c1', category: 'code',
    name: 'AuraAI Backend',
    description: 'Backend unificado con Express, Firebase y enrutamiento multi-modelo de IA con soporte para GPT, Claude, Gemini y Grok.',
    status: 'running', updatedAt: h(2),
    meta: { language: 'Node.js', lines: 2847, repo: 'https://github.com/devcashflow42-sys/aurx-ai' },
  },
  {
    id: 'c2', category: 'code',
    name: 'Firebase Auth Module',
    description: 'Módulo de autenticación con httpOnly cookies, circuit-breaker y validación de sesiones contra Firebase Realtime DB.',
    status: 'completed', updatedAt: d(1),
    meta: { language: 'JavaScript', lines: 634, repo: '' },
  },
  {
    id: 'c3', category: 'code',
    name: 'AI Provider Router',
    description: 'Enrutador que distribuye prompts a múltiples proveedores de IA según el modelo seleccionado por el usuario en tiempo real.',
    status: 'completed', updatedAt: d(3),
    meta: { language: 'TypeScript', lines: 312, repo: '' },
  },
  /* ── DISEÑO WEB ── */
  {
    id: 'w1', category: 'web',
    name: 'Portfolio 2025',
    description: 'Portfolio personal moderno con animaciones CSS, modo oscuro nativo y diseño responsivo optimizado para todos los dispositivos.',
    status: 'deployed', updatedAt: h(5),
    meta: { framework: 'Next.js 14', deployUrl: '', devices: ['desktop', 'mobile', 'tablet'] },
  },
  {
    id: 'w2', category: 'web',
    name: 'SaaS Landing Page',
    description: 'Landing page de alto impacto para producto SaaS con hero animado, pricing y testimonios con prueba social.',
    status: 'staging', updatedAt: d(2),
    meta: { framework: 'Astro 4', deployUrl: '', devices: ['desktop', 'mobile'] },
  },
  {
    id: 'w3', category: 'web',
    name: 'Admin Dashboard',
    description: 'Panel de administración con métricas en tiempo real, gestión de usuarios y exportación de datos a CSV y PDF.',
    status: 'development', updatedAt: d(5),
    meta: { framework: 'React + Vite', deployUrl: '', devices: ['desktop'] },
  },
  /* ── IMÁGENES ── */
  {
    id: 'i1', category: 'image',
    name: 'Cyberpunk City',
    description: 'Serie de imágenes urbanas futuristas con neón, lluvia y arquitectura retrofuturista generadas con prompts avanzados.',
    status: 'generated', updatedAt: d(1),
    meta: { model: 'DALL-E 3', dimensions: '1024×1024', prompt: 'Cyberpunk city at night, neon lights, rain reflections' },
  },
  {
    id: 'i2', category: 'image',
    name: 'Brand Logo Set',
    description: 'Conjunto de logos minimalistas para identidad de marca tecnológica. 12 variaciones en distintos estilos y paletas.',
    status: 'generated', updatedAt: d(3),
    meta: { model: 'Flux', dimensions: '512×512', prompt: 'Minimal tech logo, geometric shapes, dark background' },
  },
  {
    id: 'i3', category: 'image',
    name: 'Character Art',
    description: 'Arte conceptual de personajes para proyecto de novela gráfica. Estilo manga con paleta oscura y alto nivel de detalle.',
    status: 'generated', updatedAt: w(1),
    meta: { model: 'Midjourney', dimensions: '1024×1792', prompt: 'Manga character, dark fantasy, intricate details' },
  },
  /* ── TEXTO ── */
  {
    id: 't1', category: 'text',
    name: 'AuraAI Docs Técnicos',
    description: 'Documentación técnica completa de la arquitectura backend, endpoints de API, autenticación y despliegue en producción.',
    status: 'draft', updatedAt: h(3),
    meta: { wordCount: 1240, tags: ['docs', 'técnico', 'api'] },
  },
  {
    id: 't2', category: 'text',
    name: 'Tendencias IA 2025',
    description: 'Artículo de blog sobre las tendencias más relevantes en inteligencia artificial generativa y su impacto en la industria.',
    status: 'published', updatedAt: d(2),
    meta: { wordCount: 890, tags: ['blog', 'ia', 'tech'] },
  },
  {
    id: 't3', category: 'text',
    name: 'Propuesta de Inversión',
    description: 'Documento formal con análisis de mercado, proyecciones financieras a 3 años y modelo de negocio detallado para inversores.',
    status: 'review', updatedAt: w(1),
    meta: { wordCount: 2100, tags: ['negocio', 'finanzas', 'pitch'] },
  },
];

/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
const state = {
  filter: 'all',
  search: '',
  sort: 'date',
  view: 'grid',
  projects: [...PROJECTS],
};

/* ─────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────── */
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s <    60) return 'ahora mismo';
  if (s <  3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)}d`;
  return `hace ${Math.floor(s / 604800)}sem`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let _dTimer;
function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(_dTimer);
    _dTimer = setTimeout(() => fn(...args), ms);
  };
}

/* ─────────────────────────────────────────────
   FILTER + SORT
───────────────────────────────────────────── */
function getVisible() {
  let list = state.projects;

  if (state.filter !== 'all') {
    list = list.filter(p => p.category === state.filter);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.meta.language  || '').toLowerCase().includes(q) ||
      (p.meta.framework || '').toLowerCase().includes(q) ||
      (p.meta.model     || '').toLowerCase().includes(q) ||
      (p.meta.tags      || []).some(t => t.toLowerCase().includes(q))
    );
  }

  if (state.sort === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  } else if (state.sort === 'date') {
    list = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  } else if (state.sort === 'status') {
    list = [...list].sort((a, b) => a.status.localeCompare(b.status));
  }

  return list;
}

/* ─────────────────────────────────────────────
   CARD META (category-specific chips)
───────────────────────────────────────────── */
function buildMeta(p) {
  const { category: cat, meta } = p;
  const chips = [];

  if (cat === 'code') {
    const color = LANG_COLORS[meta.language] || '#a1a1aa';
    chips.push(`<span class="detail-chip"><span class="lang-dot" style="background:${color}"></span>${esc(meta.language)}</span>`);
    chips.push(`<span class="detail-chip">${meta.lines.toLocaleString('es')} líneas</span>`);
    if (meta.repo) chips.push(`<span class="detail-chip">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
      Repo</span>`);
  } else if (cat === 'web') {
    chips.push(`<span class="detail-chip">${esc(meta.framework)}</span>`);
    (meta.devices || []).forEach(dv => chips.push(`<span class="detail-chip">${esc(dv)}</span>`));
  } else if (cat === 'image') {
    chips.push(`<span class="detail-chip">${esc(meta.model)}</span>`);
    chips.push(`<span class="detail-chip">${esc(meta.dimensions)}</span>`);
  } else if (cat === 'text') {
    chips.push(`<span class="detail-chip">${meta.wordCount.toLocaleString('es')} palabras</span>`);
    (meta.tags || []).forEach(t => chips.push(`<span class="detail-chip">#${esc(t)}</span>`));
  }

  return chips.length
    ? `<div class="card-details">${chips.join('')}</div>`
    : '';
}

/* ─────────────────────────────────────────────
   RENDER — SINGLE CARD
───────────────────────────────────────────── */
function buildCard(p, idx) {
  const cat = CATEGORIES[p.category];
  const el  = document.createElement('article');

  el.className = 'project-card';
  el.tabIndex  = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Proyecto: ${p.name}`);
  el.dataset.id = p.id;
  el.style.setProperty('--glow',     cat.color);
  el.style.setProperty('--glow-rgb', cat.rgb);
  el.style.animationDelay = `${idx * 45}ms`;

  el.innerHTML = `
    <div class="card-top">
      <span class="category-badge ${cat.badge}">
        ${CAT_ICONS[p.category]}
        ${cat.label}
      </span>
      <button class="more-btn" aria-label="Más opciones de ${esc(p.name)}" tabindex="-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>
    <div class="card-body">
      <div class="card-title">${esc(p.name)}</div>
      <div class="card-desc">${esc(p.description)}</div>
    </div>
    ${buildMeta(p)}
    <div class="card-footer">
      <span class="card-time">${timeAgo(p.updatedAt)}</span>
      <span class="status-pill status-${esc(p.status)}">
        <span class="status-dot"></span>
        ${esc(STATUS_LABELS[p.status] || p.status)}
      </span>
    </div>
  `;

  return el;
}

/* ─────────────────────────────────────────────
   RENDER — EMPTY STATE
───────────────────────────────────────────── */
function buildEmpty() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.setAttribute('aria-live', 'polite');
  div.innerHTML = `
    <div class="empty-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        <path d="M11 8v3M11 14h.01"/>
      </svg>
    </div>
    <div class="empty-title">Sin resultados</div>
    <div class="empty-desc">No hay proyectos que coincidan. Prueba otro filtro o crea uno nuevo.</div>
    <button class="empty-action" id="empty-new-btn" aria-label="Crear nuevo proyecto">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Crear proyecto
    </button>
  `;
  div.querySelector('#empty-new-btn').addEventListener('click', openModal);
  return div;
}

/* ─────────────────────────────────────────────
   RENDER — MAIN
───────────────────────────────────────────── */
function render() {
  const container = document.getElementById('projects-container');
  const visible   = getVisible();

  container.innerHTML = '';

  if (!visible.length) {
    container.appendChild(buildEmpty());
  } else {
    const wrap = document.createElement('div');
    wrap.className = state.view === 'grid' ? 'projects-grid' : 'projects-list';
    visible.forEach((p, i) => wrap.appendChild(buildCard(p, i)));
    container.appendChild(wrap);
  }

  syncCounts();
  document.getElementById('result-count').textContent =
    `${visible.length} proyecto${visible.length !== 1 ? 's' : ''}`;
}

/* ─────────────────────────────────────────────
   SYNC SIDEBAR COUNTS
───────────────────────────────────────────── */
function syncCounts() {
  const all = state.projects;
  document.getElementById('count-all').textContent   = all.length;
  document.getElementById('count-code').textContent  = all.filter(p => p.category === 'code').length;
  document.getElementById('count-web').textContent   = all.filter(p => p.category === 'web').length;
  document.getElementById('count-image').textContent = all.filter(p => p.category === 'image').length;
  document.getElementById('count-text').textContent  = all.filter(p => p.category === 'text').length;
}

/* ─────────────────────────────────────────────
   PAGE TITLE
───────────────────────────────────────────── */
const PAGE_TITLES = {
  all:   'Todos los Proyectos',
  code:  'Programación',
  web:   'Diseño Web',
  image: 'Generación de Imágenes',
  text:  'Textos',
};

function syncTitle() {
  const t = PAGE_TITLES[state.filter] || 'Proyectos';
  document.getElementById('page-title').textContent = t;
  document.title = `${t} — AuraAI`;
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
function openModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => document.getElementById('field-name').focus());
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.getElementById('create-form').reset();
  document.body.style.overflow = '';
}

function onCreateSubmit(e) {
  e.preventDefault();
  const name     = document.getElementById('field-name').value.trim();
  const category = document.getElementById('field-category').value;
  const desc     = document.getElementById('field-desc').value.trim();

  if (!name || !category) return;

  const defaults = {
    code:  { language: 'JavaScript', lines: 0, repo: '' },
    web:   { framework: 'HTML/CSS', deployUrl: '', devices: ['desktop'] },
    image: { model: 'DALL-E 3', dimensions: '1024×1024', prompt: '' },
    text:  { wordCount: 0, tags: [] },
  };

  const newProject = {
    id:          `p${Date.now()}`,
    category,
    name,
    description: desc || 'Sin descripción.',
    status:      category === 'code' ? 'running'
               : category === 'web'  ? 'development'
               : category === 'image'? 'generated'
               : 'draft',
    updatedAt:   Date.now(),
    meta:        defaults[category],
  };

  state.projects.unshift(newProject);
  if (state.filter !== 'all' && state.filter !== category) {
    setFilter('all');
  }
  closeModal();
  render();

  setTimeout(() => {
    const card = document.querySelector(`[data-id="${newProject.id}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 120);
}

/* ─────────────────────────────────────────────
   SIDEBAR (MOBILE)
───────────────────────────────────────────── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}

/* ─────────────────────────────────────────────
   FILTER HELPER
───────────────────────────────────────────── */
function setFilter(val) {
  state.filter = val;
  document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
    const active = btn.dataset.filter === val;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  syncTitle();
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  render();

  /* ── Filter nav ── */
  document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      render();
      if (window.innerWidth < 769) closeSidebar();
    });
  });

  /* ── Search ── */
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', debounce(e => {
    state.search     = e.target.value.trim();
    searchClear.hidden = !state.search;
    render();
  }, 180));

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.search      = '';
    searchClear.hidden = true;
    searchInput.focus();
    render();
  });

  /* ── Sort ── */
  document.getElementById('sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  /* ── View toggle ── */
  document.getElementById('btn-grid').addEventListener('click', () => {
    if (state.view === 'grid') return;
    state.view = 'grid';
    document.getElementById('btn-grid').classList.add('active');
    document.getElementById('btn-grid').setAttribute('aria-pressed', 'true');
    document.getElementById('btn-list').classList.remove('active');
    document.getElementById('btn-list').setAttribute('aria-pressed', 'false');
    render();
  });

  document.getElementById('btn-list').addEventListener('click', () => {
    if (state.view === 'list') return;
    state.view = 'list';
    document.getElementById('btn-list').classList.add('active');
    document.getElementById('btn-list').setAttribute('aria-pressed', 'true');
    document.getElementById('btn-grid').classList.remove('active');
    document.getElementById('btn-grid').setAttribute('aria-pressed', 'false');
    render();
  });

  /* ── New project ── */
  document.getElementById('btn-new').addEventListener('click', openModal);

  /* ── Modal ── */
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('create-form').addEventListener('submit', onCreateSubmit);

  /* ── Sidebar mobile ── */
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', e => {
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      if (document.getElementById('modal-overlay').classList.contains('open')) closeModal();
      else closeSidebar();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      return;
    }

    if (!inInput && e.key === 'n') openModal();
  });

  /* ── Card keyboard activation ── */
  document.getElementById('projects-container').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('project-card')) {
      e.target.click();
    }
  });
});
