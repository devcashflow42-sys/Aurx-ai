/* ═══════════════════════════════════════════════════════════
   AuraAI — fullscreen-nav.js

   Architecture
   ─────────────────────────────────────────────────────────
   body
   ├── .shell  (existing home UI — untouched)
   │     ├── .sidebar      (drawer — nav items injected at bottom)
   │     └── .main         (chat area)
   └── #app-screens  (NEW — fixed overlay, z-index 200)
         ├── .app-screen[data-screen="comunidad"]
         ├── .app-screen[data-screen="notificaciones"]
         ├── .app-screen[data-screen="ayuda"]
         └── .app-screen[data-screen="configuracion"]

   Flow
   ─────────────────────────────────────────────────────────
   1. User clicks nav item in drawer
   2. Drawer closes
   3. Full-screen page slides in from right   → openScreen()
   4. User taps ← back
   5. Page slides out to the right            → goBack()
   6. Home UI is restored
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── DATA ──────────────────────────────────────────────── */

  const COMMUNITIES = [
    { id: 1, emoji: '🧠', name: 'IA & Machine Learning', desc: 'Papers, modelos y proyectos de inteligencia artificial.', members: 2410 },
    { id: 2, emoji: '💻', name: 'Dev Zone',              desc: 'Open source y ayuda entre desarrolladores de todos los stacks.', members: 3192 },
    { id: 3, emoji: '🚀', name: 'Startup Founders',      desc: 'Emprendedores construyendo el futuro juntos.', members: 1284 },
    { id: 4, emoji: '🎨', name: 'Diseño & UX',           desc: 'Interfaces, tipografía y exploración visual.', members: 873 },
    { id: 5, emoji: '📚', name: 'Aprendizaje',           desc: 'Metodologías para aprender cualquier cosa más rápido.', members: 640 },
  ];

  const NOTIFICATIONS = [
    { id: 1, icon: '💬', title: 'Nueva respuesta',     text: 'Alguien respondió a tu post en Dev Zone.',   time: 'hace 5 min', unread: true  },
    { id: 2, icon: '🔔', title: 'Bienvenido a AuraAI', text: 'Tu cuenta está lista. ¡Explora todas las funciones!', time: 'hace 2h', unread: true  },
    { id: 3, icon: '🚀', title: 'Comunidad destacada', text: 'IA & Machine Learning publicó contenido nuevo.', time: 'ayer', unread: false },
  ];

  const HELP_ITEMS = [
    { id: 'centro',   label: 'Centro de ayuda', desc: 'Guías y tutoriales',        icon: bookSVG()  },
    { id: 'contacto', label: 'Contacto',         desc: 'soporte@aurai.app',         icon: mailSVG()  },
    { id: 'faq',      label: 'FAQ',              desc: 'Preguntas frecuentes',      icon: helpSVG()  },
  ];

  const NAV_DEFS = [
    { id: 'comunidad',      label: 'Comunidad',     icon: communitySVG() },
    { id: 'notificaciones', label: 'Notificaciones', icon: bellSVG()      },
    { id: 'ayuda',          label: 'Ayuda',          icon: helpSVG()      },
    { id: 'configuracion',  label: 'Configuración',  icon: gearSVG()      },
  ];

  /* ─── STATE ─────────────────────────────────────────────── */

  let activeScreen  = null;
  let selectedComm  = null;
  let formOpen      = false;
  let toastTimer    = null;

  const settings = {
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    privateAccount:       localStorage.getItem('privateAccount') === 'true',
  };

  /* ─── ELEMENTS ──────────────────────────────────────────── */

  let $appScreens = null;
  let $toast      = null;

  /* ═══════════════════════════════════════════════════════════
     BOOT
  ════════════════════════════════════════════════════════════ */

  function boot () {
    // 1. Inject nav items into drawer's .sb-body
    injectDrawerItems();

    // 2. Build #app-screens container + all screen shells
    $appScreens = buildAppScreens();
    document.body.appendChild($appScreens);

    // 3. Toast element
    $toast = Object.assign(document.createElement('div'), { className: 'asc-toast' });
    document.body.appendChild($toast);

    // 4. Hardware back / ESC
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && activeScreen) goBack(); });
  }

  /* ═══════════════════════════════════════════════════════════
     DRAWER NAV ITEMS
  ════════════════════════════════════════════════════════════ */

  function injectDrawerItems () {
    const sbBody = document.querySelector('.sb-body');
    if (!sbBody) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="sb-divider"></div>
      <div class="fsn-nav-divider-label">Menú</div>
      ${NAV_DEFS.map(d => `
        <div class="fsn-nav-item" data-nav="${d.id}" role="button" tabindex="0">
          <div class="fsn-nav-icon">${d.icon}</div>
          <span class="fsn-nav-label">${d.label}</span>
          <span class="fsn-nav-badge" id="fsn-badge-${d.id}"></span>
          <svg class="fsn-nav-arrow" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>`).join('')}
    `;

    sbBody.appendChild(wrap);

    wrap.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => openScreen(el.dataset.nav));
    });

    syncBadge();
  }

  function syncBadge () {
    const count = NOTIFICATIONS.filter(n => n.unread).length;
    const el = document.getElementById('fsn-badge-notificaciones');
    if (!el) return;
    el.textContent = count > 0 ? count : '';
    el.classList.toggle('on', count > 0);
  }

  /* ═══════════════════════════════════════════════════════════
     APP SCREENS — fixed container built once, content re-rendered
  ════════════════════════════════════════════════════════════ */

  function buildAppScreens () {
    const container = document.createElement('div');
    container.id = 'app-screens';

    const TITLES = { comunidad: 'Comunidad', notificaciones: 'Notificaciones', ayuda: 'Ayuda', configuracion: 'Configuración' };

    NAV_DEFS.forEach(({ id }) => {
      const screen = document.createElement('div');
      screen.className = 'app-screen';
      screen.dataset.screen = id;
      screen.innerHTML = `
        <div class="app-screen-hd">
          <button class="icon-btn asc-back" aria-label="Volver" data-back="${id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="app-screen-hd-title">${TITLES[id]}</span>
          <div class="app-screen-hd-spacer"></div>
        </div>
        <div class="app-screen-body" id="asc-body-${id}"></div>
      `;

      screen.querySelector('.asc-back').addEventListener('click', goBack);
      container.appendChild(screen);
    });

    return container;
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
  ════════════════════════════════════════════════════════════ */

  function openScreen (name) {
    // 1. Close drawer first (fast)
    closeSidebar();

    // 2. Render fresh content into this screen
    const body = document.getElementById(`asc-body-${name}`);
    if (body) renderContent(name, body);

    // 3. Activate screen — tiny rAF delay so CSS transition fires
    const screen = $appScreens.querySelector(`.app-screen[data-screen="${name}"]`);
    if (!screen) return;

    $appScreens.classList.add('active');
    activeScreen = name;

    requestAnimationFrame(() => {
      screen.classList.add('is-active');
      screen.classList.remove('is-exiting');
    });
  }

  function goBack () {
    if (!activeScreen) return;

    const screen = $appScreens.querySelector(`.app-screen[data-screen="${activeScreen}"]`);
    if (!screen) return;

    // Slide screen out to the right
    screen.classList.remove('is-active');
    screen.classList.add('is-exiting');

    activeScreen = null;

    // After transition, deactivate container so it's pointer-events:none again
    setTimeout(() => {
      $appScreens.classList.remove('active');
      screen.classList.remove('is-exiting');
    }, 340);
  }

  /* Close drawer — trigger the existing close button */
  function closeSidebar () {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !sidebar.classList.contains('open')) return;

    // Simulate click on the sidebar's close button (chat-ai.js handles the rest)
    const closeBtn = document.getElementById('sb-close');
    if (closeBtn) { closeBtn.click(); return; }

    // Fallback: manually remove classes
    sidebar.classList.remove('open');
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.classList.remove('show'), 200);
    }
    const hamburger = document.getElementById('hamburger');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  }

  /* ═══════════════════════════════════════════════════════════
     CONTENT RENDERERS
  ════════════════════════════════════════════════════════════ */

  function renderContent (name, body) {
    body.scrollTop = 0;
    switch (name) {
      case 'comunidad':      renderComunidad(body);      break;
      case 'notificaciones': renderNotificaciones(body); break;
      case 'ayuda':          renderAyuda(body);          break;
      case 'configuracion':  renderConfiguracion(body);  break;
    }
  }

  /* ── COMUNIDAD ─────────────────────────────────────────── */

  function renderComunidad (body) {
    const cards = COMMUNITIES.map(c => `
      <div class="asc-comm-card${selectedComm === c.id ? ' selected' : ''}"
           data-comm="${c.id}" role="button" tabindex="0">
        <div class="asc-comm-emoji">${c.emoji}</div>
        <div class="asc-comm-info">
          <div class="asc-comm-name">${esc(c.name)}</div>
          <div class="asc-comm-desc">${esc(c.desc)}</div>
          <div class="asc-comm-members">${fmt(c.members)} miembros</div>
        </div>
        <div class="asc-comm-check">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>`).join('');

    body.innerHTML = `
      <div class="asc-toolbar">
        <span class="asc-section-label">${COMMUNITIES.length} comunidades</span>
        <button class="asc-primary-btn" id="asc-create-trigger">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Crear comunidad
        </button>
      </div>

      <div class="asc-create-form${formOpen ? ' open' : ''}" id="asc-create-form">
        <div class="asc-create-form-title">Nueva comunidad</div>
        <input  class="asc-inp" id="asc-new-name" type="text"
                placeholder="Nombre de la comunidad" maxlength="48" />
        <textarea class="asc-inp asc-inp-ta" id="asc-new-desc"
                  placeholder="Descripción breve…"></textarea>
        <div class="asc-form-actions">
          <button class="asc-btn" id="asc-form-cancel">Cancelar</button>
          <button class="asc-btn ok" id="asc-form-confirm">Crear</button>
        </div>
      </div>

      <div class="asc-comm-list">${cards}</div>
    `;

    // Toggle form
    body.querySelector('#asc-create-trigger').addEventListener('click', () => {
      formOpen = !formOpen;
      renderComunidad(body);
      if (formOpen) setTimeout(() => body.querySelector('#asc-new-name')?.focus(), 30);
    });

    // Cancel form
    body.querySelector('#asc-form-cancel')?.addEventListener('click', () => {
      formOpen = false;
      renderComunidad(body);
    });

    // Confirm create
    body.querySelector('#asc-form-confirm')?.addEventListener('click', () => {
      const name = (body.querySelector('#asc-new-name')?.value || '').trim();
      const desc = (body.querySelector('#asc-new-desc')?.value || '').trim();
      if (!name) { body.querySelector('#asc-new-name')?.focus(); return; }
      COMMUNITIES.unshift({ id: Date.now(), emoji: '🌐', name, desc: desc || 'Una nueva comunidad.', members: 1 });
      formOpen = false;
      renderComunidad(body);
      toast(`"${name}" creada ✓`);
    });

    // Select card
    body.querySelectorAll('[data-comm]').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.comm);
        selectedComm = (selectedComm === id) ? null : id;
        renderComunidad(body);
      });
    });
  }

  /* ── NOTIFICACIONES ────────────────────────────────────── */

  function renderNotificaciones (body) {
    const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

    if (!NOTIFICATIONS.length) {
      body.innerHTML = `
        <div class="asc-notif-empty">
          <div class="asc-notif-empty-icon">${bellSVG(40)}</div>
          <div class="asc-notif-empty-title">Sin notificaciones</div>
          <div class="asc-notif-empty-sub">
            Cuando haya actividad nueva, aparecerá aquí.
          </div>
        </div>`;
      return;
    }

    const toolbar = `
      <div class="asc-notif-toolbar">
        <span class="asc-notif-count">
          ${unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día ✓'}
        </span>
        ${unreadCount > 0
          ? `<button class="asc-mark-all" id="asc-mark-all">Marcar todo leído</button>`
          : ''}
      </div>`;

    const items = NOTIFICATIONS.map(n => `
      <div class="asc-notif-item${n.unread ? ' unread' : ''}" data-notif="${n.id}">
        <div class="asc-notif-icon-wrap">${n.icon}</div>
        <div class="asc-notif-body">
          <div class="asc-notif-title">${esc(n.title)}</div>
          <div class="asc-notif-text">${esc(n.text)}</div>
          <div class="asc-notif-time">${n.time}</div>
        </div>
        ${n.unread ? '<div class="asc-notif-dot"></div>' : ''}
      </div>`).join('');

    body.innerHTML = toolbar + `<div class="asc-notif-list">${items}</div>`;

    body.querySelector('#asc-mark-all')?.addEventListener('click', () => {
      NOTIFICATIONS.forEach(n => { n.unread = false; });
      syncBadge();
      renderNotificaciones(body);
    });

    body.querySelectorAll('[data-notif]').forEach(el => {
      el.addEventListener('click', () => {
        const n = NOTIFICATIONS.find(x => x.id === Number(el.dataset.notif));
        if (n?.unread) { n.unread = false; syncBadge(); renderNotificaciones(body); }
      });
    });
  }

  /* ── AYUDA ──────────────────────────────────────────────── */

  function renderAyuda (body) {
    const arrowSVG = `
      <svg class="asc-help-item-arrow" width="15" height="15" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>`;

    const msgs = { centro: '📚 Centro de ayuda próximamente', contacto: '✉️  soporte@aurai.app', faq: '❓ FAQ próximamente disponible' };

    body.innerHTML = `
      <div class="asc-help-list">
        ${HELP_ITEMS.map(item => `
          <div class="asc-help-item" data-help="${item.id}" role="button" tabindex="0">
            <div class="asc-help-item-icon">${item.icon}</div>
            <div class="asc-help-item-label">${item.label}</div>
            ${arrowSVG}
          </div>`).join('')}
      </div>`;

    body.querySelectorAll('[data-help]').forEach(el => {
      el.addEventListener('click', () => toast(msgs[el.dataset.help]));
    });
  }

  /* ── CONFIGURACIÓN ──────────────────────────────────────── */

  function renderConfiguracion (body) {
    body.innerHTML = `
      <div class="asc-cfg-section">
        <div class="asc-cfg-label">Perfil</div>
        <div class="asc-cfg-profile">
          <div class="asc-cfg-avatar">D</div>
          <div>
            <div class="asc-cfg-name">David</div>
            <div class="asc-cfg-user">@david</div>
          </div>
        </div>
      </div>

      <div class="asc-cfg-section">
        <div class="asc-cfg-label">Cuenta</div>
        <div class="asc-cfg-rows">
          <div class="asc-cfg-row">
            <span class="asc-cfg-row-key">Correo electrónico</span>
            <span class="asc-cfg-row-val">david****@gmail.com</span>
          </div>
          <div class="asc-cfg-row">
            <span class="asc-cfg-row-key">Contraseña</span>
            <span class="asc-cfg-row-val" style="letter-spacing:3px">••••••••</span>
          </div>
        </div>
      </div>

      <div class="asc-cfg-section">
        <div class="asc-cfg-label">Preferencias</div>
        <div class="asc-cfg-toggles">
          <div class="asc-cfg-toggle-row">
            <div class="asc-cfg-toggle-info">
              <div class="asc-cfg-toggle-label">Activar notificaciones</div>
              <div class="asc-cfg-toggle-desc">Recibe alertas de actividad</div>
            </div>
            <label class="asc-sw" onclick="event.stopPropagation()">
              <input type="checkbox" id="asc-sw-notif"
                     ${settings.notificationsEnabled ? 'checked' : ''} />
              <div class="asc-sw-track"></div>
              <div class="asc-sw-thumb"></div>
            </label>
          </div>
          <div class="asc-cfg-toggle-row">
            <div class="asc-cfg-toggle-info">
              <div class="asc-cfg-toggle-label">Cuenta privada</div>
              <div class="asc-cfg-toggle-desc">Solo tus seguidores te ven</div>
            </div>
            <label class="asc-sw" onclick="event.stopPropagation()">
              <input type="checkbox" id="asc-sw-private"
                     ${settings.privateAccount ? 'checked' : ''} />
              <div class="asc-sw-track"></div>
              <div class="asc-sw-thumb"></div>
            </label>
          </div>
        </div>
      </div>

      <div style="height:24px"></div>
    `;

    body.querySelector('#asc-sw-notif')?.addEventListener('change', e => {
      settings.notificationsEnabled = e.target.checked;
      localStorage.setItem('notificationsEnabled', String(e.target.checked));
      toast(e.target.checked ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    });

    body.querySelector('#asc-sw-private')?.addEventListener('change', e => {
      settings.privateAccount = e.target.checked;
      localStorage.setItem('privateAccount', String(e.target.checked));
      toast(e.target.checked ? 'Cuenta privada activada' : 'Cuenta privada desactivada');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════════════════════════ */

  function toast (msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2800);
  }

  function esc (s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt (n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  /* ─── SVG ICONS ──────────────────────────────────────────── */

  function communitySVG () {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`;
  }

  function bellSVG (size) {
    const s = size || 13;
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`;
  }

  function helpSVG () {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
  }

  function gearSVG () {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33
               1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33
               l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1
               0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65
               1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65
               0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51
               1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`;
  }

  function bookSVG () {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`;
  }

  function mailSVG () {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>`;
  }

  /* ─── INIT ──────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ─── PUBLIC API ────────────────────────────────────────── */
  window.AuraNav = { openScreen, goBack };

})();
