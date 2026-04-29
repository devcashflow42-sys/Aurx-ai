/* ═══════════════════════════════════════════════════════════
   AuraAI — home.js  (new architecture)
   Full-page home: drawer overlay, hero, quick chips, input
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const API_BASE = window.location.origin;

  /* ── Auth ─────────────────────────────────────────────── */
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('aurx_user') || '{}'); } catch { return {}; }
  }

  (function checkAuth() {
    if (localStorage.getItem('aurx_session')) return;
    const last = parseInt(sessionStorage.getItem('aurx_guard_ts') || '0', 10);
    if ((Date.now() - last) < 4000) sessionStorage.removeItem('aurx_guard_ts');
    location.replace('/login');
  })();

  function apiFetch(path, opts = {}) {
    return fetch(API_BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    }).then(r => {
      if (r.status === 401) { logout(); return null; }
      return r.json();
    }).catch(() => null);
  }

  function logout() {
    sessionStorage.setItem('aurx_guard_ts', Date.now().toString());
    localStorage.removeItem('aurx_session');
    localStorage.removeItem('aurx_user');
    fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => location.replace('/login'));
  }

  /* ── Profile ──────────────────────────────────────────── */
  (function loadProfile() {
    const user    = getStoredUser();
    const name    = user.name  || 'Usuario';
    const email   = user.email || '';
    const initial = name.charAt(0).toUpperCase();
    const firstName = name.split(' ')[0];

    const dpAvatar = document.getElementById('dp-avatar');
    const dpName   = document.getElementById('dp-name');
    const dpEmail  = document.getElementById('dp-email');
    const homeSub  = document.getElementById('home-sub');

    if (dpAvatar) dpAvatar.textContent = initial;
    if (dpName)   dpName.textContent   = name;
    if (dpEmail)  dpEmail.textContent  = email;
    if (homeSub)  homeSub.textContent  = 'Hola, ' + firstName + '. ¿Qué quieres crear hoy?';
  })();

  /* ── Drawer ───────────────────────────────────────────── */
  const drawer        = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const hamburger     = document.getElementById('hamburger');
  const drawerClose   = document.getElementById('drawer-close');

  function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('show');
    drawerOverlay.setAttribute('aria-hidden', 'false');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('show');
    drawerOverlay.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-hidden', 'true');
  }

  if (hamburger)     hamburger.addEventListener('click', openDrawer);
  if (drawerClose)   drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ── Profile dropdown arrow ───────────────────────────── */
  const dpArrow = document.getElementById('dp-arrow');
  if (dpArrow) {
    dpArrow.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('¿Deseas cerrar sesión?')) logout();
    });
  }

  /* ── Token balance ────────────────────────────────────── */
  async function loadTokenBalance() {
    const res = await apiFetch('/api/users/tokens');
    if (!res || !res.success) return;
    const t = res.data?.tokens ?? 0;
    const el = document.getElementById('drawer-token-count');
    if (el) el.textContent = Number(t).toLocaleString('es');
  }
  loadTokenBalance();

  /* ── Buy buttons ──────────────────────────────────────── */
  function handleBuy() {
    alert('Compra de créditos estará disponible próximamente.');
  }

  const drawerBuyBtn  = document.getElementById('drawer-buy-btn');
  const buyCreditsBtn = document.getElementById('buy-credits-btn');
  if (drawerBuyBtn)  drawerBuyBtn.addEventListener('click', handleBuy);
  if (buyCreditsBtn) buyCreditsBtn.addEventListener('click', handleBuy);

  /* ── Conversations ────────────────────────────────────── */
  function dateGroupLabel(ts) {
    const now  = new Date();
    const date = new Date(ts);
    const diffD = Math.floor((now - date) / 86400000);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth()    === b.getMonth()    &&
      a.getDate()     === b.getDate();
    if (sameDay(now, date)) return 'Hoy';
    if (diffD < 2)          return 'Ayer';
    if (diffD < 8)          return 'Últimos 7 días';
    if (diffD < 31)         return 'Últimos 30 días';
    return date.toLocaleString('es', { month: 'long', year: 'numeric' });
  }

  /* ── Conv context menu ────────────────────────────────── */
  let _ciTargetId   = null;
  let _ciTitleEl    = null;
  let _ciMoreBtn    = null;
  let _pendingDelId = null;

  const _ciMenu = document.createElement('div');
  _ciMenu.className = 'ci-menu';
  _ciMenu.innerHTML = `
    <button class="ci-menu-item" id="ci-rename-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Renombrar
    </button>
    <div class="ci-menu-sep"></div>
    <button class="ci-menu-item ci-danger" id="ci-delete-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      Eliminar
    </button>`;
  document.body.appendChild(_ciMenu);

  const _ciBackdrop = document.createElement('div');
  _ciBackdrop.className = 'ci-backdrop';
  document.body.appendChild(_ciBackdrop);

  const _ciDialog = document.createElement('div');
  _ciDialog.className = 'ci-dialog';
  _ciDialog.innerHTML = `
    <div class="ci-dialog-handle"></div>
    <div class="ci-dialog-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
    </div>
    <div class="ci-dialog-title">Eliminar conversación</div>
    <div class="ci-dialog-body">Esta acción no se puede deshacer. La conversación se eliminará permanentemente.</div>
    <div class="ci-dialog-actions">
      <button class="ci-btn-delete" id="ci-confirm-delete">Eliminar</button>
      <button class="ci-btn-cancel" id="ci-confirm-cancel">Cancelar</button>
    </div>`;
  document.body.appendChild(_ciDialog);

  function openCiMenu(id, titleEl, moreBtn) {
    _ciTargetId = id;
    _ciTitleEl  = titleEl;
    _ciMoreBtn  = moreBtn;
    moreBtn.classList.add('active');
    const rect = moreBtn.getBoundingClientRect();
    _ciMenu.style.top   = (rect.bottom + 6) + 'px';
    _ciMenu.style.right = (window.innerWidth - rect.right) + 'px';
    _ciMenu.style.left  = 'auto';
    _ciMenu.classList.add('open');
    setTimeout(() => document.addEventListener('click', _closeCiMenuOutside), 10);
  }

  function closeCiMenu() {
    _ciMenu.classList.remove('open');
    if (_ciMoreBtn) { _ciMoreBtn.classList.remove('active'); _ciMoreBtn = null; }
    document.removeEventListener('click', _closeCiMenuOutside);
  }

  function _closeCiMenuOutside(e) {
    if (!_ciMenu.contains(e.target)) closeCiMenu();
  }

  function showDelDialog() {
    _ciBackdrop.classList.add('open');
    _ciDialog.classList.add('open');
  }

  function hideDelDialog() {
    _ciBackdrop.classList.remove('open');
    _ciDialog.classList.remove('open');
  }

  _ciMenu.querySelector('#ci-rename-btn').addEventListener('click', () => {
    const id = _ciTargetId, el = _ciTitleEl;
    closeCiMenu();
    if (id && el) startCiRename(id, el);
  });

  _ciMenu.querySelector('#ci-delete-btn').addEventListener('click', () => {
    _pendingDelId = _ciTargetId;
    closeCiMenu();
    showDelDialog();
  });

  _ciBackdrop.addEventListener('click', hideDelDialog);
  _ciDialog.querySelector('#ci-confirm-cancel').addEventListener('click', hideDelDialog);
  _ciDialog.querySelector('#ci-confirm-delete').addEventListener('click', async () => {
    const id = _pendingDelId;
    _pendingDelId = null;
    hideDelDialog();
    if (!id) return;
    await apiFetch('/api/conversations/' + id, { method: 'DELETE' });
    loadConversations();
  });

  function startCiRename(id, titleEl) {
    const original = titleEl.textContent;
    const inp = document.createElement('input');
    inp.type      = 'text';
    inp.className = 'ci-rename-input';
    inp.value     = original;
    titleEl.replaceWith(inp);
    inp.focus();
    inp.select();
    let done = false;
    async function commit() {
      if (done) return; done = true;
      const val = inp.value.trim();
      if (!val || val === original) { inp.replaceWith(titleEl); return; }
      inp.replaceWith(titleEl);
      titleEl.textContent = val;
      await apiFetch('/api/conversations/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ title: val }),
      });
    }
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { done = true; inp.replaceWith(titleEl); }
    });
    inp.addEventListener('blur', commit);
  }

  async function loadConversations() {
    const recentList = document.getElementById('recent-list');
    if (!recentList) return;

    const res = await apiFetch('/api/conversations/');
    if (!res) {
      recentList.innerHTML = '<div class="conv-empty">Error al cargar conversaciones.</div>';
      return;
    }

    const all = res.data || [];
    if (!all.length) {
      recentList.innerHTML = '<div class="conv-empty">Aún no hay conversaciones.<br/>¡Inicia una nueva tarea!</div>';
      return;
    }

    const groups = [];
    const seen   = {};
    all.forEach(conv => {
      const label = dateGroupLabel(conv.updatedAt);
      if (!seen[label]) { seen[label] = true; groups.push({ label, items: [] }); }
      groups[groups.length - 1].items.push(conv);
    });

    recentList.innerHTML = '';
    groups.forEach(grp => {
      const hdr = document.createElement('div');
      hdr.className   = 'conv-date-group';
      hdr.textContent = grp.label;
      recentList.appendChild(hdr);

      grp.items.forEach(conv => {
        const btn = document.createElement('button');
        btn.className = 'conv-item';

        const title = document.createElement('span');
        title.className   = 'conv-item-title';
        title.textContent = conv.title || 'Sin título';

        const more = document.createElement('button');
        more.type      = 'button';
        more.className = 'conv-item-more';
        more.setAttribute('aria-label', 'Opciones de conversación');
        more.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;
        more.addEventListener('click', e => {
          e.stopPropagation();
          openCiMenu(conv.id, title, more);
        });

        btn.append(title, more);
        btn.addEventListener('click', () => {
          window.location.href = '/chat?id=' + encodeURIComponent(conv.id);
        });
        recentList.appendChild(btn);
      });
    });
  }
  loadConversations();



  /* ── Nueva tarea button ───────────────────────────────── */
  const newTaskBtn = document.getElementById('drawer-new-task');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', () => {
      closeDrawer();
      const input = document.getElementById('home-input');
      if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth' }); }
    });
  }

  /* ── Model Selector ──────────────────────────────────── */
  const PROVIDER_ICONS = {
    openai: `<img src="assets/icons/openai.png" alt="OpenAI" draggable="false">`,
    claude: `<img src="assets/icons/claude.png" alt="Claude" draggable="false">`,
    gemini: `<img src="assets/icons/gemini.png" alt="Gemini" draggable="false">`,
    grok:   `<img src="assets/icons/grok.png"   alt="Grok"   draggable="false">`,
  };
  const CATEGORIES = [
    { id: 'instant', label: 'modelos instantáneos', icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>` },
    { id: 'pro',     label: 'modelos Pro',           icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    { id: 'legacy',  label: 'modelos antiguos',      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  ];
  const MODELS = [
    { id: 'gpt-4o-mini',      name: 'OpenAI GPT-4o Mini',    desc: 'Ligero, ágil y con respuestas instantáneas',    category: 'instant', provider: 'openai',  dot: 'dot-green'  },
    { id: 'gemini-31-fll',    name: 'Gemini 3.1 Flash Lite', desc: 'Utilidad ultrarrápida, ligera y eficiente',     category: 'instant', provider: 'gemini',  dot: 'dot-blue',   isNew: true },
    { id: 'grok-41-fast',     name: 'Grok 4.1 Fast',         desc: 'Respuestas instantáneas, sin demora',          category: 'instant', provider: 'grok',    dot: 'dot-purple'  },
    { id: 'claude-45-haiku',  name: 'Claude 4.5 Haiku',      desc: 'Modelo rápido y conciso',                      category: 'instant', provider: 'claude',  dot: 'dot-yellow'  },
    { id: 'gemini-30-flash',  name: 'Gemini 3.0 Flash',      desc: 'Respuestas ultrarrápidas en tiempo real',      category: 'instant', provider: 'gemini',  dot: 'dot-blue'    },
    { id: 'gpt-5-mini',       name: 'OpenAI GPT-5 Mini',     desc: 'Rápido y eficiente para tareas diarias',       category: 'instant', provider: 'openai',  dot: 'dot-green'   },
    { id: 'gpt-54-mini',      name: 'OpenAI GPT-5.4 Mini',   desc: 'Rápido e inteligente',                         category: 'instant', provider: 'openai',  dot: 'dot-green',  isNew: true },
    { id: 'gpt-54-nano',      name: 'OpenAI GPT-5.4 Nano',   desc: 'Ultraligero y veloz',                          category: 'instant', provider: 'openai',  dot: 'dot-green',  isNew: true },
    { id: 'gpt-52',           name: 'OpenAI GPT-5.2',        desc: 'Razonamiento avanzado',                        category: 'pro',     provider: 'openai',  dot: 'dot-blue',   isPro: true },
    { id: 'gemini-3-pro',     name: 'Gemini 3 Pro',          desc: 'Razonamiento de alto nivel',                   category: 'pro',     provider: 'gemini',  dot: 'dot-purple', isPro: true },
    { id: 'gemini-31-pro',    name: 'Gemini 3.1 Pro',        desc: 'Investigación profunda y lógica avanzada',     category: 'pro',     provider: 'gemini',  dot: 'dot-purple', isNew: true, isPro: true },
    { id: 'gpt-52-pro',       name: 'OpenAI GPT-5.2 Pro',    desc: 'Máxima precisión y lógica',                   category: 'pro',     provider: 'openai',  dot: 'dot-blue',   isPro: true },
    { id: 'claude-45-sonnet', name: 'Claude 4.5 Sonnet',     desc: 'Equilibrado y potente',                        category: 'pro',     provider: 'claude',  dot: 'dot-yellow', isPro: true },
    { id: 'claude-46-sonnet', name: 'Claude 4.6 Sonnet',     desc: 'Ideal para programación avanzada',             category: 'pro',     provider: 'claude',  dot: 'dot-yellow', isNew: true, isPro: true },
    { id: 'claude-46-opus',   name: 'Claude 4.6 Opus',       desc: 'Investigación experta',                        category: 'pro',     provider: 'claude',  dot: 'dot-yellow', isPro: true },
    { id: 'grok-4',           name: 'Grok 4',                desc: 'Lógica rápida y directa',                      category: 'pro',     provider: 'grok',    dot: 'dot-purple', isPro: true },
    { id: 'gpt-54-pro',       name: 'OpenAI GPT-5.4 Pro',    desc: 'Mayor precisión y rendimiento',                category: 'pro',     provider: 'openai',  dot: 'dot-blue',   isNew: true, isPro: true },
    { id: 'gpt-54',           name: 'OpenAI GPT-5.4',        desc: 'Razonamiento avanzado y planificación',        category: 'pro',     provider: 'openai',  dot: 'dot-blue',   isNew: true, isPro: true },
    { id: 'claude-47-opus',   name: 'Claude 4.7 Opus',       desc: 'Modelo más avanzado para tareas complejas',    category: 'pro',     provider: 'claude',  dot: 'dot-yellow', isNew: true, isPro: true },
    { id: 'gpt-51',           name: 'OpenAI GPT-5.1',        desc: 'Generación anterior estable',                  category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
    { id: 'gpt-5',            name: 'OpenAI GPT-5',          desc: 'Primera versión GPT-5',                        category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
    { id: 'claude-4-sonnet',  name: 'Claude 4 Sonnet',       desc: 'Versión previa equilibrada',                   category: 'legacy',  provider: 'claude',  dot: 'dot-yellow'  },
    { id: 'grok-4-fast',      name: 'Grok 4 Fast',           desc: 'Versión rápida anterior',                      category: 'legacy',  provider: 'grok',    dot: 'dot-purple'  },
    { id: 'gemini-25-pro',    name: 'Gemini 2.5 Pro',        desc: 'Multimodal generación anterior',               category: 'legacy',  provider: 'gemini',  dot: 'dot-purple'  },
    { id: 'gpt-4o',           name: 'OpenAI GPT-4o',         desc: 'Modelo multimodal previo',                     category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
  ];

  const LS_KEY        = 'aura_selected_model';
  const DEFAULT_MODEL = 'gpt-4o-mini';
  let selectedModelId = (function(){ try { return localStorage.getItem(LS_KEY) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; } })();
  if (!MODELS.find(m => m.id === selectedModelId)) selectedModelId = DEFAULT_MODEL;

  const modelPill   = document.getElementById('model-pill');
  const modelDot    = document.getElementById('model-dot');
  const modelLabel  = document.getElementById('model-label');
  const msOverlay   = document.getElementById('ms-overlay');
  const msPanel     = document.getElementById('ms-panel');
  const msClose     = document.getElementById('ms-close');
  const msSearch    = document.getElementById('ms-search');
  const msSearchClr = document.getElementById('ms-search-clear');
  const msBody      = document.getElementById('ms-body');

  function saveModelId(id) { try { localStorage.setItem(LS_KEY, id); } catch {} }

  function renderModelList(query) {
    const q = (query || '').trim().toLowerCase();
    const filtered = q ? MODELS.filter(m => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)) : null;
    msBody.innerHTML = '';
    if (filtered && !filtered.length) {
      msBody.innerHTML = `<div class="ms-empty show"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Sin resultados</div>`;
      return;
    }
    const list = filtered || null;
    if (list) {
      list.forEach((m, i) => msBody.appendChild(buildModelItem(m, i)));
    } else {
      CATEGORIES.forEach(cat => {
        const group = MODELS.filter(m => m.category === cat.id);
        if (!group.length) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `${msBody.children.length > 0 ? '<div class="ms-cat-divider"></div>' : ''}<div class="ms-cat"><span class="ms-cat-icon">${cat.icon}</span><span class="ms-cat-label">${cat.label}</span></div>`;
        msBody.appendChild(wrap);
        group.forEach((m, i) => msBody.appendChild(buildModelItem(m, i)));
      });
    }
  }

  function buildModelItem(m, idx) {
    const btn = document.createElement('button');
    btn.className = 'ms-item' + (m.id === selectedModelId ? ' selected' : '');
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(m.id === selectedModelId));
    btn.style.animationDelay = (idx * 18) + 'ms';
    const newBadge = m.isNew ? `<span class="ms-badge-new">NEW</span>` : '';
    const proBadge = m.isPro ? `<span class="ms-badge-new" style="background:linear-gradient(135deg,#f59e0b,#d97706);">Pro</span>` : '';
    btn.innerHTML = `
      <div class="ms-item-icon">${PROVIDER_ICONS[m.provider] || ''}</div>
      <div class="ms-item-info">
        <div class="ms-item-name"><span class="ms-item-name-text">${m.name}</span>${newBadge}${proBadge}</div>
        <div class="ms-item-desc">${m.desc}</div>
      </div>
      <div class="ms-item-right"><div class="ms-item-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div></div>`;
    btn.addEventListener('click', () => selectModel(m));
    return btn;
  }

  function selectModel(m) {
    selectedModelId     = m.id;
    modelLabel.textContent = m.name;
    modelDot.className  = 'model-dot ' + m.dot;
    saveModelId(m.id);
    closeModelPanel();
  }

  function openModelPanel() {
    msOverlay.classList.add('show');
    msPanel.classList.add('open');
    modelPill.classList.add('open');
    modelPill.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      msSearch.value = '';
      msSearchClr.classList.remove('show');
      renderModelList('');
      msSearch.focus();
    });
  }

  function closeModelPanel() {
    msOverlay.classList.remove('show');
    msPanel.classList.remove('open');
    modelPill.classList.remove('open');
    modelPill.setAttribute('aria-expanded', 'false');
  }

  /* Init pill */
  (function () {
    const m = MODELS.find(x => x.id === selectedModelId) || MODELS[0];
    selectedModelId       = m.id;
    modelLabel.textContent = m.name;
    modelDot.className    = 'model-dot ' + m.dot;
  })();

  modelPill.addEventListener('click', e => { e.stopPropagation(); openModelPanel(); });
  msClose.addEventListener('click', closeModelPanel);
  msOverlay.addEventListener('click', closeModelPanel);
  msSearch.addEventListener('input', () => {
    const v = msSearch.value;
    msSearchClr.classList.toggle('show', v.length > 0);
    renderModelList(v);
  });
  msSearchClr.addEventListener('click', () => {
    msSearch.value = '';
    msSearchClr.classList.remove('show');
    renderModelList('');
    msSearch.focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (_ciDialog.classList.contains('open')) { hideDelDialog(); return; }
      if (_ciMenu.classList.contains('open'))   { closeCiMenu(); return; }
      closeModelPanel();
      closeDrawer();
    }
  });

  /* ── Home input ───────────────────────────────────────── */
  const homeInput   = document.getElementById('home-input');
  const homeSendBtn = document.getElementById('home-send-btn');

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  function updateSendBtn() {
    const hasText = homeInput.value.trim().length > 0;
    homeSendBtn.disabled = !hasText;
    homeSendBtn.classList.toggle('active', hasText);
  }

  if (homeInput) {
    homeInput.addEventListener('input', () => {
      autoResize(homeInput);
      updateSendBtn();
    });
    homeInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!homeSendBtn.disabled) submitHomeInput();
      }
    });
  }

  function submitHomeInput() {
    const text = homeInput.value.trim();
    if (!text) return;
    window.location.href = '/chat?msg=' + encodeURIComponent(text) + '&model=' + encodeURIComponent(selectedModelId);
  }

  if (homeSendBtn) {
    homeSendBtn.addEventListener('click', submitHomeInput);
  }

  /* ── setHomeInput (global, used by quick chips) ───────── */
  window.setHomeInput = function (text) {
    if (!homeInput) return;
    homeInput.value = text;
    autoResize(homeInput);
    updateSendBtn();
    homeInput.focus();
  };

})();
