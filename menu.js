/* ═══════════════════════════════════════════════════════════
   AuraAI — menu.js
   Popup menu: Comunidad · Notificaciones · Ayuda · Configuración
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── MOCK DATA ─────────────────────────────────────────── */
  const COMMUNITIES = [
    { id: 1, emoji: '🚀', name: 'Startup Founders', desc: 'Emprendedores construyendo el futuro. Comparte ideas, aprendizajes y feedback.', members: 1284 },
    { id: 2, emoji: '🎨', name: 'Diseño & UX',      desc: 'Comunidad para diseñadores, exploradores de interfaces y amantes de lo visual.', members: 873 },
    { id: 3, emoji: '🧠', name: 'IA & Machine Learning', desc: 'Últimas noticias, papers y proyectos sobre inteligencia artificial.', members: 2410 },
    { id: 4, emoji: '💻', name: 'Dev Zone',          desc: 'Desarrolladores de todos los stacks. Open source, proyectos y ayuda mutua.', members: 3192 },
    { id: 5, emoji: '📚', name: 'Aprendizaje',       desc: 'Recursos, cursos y metodologías para aprender cualquier cosa más rápido.', members: 640 },
  ];

  const NOTIFICATIONS = [
    { id: 1, icon: '💬', title: 'Nueva respuesta',   text: 'Alguien respondió a tu post en Dev Zone.', time: 'hace 5 min',  unread: true  },
    { id: 2, icon: '🔔', title: 'Bienvenido a AuraAI', text: 'Tu cuenta está lista. Explora todas las funciones disponibles.', time: 'hace 2h', unread: true  },
    { id: 3, icon: '🚀', title: 'Comunidad destacada', text: 'IA & Machine Learning ha publicado contenido nuevo.', time: 'ayer', unread: false },
  ];

  /* ─── STATE ──────────────────────────────────────────────── */
  let currentSection = 'comunidad';
  let menuOpen       = false;
  let joinedIds      = new Set(JSON.parse(localStorage.getItem('aura_joined_communities') || '[]'));
  let createFormOpen = false;
  let toastTimer     = null;

  const settings = {
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    privateAccount:       localStorage.getItem('privateAccount') === 'true',
  };

  /* ─── INJECT STYLESHEET & DOM ────────────────────────────── */
  function boot() {
    // 1. Load CSS
    const link  = document.createElement('link');
    link.rel    = 'stylesheet';
    link.href   = 'css/menu.css';
    document.head.appendChild(link);

    // 2. Inject trigger button — replace the empty 36px spacer in topbar
    const topbar  = document.querySelector('.topbar');
    const spacer  = topbar && topbar.querySelector('[aria-hidden="true"]');
    const wrap    = document.createElement('div');
    wrap.className = 'menu-trigger-wrap';
    wrap.innerHTML = `
      <button class="icon-btn" id="menu-trigger-btn" aria-label="Menú" title="Menú">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
      <div class="menu-notif-badge" id="menu-notif-badge"></div>
    `;
    if (spacer) {
      spacer.replaceWith(wrap);
    } else if (topbar) {
      topbar.appendChild(wrap);
    }

    // 3. Inject overlay
    const overlay    = document.createElement('div');
    overlay.id       = 'menu-overlay';
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);

    // 4. Inject panel
    const panel   = document.createElement('div');
    panel.id      = 'menu-panel';
    panel.className = 'menu-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Menú de opciones');
    panel.innerHTML = buildPanelShell();
    document.body.appendChild(panel);

    // 5. Inject toast
    const toast    = document.createElement('div');
    toast.id       = 'help-toast';
    toast.className = 'help-toast';
    document.body.appendChild(toast);

    bindEvents();
    updateBadge();
  }

  /* ─── PANEL SHELL ────────────────────────────────────────── */
  function buildPanelShell() {
    const tabs = [
      { id: 'comunidad',      icon: tabIcon('comunidad'),      label: 'Comunidad'      },
      { id: 'notificaciones', icon: tabIcon('notificaciones'), label: 'Notificaciones' },
      { id: 'ayuda',          icon: tabIcon('ayuda'),          label: 'Ayuda'          },
      { id: 'configuracion',  icon: tabIcon('configuracion'),  label: 'Configuración'  },
    ];

    const tabsHTML = tabs.map(t => `
      <button class="menu-tab${t.id === currentSection ? ' active' : ''}"
              data-section="${t.id}" aria-selected="${t.id === currentSection}">
        ${t.icon}
        ${t.label}
        <span class="menu-tab-dot${t.id === 'notificaciones' ? ' visible' : ''}" id="tab-dot-${t.id}"></span>
      </button>
    `).join('');

    return `
      <div class="menu-handle" aria-hidden="true"></div>
      <div class="menu-header">
        <span class="menu-header-title" id="menu-header-title">Comunidad</span>
        <button class="menu-close-btn" id="menu-close-btn" aria-label="Cerrar menú">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="menu-tabs" role="tablist">${tabsHTML}</div>
      <div class="menu-body" id="menu-body" role="tabpanel"></div>
    `;
  }

  function tabIcon(id) {
    const icons = {
      comunidad:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      notificaciones: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      ayuda:          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      configuracion:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    };
    return icons[id] || '';
  }

  /* ─── OPEN / CLOSE ───────────────────────────────────────── */
  function openMenu() {
    menuOpen = true;
    document.getElementById('menu-overlay').classList.add('show');
    document.getElementById('menu-panel').classList.add('open');
    renderSection(currentSection);
  }

  function closeMenu() {
    menuOpen = false;
    document.getElementById('menu-overlay').classList.remove('show');
    document.getElementById('menu-panel').classList.remove('open');
  }

  /* ─── RENDER SECTION ─────────────────────────────────────── */
  function renderSection(section) {
    currentSection = section;

    // Update tabs
    document.querySelectorAll('.menu-tab').forEach(btn => {
      const active = btn.dataset.section === section;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    // Update header title
    const titles = {
      comunidad:      'Comunidad',
      notificaciones: 'Notificaciones',
      ayuda:          'Ayuda',
      configuracion:  'Configuración',
    };
    const titleEl = document.getElementById('menu-header-title');
    if (titleEl) titleEl.textContent = titles[section] || section;

    // Render body
    const body = document.getElementById('menu-body');
    if (!body) return;
    body.scrollTop = 0;

    switch (section) {
      case 'comunidad':      body.innerHTML = renderComunidad();      bindComunidadEvents();      break;
      case 'notificaciones': body.innerHTML = renderNotificaciones(); bindNotifEvents();          break;
      case 'ayuda':          body.innerHTML = renderAyuda();          bindAyudaEvents();          break;
      case 'configuracion':  body.innerHTML = renderConfiguracion();  bindConfigEvents();         break;
    }
  }

  /* ─── RENDER: COMUNIDAD ──────────────────────────────────── */
  function renderComunidad() {
    const cards = COMMUNITIES.map(c => {
      const joined = joinedIds.has(c.id);
      return `
        <div class="community-card${joined ? ' selected' : ''}" data-id="${c.id}">
          <div class="community-avatar" style="background:${avatarBg(c.id)}">${c.emoji}</div>
          <div class="community-info">
            <div class="community-name">${c.name}</div>
            <div class="community-desc">${c.desc}</div>
            <div class="community-members">${fmtNum(c.members)} miembros</div>
          </div>
          <button class="community-join-btn${joined ? ' joined' : ''}" data-join="${c.id}">
            ${joined ? 'Unido ✓' : 'Unirse'}
          </button>
        </div>
      `;
    }).join('');

    return `
      <div class="menu-section-header">
        <span class="menu-section-label">Comunidades</span>
        <button class="menu-btn-primary" id="btn-create-community">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Crear comunidad
        </button>
      </div>
      <div class="community-create-form${createFormOpen ? ' open' : ''}" id="create-form">
        <div class="menu-section-label" style="margin-bottom:10px">Nueva comunidad</div>
        <input type="text" class="menu-input" id="new-comm-name" placeholder="Nombre de la comunidad" maxlength="40" />
        <textarea class="menu-input" id="new-comm-desc" placeholder="Descripción breve…" rows="2"
          style="resize:none; height:62px; line-height:1.5"></textarea>
        <div class="menu-form-actions">
          <button class="menu-btn-ghost" id="cancel-create">Cancelar</button>
          <button class="menu-btn-primary" id="confirm-create">Crear</button>
        </div>
      </div>
      ${cards}
    `;
  }

  function bindComunidadEvents() {
    // Toggle create form
    const btnCreate = document.getElementById('btn-create-community');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        createFormOpen = !createFormOpen;
        renderSection('comunidad');
        setTimeout(() => {
          const input = document.getElementById('new-comm-name');
          if (input) input.focus();
        }, 50);
      });
    }
    const cancelBtn = document.getElementById('cancel-create');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { createFormOpen = false; renderSection('comunidad'); });

    const confirmBtn = document.getElementById('confirm-create');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const name = (document.getElementById('new-comm-name')?.value || '').trim();
        const desc = (document.getElementById('new-comm-desc')?.value || '').trim();
        if (!name) { document.getElementById('new-comm-name')?.focus(); return; }
        const newComm = {
          id:      Date.now(),
          emoji:   '🌐',
          name,
          desc:    desc || 'Una nueva comunidad en AuraAI.',
          members: 1,
        };
        COMMUNITIES.unshift(newComm);
        joinedIds.add(newComm.id);
        persistJoined();
        createFormOpen = false;
        renderSection('comunidad');
        showToast(`Comunidad "${name}" creada ✓`);
      });
    }

    // Join / leave buttons
    document.querySelectorAll('[data-join]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.join);
        if (joinedIds.has(id)) {
          joinedIds.delete(id);
        } else {
          joinedIds.add(id);
        }
        persistJoined();
        renderSection('comunidad');
      });
    });

    // Card click (select community)
    document.querySelectorAll('.community-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        joinedIds.add(id);
        persistJoined();
        renderSection('comunidad');
        showToast('Comunidad seleccionada');
      });
    });
  }

  function persistJoined() {
    localStorage.setItem('aura_joined_communities', JSON.stringify([...joinedIds]));
  }

  /* ─── RENDER: NOTIFICACIONES ─────────────────────────────── */
  function renderNotificaciones() {
    if (!NOTIFICATIONS.length) {
      return `
        <div class="notif-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="notif-empty-text">Sin notificaciones por el momento</div>
          <div class="notif-empty-sub">Te avisaremos cuando haya novedades</div>
        </div>
      `;
    }

    const items = NOTIFICATIONS.map(n => `
      <div class="notif-item${n.unread ? ' unread' : ''}" data-notif="${n.id}">
        <div class="notif-icon">${n.icon}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
      </div>
    `).join('');

    const hasUnread = NOTIFICATIONS.some(n => n.unread);
    const header = hasUnread
      ? `<div class="menu-section-header">
           <span class="menu-section-label">${NOTIFICATIONS.filter(n=>n.unread).length} sin leer</span>
           <button class="menu-btn-ghost" id="mark-all-read" style="font-size:11.5px;padding:5px 10px">Marcar todo leído</button>
         </div>`
      : `<div class="menu-section-label" style="margin-bottom:12px">Recientes</div>`;

    return header + items;
  }

  function bindNotifEvents() {
    document.querySelectorAll('[data-notif]').forEach(item => {
      item.addEventListener('click', () => {
        const id = Number(item.dataset.notif);
        const notif = NOTIFICATIONS.find(n => n.id === id);
        if (notif && notif.unread) {
          notif.unread = false;
          renderSection('notificaciones');
          updateBadge();
        }
      });
    });
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        NOTIFICATIONS.forEach(n => { n.unread = false; });
        renderSection('notificaciones');
        updateBadge();
      });
    }
  }

  /* ─── RENDER: AYUDA ──────────────────────────────────────── */
  function renderAyuda() {
    const items = [
      { icon: bookIcon(),   label: 'Centro de ayuda', action: 'help-center' },
      { icon: mailIcon(),   label: 'Contacto',        action: 'contact'     },
      { icon: faqIcon(),    label: 'FAQ',              action: 'faq'         },
    ];

    return items.map(it => `
      <div class="help-item" data-action="${it.action}">
        <div class="help-item-icon">${it.icon}</div>
        <div class="help-item-label">${it.label}</div>
        <div class="help-item-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    `).join('');
  }

  function bindAyudaEvents() {
    const messages = {
      'help-center': '📚 Centro de ayuda próximamente',
      'contact':     '✉️ Contacto: soporte@aurai.app',
      'faq':         '❓ FAQ próximamente disponible',
    };
    document.querySelectorAll('[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        showToast(messages[item.dataset.action] || '¡Próximamente!');
      });
    });
  }

  /* ─── RENDER: CONFIGURACIÓN ──────────────────────────────── */
  function renderConfiguracion() {
    return `
      <div class="config-profile-card">
        <div class="config-avatar">D</div>
        <div class="config-profile-info">
          <div class="config-name">David</div>
          <div class="config-user">@david_aurai</div>
        </div>
      </div>

      <div class="menu-divider-label">Información de la cuenta</div>
      <div class="config-rows">
        <div class="config-row">
          <div>
            <div class="config-row-label">Correo electrónico</div>
            <div class="config-row-value">david****@gmail.com</div>
          </div>
          <div class="config-row-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
        <div class="config-row">
          <div>
            <div class="config-row-label">Contraseña</div>
            <div class="config-row-value" style="letter-spacing:3px">••••••••</div>
          </div>
          <div class="config-row-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
      </div>

      <div class="menu-divider-label">Preferencias</div>
      <div class="config-toggles">
        <div class="config-toggle-row">
          <div>
            <div class="config-toggle-label">Activar notificaciones</div>
            <div class="config-toggle-desc">Recibe alertas de actividad</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-notif" ${settings.notificationsEnabled ? 'checked' : ''} />
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="config-toggle-row">
          <div>
            <div class="config-toggle-label">Cuenta privada</div>
            <div class="config-toggle-desc">Solo tus seguidores te ven</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-private" ${settings.privateAccount ? 'checked' : ''} />
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
        </div>
      </div>
    `;
  }

  function bindConfigEvents() {
    const notifToggle   = document.getElementById('toggle-notif');
    const privateToggle = document.getElementById('toggle-private');

    if (notifToggle) {
      notifToggle.addEventListener('change', () => {
        settings.notificationsEnabled = notifToggle.checked;
        localStorage.setItem('notificationsEnabled', String(notifToggle.checked));
        showToast(notifToggle.checked ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
      });
    }
    if (privateToggle) {
      privateToggle.addEventListener('change', () => {
        settings.privateAccount = privateToggle.checked;
        localStorage.setItem('privateAccount', String(privateToggle.checked));
        showToast(privateToggle.checked ? 'Cuenta privada activada' : 'Cuenta privada desactivada');
      });
    }
  }

  /* ─── BADGE & TOAST ──────────────────────────────────────── */
  function updateBadge() {
    const unread = NOTIFICATIONS.filter(n => n.unread).length;
    const badge  = document.getElementById('menu-notif-badge');
    const tabDot = document.getElementById('tab-dot-notificaciones');
    if (badge)  badge.classList.toggle('visible', unread > 0);
    if (tabDot) tabDot.classList.toggle('visible', unread > 0);
  }

  function showToast(msg) {
    const toast = document.getElementById('help-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ─── EVENTS ─────────────────────────────────────────────── */
  function bindEvents() {
    // Trigger button
    document.addEventListener('click', e => {
      const triggerBtn = e.target.closest('#menu-trigger-btn');
      if (triggerBtn) { menuOpen ? closeMenu() : openMenu(); return; }

      // Close button
      if (e.target.closest('#menu-close-btn')) { closeMenu(); return; }

      // Overlay click
      if (e.target.id === 'menu-overlay') { closeMenu(); return; }

      // Tab clicks
      const tab = e.target.closest('.menu-tab');
      if (tab && document.getElementById('menu-panel')?.classList.contains('open')) {
        renderSection(tab.dataset.section);
        return;
      }
    });

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    });
  }

  /* ─── HELPERS ────────────────────────────────────────────── */
  function avatarBg(id) {
    const palettes = ['#fef3c7','#dbeafe','#fce7f3','#d1fae5','#ede9fe'];
    return palettes[(id - 1) % palettes.length];
  }
  function fmtNum(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }
  function bookIcon() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
  }
  function mailIcon() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  }
  function faqIcon() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ─── PUBLIC API ─────────────────────────────────────────── */
  window.AuraMenu = { openMenu, closeMenu, renderSection };

})();
