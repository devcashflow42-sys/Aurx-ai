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

    const dpAvatar  = document.getElementById('dp-avatar');
    const dpName    = document.getElementById('dp-name');
    const dpEmail   = document.getElementById('dp-email');
    const heroWelcome = document.getElementById('hero-welcome');

    if (dpAvatar)    dpAvatar.textContent    = initial;
    if (dpName)      dpName.textContent      = name;
    if (dpEmail)     dpEmail.textContent     = email;
    if (heroWelcome) heroWelcome.textContent = 'HOLA, ' + firstName.toUpperCase();
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

  async function loadConversations() {
    const recentList  = document.getElementById('recent-list');
    const activeList  = document.getElementById('active-list');
    const activeLabel = document.getElementById('active-label');
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

    const groups  = [];
    const seen    = {};
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

        const del = document.createElement('button');
        del.className = 'conv-item-del';
        del.setAttribute('aria-label', 'Eliminar conversación');
        del.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
        del.addEventListener('click', async e => {
          e.stopPropagation();
          if (!confirm('¿Eliminar esta conversación?')) return;
          await apiFetch('/api/conversations/' + conv.id, { method: 'DELETE' });
          loadConversations();
        });

        btn.append(title, del);
        btn.addEventListener('click', () => {
          window.location.href = '/chat?id=' + encodeURIComponent(conv.id);
        });
        recentList.appendChild(btn);
      });
    });
  }
  loadConversations();

  /* ── Promo banner close ───────────────────────────────── */
  const promoClose = document.getElementById('promo-close');
  const promoBanner = document.getElementById('promo-banner');
  if (promoClose && promoBanner) {
    promoClose.addEventListener('click', () => {
      promoBanner.style.animation = 'none';
      promoBanner.style.opacity   = '0';
      promoBanner.style.transform = 'translateY(-12px)';
      promoBanner.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => { promoBanner.style.display = 'none'; }, 320);
    });
  }

  /* ── View tabs ────────────────────────────────────────── */
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.view === 'chat') {
        window.location.href = '/chat';
      }
    });
  });

  /* ── Nueva tarea button ───────────────────────────────── */
  const newTaskBtn = document.getElementById('drawer-new-task');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', () => {
      closeDrawer();
      const input = document.getElementById('home-input');
      if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth' }); }
    });
  }

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
    const encoded = encodeURIComponent(text);
    window.location.href = '/chat?msg=' + encoded;
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
