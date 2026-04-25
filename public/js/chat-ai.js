/* ═══════════════════════════════════════════════════════════
   AuraAI — chat-ai.js
   All application logic (model selector, provider popup,
   file handling, camera, messaging)
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     ELEMENTS
  ══════════════════════════════════════════════ */
  const sidebar      = document.getElementById('sidebar');
  const overlay      = document.getElementById('overlay');
  const hamburger    = document.getElementById('hamburger');
  const sbClose      = document.getElementById('sb-close');
  const btnNew       = document.getElementById('btn-new');
  const sbChatList   = document.getElementById('sb-chat-list');
  const input        = document.getElementById('chat-input');
  const sendBtn      = document.getElementById('send-btn');
  const hero         = document.getElementById('hero');
  const messages     = document.getElementById('messages');
  const chatBody     = document.getElementById('chat-body');
  const inputBox     = document.getElementById('input-box');

  // file strip
  const fileStrip    = document.getElementById('file-strip');

  // attach
  const attachBtn    = document.getElementById('attach-btn');
  const attachMenu   = document.getElementById('attach-menu');
  const attachFile   = document.getElementById('attach-file-btn');
  const attachImage  = document.getElementById('attach-image-btn');
  const attachCamera = document.getElementById('attach-camera-btn');
  const fileInputDoc = document.getElementById('file-input-doc');
  const fileInputImg = document.getElementById('file-input-image');

  // model
  const modelPill    = document.getElementById('model-pill');
  const modelLabel   = document.getElementById('model-label');
  const modelDot     = document.getElementById('model-dot');

  // model selector panel
  const msOverlay    = document.getElementById('ms-overlay');
  const msPanel      = document.getElementById('ms-panel');
  const msClose      = document.getElementById('ms-close');
  const msBody       = document.getElementById('ms-body');
  const msSearch     = document.getElementById('ms-search');
  const msSearchClear= document.getElementById('ms-search-clear');

  // camera
  const cameraModal  = document.getElementById('camera-modal');
  const cameraVideo  = document.getElementById('camera-video');
  const camCanvas    = document.getElementById('cam-canvas');
  const camClose     = document.getElementById('cam-close-btn');
  const camShutter   = document.getElementById('cam-shutter-btn');
  const camFlash     = document.getElementById('cam-flash');
  const cameraError  = document.getElementById('camera-error');
  const cameraErrMsg = document.getElementById('camera-error-msg');

  // img preview
  const imgModal     = document.getElementById('img-modal');
  const modalImg     = document.getElementById('modal-img');
  const modalClose   = document.getElementById('modal-close');

  let chatActive   = false;
  let stagedFiles  = [];
  let fcIdCounter  = 0;
  let cameraStream = null;

  const API_BASE = window.location.origin;

  /* ══════════════════════════════════════════════
     CONVERSATION HISTORY — Firebase via API
  ══════════════════════════════════════════════ */
  let currentConvId  = null;   // ID of the active conversation
  let currentMsgs    = [];     // { role:'user'|'ai', text:string }
  let _saveTimer     = null;   // debounce handle

  function genConvId() { return 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }

  function genTitle(text) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    return clean.length > 60 ? clean.slice(0, 60) + '…' : (clean || 'Nueva conversación');
  }

  /* ── API helpers ── */
  function apiFetch(path, opts = {}) {
    return fetch(API_BASE + '/api/conversations' + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    }).then(r => {
      if (r.status === 401) { logout(); return null; }
      return r.json();
    });
  }

  /** Save / update active conversation in Firebase (debounced 600ms) */
  function persistConv() {
    if (!currentConvId || !currentMsgs.length) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      await apiFetch('/', {
        method: 'POST',
        body: JSON.stringify({
          id:       currentConvId,
          title:    genTitle(currentMsgs[0]?.text || ''),
          model:    selectedModelId,
          messages: currentMsgs,
        }),
      });
      renderSidebar();   // refresh list after save
    }, 600);
  }

  /** Delete a conversation from Firebase */
  async function deleteConv(id) {
    await apiFetch('/' + id, { method: 'DELETE' });
    if (id === currentConvId) startNewChat();
    else renderSidebar();
  }

  /** Load a conversation from Firebase into the UI */
  async function loadConv(id) {
    const res = await apiFetch('/' + id);
    if (!res || !res.success) return;
    const conv = res.data;

    currentConvId = id;
    currentMsgs   = conv.messages || [];

    // Reset UI
    messages.innerHTML = '';
    messages.classList.add('active');
    hero.style.display = 'none';
    chatActive = true;
    clearAllFiles();
    updateSendBtn();

    // Restore model
    const m = MODELS.find(x => x.id === conv.model);
    if (m) selectModel(m);

    // Render messages
    currentMsgs.forEach(msg => addMsg(msg.role, msg.text, [], false));
    requestAnimationFrame(() => chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }));

    closeSidebar();
    renderSidebar();   // refresh active highlight
  }

  /** Start fresh chat */
  function startNewChat() {
    clearTimeout(_saveTimer);
    currentConvId = null;
    currentMsgs   = [];
    chatActive    = false;
    messages.innerHTML  = '';
    messages.classList.remove('active');
    hero.style.display  = '';
    input.value         = '';
    input.style.height  = 'auto';
    clearAllFiles();
    updateSendBtn();
    closeSidebar();
    chatBody.scrollTo({ top: 0, behavior: 'smooth' });
    renderSidebar();
  }

  /* ── Date group label ── */
  function dateGroupLabel(ts) {
    const now  = new Date();
    const date = new Date(ts);
    const diffD = Math.floor((now - date) / 86400000);
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(now, date))    return 'Hoy';
    if (diffD < 2)             return 'Ayer';
    if (diffD < 8)             return 'Últimos 7 días';
    if (diffD < 31)            return 'Últimos 30 días';
    return date.toLocaleString('es', { month: 'long', year: 'numeric' });
  }

  /** Fetch list from Firebase and render sidebar */
  async function renderSidebar() {
    const res = await apiFetch('/');
    if (!res) return;
    const all = res.data || [];

    if (!all.length) {
      sbChatList.innerHTML = '<div class="sb-empty">Aún no hay conversaciones</div>';
      return;
    }

    // Group by date label (preserving server sort order: newest first)
    const groups = [];
    const seen   = {};
    all.forEach(conv => {
      const label = dateGroupLabel(conv.updatedAt);
      if (!seen[label]) { seen[label] = true; groups.push({ label, items: [] }); }
      groups[groups.length - 1].items.push(conv);
    });

    sbChatList.innerHTML = '';
    groups.forEach(grp => {
      const hdr = document.createElement('div');
      hdr.className   = 'sb-date-group';
      hdr.textContent = grp.label;
      sbChatList.appendChild(hdr);

      grp.items.forEach(conv => {
        const btn = document.createElement('button');
        btn.className = 'sb-conv-item' + (conv.id === currentConvId ? ' active' : '');

        const title = document.createElement('span');
        title.className   = 'sb-conv-title';
        title.textContent = conv.title;

        const del = document.createElement('button');
        del.className = 'sb-conv-del';
        del.setAttribute('aria-label', 'Eliminar conversación');
        del.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
        del.addEventListener('click', e => { e.stopPropagation(); deleteConv(conv.id); });

        btn.append(title, del);
        btn.addEventListener('click', () => loadConv(conv.id));
        sbChatList.appendChild(btn);
      });
    });
  }

  /* ══════════════════════════════════════════════
     SIDEBAR
  ══════════════════════════════════════════════ */
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
    hamburger.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    hamburger.setAttribute('aria-expanded','false');
    setTimeout(() => overlay.classList.remove('show'), 220);
  }
  hamburger.addEventListener('click', openSidebar);
  sbClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', () => { closeSidebar(); closeAllMenus(); });

  /* ══════════════════════════════════════════════
     MENU MANAGEMENT
  ══════════════════════════════════════════════ */
  function closeAllMenus() {
    closeAttachMenu();
    closeModelPanel();
  }

  function openAttachMenu() {
    closeModelPanel();
    attachMenu.classList.add('open');
    attachBtn.classList.add('menu-open');
    attachBtn.setAttribute('aria-expanded','true');
  }
  function closeAttachMenu() {
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('menu-open');
    attachBtn.setAttribute('aria-expanded','false');
  }
  function toggleAttachMenu(e) {
    e.stopPropagation();
    attachMenu.classList.contains('open') ? closeAttachMenu() : openAttachMenu();
  }
  attachBtn.addEventListener('click', toggleAttachMenu);

  /* ── Model Selector Panel ── */
  function openModelPanel() {
    closeAttachMenu();
    msOverlay.classList.add('show');
    msPanel.classList.add('open');
    modelPill.classList.add('open');
    modelPill.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => {
      msSearch.value = '';
      msSearchClear.classList.remove('show');
      renderModels('');
      msSearch.focus();
    });
  }
  function closeModelPanel() {
    msOverlay.classList.remove('show');
    msPanel.classList.remove('open');
    modelPill.classList.remove('open');
    modelPill.setAttribute('aria-expanded','false');
  }
  modelPill.addEventListener('click', e => { e.stopPropagation(); openModelPanel(); });
  msClose.addEventListener('click', closeModelPanel);
  msOverlay.addEventListener('click', closeModelPanel);

  document.addEventListener('click', (e) => {
    if (!attachMenu.contains(e.target) && e.target !== attachBtn) closeAttachMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMenus();
      if (sidebar.classList.contains('open'))       closeSidebar();
      if (imgModal.classList.contains('visible'))   closeImgModal();
      if (cameraModal.classList.contains('visible'))closeCamera();
    }
  });

  attachMenu.addEventListener('click', e => e.stopPropagation());

  /* ══════════════════════════════════════════════
     MODEL SELECTOR — provider icons (PNG)
     Replace assets/icons/*.png with your own files.
  ══════════════════════════════════════════════ */
  const PROVIDER_ICONS = {
    openai: `<img src="assets/icons/openai.png" alt="OpenAI" draggable="false">`,
    claude: `<img src="assets/icons/claude.png" alt="Claude" draggable="false">`,
    gemini: `<img src="assets/icons/gemini.png" alt="Gemini" draggable="false">`,
    grok:   `<img src="assets/icons/grok.png"   alt="Grok"   draggable="false">`,
  };

  /* ══════════════════════════════════════════════
     MODEL SELECTOR — categories
  ══════════════════════════════════════════════ */
  const CATEGORIES = [
    {
      id:    'instant',
      label: 'modelos instantáneos',
      icon:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    },
    {
      id:    'pro',
      label: 'modelos Pro',
      icon:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    },
    {
      id:    'legacy',
      label: 'modelos antiguos',
      icon:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    },
  ];

  /* ══════════════════════════════════════════════
     MODEL SELECTOR — data
     Fields: id · name · desc · category · provider · dot · isNew? · isPro?
  ══════════════════════════════════════════════ */
  const MODELS = [
    /* ── instant ─────────────────────────────── */
    { id: 'gpt-4o-mini',      name: 'OpenAI GPT-4o Mini',    desc: 'Ligero, ágil y con respuestas instantáneas',    category: 'instant', provider: 'openai',  dot: 'dot-green'  },
    { id: 'gemini-31-fll',    name: 'Gemini 3.1 Flash Lite', desc: 'Utilidad ultrarrápida, ligera y eficiente',     category: 'instant', provider: 'gemini',  dot: 'dot-blue',   isNew: true },
    { id: 'grok-41-fast',     name: 'Grok 4.1 Fast',         desc: 'Respuestas instantáneas, sin demora',          category: 'instant', provider: 'grok',    dot: 'dot-purple'  },
    { id: 'claude-45-haiku',  name: 'Claude 4.5 Haiku',      desc: 'Modelo rápido y conciso',                      category: 'instant', provider: 'claude',  dot: 'dot-yellow'  },
    { id: 'gemini-30-flash',  name: 'Gemini 3.0 Flash',      desc: 'Respuestas ultrarrápidas en tiempo real',      category: 'instant', provider: 'gemini',  dot: 'dot-blue'    },
    { id: 'gpt-5-mini',       name: 'OpenAI GPT-5 Mini',     desc: 'Rápido y eficiente para tareas diarias',       category: 'instant', provider: 'openai',  dot: 'dot-green'   },
    { id: 'gpt-54-mini',      name: 'OpenAI GPT-5.4 Mini',   desc: 'Rápido e inteligente',                         category: 'instant', provider: 'openai',  dot: 'dot-green',  isNew: true },
    { id: 'gpt-54-nano',      name: 'OpenAI GPT-5.4 Nano',   desc: 'Ultraligero y veloz',                          category: 'instant', provider: 'openai',  dot: 'dot-green',  isNew: true },
    /* ── pro ─────────────────────────────────── */
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
    /* ── legacy ──────────────────────────────── */
    { id: 'gpt-51',           name: 'OpenAI GPT-5.1',        desc: 'Generación anterior estable',                  category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
    { id: 'gpt-5',            name: 'OpenAI GPT-5',          desc: 'Primera versión GPT-5',                        category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
    { id: 'claude-4-sonnet',  name: 'Claude 4 Sonnet',       desc: 'Versión previa equilibrada',                   category: 'legacy',  provider: 'claude',  dot: 'dot-yellow'  },
    { id: 'grok-4-fast',      name: 'Grok 4 Fast',           desc: 'Versión rápida anterior',                      category: 'legacy',  provider: 'grok',    dot: 'dot-purple'  },
    { id: 'gemini-25-pro',    name: 'Gemini 2.5 Pro',        desc: 'Multimodal generación anterior',               category: 'legacy',  provider: 'gemini',  dot: 'dot-purple'  },
    { id: 'gpt-4o',           name: 'OpenAI GPT-4o',         desc: 'Modelo multimodal previo',                     category: 'legacy',  provider: 'openai',  dot: 'dot-blue'    },
  ];

  /* ══════════════════════════════════════════════
     PERSISTENCE
  ══════════════════════════════════════════════ */
  const LS_KEY = 'aura_selected_model';
  function loadStoredModelId() { try { return localStorage.getItem(LS_KEY) || null; } catch { return null; } }
  function saveModelId(id)      { try { localStorage.setItem(LS_KEY, id); }           catch {} }

  /* ══════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════ */
  const DEFAULT_MODEL_ID = 'gpt-4o-mini';
  let selectedModelId = loadStoredModelId() || DEFAULT_MODEL_ID;
  if (!MODELS.find(m => m.id === selectedModelId)) selectedModelId = DEFAULT_MODEL_ID;

  /* ══════════════════════════════════════════════
     RENDER — main model list
  ══════════════════════════════════════════════ */
  function renderModels(query) {
    const q = query.trim().toLowerCase();
    // Apply active provider filter first (set by the dropdown)
    const pool = (typeof ppActiveProvider !== 'undefined' && ppActiveProvider)
      ? MODELS.filter(m => m.provider === ppActiveProvider)
      : MODELS;

    const filtered = q
      ? pool.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.desc.toLowerCase().includes(q)
        )
      : (ppActiveProvider ? pool : null); // flat list when provider is filtered

    msBody.innerHTML = '';

    if (filtered && filtered.length === 0) {
      msBody.innerHTML = `
        <div class="ms-empty show">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          Sin resultados para "<strong>${query}</strong>"
        </div>`;
      return;
    }

    if (filtered) {
      filtered.forEach((m, idx) => msBody.appendChild(buildItem(m, idx)));
    } else {
      CATEGORIES.forEach(cat => {
        const group = pool.filter(m => m.category === cat.id);
        if (!group.length) return;
        const wrap = document.createElement('div');
        const needsDivider = msBody.children.length > 0;
        wrap.innerHTML = `
          ${needsDivider ? '<div class="ms-cat-divider"></div>' : ''}
          <div class="ms-cat">
            <span class="ms-cat-icon">${cat.icon}</span>
            <span class="ms-cat-label">${cat.label}</span>
          </div>`;
        msBody.appendChild(wrap);
        group.forEach((m, idx) => msBody.appendChild(buildItem(m, idx)));
      });
    }
  }

  function buildItem(m, idx) {
    const isSelected = m.id === selectedModelId;
    const btn = document.createElement('button');
    btn.className = 'ms-item' + (isSelected ? ' selected' : '');
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(isSelected));
    btn.style.animationDelay = (idx * 18) + 'ms';

    const newBadge = m.isNew
      ? `<span class="ms-badge-new">NEW</span>`
      : '';
    const proBadge = m.isPro
      ? `<span class="ms-badge-new" style="background:linear-gradient(135deg,#f59e0b,#d97706);">Pro</span>`
      : '';

    btn.innerHTML = `
      <div class="ms-item-icon">${PROVIDER_ICONS[m.provider] || ''}</div>
      <div class="ms-item-info">
        <div class="ms-item-name">
          <span class="ms-item-name-text">${m.name}</span>${newBadge}${proBadge}
        </div>
        <div class="ms-item-desc">${m.desc}</div>
      </div>
      <div class="ms-item-right">
        <div class="ms-item-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>`;
    btn.addEventListener('click', () => selectModel(m));
    return btn;
  }

  function selectModel(m) {
    selectedModelId        = m.id;
    modelLabel.textContent = m.name;
    modelDot.className     = 'model-dot ' + m.dot;
    saveModelId(m.id);
    closeModelPanel();
  }

  /* ── Init pill on load ── */
  (function initModelUI() {
    const m = MODELS.find(x => x.id === selectedModelId) || MODELS[0];
    selectedModelId        = m.id;
    modelLabel.textContent = m.name;
    modelDot.className     = 'model-dot ' + m.dot;
  })();

  /* ── Search ── */
  msSearch.addEventListener('input', () => {
    const val = msSearch.value;
    msSearchClear.classList.toggle('show', val.length > 0);
    renderModels(val);
  });
  msSearchClear.addEventListener('click', () => {
    msSearch.value = '';
    msSearchClear.classList.remove('show');
    renderModels('');
    msSearch.focus();
  });

  /* ══════════════════════════════════════════════
     FILE TYPE HELPERS
  ══════════════════════════════════════════════ */
  const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','svg','bmp','avif','ico','heic']);
  function isImageFile(f) {
    if (f.type && f.type.startsWith('image/')) return true;
    return IMAGE_EXTS.has(f.name.split('.').pop().toLowerCase());
  }
  function docMeta(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const map = {
      pdf:{ label:'PDF', color:'var(--fc-pdf)' }, zip:{ label:'ZIP', color:'var(--fc-zip)' },
      tar:{ label:'TAR', color:'var(--fc-zip)' }, gz :{ label:'GZ',  color:'var(--fc-zip)' },
      txt:{ label:'TXT', color:'var(--fc-txt)' }, md :{ label:'MD',  color:'var(--fc-txt)' },
      csv:{ label:'CSV', color:'#10b981' },
      env:{ label:'ENV', color:'var(--fc-env)' },
      doc:{ label:'DOC', color:'var(--fc-doc)' }, docx:{ label:'DOC', color:'var(--fc-doc)' },
      xls:{ label:'XLS', color:'#10b981' }, xlsx:{ label:'XLS', color:'#10b981' },
      ppt:{ label:'PPT', color:'#f97316' }, pptx:{ label:'PPT', color:'#f97316' },
      js :{ label:'JS',  color:'var(--fc-code)' }, ts:{ label:'TS',  color:'#3b82f6' },
      py :{ label:'PY',  color:'#f59e0b' }, json:{ label:'JSON',color:'var(--fc-code)' },
      html:{ label:'HTML',color:'#f97316' }, css:{ label:'CSS', color:'#06b6d4' },
      mp3:{ label:'MP3', color:'#ec4899' }, mp4:{ label:'MP4', color:'#8b5cf6' },
    };
    return map[ext] || { label:(ext.toUpperCase().slice(0,4)||'FILE'), color:'var(--fc-default)' };
  }
  function docIconSVG(ext) {
    const e = (ext||'').toLowerCase();
    if (['zip','tar','gz'].includes(e)) return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
    if (['js','ts','py','json','html','css'].includes(e)) return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    if (['mp3','mp4','wav'].includes(e)) return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }

  /* ══════════════════════════════════════════════
     ATTACH MENU ACTIONS
  ══════════════════════════════════════════════ */
  attachFile.addEventListener('click', () => { closeAttachMenu(); fileInputDoc.click(); });
  attachImage.addEventListener('click', () => { closeAttachMenu(); fileInputImg.click(); });
  attachCamera.addEventListener('click', () => { closeAttachMenu(); openCamera(); });

  fileInputDoc.addEventListener('change', () => { handleFiles(Array.from(fileInputDoc.files)); fileInputDoc.value=''; });
  fileInputImg.addEventListener('change', () => { handleFiles(Array.from(fileInputImg.files)); fileInputImg.value=''; });

  function handleFiles(files) {
    files.forEach(file => {
      const id = ++fcIdCounter;
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = e => {
          const entry = { id, file, dataUrl:e.target.result, isImage:true };
          stagedFiles.push(entry);
          appendCard(entry);
        };
        reader.readAsDataURL(file);
      } else {
        const entry = { id, file, dataUrl:null, isImage:false };
        stagedFiles.push(entry);
        appendCard(entry);
      }
    });
  }

  /* ══════════════════════════════════════════════
     FILE CARDS
  ══════════════════════════════════════════════ */
  function appendCard(entry) {
    const card = buildCard(entry);
    fileStrip.appendChild(card);
    fileStrip.classList.add('has-files');
    attachBtn.classList.add('has-files');
    updateSendBtn();
  }

  function buildCard({ id, file, dataUrl, isImage }) {
    const card = document.createElement('div');
    card.className = 'fc ' + (isImage ? 'fc-image' : 'fc-doc-wrap');
    card.dataset.fcId = id;
    card.setAttribute('role','listitem');

    if (isImage) {
      card.classList.add('fc-image');
      const img = document.createElement('img');
      img.className = 'fc-thumb'; img.src = dataUrl; img.alt = file.name; img.title = file.name;
      img.addEventListener('click', () => openImgModal(dataUrl));
      card.appendChild(img);
    } else {
      const ext  = file.name.split('.').pop().toLowerCase();
      const meta = docMeta(file);
      const inner    = document.createElement('div'); inner.className = 'fc-doc';
      const iconWrap = document.createElement('div'); iconWrap.className = 'fc-doc-icon'; iconWrap.style.background = meta.color; iconWrap.innerHTML = docIconSVG(ext);
      const metaDiv  = document.createElement('div'); metaDiv.className = 'fc-doc-meta';
      const nameDiv  = document.createElement('div'); nameDiv.className = 'fc-doc-name'; nameDiv.textContent = file.name; nameDiv.title = file.name;
      const typeDiv  = document.createElement('div'); typeDiv.className = 'fc-doc-type'; typeDiv.textContent = meta.label;
      metaDiv.append(nameDiv, typeDiv);
      inner.append(iconWrap, metaDiv);
      card.appendChild(inner);
    }

    const rmBtn = document.createElement('button');
    rmBtn.className = 'fc-remove'; rmBtn.setAttribute('aria-label','Eliminar '+file.name);
    rmBtn.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener('click', e => { e.stopPropagation(); removeCard(id, card); });
    card.appendChild(rmBtn);
    return card;
  }

  function removeCard(id, cardEl) {
    cardEl.classList.add('removing');
    setTimeout(() => {
      cardEl.remove();
      stagedFiles = stagedFiles.filter(f => f.id !== id);
      if (!stagedFiles.length) { fileStrip.classList.remove('has-files'); attachBtn.classList.remove('has-files'); }
      updateSendBtn();
    }, 210);
  }
  function clearAllFiles() {
    fileStrip.innerHTML = '';
    fileStrip.classList.remove('has-files');
    attachBtn.classList.remove('has-files');
    stagedFiles = [];
  }

  /* ══════════════════════════════════════════════
     DRAG & DROP
  ══════════════════════════════════════════════ */
  inputBox.addEventListener('dragover',  e => { e.preventDefault(); inputBox.style.borderColor='#b5b4ae'; });
  inputBox.addEventListener('dragleave', ()  => { inputBox.style.borderColor=''; });
  inputBox.addEventListener('drop', e => {
    e.preventDefault(); inputBox.style.borderColor='';
    handleFiles(Array.from(e.dataTransfer.files));
  });

  /* ══════════════════════════════════════════════
     CAMERA
  ══════════════════════════════════════════════ */
  async function openCamera() {
    cameraError.classList.remove('show');
    cameraVideo.style.display = 'block';
    cameraModal.classList.add('visible');
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
      cameraVideo.srcObject = cameraStream;
    } catch (err) {
      cameraVideo.style.display = 'none';
      cameraError.classList.add('show');
      cameraErrMsg.innerHTML = err.name === 'NotAllowedError'
        ? 'Permiso denegado.<br/>Permite el acceso a la cámara en tu navegador.'
        : 'No se encontró ninguna cámara disponible.';
    }
  }
  function closeCamera() {
    cameraModal.classList.remove('visible');
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    cameraVideo.srcObject = null;
  }
  camClose.addEventListener('click', closeCamera);
  cameraModal.addEventListener('click', e => { if (e.target === cameraModal) closeCamera(); });

  camShutter.addEventListener('click', () => {
    if (!cameraStream) return;
    camFlash.classList.remove('flash');
    void camFlash.offsetWidth;
    camFlash.classList.add('flash');

    const vw = cameraVideo.videoWidth  || 640;
    const vh = cameraVideo.videoHeight || 480;
    camCanvas.width  = vw;
    camCanvas.height = vh;
    camCanvas.getContext('2d').drawImage(cameraVideo, 0, 0, vw, vh);

    camCanvas.toBlob(blob => {
      if (!blob) return;
      const now  = new Date();
      const name = `foto_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}.jpg`;
      const file = new File([blob], name, { type:'image/jpeg' });
      const reader = new FileReader();
      reader.onload = e => {
        const id    = ++fcIdCounter;
        const entry = { id, file, dataUrl:e.target.result, isImage:true };
        stagedFiles.push(entry);
        appendCard(entry);
        updateSendBtn();
      };
      reader.readAsDataURL(file);
      closeCamera();
    }, 'image/jpeg', 0.92);
  });

  /* ══════════════════════════════════════════════
     IMAGE PREVIEW MODAL
  ══════════════════════════════════════════════ */
  function openImgModal(src) { modalImg.src = src; imgModal.classList.add('visible'); }
  function closeImgModal() {
    imgModal.classList.remove('visible');
    setTimeout(() => { modalImg.src=''; }, 300);
  }
  modalClose.addEventListener('click', closeImgModal);
  imgModal.addEventListener('click', e => { if (e.target === imgModal) closeImgModal(); });

  /* ══════════════════════════════════════════════
     TEXTAREA
  ══════════════════════════════════════════════ */
  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    updateSendBtn();
  }
  function updateSendBtn() {
    sendBtn.disabled = (input.value.trim() === '' && stagedFiles.length === 0);
  }
  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);
  window.fillInput = text => { input.value = text; resizeInput(); input.focus(); };

  /* ══════════════════════════════════════════════
     NEW CHAT
  ══════════════════════════════════════════════ */
  btnNew.addEventListener('click', startNewChat);

  /* ══════════════════════════════════════════════
     SEND MESSAGE
  ══════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════
     AUTH GUARD + PROFILE INIT
  ══════════════════════════════════════════════ */

  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('aurx_user') || '{}'); } catch { return {}; }
  }

  function logout() {
    // Marca el momento de salida para el circuit-breaker de checkAuth
    sessionStorage.setItem('aurx_guard_ts', Date.now().toString());
    localStorage.removeItem('aurx_session');
    localStorage.removeItem('aurx_user');
    // Pide al servidor que limpie la cookie httpOnly (JS no puede borrarla directamente)
    fetch(API_BASE + '/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(function () {
      location.replace('/login');
    });
  }

  // ── Circuit-breaker: evita bucle de redirección ──────────────
  // Si se redirigió a /login en los últimos 4 s (logout reciente),
  // no volvemos a redirigir desde aquí.
  (function checkAuth() {
    const hasSession = localStorage.getItem('aurx_session');
    if (hasSession) return; // indicador de sesión presente → continúa

    const lastRedirect = parseInt(sessionStorage.getItem('aurx_guard_ts') || '0', 10);
    const esReciente   = (Date.now() - lastRedirect) < 4000;

    if (esReciente) {
      // Vinimos de un logout válido; borramos la marca para no bloquear futuros logins
      sessionStorage.removeItem('aurx_guard_ts');
    }

    // Redirige a login (register si es primera vez, login si venía de logout)
    location.replace('/login');
  })();

  // Fill in profile info from stored session
  (function loadProfile() {
    const user    = getStoredUser();
    const name    = user.name  || 'Usuario';
    const email   = user.email || '';
    const initial = name.charAt(0).toUpperCase();

    const elName   = document.getElementById('profile-name');
    const elEmail  = document.getElementById('profile-email');
    const elAvatar = document.getElementById('profile-avatar');
    const heroSub  = document.querySelector('.hero-sub');

    if (elName)   elName.textContent   = name;
    if (elEmail)  elEmail.textContent  = email;
    if (elAvatar) elAvatar.textContent = initial;
    if (heroSub)  heroSub.textContent  = 'Hola, ' + name.split(' ')[0] + '. Pregunta lo que quieras.';

    // Render saved conversations on load
    renderSidebar();
  })();

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  /* ══════════════════════════════════════════════
     SEND MESSAGE — calls real API
  ══════════════════════════════════════════════ */
  function sendMessage() {
    const text = input.value.trim();
    if (!text && !stagedFiles.length) return;
    if (!chatActive) { chatActive = true; hero.style.display = 'none'; messages.classList.add('active'); }

    // Start a new conversation if needed
    if (!currentConvId) {
      currentConvId = genConvId();
      currentMsgs   = [];
    }

    const snapshot = [...stagedFiles];
    addMsg('user', text, snapshot, true);
    input.value = ''; input.style.height = 'auto';
    clearAllFiles(); updateSendBtn();

    // Show typing indicator
    const typingId = addTyping();

    fetch(API_BASE + '/api/ai/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, model: selectedModelId }),
    })
    .then(function (res) {
      if (res.status === 401) { logout(); return null; }
      return res.json();
    })
    .then(function (data) {
      removeTyping(typingId);
      if (!data) return;
      if (!data.success) {
        addMsg('ai', '⚠️ ' + (data.message || 'Error al obtener respuesta.'), [], true);
        return;
      }
      addMsg('ai', data.data.response, [], true);
    })
    .catch(function () {
      removeTyping(typingId);
      addMsg('ai', '⚠️ Error de conexión. Verifica tu red e intenta de nuevo.', [], true);
    });
  }

  /* ══════════════════════════════════════════════
     TYPING INDICATOR helpers
  ══════════════════════════════════════════════ */
  let _typingCounter = 0;

  function addTyping() {
    const id   = 'typing-' + (++_typingCounter);
    const wrap = document.createElement('div');
    wrap.className = 'msg ai';
    wrap.id = id;

    const av = document.createElement('div');
    av.className = 'msg-av'; av.textContent = 'A'; av.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    Object.assign(body.style, { display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-start', maxWidth:'100%', width:'100%' });

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    bubble.style.cssText = 'display:flex;gap:5px;align-items:center;padding:10px 0;';

    body.appendChild(bubble);
    wrap.append(av, body);
    messages.appendChild(wrap);
    requestAnimationFrame(() => chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }));
    return id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function addMsg(role, text, files, persist) {
    const wrap = document.createElement('div');
    wrap.className = 'msg ' + role;

    const av = document.createElement('div');
    av.className = 'msg-av'; av.textContent = role==='ai'?'A':'D'; av.setAttribute('aria-hidden','true');

    const body = document.createElement('div');
    Object.assign(body.style, { display:'flex', flexDirection:'column', gap:'6px',
      alignItems: role==='user'?'flex-end':'flex-start',
      maxWidth: role==='ai' ? '100%' : 'min(72%, 480px)',
      width: role==='ai' ? '100%' : 'auto' });

    if (files && files.length) {
      const row = document.createElement('div'); row.className = 'msg-files';
      files.forEach(({ file, dataUrl, isImage }) => {
        if (isImage) {
          const fc  = document.createElement('div'); fc.className = 'msg-fc';
          const img = document.createElement('img'); img.src=dataUrl; img.alt=file.name;
          fc.appendChild(img); fc.addEventListener('click', ()=>openImgModal(dataUrl));
          row.appendChild(fc);
        } else {
          const ext  = file.name.split('.').pop().toLowerCase();
          const meta = docMeta(file);
          const fc  = document.createElement('div'); fc.className = 'msg-fc msg-fc-doc';
          const ico = document.createElement('div'); ico.className='msg-fc-doc-icon'; ico.style.background=meta.color; ico.innerHTML=docIconSVG(ext);
          const nm  = document.createElement('div'); nm.className='msg-fc-doc-name'; nm.textContent=file.name; nm.title=file.name;
          fc.append(ico, nm); row.appendChild(fc);
        }
      });
      body.appendChild(row);
    }

    if (text) {
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      if (role === 'ai') {
        bubble.innerHTML = parseMarkdown(text);
      } else {
        bubble.textContent = text;
      }
      body.appendChild(bubble);
    }

    wrap.append(av, body); messages.appendChild(wrap);
    requestAnimationFrame(() => chatBody.scrollTo({ top:chatBody.scrollHeight, behavior:'smooth' }));

    // Track & persist
    if (persist && text) {
      currentMsgs.push({ role, text });
      persistConv();
    }
  }

  /* ══════════════════════════════════════════════
     MARKDOWN RENDERER
  ══════════════════════════════════════════════ */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inlineMd(text) {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g,     '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,         '<em>$1</em>')
      .replace(/~~(.*?)~~/g,         '<del>$1</del>')
      .replace(/`([^`]+)`/g,         '<code class="md-code">$1</code>');
  }

  function parseMarkdown(raw) {
    if (!raw) return '';
    const lines = raw.split('\n');
    let html = '';
    let i = 0;
    let inList = false;
    let listTag = 'ul';
    let inCodeBlock = false;
    let codeLang = '';
    let codeLines = [];

    function closeList() {
      if (inList) { html += `</${listTag}>`; inList = false; }
    }

    while (i < lines.length) {
      const line = lines[i];

      /* ── Fenced code block ── */
      const fenceMatch = line.trim().match(/^```(\w*)$/);
      if (fenceMatch && !inCodeBlock) {
        closeList();
        inCodeBlock = true;
        codeLang = fenceMatch[1] || '';
        codeLines = [];
        i++; continue;
      }
      if (inCodeBlock) {
        if (line.trim() === '```') {
          const langLabel = codeLang
            ? `<span class="md-code-lang">${esc(codeLang)}</span>` : '';
          html += `<div class="md-code-block">${langLabel}<pre><code>${esc(codeLines.join('\n'))}</code></pre></div>`;
          inCodeBlock = false; codeLines = []; codeLang = '';
        } else {
          codeLines.push(line);
        }
        i++; continue;
      }

      /* ── Horizontal rule ── */
      if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
        closeList();
        html += '<hr class="md-hr">';
        i++; continue;
      }

      /* ── H1 ── */
      if (line.startsWith('# ')) {
        closeList();
        html += `<h1 class="md-h1">${inlineMd(esc(line.slice(2)))}</h1>`;
        i++; continue;
      }

      /* ── H2 ── */
      if (line.startsWith('## ')) {
        closeList();
        html += `<h2 class="md-h2">${inlineMd(esc(line.slice(3)))}</h2>`;
        i++; continue;
      }

      /* ── H3 → card if followed by list items ── */
      if (line.startsWith('### ')) {
        closeList();
        const title = inlineMd(esc(line.slice(4)));
        let j = i + 1;
        const items = [];
        while (j < lines.length) {
          const l = lines[j].trim();
          if (l === '') { j++; continue; }
          if (/^[-*]\s/.test(l)) { items.push(inlineMd(esc(l.slice(2)))); j++; }
          else break;
        }
        if (items.length) {
          html += `<div class="md-card"><div class="md-card-title">${title}</div><ul class="md-card-list">${items.map(it => `<li>${it}</li>`).join('')}</ul></div>`;
          i = j;
        } else {
          html += `<h3 class="md-h3">${title}</h3>`;
          i++;
        }
        continue;
      }

      /* ── Numbered list ── */
      const olMatch = line.match(/^(\d+)\.\s(.+)/);
      if (olMatch) {
        if (!inList || listTag !== 'ol') { closeList(); html += '<ol class="md-ol">'; inList = true; listTag = 'ol'; }
        html += `<li>${inlineMd(esc(olMatch[2]))}</li>`;
        i++; continue;
      }

      /* ── Unordered list ── */
      if (/^[-*]\s/.test(line)) {
        if (!inList || listTag !== 'ul') { closeList(); html += '<ul class="md-list">'; inList = true; listTag = 'ul'; }
        html += `<li>${inlineMd(esc(line.slice(2)))}</li>`;
        i++; continue;
      }

      /* ── Blank line ── */
      if (line.trim() === '') {
        closeList();
        i++; continue;
      }

      /* ── Paragraph ── */
      closeList();
      html += `<p class="md-p">${inlineMd(esc(line))}</p>`;
      i++;
    }

    closeList();
    if (inCodeBlock && codeLines.length) {
      html += `<div class="md-code-block"><pre><code>${esc(codeLines.join('\n'))}</code></pre></div>`;
    }
    return html;
  }

  /* ══════════════════════════════════════════════
     PROVIDER FILTER DROPDOWN
     Simple filter list — matches chatlyai.app style.
     Clicking a provider filters the main model list.
  ══════════════════════════════════════════════ */

  // ── 1. Filter button ──────────────────────────
  const ppFilterBtn = document.createElement('button');
  ppFilterBtn.className = 'pp-filter-btn';
  ppFilterBtn.id        = 'pp-filter-btn';
  ppFilterBtn.setAttribute('aria-label',    'Filtrar por proveedor');
  ppFilterBtn.setAttribute('title',         'Filtrar por proveedor');
  ppFilterBtn.setAttribute('aria-haspopup', 'listbox');
  ppFilterBtn.setAttribute('aria-expanded', 'false');
  ppFilterBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="6"  x2="20" y2="6"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
    <span class="pp-active-dot" aria-hidden="true"></span>`;
  document.querySelector('.ms-search-box').appendChild(ppFilterBtn);

  // ── 2. Dropdown panel ─────────────────────────
  const ppPanel = document.createElement('div');
  ppPanel.className = 'provider-dropdown';
  ppPanel.id        = 'pp-panel';
  ppPanel.setAttribute('role',        'listbox');
  ppPanel.setAttribute('aria-label',  'Filtrar por proveedor');
  ppPanel.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ppPanel);

  // ── 3. Filter items data ──────────────────────
  const FILTER_ITEMS = [
    {
      id:    null,
      label: 'Todos',
      icon:  null,          // rendered as SVG shuffle icon
    },
    {
      id:    'openai',
      label: 'OpenAI',
      icon:  'openai',
    },
    {
      id:    'gemini',
      label: 'Google Gemini',
      icon:  'gemini',
    },
    {
      id:    'grok',
      label: 'Grok',
      icon:  'grok',
    },
    {
      id:    'claude',
      label: 'Anthropic',
      icon:  'claude',
    },
  ];

  // ── 4. State ──────────────────────────────────
  let ppActiveProvider = null;   // null = show all providers

  // ── 5. Render filter list ─────────────────────
  function renderFilterList() {
    ppPanel.innerHTML = `<span class="pp-dd-title">Proveedores</span>`;

    FILTER_ITEMS.forEach(item => {
      const btn = document.createElement('button');
      const isActive = item.id === ppActiveProvider;
      btn.className = 'pp-filter-item' + (isActive ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(isActive));

      // Icon: PNG img or fallback SVG for "Todos"
      const iconHTML = item.icon
        ? `<span class="pp-fi-icon"><img src="assets/icons/${item.icon}.png" alt="${item.label}"></span>`
        : `<span class="pp-fi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
           </span>`;

      btn.innerHTML = `
        ${iconHTML}
        <span class="pp-fi-label">${item.label}</span>
        <span class="pp-fi-check" aria-hidden="true">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>`;

      btn.addEventListener('click', () => applyProviderFilter(item.id));
      ppPanel.appendChild(btn);
    });
  }

  // ── 6. Apply filter ───────────────────────────
  function applyProviderFilter(providerId) {
    ppActiveProvider = providerId;

    // Mark filter button as having an active filter (shows indicator dot)
    if (providerId !== null) {
      ppFilterBtn.classList.add('has-filter');
    } else {
      ppFilterBtn.classList.remove('has-filter');
    }

    closeProviderPopup();

    // Re-render the main model list with the new provider filter
    if (msPanel.classList.contains('open')) {
      renderModels(msSearch.value);
    }
  }

  // ── 7. Positioning ────────────────────────────
  function positionDropdown() {
    const btnRect = ppFilterBtn.getBoundingClientRect();
    const ddW     = Math.min(240, window.innerWidth * 0.88);
    const gap     = 8;

    // Align right edge of dropdown to right edge of button
    let left = btnRect.right - ddW;
    if (left < 8) left = 8;

    // Place below button; flip above if space is tight
    let top = btnRect.bottom + gap;
    const ddH = FILTER_ITEMS.length * 52 + 40; // estimated height
    if (top + ddH > window.innerHeight - 12) {
      top = btnRect.top - gap - ddH;
    }
    if (top < 8) top = 8;

    ppPanel.style.left  = left + 'px';
    ppPanel.style.top   = top  + 'px';
    ppPanel.style.width = ddW  + 'px';
  }

  // ── 8. Open / Close ───────────────────────────
  function openProviderPopup() {
    renderFilterList();
    positionDropdown();
    ppPanel.classList.add('open');
    ppFilterBtn.classList.add('active');
    ppFilterBtn.setAttribute('aria-expanded', 'true');
    ppPanel.setAttribute('aria-hidden', 'false');
  }

  function closeProviderPopup() {
    ppPanel.classList.remove('open');
    ppFilterBtn.classList.remove('active');
    ppFilterBtn.setAttribute('aria-expanded', 'false');
    ppPanel.setAttribute('aria-hidden', 'true');
  }

  // ── 9. Events ─────────────────────────────────
  ppFilterBtn.addEventListener('click', e => {
    e.stopPropagation();
    ppPanel.classList.contains('open') ? closeProviderPopup() : openProviderPopup();
  });

  document.addEventListener('click', e => {
    if (ppPanel.classList.contains('open') &&
        !ppPanel.contains(e.target) &&
        e.target !== ppFilterBtn &&
        !ppFilterBtn.contains(e.target)) {
      closeProviderPopup();
    }
  });

  window.addEventListener('resize', () => {
    if (ppPanel.classList.contains('open')) positionDropdown();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ppPanel.classList.contains('open')) closeProviderPopup();
  });

})();
