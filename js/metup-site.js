/* MET UP! — comportamenti della landing (nav, countdown, hero visual,
   gallery/lightbox, FAQ, RSVP multi-step, form contatti).
   I contenuti sono nel markup del Design Component: qui c'è solo logica. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isEmail = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

/* Endpoint del backend (Google Apps Script Web App). */
const API_URL = 'https://script.google.com/macros/s/AKfycbwe73rzaMn1kSYBS5CS6apRokcKlxM0WGMLx7M1sXYGMuF5eEw8J7BcALun-sKv9X9L/exec';
const API_TOKEN = 'metup26_w_gZRbWG9mNOFjwMZBjEyuYx545PogJVqZ00QKZBlm';

/* Content-Type text/plain: evita il preflight CORS, che Apps Script non gestisce. */
async function apiPost(action, data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: API_TOKEN, action, data })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function busy(btn, on, testo) {
  if (!btn) return;
  if (on) { btn.dataset.lab = btn.innerHTML; btn.disabled = true; btn.innerHTML = testo || 'Invio in corso…'; }
  else { btn.disabled = false; if (btn.dataset.lab) btn.innerHTML = btn.dataset.lab; }
}

let bound = false;

export function initMetUp(opts = {}) {
  if (bound) return;
  if (!$('#nav') || !$('#rsvp')) return;
  bound = true;

  const startDate = opts.startDate || '2026-10-14T10:00:00';
  const registrate = (opts.emailRegistrate || []).map(e => e.toLowerCase());

  /* ---------------- FAQ ---------------- */
  $$('.faq__q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.parentElement, panel = btn.nextElementSibling, open = item.classList.contains('is-open');
    $$('.faq__i').forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.faq__a').style.maxHeight = null;
      i.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
    });
    if (!open) {
      item.classList.add('is-open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  }));

  /* ---------------- NAV · DRAWER · STICKY ---------------- */
  const nav = $('#nav'), drawer = $('#drawer'), burger = $('#burger'), sticky = $('#sticky');

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('nav--solid', y > 40);
    const rs = $('#rsvp').getBoundingClientRect();
    const rsvpVisibile = rs.top < window.innerHeight * .85 && rs.bottom > 120;
    const on = y > window.innerHeight * .7 && !rsvpVisibile;
    sticky.classList.toggle('is-on', on);
    document.body.classList.toggle('has-sticky', on);
    let cur = '';
    $$('main section[id]').forEach(s => { if (s.getBoundingClientRect().top <= 140) cur = s.id; });
    $$('.nav__links a').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function toggleDrawer(force) {
    const open = force !== undefined ? force : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    drawer.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('no-scroll', open);
  }
  burger.addEventListener('click', () => toggleDrawer());
  $$('#drawer [data-nav]').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { toggleDrawer(false); closeModal(); $('#lb').classList.remove('is-on'); }
  });

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.rev').forEach(el => io.observe(el));

  /* ---------------- COUNTDOWN ---------------- */
  (function countdown() {
    const target = new Date(startDate), box = $('#countdown');
    if (!box) return;
    const two = n => String(n).padStart(2, '0');
    function tick() {
      const ms = target - new Date();
      if (ms <= 0) {
        box.innerHTML = '<p class="cd__cap" style="font-size:17px">Ci vediamo a <b>Villa Quaranta</b>!</p>';
        return;
      }
      const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
      const D = $('#cd-d'), H = $('#cd-h'), M = $('#cd-m');
      if (D) D.textContent = d;
      if (H) H.textContent = two(h);
      if (M) M.textContent = two(m);
    }
    tick(); setInterval(tick, 15000);
  })();

  /* ---------------- HERO — visual "connessione" ---------------- */
  (function heroVisual() {
    const cv = $('#net'); if (!cv) return;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = cv.getContext('2d');
    let W, H, bubbles = [], arcs = [], dpr = Math.min(devicePixelRatio || 1, 2);
    const TINT = [[255, 255, 255], [136, 210, 231], [70, 195, 178], [107, 192, 75]];

    function build() {
      const small = W < 760;
      const nB = small ? 10 : 16;
      const inText = (x, y) => !small && x > W * .06 && x < W * .62 && y > H * .16 && y < H * .9;
      bubbles = Array.from({ length: nB }, () => {
        const r = (small ? 24 : 34) + Math.random() * (small ? 78 : 130);
        let x;
        const roll = Math.random();
        if (small) x = Math.random() * W;
        else if (roll < .5) x = W * (.60 + Math.random() * .45);
        else if (roll < .78) x = W * (-.04 + Math.random() * .18);
        else x = Math.random() * W;
        const y = Math.random() * H;
        const white = Math.random() < .58;
        const base = .045 + Math.random() * .085;
        return {
          x, y, r,
          ring: Math.random() < .42,
          col: white ? TINT[0] : TINT[1 + Math.floor(Math.random() * 3)],
          a: inText(x, y) ? base * .5 : base,
          vy: -(.05 + Math.random() * .16), vx: (Math.random() - .5) * .12,
          ph: Math.random() * 6.283, amp: 6 + Math.random() * 16,
          sw: .7 + Math.random() * 1.5
        };
      });
      const m = Math.min(W, H);
      [[1.0, .10, .32, false], [-.02, .92, .28, true], [.88, 1.0, .22, false]].forEach(([fx, fy, fr, ring], i) => {
        bubbles.push({
          x: W * fx, y: H * fy, r: m * fr, ring, col: i === 1 ? TINT[1] : TINT[0],
          a: .035 + i * .008, vy: -(.02 + Math.random() * .04), vx: (Math.random() - .5) * .05,
          ph: Math.random() * 6.283, amp: 5 + Math.random() * 8, sw: 1.1
        });
      });
      const nA = small ? 2 : 3;
      arcs = Array.from({ length: nA }, (_, i) => {
        const y = H * (.16 + .7 * Math.random());
        return {
          x0: W * (-.05 + Math.random() * .25), y0: y,
          x1: W * (.35 + Math.random() * .4), y1: y - H * (.10 + Math.random() * .16),
          x2: W * (.85 + Math.random() * .3), y2: y + H * (.03 + Math.random() * .1),
          beads: 11 + Math.floor(Math.random() * 5),
          col: [136, 210, 231, 70, 195, 178, 107, 192, 75].slice(i % 3 * 3, i % 3 * 3 + 3),
          sp: (.00004 + Math.random() * .00008) * (i % 2 ? 1 : -1),
          ph: Math.random(), size: .85 + Math.random() * .5, alpha: .16 + Math.random() * .16
        };
      });
    }
    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    const bez = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';

    function drawBubble(b, ts) {
      const wob = rm ? 0 : Math.sin(ts * .00035 + b.ph) * b.amp;
      const x = b.x + wob, y = b.y;
      if (b.ring) {
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832);
        ctx.lineWidth = b.sw; ctx.strokeStyle = rgba(b.col, b.a * 2.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, b.r, -2.5, -.9);
        ctx.lineWidth = b.sw * 1.6; ctx.strokeStyle = rgba(b.col, b.a * 2.6); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(x - b.r * .35, y - b.r * .38, b.r * .06, x, y, b.r);
        g.addColorStop(0, rgba(b.col, b.a * 2.1));
        g.addColorStop(.55, rgba(b.col, b.a * .85));
        g.addColorStop(1, rgba(b.col, b.a * .12));
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = .8; ctx.strokeStyle = rgba(b.col, b.a * 1.2); ctx.stroke();
      }
    }
    function drawArc(a, ts) {
      const off = rm ? 0 : (ts * a.sp + a.ph) % 1;
      for (let i = 0; i < a.beads; i++) {
        const t = ((i / a.beads + off) % 1 + 1) % 1;
        const grow = Math.sin(t * Math.PI);
        const x = bez(a.x0, a.x1, a.x2, t);
        const y = bez(a.y0, a.y1, a.y2, t) + (rm ? 0 : Math.sin(ts * .0003 + i * .6 + a.ph * 6) * 7);
        const r = (1 + Math.pow(grow, 1.25) * 5.4) * a.size;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
        ctx.fillStyle = rgba(a.col, Math.min(.5, a.alpha * (.5 + grow * .8)));
        ctx.fill();
      }
    }
    function step() {
      bubbles.forEach(b => {
        b.y += b.vy; b.x += b.vx;
        if (b.y + b.r < -40) { b.y = H + b.r + 20; b.x = Math.random() * W; }
        if (b.x - b.r > W + 60) b.x = -b.r - 60;
        if (b.x + b.r < -60) b.x = W + b.r + 60;
      });
    }
    function draw(ts) {
      ctx.clearRect(0, 0, W, H);
      arcs.forEach(a => drawArc(a, ts));
      bubbles.forEach(b => drawBubble(b, ts));
      if (!rm) { step(); requestAnimationFrame(draw); }
    }
    resize(); requestAnimationFrame(draw);
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt); rt = setTimeout(() => { resize(); if (rm) draw(0); }, 220);
    });
  })();

  /* ---------------- MODALE · LIGHTBOX ---------------- */
  const modal = $('#modal');
  const ICO_OK = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.5l5 5L20 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICO_I = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/><path d="M12 11v6M12 7.6v.9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function openModal({ title, body, cta, ico = ICO_OK, grad = 'var(--grad-03)', doc = false }) {
    $('.modal__box').classList.toggle('is-doc', !!doc);
    $('#modal-t').innerHTML = title;
    $('#modal-body').innerHTML = body;
    $('#modal-cta').innerHTML = cta || '';
    const i = $('#modal-ico'); i.innerHTML = ico; i.style.background = grad;
    modal.classList.add('is-on'); document.body.classList.add('no-scroll');
    $('.modal__x').focus();
  }
  function closeModal() { modal.classList.remove('is-on'); document.body.classList.remove('no-scroll'); }
  $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));

  const lb = $('#lb');
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => {
    const box = $('#lb .ph'), cap = $('#lb .lb__cap'), bg = getComputedStyle(b).backgroundImage;
    const hasImg = b.classList.contains('has-img') && bg && bg !== 'none';
    box.classList.toggle('has-img', hasImg);
    box.style.backgroundImage = hasImg ? bg : '';
    box.removeAttribute('data-cap');
    $('#lb-lab').innerHTML = hasImg ? '' : '[ ' + b.getAttribute('data-lb').toUpperCase() + ' ]<i>slot immagine · da caricare dal backend</i>';
    cap.innerHTML = (hasImg ? esc(b.getAttribute('data-lb')) : 'Slot immagine — la fotografia ufficiale verrà caricata dal backend MET.')
      + ' <button class="btn btn--quiet" style="color:#88d2e7" data-lb-close>Chiudi ✕</button>';
    lb.classList.add('is-on'); document.body.classList.add('no-scroll');
  }));
  function closeLb() { lb.classList.remove('is-on'); document.body.classList.remove('no-scroll'); }
  lb.addEventListener('click', e => { if (e.target === lb || e.target.hasAttribute('data-lb-close')) closeLb(); });

  const PRIVACY_HTML = `
    <div style="text-align:left;max-height:56vh;overflow-y:auto;padding-right:6px">
      <p class="modal__p" style="font-size:13px;margin-bottom:14px"><strong style="color:var(--ink)">Informativa sul trattamento dei dati personali</strong><br>ai sensi dell'art. 13 del Regolamento (UE) 2016/679 («GDPR»)</p>
      <p class="modal__p" style="font-size:13px">MET Energia Italia S.p.A., in qualità di Titolare del trattamento, informa gli interessati che i dati personali forniti attraverso il presente modulo saranno trattati nel rispetto della normativa vigente in materia di protezione dei dati personali.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">1. Titolare del trattamento</b><br>Il Titolare del trattamento è MET Energia Italia S.p.A., con sede in Viale Francesco Restelli 3/7, 20124 Milano (MI), contattabile all'indirizzo e-mail <a href="mailto:privacy.metita@met.com" style="color:var(--primary);text-decoration:underline">privacy.metita@met.com</a>.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">2. Dati personali trattati</b><br>Attraverso il presente modulo potranno essere raccolti dati personali necessari all'organizzazione del soggiorno e alle relative procedure di check-in presso la struttura alberghiera, quali, a titolo esemplificativo, nome, cognome, data e luogo di nascita, nazionalità e gli ulteriori dati richiesti nel modulo.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">3. Finalità e base giuridica del trattamento</b><br>I dati personali saranno trattati esclusivamente per le seguenti finalità:</p>
      <ul style="font-size:13px;color:var(--ink-soft);margin:0 0 12px;padding-left:20px;line-height:1.6">
        <li>organizzazione e gestione del soggiorno presso la struttura alberghiera «Villa Quaranta»;</li>
        <li>gestione delle procedure necessarie alla prenotazione e al check-in;</li>
        <li>comunicazione dei dati alla struttura alberghiera ai fini della gestione del soggiorno e dell'adempimento degli obblighi previsti dalla normativa applicabile.</li>
      </ul>
      <p class="modal__p" style="font-size:13px">Il trattamento è effettuato nella misura necessaria alla gestione e organizzazione del soggiorno e all'esecuzione delle attività ad esso connesse, ai sensi dell'art. 6, par. 1, lett. b), del GDPR, nonché, ove applicabile, per l'adempimento di obblighi di legge ai sensi dell'art. 6, par. 1, lett. c), del GDPR.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">4. Natura del conferimento dei dati</b><br>Il conferimento dei dati richiesti nel modulo è necessario per consentire la corretta organizzazione del soggiorno e lo svolgimento delle procedure di check-in. L'eventuale mancato conferimento dei dati necessari potrebbe comportare l'impossibilità di completare preventivamente le relative procedure.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">5. Destinatari dei dati</b><br>I dati personali raccolti saranno trattati esclusivamente da personale autorizzato di MET Energia Italia S.p.A. e potranno essere comunicati alla struttura alberghiera presso la quale è previsto il soggiorno, limitatamente ai dati necessari alla gestione della prenotazione, del soggiorno e delle procedure di check-in.<br><br>La struttura alberghiera tratterà i dati ricevuti secondo quanto previsto dalla normativa applicabile e, per i trattamenti effettuati in qualità di autonomo Titolare, secondo la propria informativa privacy.<br><br>I dati potranno inoltre essere comunicati ad altri soggetti esclusivamente qualora ciò sia necessario per adempiere a obblighi previsti dalla legge.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">6. Modalità e durata del trattamento</b><br>I dati saranno trattati con strumenti informatici e/o telematici, adottando misure tecniche e organizzative adeguate a garantirne la sicurezza e la riservatezza.<br><br>MET Energia Italia S.p.A. conserverà i dati personali esclusivamente per il periodo necessario al perseguimento delle finalità sopra indicate e, successivamente, per il tempo eventualmente necessario all'adempimento di obblighi di legge o alla tutela dei propri diritti.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">7. Trasferimento dei dati</b><br>I dati personali non saranno trasferiti verso Paesi situati al di fuori dello Spazio Economico Europeo, salvo che ciò risulti necessario e avvenga nel rispetto delle condizioni e delle garanzie previste dal GDPR.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">8. Diritti dell'interessato</b><br>L'interessato può esercitare, nei casi previsti dalla normativa applicabile, i diritti riconosciuti dagli artt. 15-22 del GDPR, tra cui il diritto di:</p>
      <ul style="font-size:13px;color:var(--ink-soft);margin:0 0 12px;padding-left:20px;line-height:1.6">
        <li>ottenere l'accesso ai propri dati personali;</li>
        <li>richiederne la rettifica o l'aggiornamento;</li>
        <li>richiederne la cancellazione, ove applicabile;</li>
        <li>ottenere la limitazione del trattamento;</li>
        <li>opporsi al trattamento, nei casi previsti dal GDPR;</li>
        <li>richiedere la portabilità dei dati, ove applicabile.</li>
      </ul>
      <p class="modal__p" style="font-size:13px">Le richieste possono essere rivolte a MET Energia Italia S.p.A. all'indirizzo <a href="mailto:privacy.metita@met.com" style="color:var(--primary);text-decoration:underline">privacy.metita@met.com</a>.<br><br>L'interessato ha inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali, secondo le modalità previste dalla normativa vigente.</p>
      <p class="modal__p" style="font-size:13px"><b style="color:var(--ink)">9. Aggiornamenti</b><br>La presente informativa potrà essere aggiornata qualora intervengano modifiche nelle modalità o nelle finalità del trattamento dei dati personali.</p>
    </div>`;

  const COOKIE_HTML = `
    <p class="modal__p">Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento della pagina e alla compilazione del modulo di registrazione. Non vengono utilizzati cookie di profilazione né strumenti di tracciamento pubblicitario.</p>
    <p class="modal__p">Per informazioni sul trattamento dei dati personali si rinvia all'Informativa sul trattamento dei dati personali e ai contatti indicati al suo interno.</p>`;

  $$('[data-doc]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const cookie = a.getAttribute('data-doc') === 'cookie';
    openModal({
      title: cookie ? 'Cookie Policy' : 'Trattamento dei dati personali',
      body: cookie ? COOKIE_HTML : PRIVACY_HTML,
      cta: '<button class="btn btn--outline btn--full" data-close-in>Chiudi</button>',
      ico: ICO_I, grad: 'var(--grad-01)', doc: !cookie
    });
    $('[data-close-in]').addEventListener('click', closeModal);
  }));

  /* ---------------- RSVP multi-step ---------------- */
  const formYes = $('#form-yes'), formNo = $('#form-no'), choice = $('#rsvp-choice');
  let step = 1;
  const TOT = 5;

  function showStep(n) {
    step = n;
    $$('.fstep').forEach(s => s.classList.toggle('is-on', +s.dataset.step === n));
    $('#step-bar').style.width = (n / TOT * 100) + '%';
    $('#step-lab').textContent = 'Step ' + n + ' di ' + TOT;
    if (n === TOT) buildRecap();
    const y = formYes.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  $('#btn-yes').addEventListener('click', () => {
    choice.classList.add('hidden'); formNo.classList.add('hidden');
    formYes.classList.remove('hidden'); showStep(1);
  });
  $('#btn-no').addEventListener('click', () => {
    choice.classList.add('hidden'); formYes.classList.add('hidden');
    formNo.classList.remove('hidden');
    window.scrollTo({ top: formNo.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  });
  $$('[data-cancel]').forEach(b => b.addEventListener('click', () => {
    formYes.classList.add('hidden'); formNo.classList.add('hidden'); choice.classList.remove('hidden');
    window.scrollTo({ top: $('#rsvp').offsetTop - 60, behavior: 'smooth' });
  }));
  $$('[data-prev]').forEach(b => b.addEventListener('click', () => showStep(Math.max(1, step - 1))));
  $$('[data-next]').forEach(b => b.addEventListener('click', () => { if (validateStep(step)) showStep(Math.min(TOT, step + 1)); }));

  function fieldErr(input, on, msg) {
    input.classList.toggle('err', on);
    const box = input.closest('.field'); if (!box) return;
    const m = box.querySelector('.emsg');
    if (m) { m.classList.toggle('is-on', on); if (msg) m.textContent = msg; }
  }

  function validateStep(n) {
    const pane = $('.fstep[data-step="' + n + '"]');
    let ok = true, first = null;
    $$('input[required], select[required], textarea[required]', pane).forEach(inp => {
      let bad = !inp.value.trim();
      if (!bad && inp.type === 'email' && !isEmail(inp.value)) bad = true;
      fieldErr(inp, bad); if (bad && !first) first = inp; if (bad) ok = false;
    });
    if (n === 3) {
      const si = $('input[name="diet"]:checked').value === 'si';
      const any = $$('input[name="diet_type"]:checked').length > 0;
      $('#diet-err').classList.toggle('is-on', si && !any);
      if (si && !any) ok = false;
    }
    if (n === 1 && ok) {
      const mail = $('#f-email').value.trim().toLowerCase();
      if (registrate.includes(mail)) { duplicato(); return false; }
    }
    if (!ok && first) first.focus({ preventScroll: false });
    return ok;
  }

  function erroreInvio() {
    openModal({
      title: 'Non siamo riusciti a registrarti',
      body: `<p class="modal__p">Si è verificato un problema nell'invio dei dati. I tuoi dati non sono andati persi: riprova tra qualche istante.</p>
             <p class="modal__p">Se il problema persiste, scrivi al Team Marketing all'indirizzo <strong>events@metenergiaitalia.it</strong>.</p>`,
      cta: '<button class="btn btn--outline btn--full" id="m-err">Chiudi</button>',
      ico: ICO_I, grad: 'var(--grad-01)'
    });
    $('#m-err').addEventListener('click', closeModal);
  }

  function duplicato() {
    openModal({
      title: 'Risulti già registrato a MET UP!',
      body: `<p class="modal__p">Questo indirizzo email è già associato a una registrazione.</p>
             <p class="modal__p">Se hai necessità di modificare alcune informazioni, contatta il Team Marketing.</p>`,
      cta: `<a class="btn btn--primary btn--full" href="#contatti" data-close>Contatta il Team Marketing</a>`,
      ico: ICO_I, grad: 'var(--grad-01)'
    });
    $('#modal-cta a').addEventListener('click', closeModal);
  }

  $('input[name="diet"]').closest('.opts').addEventListener('change', () => {
    const si = $('input[name="diet"]:checked').value === 'si';
    $('#diet-box').classList.toggle('hidden', !si);
  });
  document.addEventListener('change', e => {
    if (e.target.matches('.opt input')) {
      const o = e.target.closest('.opt');
      if (e.target.type === 'radio') $$('input[name="' + e.target.name + '"]').forEach(r => r.closest('.opt').classList.toggle('is-sel', r.checked));
      else o.classList.toggle('is-sel', e.target.checked);
    }
  });

  function collect() {
    const g = id => ($(id).value || '').trim();
    const diet = $('input[name="diet"]:checked').value === 'si';
    return {
      nome: g('#f-nome'), cognome: g('#f-cognome'), agenzia: g('#f-agenzia'), email: g('#f-email'),
      nascitaData: g('#f-nascita-d'), nascitaLuogo: g('#f-nascita-l'), residenza: g('#f-residenza'),
      docNumero: g('#f-doc-n'), docLuogo: g('#f-doc-l'), docData: g('#f-doc-d'),
      dieta: diet, dietaTipi: $$('input[name="diet_type"]:checked').map(i => i.value),
      dietaNote: g('#f-diet-note'), note: g('#f-note')
    };
  }
  const fmtDate = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; };
  const mask = s => s ? s.slice(0, 2) + '•'.repeat(Math.max(0, s.length - 4)) + s.slice(-2) : '—';

  function buildRecap() {
    const d = collect();
    const rows = [
      ['Nome e cognome', esc(d.nome + ' ' + d.cognome)],
      ['Agenzia', esc(d.agenzia)],
      ['Email', esc(d.email)],
      ['Data di nascita', fmtDate(d.nascitaData)],
      ['Luogo di nascita', esc(d.nascitaLuogo)],
      ['Residenza', esc(d.residenza)],
      ['Documento', mask(d.docNumero) + ' <span style="font-weight:500;color:var(--ink-soft)">(dato protetto)</span>'],
      ['Esigenze alimentari', d.dieta ? (d.dietaTipi.join(', ') || 'Sì') : 'Nessuna'],
      ['Note', d.note ? esc(d.note.slice(0, 90)) + (d.note.length > 90 ? '…' : '') : '—']
    ];
    $('#recap').innerHTML = rows.map(r => `<div class="recap__r"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  }

  $('#f-privacy').addEventListener('change', e => {
    $('#privacy-err').classList.toggle('is-on', !e.target.checked);
    $('#privacy-opt').classList.toggle('is-sel', e.target.checked);
  });

  $('#btn-submit-yes').addEventListener('click', async e => {
    if (!$('#f-privacy').checked) { $('#privacy-err').classList.add('is-on'); $('#f-privacy').focus(); return; }
    const d = collect();
    const btn = e.currentTarget;
    busy(btn, true);
    let out;
    try { out = await apiPost('registrazione', d); }
    catch (err) { console.error('[MET UP!] invio registrazione', err); busy(btn, false); erroreInvio(); return; }
    busy(btn, false);
    if (!out.ok) { if (out.error === 'duplicato') duplicato(); else erroreInvio(); return; }
    registrate.push(d.email.toLowerCase());
    formYes.classList.add('hidden');
    choice.innerHTML = `<div style="grid-column:1/-1;background:rgba(107,192,75,.14);border:1px solid rgba(107,192,75,.45);
        border-radius:20px;padding:22px">
        <b style="display:block;font-size:18px;margin-bottom:6px">Partecipazione confermata ✓</b>
        <span style="font-size:14.5px;color:rgba(255,255,255,.82)">Grazie ${esc(d.nome)}, ci vediamo il 14 ottobre a Villa Quaranta.</span></div>`;
    choice.classList.remove('hidden');
    openModal({
      title: 'Ci vediamo a MET UP! 🎉',
      body: `<p class="modal__p"><strong style="color:var(--ink)">La tua partecipazione è confermata.</strong></p>
             <p class="modal__p">Abbiamo ricevuto correttamente la tua registrazione. Ti aspettiamo il 14 ottobre a Villa Quaranta!</p>`,
      cta: '<button class="btn btn--primary btn--full" id="m-back">Torna a MET UP!</button>'
    });
    $('#m-back').addEventListener('click', () => { closeModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  $('#btn-submit-no').addEventListener('click', async e => {
    let ok = true, first = null;
    ['#n-nome', '#n-cognome', '#n-agenzia', '#n-email'].forEach(id => {
      const inp = $(id); let bad = !inp.value.trim();
      if (!bad && inp.type === 'email' && !isEmail(inp.value)) bad = true;
      fieldErr(inp, bad); if (bad) { ok = false; if (!first) first = inp; }
    });
    if (!ok) { first.focus(); return; }
    const mail = $('#n-email').value.trim().toLowerCase();
    if (registrate.includes(mail)) { duplicato(); return; }
    const btn = e.currentTarget;
    busy(btn, true);
    let out;
    try {
      out = await apiPost('rifiuto', {
        nome: $('#n-nome').value.trim(), cognome: $('#n-cognome').value.trim(),
        agenzia: $('#n-agenzia').value.trim(), email: mail, messaggio: $('#n-msg').value.trim()
      });
    } catch (err) { console.error('[MET UP!] invio rifiuto', err); busy(btn, false); erroreInvio(); return; }
    busy(btn, false);
    if (!out.ok) { if (out.error === 'duplicato') duplicato(); else erroreInvio(); return; }
    registrate.push(mail);
    formNo.classList.add('hidden');
    choice.innerHTML = `<div style="grid-column:1/-1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);
        border-radius:20px;padding:22px">
        <b style="display:block;font-size:18px;margin-bottom:6px">Risposta registrata</b>
        <span style="font-size:14.5px;color:rgba(255,255,255,.82)">Grazie per averci dato conferma. Ci dispiace non averti con noi e speriamo di rivederti presto!</span></div>`;
    choice.classList.remove('hidden');
    openModal({
      title: 'Grazie per averci dato conferma',
      body: `<p class="modal__p">Ci dispiace non averti con noi e speriamo di rivederti presto!</p>`,
      cta: '<button class="btn btn--outline btn--full" id="m-back2">Torna a MET UP!</button>',
      ico: ICO_I, grad: 'var(--grad-01)'
    });
    $('#m-back2').addEventListener('click', () => { closeModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });

  /* ---------------- FORM CONTATTI ---------------- */
  $('#btn-contact').addEventListener('click', async e => {
    let ok = true, first = null;
    ['#c-nome', '#c-cognome', '#c-agenzia', '#c-email', '#c-ogg', '#c-msg'].forEach(id => {
      const inp = $(id); let bad = !inp.value.trim();
      if (!bad && inp.type === 'email' && !isEmail(inp.value)) bad = true;
      fieldErr(inp, bad); if (bad) { ok = false; if (!first) first = inp; }
    });
    if (!ok) { first.focus(); return; }
    const btn = e.currentTarget;
    busy(btn, true);
    let out;
    try {
      out = await apiPost('richiesta', {
        nome: $('#c-nome').value.trim(), cognome: $('#c-cognome').value.trim(),
        agenzia: $('#c-agenzia').value.trim(), email: $('#c-email').value.trim(),
        oggetto: $('#c-ogg').value, messaggio: $('#c-msg').value.trim()
      });
    } catch (err) { console.error('[MET UP!] invio richiesta', err); busy(btn, false); erroreInvio(); return; }
    busy(btn, false);
    if (!out.ok) { erroreInvio(); return; }
    ['#c-nome', '#c-cognome', '#c-agenzia', '#c-email', '#c-msg'].forEach(id => $(id).value = '');
    $('#c-ogg').value = '';
    openModal({
      title: 'Richiesta inviata!',
      body: `<p class="modal__p">Il Team Marketing ha ricevuto il tuo messaggio e ti risponderà il prima possibile.</p>`,
      cta: '<button class="btn btn--primary btn--full" id="m-back3">Chiudi</button>'
    });
    $('#m-back3').addEventListener('click', closeModal);
  });
}
