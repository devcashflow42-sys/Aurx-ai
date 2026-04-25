// ── Neural Network Canvas ──
(function(){
  const canvas = document.getElementById('neuralCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 700, H = 380;
  canvas.width = W; canvas.height = H;

  const DARK = '#1a1a1a';
  const GRAY_FILL = '#888886';
  const CX = W/2, CY = H/2;

  const cols = [70, 195, CX, 505, 630];
  const colNodes = [
    [{y:110},{y:CY},{y:270}],
    [{y:120},{y:CY},{y:260}],
    [{y:CY}],
    [{y:120},{y:CY},{y:260}],
    [{y:110},{y:CY},{y:270}],
  ];

  const nodes = [];
  colNodes.forEach((col, ci) => {
    col.forEach((n) => {
      nodes.push({
        x: cols[ci], y: n.y, col: ci,
        r: ci === 2 ? 34 : (ci === 0 || ci === 4) ? 16 : 11,
        type: ci === 0 ? 'input' : ci === 4 ? 'output' : ci === 2 ? 'center' : 'hidden',
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
      });
    });
  });

  const edges = [];
  function addEdges(fromCol, toCol) {
    const from = nodes.filter(n=>n.col===fromCol);
    const to   = nodes.filter(n=>n.col===toCol);
    from.forEach(a => to.forEach(b => {
      edges.push({ a, b, phase: Math.random()*Math.PI*2, speed: 0.4+Math.random()*0.5 });
    }));
  }
  addEdges(0,1); addEdges(1,2); addEdges(2,3); addEdges(3,4);

  const particles = [];
  edges.forEach(e => {
    particles.push({ edge:e, t:Math.random(), speed:0.003+Math.random()*0.004, size:4.5+Math.random()*2, dark:e.a.col>=2 });
  });
  edges.filter(e=>e.b.col===4).forEach(e=>{
    particles.push({ edge:e, t:Math.random(), speed:0.005+Math.random()*0.004, size:5, dark:true });
  });

  let t = 0;

  function draw() {
    ctx.clearRect(0,0,W,H);
    t += 0.016;

    edges.forEach(e => {
      const pulse = 0.3 + 0.4 * Math.sin(t * e.speed + e.phase);
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.strokeStyle = `rgba(120,120,118,${0.45 + pulse * 0.45})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    particles.forEach(p => {
      p.t += p.speed;
      if(p.t > 1) p.t = 0;
      const px = p.edge.a.x + (p.edge.b.x - p.edge.a.x) * p.t;
      const py = p.edge.a.y + (p.edge.b.y - p.edge.a.y) * p.t;
      const alpha = Math.sin(p.t * Math.PI);
      ctx.save();
      ctx.shadowColor = p.dark ? DARK : '#888';
      ctx.shadowBlur = p.dark ? 10 : 6;
      ctx.beginPath();
      ctx.arc(px, py, p.size * (0.5 + 0.5*alpha), 0, Math.PI*2);
      ctx.fillStyle = p.dark ? `rgba(26,26,26,${0.9*alpha})` : `rgba(120,120,118,${0.85*alpha})`;
      ctx.fill();
      ctx.restore();
    });

    nodes.forEach(n => {
      const pulse = 0.5 + 0.5 * Math.sin(t * n.speed + n.phase);

      if (n.type === 'center') {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#d0d0ce';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        const iw = 38, gap = 10;
        [-gap, 0, gap].forEach((dy, i) => {
          ctx.save();
          ctx.translate(n.x, n.y + dy - 4);
          ctx.rotate(-0.2);
          ctx.beginPath();
          ctx.moveTo(-iw/2, 0); ctx.lineTo(iw/2, 0);
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = i === 1 ? 3 : 2;
          ctx.lineCap = 'round';
          ctx.globalAlpha = i === 1 ? 1 : 0.5;
          ctx.stroke();
          ctx.restore();
        });
        ctx.font = `600 10px 'DM Sans', sans-serif`;
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('AURX', n.x, n.y + n.r + 16);

      } else if (n.type === 'input') {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = GRAY_FILL;
        ctx.fill();
        ctx.restore();

      } else if (n.type === 'output') {
        ctx.save();
        ctx.shadowColor = 'rgba(26,26,26,0.5)';
        ctx.shadowBlur = 18 * pulse;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 2*pulse, 0, Math.PI*2);
        ctx.fillStyle = `rgba(26,26,26,${0.1*pulse})`;
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.shadowColor = '#1a1a1a';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = DARK;
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(n.x - 4, n.y - 4, 4, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.2*pulse+0.05})`;
        ctx.fill();

      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = '#ececea';
        ctx.fill();
        ctx.strokeStyle = `rgba(110,110,108,${0.7+0.25*pulse})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(100,100,98,${0.6+0.4*pulse})`;
        ctx.fill();
      }
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Typewriter ──
const phrases = [
  'chatear contigo.',
  'escribir código.',
  'crear imágenes.',
  'resumir textos.',
  'analizar datos.',
  'generar ideas.',
  'traducir idiomas.',
  'mucho más…'
];

let pi = 0, ci = 0, deleting = false;
const el = document.getElementById('tw');

function type() {
  const current = phrases[pi];
  if (!deleting) {
    el.textContent = current.slice(0, ++ci);
    if (ci === current.length) { deleting = true; setTimeout(type, 1800); return; }
    setTimeout(type, 60);
  } else {
    el.textContent = current.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 300); return; }
    setTimeout(type, 35);
  }
}
type();

// ── Community ──
(function(){
  // Capacity bar — sin cambios
  setTimeout(() => {
    const fill = document.getElementById('capFill');
    if (fill) fill.style.width = '7.59%';
  }, 400);

  const allMessages = [
    { user: 'JM', name: 'Juan M.',    bg: '#1a1a1a', text: 'Acabo de lanzar mi primera app con IA 🚀 ¡Gracias a todos!' },
    { user: 'SA', name: 'Sofía A.',   bg: '#555',    text: 'Busco colaboradores para una página web. ¿Alguien se apunta?' },
    { user: 'CR', name: 'Carlos R.',  bg: '#333',    text: 'Compartí el enlace — ya tengo 3 personas ayudando 🙌' },
    { user: 'LP', name: 'Lucía P.',   bg: '#777',    text: 'Si necesitan ayuda con UI, aquí estoy con Aurx AI.' },
    { user: 'DV', name: 'Diego V.',   bg: '#444',    text: 'En 1 día armamos una landing completa entre 4.' },
    { user: 'MT', name: 'Marco T.',   bg: '#1a1a1a', text: 'Alguien con experiencia en APIs? Necesito ayuda rápido 🙏' },
    { user: 'AR', name: 'Ana R.',     bg: '#666',    text: 'Acabo de publicar mi portafolio con Aurx. Queda increíble.' },
    { user: 'EM', name: 'Eric M.',    bg: '#222',    text: '¿Alguien quiere colaborar en una app de productividad?' },
    { user: 'VG', name: 'Valeria G.', bg: '#555',    text: 'El chat en tiempo real es lo que más me gusta de aquí 💬' },
    { user: 'PL', name: 'Pablo L.',   bg: '#333',    text: 'Terminamos el MVP en 3 días gracias a la comunidad 🎉' },
    { user: 'NF', name: 'Nadia F.',   bg: '#777',    text: 'Comparto enlace de mi proyecto: dashboard de finanzas con IA.' },
    { user: 'OS', name: 'Omar S.',    bg: '#1a1a1a', text: 'Llevo 2 semanas aquí y ya lancé 2 proyectos. Increíble.' },
    { user: 'IG', name: 'Isa G.',     bg: '#444',    text: 'Necesito feedback sobre mi landing page. ¿Alguien revisa?' },
    { user: 'RT', name: 'Raúl T.',    bg: '#666',    text: 'La IA me ayudó a corregir todo el código en 20 minutos 🤯' },
    { user: 'CM', name: 'Camila M.',  bg: '#222',    text: 'Buscando co-fundador para una app de fitness con IA.' },
    { user: 'FH', name: 'Felipe H.',  bg: '#555',    text: 'Si entran hoy todavía hay plazas. ¡Dense prisa!' },
    { user: 'BN', name: 'Bianca N.',  bg: '#333',    text: 'Listo el diseño de la app. Ahora a integrar Aurx AI 🔧' },
    { user: 'KC', name: 'Kevin C.',   bg: '#1a1a1a', text: 'Esta comunidad es lo mejor que le ha pasado a mi startup.' },
    { user: 'MR', name: 'Mónica R.',  bg: '#777',    text: '¿Alguien usa Aurx para generar contenido? Resultados top.' },
    { user: 'JT', name: 'Joel T.',    bg: '#444',    text: 'Mi cliente quedó encantado con la web que hicimos juntos ✅' },
    { user: 'AL', name: 'Alba L.',    bg: '#222',    text: 'Acabo de unirme. ¿Por dónde empiezo para colaborar?' },
    { user: 'GV', name: 'Gael V.',    bg: '#555',    text: 'Compartiendo template de e-commerce gratis para la comunidad.' },
    { user: 'SR', name: 'Sil R.',     bg: '#1a1a1a', text: 'Con IA tardé 4 horas en lo que antes me tomaba 4 días.' },
    { user: 'TM', name: 'Teo M.',     bg: '#333',    text: 'Probando el nuevo modelo. La respuesta es brutalmente buena.' },
    { user: 'DP', name: 'Dana P.',    bg: '#666',    text: '10K personas y todos trabajando en algo distinto. Qué locura 🌍' },
  ];

  const list = document.getElementById('feedList');
  if (!list) return;

  const MAX_VISIBLE = 5;
  let msgIndex = 0;
  let typingEl = null;

  // ── Botón del feed: press + ripple al hacer click ──────────────────
  const feedBtn = document.querySelector('#community .btn-cta');
  if (feedBtn) {
    feedBtn.style.position = 'relative';
    feedBtn.style.overflow = 'hidden';
    feedBtn.addEventListener('click', function () {
      this.classList.remove('btn-press');
      void this.offsetWidth; // reinicia animación
      this.classList.add('btn-press');
      this.addEventListener('animationend', () => this.classList.remove('btn-press'), { once: true });
      const r = document.createElement('span');
      r.className = 'btn-ripple';
      this.appendChild(r);
      r.addEventListener('animationend', () => r.remove(), { once: true });
    });
  }

  // ── Scroll suave al fondo de la lista ─────────────────────────────
  function scrollFeed() {
    list.scrollTo
      ? list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
      : (list.scrollTop = list.scrollHeight);
  }

  // ── Elimina el más antiguo con animación de salida ────────────────
  function removeOldest() {
    const items = list.querySelectorAll('.comm-feed-item');
    if (items.length > MAX_VISIBLE) {
      const oldest = items[0];
      oldest.classList.add('msg-exit');
      oldest.addEventListener('animationend', () => oldest.remove(), { once: true });
    }
  }

  // ── Añade un mensaje — animate=true para mensajes del ciclo en vivo
  function addMessage(m, animate) {
    const item = document.createElement('div');

    // animate=true  → clases de animación completa (nuevos mensajes)
    // animate=false → usa feedIn existente sin highlight (mensajes iniciales)
    item.className = animate
      ? 'comm-feed-item msg-new msg-highlight'
      : 'comm-feed-item';

    // HTML idéntico al original
    item.innerHTML = `
      <div class="comm-avatar" style="background:${m.bg}">${m.user}</div>
      <div>
        <div class="comm-feed-text"><strong>${m.name}</strong> — ${m.text}</div>
        <div class="comm-feed-time">ahora</div>
      </div>`;

    if (typingEl && typingEl.parentNode === list) {
      list.insertBefore(item, typingEl);
    } else {
      list.appendChild(item);
    }

    // Al terminar la entrada, añade msg-settled para que el highlight desaparezca
    if (animate) {
      item.addEventListener('animationend', () => {
        item.classList.add('msg-settled');
      }, { once: true });
      requestAnimationFrame(scrollFeed);
    }

    removeOldest();
  }

  // ── Typing bubble ─────────────────────────────────────────────────
  function showTyping(cb) {
    if (typingEl) typingEl.remove();

    const m = allMessages[msgIndex % allMessages.length];

    typingEl = document.createElement('div');
    typingEl.className = 'typing-bubble';
    typingEl.style.opacity = '0';
    typingEl.style.transition = 'opacity 0.25s ease';
    // HTML idéntico al original
    typingEl.innerHTML = `
      <div class="comm-avatar" style="background:${m.bg};opacity:0.6">${m.user}</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>`;
    list.appendChild(typingEl);

    requestAnimationFrame(() => { typingEl.style.opacity = '1'; });

    setTimeout(() => {
      if (!typingEl) return;
      // Sale con clase CSS en vez de inline opacity
      typingEl.classList.add('typing-exit');
      typingEl.addEventListener('animationend', () => {
        if (typingEl) { typingEl.remove(); typingEl = null; }
        cb && cb(m);
      }, { once: true });
    }, 1800 + Math.random() * 800);
  }

  // ── Ciclo en vivo ─────────────────────────────────────────────────
  function cycle() {
    showTyping((m) => {
      addMessage(m, true); // true = animaciones completas
      msgIndex++;
      setTimeout(cycle, 1200 + Math.random() * 1000);
    });
  }

  // ── Inicialización: 4 mensajes sin highlight ───────────────────────
  for (let i = 0; i < 4; i++) {
    addMessage(allMessages[msgIndex], false);
    msgIndex++;
  }

  // Arranca el ciclo en vivo
  setTimeout(cycle, 1500);
})();





// ── Plan Selection ──
function selectPlan(card) {
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}
function cancelPlan(btn) {
  btn.closest('.plan-card').classList.remove('selected');
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.plan-card')) {
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  }
});

// ── Scroll Animations ──
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
fadeEls.forEach(el => observer.observe(el));
