/* ═══════════════════════════════════════════════════════
   Aurx AI — login.js
   · Lee ?mode=login | ?mode=register desde la URL
   · Toast en vez de alert()
   · sessionStorage para simular sesión
   · Redirige a /chat-ai al autenticar correctamente
═══════════════════════════════════════════════════════ */

let mode = 'login'; // 'login' | 'register' | 'recover'

/* ══════════════════════════════════════════════
   TOAST — reemplaza todos los alert()
══════════════════════════════════════════════ */
function showToast(msg, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = [
      'position:fixed',
      'bottom:28px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:10px',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(container);
  }

  var borders = { info: 'rgba(255,255,255,0.12)', error: 'rgba(220,80,80,0.55)', success: 'rgba(74,222,128,0.55)' };
  var icons   = { info: 'ℹ️', error: '⚠️', success: '✓' };

  var toast = document.createElement('div');
  toast.style.cssText = [
    'background:#1a1a1a',
    'border:1.5px solid ' + (borders[type] || borders.info),
    'color:#fff',
    'padding:13px 22px',
    'border-radius:14px',
    'font-family:DM Sans,sans-serif',
    'font-size:0.84rem',
    'font-weight:500',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.35)',
    'opacity:0',
    'transform:translateY(10px) scale(0.97)',
    'transition:opacity 0.25s ease,transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
    'pointer-events:auto',
    'max-width:300px',
    'white-space:nowrap'
  ].join(';');
  toast.innerHTML = '<span>' + (icons[type] || icons.info) + '</span><span>' + msg + '</span>';
  container.appendChild(toast);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });
  });

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px) scale(0.97)';
    setTimeout(function () { toast.remove(); }, 280);
  }, 3200);
}

/* ══════════════════════════════════════════════
   SESSION — guarda datos en localStorage
══════════════════════════════════════════════ */
function saveSession(data) {
  localStorage.setItem('aurx_token', data.token);
  localStorage.setItem('aurx_user',  JSON.stringify({
    name:  data.user?.name  || data.user?.displayName || data.email?.split('@')[0] || 'Usuario',
    email: data.user?.gmail || data.email || '',
    uid:   data.user?.userId || '',
  }));
}

/* ══════════════════════════════════════════════
   API BASE — detecta automáticamente el origen
══════════════════════════════════════════════ */
var API_BASE = window.location.origin;

