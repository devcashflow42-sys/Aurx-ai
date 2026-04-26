/* ═══════════════════════════════════════════════════════════
   AuraAI — home.js
   Conversation hub: list, MenuPop, token display
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const API_BASE = window.location.origin;

  /* ── Auth helpers ─────────────────────────────────────── */
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

  /* ── Profile init ────────────────────────────────────── */
  (function loadProfile() {
    const user    = getStoredUser();
    const name    = user.name  || 'Usuario';
    const email   = user.email || '';
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('avatar').textContent        = initial;
    document.getElementById('profile-name').textContent  = name;
    document.getElementById('profile-email').textContent = email;
    document.getElementById('mp-email').textContent      = email;
    document.getElementById('mp-proj-avatar').textContent = initial;
    document.getElementById('mp-proj-name').textContent  = name + "'s Project";
  })();

  /* ── Token balance ───────────────────────────────────── */
  async function loadTokens() {
    const res = await apiFetch('/api/users/tokens');
    if (!res || !res.success) return;
    const t = res.data?.tokens ?? '—';
    const el = document.getElementById('token-display');
    const mp = document.getElementById('mp-token-count');
    if (el) el.textContent = Number(t).toLocaleString('es') + ' créditos';
    if (mp) mp.textContent = Number(t).toLocaleString('es');
  }
  loadTokens();

  /* ── Conversations ───────────────────────────────────── */
  function dateGroupLabel(ts) {
    const now  = new Date();
    const date = new Date(ts);
    const diffD = Math.floor((now - date) / 86400000);
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() &&
                              a.getMonth()    === b.getMonth()    &&
                              a.getDate()     === b.getDate();
    if (sameDay(now, date)) return 'Hoy';
    if (diffD < 2)          return 'Ayer';
    if (diffD < 8)          return 'Últimos 7 días';
    if (diffD < 31)         return 'Últimos 30 días';
    return date.toLocaleString('es', { month: 'long', year: 'numeric' });
  }

  async function loadConversations() {
    const convList = document.getElementById('conv-list');
    const res = await apiFetch('/api/conversations/');
    if (!res) return;
    const all = res.data || [];

    if (!all.length) {
      convList.innerHTML = '<div class="conv-empty">Aún no hay conversaciones.<br/>¡Inicia una nueva tarea!</div>';
      return;
    }

    const groups = [];
    const seen   = {};
    all.forEach(conv => {
      const label = dateGroupLabel(conv.updatedAt);
      if (!seen[label]) { seen[label] = true; groups.push({ label, items: [] }); }
      groups[groups.length - 1].items.push(conv);
    });

    convList.innerHTML = '';
    groups.forEach(grp => {
      const hdr = document.createElement('div');
      hdr.className   = 'conv-date-group';
      hdr.textContent = grp.label;
      convList.appendChild(hdr);

      grp.items.forEach(conv => {
        const btn = document.createElement('button');
        btn.className = 'conv-item';

        const title = document.createElement('span');
        title.className   = 'conv-item-title';
        title.textContent = conv.title;

        const del = document.createElement('button');
        del.className = 'conv-item-del';
        del.setAttribute('aria-label', 'Eliminar conversación');
        del.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
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
        convList.appendChild(btn);
      });
    });
  }
  loadConversations();

  /* ── MenuPop ─────────────────────────────────────────── */
  const mpOverlay  = document.getElementById('mp-overlay');
  const mpCard     = document.getElementById('mp-card');
  const mpToggle   = document.getElementById('mp-toggle');
  const profileCard = document.getElementById('profile-card');

  function openMenuPop() {
    mpOverlay.classList.add('show');
    mpCard.classList.add('open');
    mpToggle.classList.add('open');
    mpCard.setAttribute('aria-hidden', 'false');
    mpOverlay.setAttribute('aria-hidden', 'false');
    mpToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenuPop() {
    mpOverlay.classList.remove('show');
    mpCard.classList.remove('open');
    mpToggle.classList.remove('open');
    mpCard.setAttribute('aria-hidden', 'true');
    mpOverlay.setAttribute('aria-hidden', 'true');
    mpToggle.setAttribute('aria-expanded', 'false');
  }

  profileCard.addEventListener('click', openMenuPop);
  mpToggle.addEventListener('click', e => { e.stopPropagation(); openMenuPop(); });
  mpOverlay.addEventListener('click', closeMenuPop);

  document.getElementById('mp-logout').addEventListener('click', logout);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenuPop();
  });

  /* ── "Pronto" placeholders ──────────────────────────── */
  document.getElementById('action-images').addEventListener('click', () => {
    alert('Generación de imágenes estará disponible próximamente.');
  });
  document.getElementById('action-session').addEventListener('click', () => {
    alert('Sesiones de proyecto estarán disponibles próximamente.');
  });

})();