/* ══════════════════════════════════════════════
   EYE TOGGLE
══════════════════════════════════════════════ */
function toggleEye(inputId, svgId) {
  var inp  = document.getElementById(inputId);
  var svg  = document.getElementById(svgId);
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  svg.innerHTML = show
    ? '<path d="M17.94 17.94A10.08 10.08 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

/* ══════════════════════════════════════════════
   PASSWORD STRENGTH
══════════════════════════════════════════════ */
function checkStrength(inputId, barsId, labelId) {
  var val   = document.getElementById(inputId).value;
  var bars  = document.querySelectorAll('#' + barsId + ' .strength-bar');
  var lbl   = document.getElementById(labelId);
  var score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  var colorMap = ['#C0392B','#E67E22','#F1C40F','#27AE60'];
  var labelMap = ['Muy débil','Débil','Media','Fuerte'];
  bars.forEach(function (b, i) {
    b.style.background = i < score ? colorMap[score - 1] : 'var(--border)';
  });
  if (!val.length) { lbl.textContent = ''; return; }
  lbl.textContent = labelMap[score - 1] || 'Muy débil';
  lbl.style.color = colorMap[score - 1] || colorMap[0];
}

/* ══════════════════════════════════════════════
   MATCH CHECK
══════════════════════════════════════════════ */
function checkMatch() {
  var p   = document.getElementById('password').value;
  var c   = document.getElementById('confirm').value;
  var inp = document.getElementById('confirm');
  if (!c) { inp.className = ''; return; }
  if (p === c) { inp.classList.remove('error-input'); inp.classList.add('ok-input'); }
  else         { inp.classList.remove('ok-input');    inp.classList.add('error-input'); }
}

/* ══════════════════════════════════════════════
   APPLY MODE
══════════════════════════════════════════════ */
function applyMode() {
  var title      = document.getElementById('mainTitle');
  var subtitle   = document.getElementById('mainSubtitle');
  var fUser      = document.getElementById('fieldUsuario');
  var fPass      = document.getElementById('fieldPassword');
  var fConfirm   = document.getElementById('fieldConfirm');
  var recoverRow = document.getElementById('recoverRow');
  var btnAct     = document.getElementById('btnAction');
  var rowLogin   = document.getElementById('rowLogin');
  var rowReg     = document.getElementById('rowRegister');

  ['bars1','bars2'].forEach(function (id) {
    document.querySelectorAll('#' + id + ' .strength-bar')
      .forEach(function (b) { b.style.background = 'var(--border)'; });
  });
  ['label1','label2'].forEach(function (id) { document.getElementById(id).textContent = ''; });
  document.getElementById('password').value = '';
  document.getElementById('confirm').value  = '';

  if (mode === 'login') {
    title.textContent    = 'Bienvenido otra vez';
    subtitle.textContent = 'Inicia sesión para continuar';
    btnAct.textContent   = 'Iniciar sesión';
    fUser.classList.add('hidden');
    fPass.style.display      = '';
    fConfirm.classList.add('hidden');
    recoverRow.style.display = '';
    rowLogin.style.display   = 'none';
    rowReg.style.display     = 'flex';

  } else if (mode === 'register') {
    title.textContent    = 'Crea tu cuenta';
    subtitle.textContent = 'Regístrate para comenzar';
    btnAct.textContent   = 'Crear cuenta';
    fUser.classList.remove('hidden');
    fPass.style.display      = '';
    fConfirm.classList.remove('hidden');
    recoverRow.style.display = 'none';
    rowLogin.style.display   = 'flex';
    rowReg.style.display     = 'none';

  } else if (mode === 'recover') {
    title.textContent    = 'Recuperar contraseña';
    subtitle.textContent = 'Te enviaremos un enlace a tu correo';
    btnAct.textContent   = 'Enviar enlace de recuperación';
    fUser.classList.add('hidden');
    fPass.style.display      = 'none';
    fConfirm.classList.add('hidden');
    recoverRow.style.display = 'none';
    rowLogin.style.display   = 'flex';
    rowReg.style.display     = 'none';
  }
}

/* ══════════════════════════════════════════════
   MODE SWITCHERS
══════════════════════════════════════════════ */
function goLogin()    { mode = 'login';    applyMode(); }
function goRegister() { mode = 'register'; applyMode(); }
function goRecover()  { mode = 'recover';  applyMode(); }

/* ══════════════════════════════════════════════
/* ══════════════════════════════════════════════
   SUBMIT — llama a la API real
══════════════════════════════════════════════ */
function handleSubmit(e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim();

  if (!email) { showToast('Por favor ingresa tu correo electrónico.', 'error'); return; }

  if (mode === 'recover') {
    showToast('✉️ Enlace enviado a ' + email, 'success');
    setTimeout(goLogin, 1600);
    return;
  }

  var pass = document.getElementById('password').value;
  if (!pass) { showToast('Por favor ingresa tu contraseña.', 'error'); return; }

  var btn = document.getElementById('btnAction');
  btn.disabled = true;
  btn.textContent = mode === 'register' ? 'Creando cuenta…' : 'Iniciando sesión…';

  if (mode === 'register') {
    var usuario = document.getElementById('usuario').value.trim();
    if (!usuario) {
      showToast('Por favor ingresa tu nombre de usuario.', 'error');
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
      return;
    }
    var confirmVal = document.getElementById('confirm').value;
    if (pass !== confirmVal) {
      showToast('Las contraseñas no coinciden.', 'error');
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
      return;
    }

    fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: usuario, email: email, password: pass, verifyPassword: confirmVal }),
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        showToast(data.message || 'Error al crear la cuenta.', 'error');
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
        return;
      }
      showToast('¡Cuenta creada! Iniciando sesión…', 'success');
      // Auto-login after register
      return fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass }),
      })
      .then(function (res) { return res.json(); })
      .then(function (loginData) {
        if (!loginData.success) {
          showToast('Cuenta creada. Por favor inicia sesión.', 'info');
          setTimeout(goLogin, 1500);
          return;
        }
        saveSession(loginData);
        setTimeout(function () { location.href = '/chat-ai'; }, 1000);
      });
    })
    .catch(function () {
      showToast('Error de conexión. Intenta de nuevo.', 'error');
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
    });
    return;
  }

  // ── Login ──────────────────────────────────────────────
  fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass }),
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    if (!data.success) {
      showToast(data.message || 'Credenciales incorrectas.', 'error');
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
      return;
    }
    saveSession(data);
    showToast('¡Bienvenido de vuelta!', 'success');
    setTimeout(function () { location.href = '/chat-ai'; }, 900);
  })
  .catch(function () {
    showToast('Error de conexión. Intenta de nuevo.', 'error');
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  });
}

/* ══════════════════════════════════════════════
   INIT — lee ?mode= de la URL
══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function () {
  // Si ya hay sesión activa → ir directamente al chat
  if (localStorage.getItem('aurx_token')) {
    location.href = '/chat-ai';
    return;
  }
  var param = new URLSearchParams(window.location.search).get('mode');
  mode = param === 'register' ? 'register'
       : param === 'recover'  ? 'recover'
       : 'login';
  applyMode();
});
