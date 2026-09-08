/* MET UP! 2026 — Area riservata: dati di esempio e logica (prototipo).
   Nessun dato reale: tutto vive in memoria e si azzera al ricaricamento. */

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const P = [];
const REQ = [];
const STOR = [];
const LOG = [];
const ACC = [
 {n:"Organizzatrice 1",em:"marketing1@metenergiaitalia.it",ru:"Amministratrice",doc:"Sì",last:"—"},
 {n:"Organizzatrice 2",em:"marketing2@metenergiaitalia.it",ru:"Editor",doc:"Sì",last:"—"}
];

let bound = false;

export function initAdmin() {
  if (bound || !$('#app')) return;
  bound = true;

  /* ---------------- login / shell ---------------- */
  $('#lg-go').addEventListener('click', () => { $('#login').style.display = 'none'; $('#app').classList.add('is-on'); });
  $('#logout').addEventListener('click', e => { e.preventDefault(); $('#app').classList.remove('is-on'); $('#login').style.display = 'grid'; });
  $('#hb').addEventListener('click', () => $('#side').classList.toggle('is-open'));

  const TITLES = {
    dash: ['Dashboard', 'MET UP! – MET Partner Convention 2026 · 14–15 ottobre 2026'],
    part: ['Partecipanti', 'Risposte, esigenze alimentari, note e dati per il check-in'],
    cont: ['Contenuti sito', 'Programma, info utili, FAQ, testi e aggiornamenti'],
    com: ['Comunicazioni', 'Invio email ai partecipanti confermati'],
    stor: ['Storico invii', 'Comunicazioni già inviate e relative statistiche'],
    req: ['Richieste partner', 'Messaggi ricevuti dal form «Contatta il Team Marketing»'],
    exp: ['Export dati', 'Liste scaricabili in Excel e CSV'],
    log: ['Log &amp; account', 'Accessi, azioni amministrative e utenti autorizzati']
  };
  function go(v) {
    $$('.view').forEach(s => s.classList.toggle('is-on', s.id === 'v-' + v));
    $$('.side a[data-v]').forEach(a => a.classList.toggle('is-on', a.dataset.v === v));
    $('#view-t').innerHTML = TITLES[v][0] + '<span class="top__sub">' + TITLES[v][1] + '</span>';
    $('#side').classList.remove('is-open');
    window.scrollTo({ top: 0 });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-v]');
    if (a && !a.classList.contains('side__u')) { e.preventDefault(); go(a.dataset.v); }
  });

  /* ---------------- helpers ---------------- */
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('is-on'); setTimeout(() => t.classList.remove('is-on'), 3200); }
  function modal(t, b, f) { $('#md-t').innerHTML = t; $('#md-b').innerHTML = b; $('#md-f').innerHTML = f || ''; $('#md').classList.add('is-on'); }
  function mdx() { $('#md').classList.remove('is-on'); }
  $$('[data-mdx]').forEach(e => e.addEventListener('click', mdx));
  $$('[data-dwx]').forEach(e => e.addEventListener('click', () => $('#dw').classList.remove('is-on')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { mdx(); $('#dw').classList.remove('is-on'); } });
  const conf = () => P.filter(p => p.st === 'CONFERMATO');
  const mask = s => s ? s.slice(0, 2) + '•'.repeat(Math.max(0, s.length - 4)) + s.slice(-2) : '—';
  const itDate = s => s ? s.split('-').reverse().join('/') : '—';

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    const c = conf().length, no = P.length - c, al = P.filter(p => p.diet).length,
      nt = P.filter(p => p.note).length, rq = REQ.filter(r => r.st !== 'Risolta').length;
    $('#kpis').innerHTML = [
      ['Partecipanti confermati', c, 'g', 'risposte positive'],
      ['Non parteciperanno', no, 'b', 'risposte negative'],
      ['Totale risposte', P.length, '', 'registrazioni ricevute'],
      ['Allergie/intolleranze', al, 'w', 'da segnalare alla struttura'],
      ['Note da leggere', nt, '', 'richieste nel campo note'],
      ['Richieste da gestire', rq, 'w', 'dal form contatti']
    ].map(k => `<div class="kpi"><div class="kpi__l">${k[0]}</div><div class="kpi__v ${k[2]}">${k[1]}</div><div class="kpi__n">${k[3]}</div></div>`).join('');

    $('#qa').innerHTML = [
      ['part', 'Partecipanti', 'Elenco, schede e correzione dati'],
      ['cont', 'Modifica programma', 'Giornate, orari e attività'],
      ['cont', 'Aggiorna sito', 'Info utili, FAQ, testi, aggiornamenti'],
      ['com', 'Invia comunicazione', 'Email ai partecipanti confermati'],
      ['req', 'Richieste partner', 'Messaggi dal form contatti'],
      ['exp', 'Esporta dati', 'Excel e CSV']
    ].map(q => `<button data-v="${q[0]}"><b>${q[1].toUpperCase()}</b><span>${q[2]}</span></button>`).join('');

    const l = STOR[STOR.length - 1];
    if (!l) {
      $('#last-com').innerHTML = '<div class="empty">Nessuna comunicazione inviata.</div>';
    } else {
    $('#last-com').innerHTML = `<div style="font-size:13px"><b style="font-size:14.5px">${esc(l.og)}</b>
      <div style="color:var(--ink-soft);margin-top:6px">${l.dt} · ${esc(l.au)} · ${l.n} destinatari</div>
      <div class="tools" style="margin-top:12px"><span class="pill pill--ok"><i class="dot"></i>${l.st}</span>
      <span class="pill pill--i">${l.del} consegnate</span><span class="pill pill--w">${l.bo} bounce</span>
      <span class="pill pill--i">${l.ap} aperture</span></div>
      <button class="btn btn--o btn--xs" data-v="stor" style="margin-top:14px">Vedi storico completo</button></div>`;
    }

    $('#t-recent').innerHTML = `<thead><tr><th>Partecipante</th><th>Agenzia</th><th>Stato</th><th>Data</th></tr></thead><tbody>` +
      (P.length ? '' : '<tr><td colspan="4" class="empty">Nessuna registrazione ricevuta.</td></tr>') +
      P.slice().sort((a, b) => b.dt.localeCompare(a.dt)).slice(0, 5).map(p => `<tr data-id="${p.id}">
        <td><b>${esc(p.n)} ${esc(p.c)}</b></td><td>${p.ag}</td>
        <td>${p.st === 'CONFERMATO' ? '<span class="pill pill--ok"><i class="dot"></i>Confermato</span>' : '<span class="pill pill--no"><i class="dot"></i>Non partecipa</span>'}</td>
        <td>${p.dt}</td></tr>`).join('') + `</tbody>`;
  }

  /* ---------------- partecipanti ---------------- */
  let sortKey = 'dt', sortDir = -1;
  function renderPart() {
    const q = ($('#p-q').value || '').toLowerCase(), f = $('#p-f').value, d = $('#p-d').value;
    const rows = P.filter(p => {
      const hay = (p.n + ' ' + p.c + ' ' + p.ag + ' ' + p.em).toLowerCase();
      return (!q || hay.includes(q)) && (!f || p.st === f) && (!d || p.diet);
    }).sort((a, b) => {
      const va = (a[sortKey] || '').toString().toLowerCase(), vb = (b[sortKey] || '').toString().toLowerCase();
      return va < vb ? -sortDir : va > vb ? sortDir : 0;
    });
    const cols = [['n', 'Nome'], ['c', 'Cognome'], ['ag', 'Agenzia'], ['em', 'Email'], ['st', 'Stato'], ['dt', 'Registrazione'], ['diet', 'Allergie'], ['note', 'Note'], ['mail', 'Email conferma']];
    $('#t-part').innerHTML = `<thead><tr>${cols.map(c => `<th data-k="${c[0]}">${c[1]}${sortKey === c[0] ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>` +
      (rows.length ? rows.map(p => `<tr data-id="${p.id}">
        <td><b>${esc(p.n)}</b></td><td><b>${esc(p.c)}</b></td><td>${p.ag}</td>
        <td style="color:var(--ink-soft)">${esc(p.em)}</td>
        <td>${p.st === 'CONFERMATO' ? '<span class="pill pill--ok"><i class="dot"></i>Confermato</span>' : '<span class="pill pill--no"><i class="dot"></i>Non partecipa</span>'}</td>
        <td>${p.dt}</td>
        <td>${p.diet ? '<span class="pill pill--w">Sì</span>' : '<span style="color:var(--ink-soft)">No</span>'}</td>
        <td>${p.note ? '<span class="pill pill--i">Sì</span>' : '<span style="color:var(--ink-soft)">No</span>'}</td>
        <td>${p.mail === 'Inviata' ? '<span class="pill pill--ok">Inviata</span>' : '<span class="pill pill--b">Errore</span>'}</td>
      </tr>`).join('') : (q || f || d ? '<tr><td colspan="9" class="empty">Nessun partecipante corrisponde ai filtri impostati.</td></tr>' : '<tr><td colspan="9" class="empty">Nessuna registrazione ricevuta.<br><span style="font-size:12.5px">Le risposte dei partner compariranno qui.</span></td></tr>')) + `</tbody>`;
    $('#p-count').textContent = rows.length + ' partecipanti visualizzati su ' + P.length + ' risposte totali · ' + conf().length + ' confermati';
    $$('#t-part th').forEach(th => th.addEventListener('click', () => {
      const k = th.dataset.k;
      if (k === sortKey) sortDir *= -1; else { sortKey = k; sortDir = 1; }
      renderPart();
    }));
  }
  document.addEventListener('input', e => { if (e.target.matches('#p-q, #p-f, #p-d')) renderPart(); });
  document.addEventListener('change', e => { if (e.target.matches('#p-f, #p-d')) renderPart(); });

  document.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const p = P.find(x => x.id == tr.dataset.id); if (p) openCard(p);
  });

  function openCard(p) {
    $('#dw-t').innerHTML = esc(p.n) + ' ' + esc(p.c);
    $('#dw-s').innerHTML = p.ag + ' · registrato il ' + p.dt;
    const dl = r => `<div class="dl">${r.map(x => `<div class="dl__r"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>`;
    $('#dw-b').innerHTML = `
      <div class="tools" style="margin-bottom:18px">
        ${p.st === 'CONFERMATO' ? '<span class="pill pill--ok"><i class="dot"></i>Confermato</span>' : '<span class="pill pill--no"><i class="dot"></i>Non partecipa</span>'}
        ${p.diet ? '<span class="pill pill--w">Esigenze alimentari</span>' : ''}
        ${p.note ? '<span class="pill pill--i">Note</span>' : ''}
        ${p.mail === 'Errore' ? '<span class="pill pill--b">Email di conferma non recapitata</span>' : ''}
      </div>
      <div class="sect">Dati anagrafici e contatto</div>
      ${dl([['Nome', esc(p.n)], ['Cognome', esc(p.c)], ['Agenzia', p.ag], ['Email', esc(p.em)]])}
      ${p.st === 'CONFERMATO' ? `
        <div class="sect">Dati per il check-in</div>
        <div class="dl prot">
          <div class="warn">🔒 Dati sensibili: visibili solo agli account autorizzati, mai inclusi nella tabella generale né inviati per email. Ogni visualizzazione in chiaro è tracciata nel log.</div>
          <div class="dl__r"><span>Data di nascita</span><b>${itDate(p.nasc)}</b></div>
          <div class="dl__r"><span>Luogo di nascita</span><b>${esc(p.nascL || '—')}</b></div>
          <div class="dl__r"><span>Residenza</span><b>${esc(p.res || '—')}</b></div>
          <div class="dl__r"><span>N. documento</span><b class="mask" id="doc-v">${mask(p.doc)}</b></div>
          <div class="dl__r"><span>Luogo emissione</span><b>${esc(p.docL || '—')}</b></div>
          <div class="dl__r"><span>Data emissione</span><b>${itDate(p.docD)}</b></div>
        </div>
        <button class="btn btn--o btn--xs" id="doc-show">Mostra numero in chiaro</button>` : ''}
      <div class="sect">Esigenze alimentari</div>
      ${dl([['Segnalate', p.diet ? '<span class="pill pill--w">' + esc(p.diet) + '</span>' : 'Nessuna'], ['Dettagli', esc(p.note && p.diet ? p.note : '—')]])}
      <div class="sect">Note del partecipante</div>
      <div class="dl"><div class="dl__r" style="grid-template-columns:1fr"><b style="font-weight:500">${p.note ? esc(p.note) : '<span style="color:var(--ink-soft)">Nessuna nota</span>'}</b></div></div>
      <div class="sect">Azioni</div>
      <div class="tools">
        <button class="btn btn--o btn--xs" id="edit-p">Correggi i dati</button>
        <button class="btn btn--o btn--xs" id="resend">Rinvia email di conferma</button>
        <button class="btn btn--d btn--xs" id="chg-st">${p.st === 'CONFERMATO' ? 'Segna come «Non partecipa»' : 'Segna come «Confermato»'}</button>
      </div>`;
    $('#dw').classList.add('is-on');
    const ds = $('#doc-show');
    if (ds) ds.addEventListener('click', () => {
      $('#doc-v').textContent = p.doc; ds.disabled = true; ds.textContent = 'Visualizzazione registrata nel log';
      LOG.unshift({ dt: '2026-08-20 13:40', u: ACC[0].n, a: 'Visualizzazione dati documento — scheda #' + p.id + ' (' + p.n[0] + '. ' + p.c + ')' });
      renderLog(); toast('Accesso al dato registrato nel log amministrativo');
    });
    $('#edit-p').addEventListener('click', () => modal('Correzione dati partecipante',
      `<p>Nel sito definitivo questa azione apre il form di modifica dei campi della scheda: le organizzatrici autorizzate possono correggere qualsiasi dato, il partecipante no.</p>
       <p>Ogni modifica viene salvata con autore, data/ora e valore precedente nel log amministrativo.</p>`,
      `<button class="btn btn--o" data-mdx>Chiudi</button>`));
    $('#resend').addEventListener('click', () => { p.mail = 'Inviata'; renderPart(); renderDash(); toast('Email di conferma rinviata a ' + p.em); openCard(p); });
    $('#chg-st').addEventListener('click', () => { p.st = p.st === 'CONFERMATO' ? 'NON PARTECIPA' : 'CONFERMATO'; renderPart(); renderDash(); renderComRcp(); toast('Stato aggiornato: ' + p.st); openCard(p); });
    $$('#md [data-mdx]').forEach(b => b.addEventListener('click', mdx));
  }

  /* ---------------- contenuti ---------------- */
  const CONT = [
    { t: 'Programma — 14 ottobre', st: 'Orari in definizione', b: `
      ${['Arrivo ospiti / Welcome Desk', 'Light Lunch', 'MET Partner Convention', 'Coffee Break', 'Attività / Intrattenimento', 'Aperitivo', 'Cena', 'Pernottamento']
        .map(v => `<div class="row"><input class="inp" placeholder="hh:mm" style="width:96px" aria-label="Orario di ${v}"><input class="inp" value="${v}" aria-label="Titolo della voce di programma"></div>`).join('')}
      <div class="tools" style="margin-top:12px"><button class="btn btn--o btn--xs">+ Aggiungi voce</button>
      <label style="font-size:12.5px;display:flex;gap:8px;align-items:center"><input type="checkbox"> Programma definitivo (rimuove l'avviso «in aggiornamento»)</label></div>` },
    { t: 'Programma — 15 ottobre', st: 'Orari in definizione', b: `
      ${['Prima colazione', 'Check-out', 'Partenza'].map(v => `<div class="row"><input class="inp" placeholder="hh:mm" style="width:96px" aria-label="Orario di ${v}"><input class="inp" value="${v}" aria-label="Titolo della voce di programma"></div>`).join('')}
      <div class="tools" style="margin-top:12px"><button class="btn btn--o btn--xs">+ Aggiungi voce</button></div>` },
    { t: 'Info utili', st: '2 schede pubblicate su 6', b: `
      ${[['Check-in e check-out', '', 0], ['Pernottamento', 'Il programma di MET UP! prevede il pernottamento tra il 14 e il 15 ottobre a Villa Quaranta…', 1],
        ['Transfer', 'Non sono previsti transfer organizzati da MET…', 1], ['Esigenze alimentari', 'Allergie, intolleranze ed esigenze alimentari si comunicano in fase di registrazione…', 1],
        ['Dress code', '', 0], ['Servizi della struttura', '', 0]]
        .map(c => `<div class="row" style="grid-template-columns:1fr;gap:6px">
           <div style="display:flex;gap:10px;align-items:center"><b style="font-size:13px">${c[0]}</b>
           <span class="pill ${c[2] ? 'pill--ok' : 'pill--w'}" style="margin-left:auto">${c[2] ? 'Pubblicata' : 'Informazioni in arrivo'}</span></div>
           <textarea class="inp" style="min-height:62px" aria-label="Testo della scheda ${c[0]}" placeholder="Se il campo resta vuoto, in pagina compare «Informazioni in arrivo» — non un campo vuoto.">${c[1]}</textarea></div>`).join('')}` },
    { t: 'FAQ', st: '8 domande pubblicate', b: `
      ${['Quando si svolge MET UP!?', 'Dove si trova Villa Quaranta?', 'Il pernottamento è incluso?', 'Quando potrò effettuare il check-in?', 'Come raggiungo Villa Quaranta?', 'Come comunico allergie o intolleranze?', 'Come posso modificare un dato già inviato?', 'Chi posso contattare per una richiesta particolare?']
        .map(q => `<div class="row" style="grid-template-columns:1fr auto"><input class="inp" value="${q}" aria-label="Domanda FAQ"><button class="btn btn--o btn--xs">Modifica</button></div>`).join('')}
      <div class="tools" style="margin-top:12px"><button class="btn btn--o btn--xs">+ Aggiungi domanda</button></div>` },
    { t: 'Testi della pagina', st: 'Hero, concept, location', b: `
      <div class="row" style="grid-template-columns:1fr;gap:6px"><label class="lb">Testo introduttivo (hero)</label>
        <textarea class="inp">Un'occasione per ritrovarci, condividere esperienze e guardare insieme alle prossime opportunità. Due giornate dedicate alla nostra rete, alle connessioni e al valore che possiamo creare insieme.</textarea></div>
      <div class="row" style="grid-template-columns:1fr;gap:6px"><label class="lb">Sezione concept</label>
        <textarea class="inp">MET UP! nasce per riunire la nostra rete di partner in un momento dedicato all'incontro, al confronto e alla condivisione…</textarea></div>` },
    { t: 'Immagini e documenti', st: '8 slot da caricare', b: `
      ${['Hero — Villa Quaranta (2400×1400)', 'Gallery 01 — Camere (1200×1200)', 'Gallery 02 — Sale meeting', 'Gallery 03 — Ristorante', 'Gallery 04 — Aree esterne', 'Gallery 05 — Valpolicella', 'Gallery 06 — SPA / Terme', 'Foto organizzatrici (2 × 800×800)']
        .map(s => `<div class="row" style="grid-template-columns:1fr auto"><span style="font-size:13px">${s}</span><button class="btn btn--o btn--xs">Carica</button></div>`).join('')}
      <div class="row" style="grid-template-columns:1fr auto"><span style="font-size:13px"><b>Programma in PDF</b> — attiva il pulsante «Scarica il programma»</span><button class="btn btn--o btn--xs">Carica PDF</button></div>` },
    { t: 'Ultimi aggiornamenti &amp; alert', st: '2 voci pubblicate', b: `
      <div class="row"><input class="inp" value="20 agosto" style="width:96px" aria-label="Data aggiornamento"><input class="inp" value="Online la pagina di MET UP!" aria-label="Titolo aggiornamento"></div>
      <div class="row"><input class="inp" value="18 agosto" style="width:96px" aria-label="Data aggiornamento"><input class="inp" value="Save the Date" aria-label="Titolo aggiornamento"></div>
      <div class="tools" style="margin-top:12px"><button class="btn btn--o btn--xs">+ Aggiungi aggiornamento</button>
      <label style="font-size:12.5px;display:flex;gap:8px;align-items:center"><input type="checkbox"> Mostra badge «NEW» sulle sezioni aggiornate</label></div>
      <div class="row" style="grid-template-columns:1fr;gap:6px;margin-top:8px"><label class="lb">Alert in evidenza (opzionale, in cima alla pagina)</label>
        <input class="inp" placeholder="Es. Le iscrizioni chiudono il 30 settembre" aria-label="Alert in evidenza"></div>` }
  ];
  function renderCont() {
    $('#cont-acc').innerHTML = CONT.map((c, i) => `
      <div class="acc${i === 0 ? ' is-on' : ''}">
        <button class="acc__h">${c.t}<span class="st pill ${/definizione|arrivo|caricare/.test(c.st) ? 'pill--w' : 'pill--i'}">${c.st}</span></button>
        <div class="acc__b">${c.b}</div>
      </div>`).join('');
    $$('.acc__h').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('is-on')));
  }
  $('#cont-save').addEventListener('click', () => { $('#cont-saved').classList.add('is-on'); toast('Contenuti salvati. Il sito è aggiornato: nessuna email è stata inviata.'); });
  $('#cont-notify').addEventListener('click', () => { go('com'); toast('Componi la comunicazione per avvisare i partecipanti'); });

  /* ---------------- comunicazioni ---------------- */
  function renderComRcp() {
    const sel = $('#c-dest').value === 'sel';
    $('#c-sel-box').style.display = sel ? 'block' : 'none';
    const list = conf();
    $('#c-sel-list').innerHTML = list.map(p => `<label class="tagx"><input type="checkbox" class="c-one" value="${p.id}" checked> ${esc(p.n)} ${esc(p.c)}</label>`).join('');
    const n = sel ? $$('.c-one:checked').length : list.length;
    $('#c-n').textContent = n + ' destinatari';
    $('#c-rcp').innerHTML = `<label class="lb">Destinatari inclusi (${n})</label>
      <div class="rcp">${list.map(p => `<span class="tagx">${esc(p.em)}</span>`).join('')}</div>
      <p style="font-size:12px;color:var(--ink-soft);margin:10px 0 0">Esclusi automaticamente: ${P.length - list.length} partecipanti con risposta «Non parteciperò».</p>`;
    renderPrev();
  }
  function renderPrev() {
    $('#c-prev').innerHTML = `
      <div class="prev__top">
        <b>MET Energia Italia Events</b>
        events@metenergiaitalia.it → destinatario<br>
        Oggetto: <b style="display:inline">${esc($('#c-ogg').value)}</b>
      </div>
      <div class="prev__body">
        <div class="prev__h">${esc($('#c-tit').value)}</div>
        <div style="font-size:13.5px;color:var(--ink-soft);white-space:pre-line">${esc($('#c-msg').value)}</div>
        <div class="prev__cta">SCOPRI L'AGGIORNAMENTO</div>
        <p style="font-size:11.5px;color:var(--ink-soft);margin-top:18px">MET Energia Italia · MET UP! – MET Partner Convention 2026<br>Per qualsiasi necessità puoi rispondere direttamente a questa email.</p>
      </div>`;
  }
  document.addEventListener('input', e => { if (e.target.matches('#c-ogg, #c-tit, #c-msg')) renderPrev(); });
  $('#c-dest').addEventListener('change', renderComRcp);
  document.addEventListener('change', e => { if (e.target.classList.contains('c-one')) renderComRcp(); });
  $('#c-test').addEventListener('click', () => toast('Email di test inviata a ' + ACC[0].em));
  $('#c-send').addEventListener('click', () => {
    const n = $('#c-dest').value === 'sel' ? $$('.c-one:checked').length : conf().length;
    modal('Confermi l\'invio?',
      `<p>Stai per inviare questa comunicazione a <b style="color:var(--ink)">${n} partecipanti</b>.</p>
       <div class="note note--i" style="margin:0"><span>✉️</span><div><b>Oggetto:</b> ${esc($('#c-ogg').value)}<br><b>Mittente:</b> MET Energia Italia Events &lt;events@metenergiaitalia.it&gt;</div></div>`,
      `<button class="btn btn--o" data-mdx>Annulla</button><button class="btn btn--p" id="md-ok">Sì, invia ora</button>`);
    $('#md-ok').addEventListener('click', () => {
      STOR.push({ dt: '2026-08-20 14:05', og: $('#c-ogg').value, au: ACC[0].n, n: n, st: 'In corso', del: 0, bo: 0, ap: 0, cl: 0 });
      LOG.unshift({ dt: '2026-08-20 14:05', u: ACC[0].n, a: 'Invio comunicazione a ' + n + ' destinatari' });
      mdx(); renderStor(); renderLog(); renderDash(); go('stor');
      toast('Invio avviato verso ' + n + ' destinatari');
    });
    $$('#md [data-mdx]').forEach(b => b.addEventListener('click', mdx));
  });

  /* ---------------- storico ---------------- */
  function renderStor() {
    $('#t-stor').innerHTML = `<thead><tr><th>Data/ora</th><th>Oggetto</th><th>Autore</th><th>Destinatari</th><th>Stato</th><th>Consegnate</th><th>Bounce</th><th>Aperture</th><th>Click</th></tr></thead><tbody>` +
      (STOR.length ? '' : '<tr><td colspan="9" class="empty">Nessuna comunicazione inviata.</td></tr>') +
      STOR.slice().reverse().map(s => `<tr><td>${s.dt}</td><td><b>${esc(s.og)}</b></td><td>${esc(s.au)}</td><td>${s.n}</td>
        <td>${s.st === 'Inviata' ? '<span class="pill pill--ok"><i class="dot"></i>Inviata</span>' : '<span class="pill pill--w"><i class="dot"></i>In corso</span>'}</td>
        <td>${s.del || '—'}</td><td>${s.bo ? '<span class="pill pill--b">' + s.bo + '</span>' : '—'}</td><td>${s.ap || '—'}</td><td>${s.cl || '—'}</td></tr>`).join('') + `</tbody>`;
  }

  /* ---------------- richieste ---------------- */
  function renderReq() {
    const f = $('#r-f').value;
    const rows = REQ.filter(r => !f || r.st === f);
    $('#req-list').innerHTML = rows.length ? rows.map(r => `
      <div style="padding:18px;border-bottom:1px solid var(--line)">
        <div class="tools" style="margin-bottom:8px">
          <span class="pill ${r.st === 'Nuova' ? 'pill--w' : r.st === 'In gestione' ? 'pill--i' : 'pill--ok'}"><i class="dot"></i>${r.st}</span>
          <span style="font-size:12px;color:var(--ink-soft)">${r.dt}</span>
        </div>
        <b style="font-size:14.5px">${esc(r.n)} ${esc(r.c)}</b>
        <div style="font-size:12.5px;color:var(--ink-soft)">${esc(r.ag)} · ${esc(r.em)}</div>
        <div style="margin-top:10px;font-size:13px"><b>Oggetto:</b> ${esc(r.og)}</div>
        <p style="margin:8px 0 0;font-size:13.5px">${esc(r.msg)}</p>
        <div class="tools" style="margin-top:14px">
          <a class="btn btn--o btn--xs" href="mailto:${esc(r.em)}?subject=Re: ${encodeURIComponent(r.og)}">Rispondi via email</a>
          <button class="btn btn--o btn--xs" data-req="${r.id}" data-st="In gestione">Segna «In gestione»</button>
          <button class="btn btn--o btn--xs" data-req="${r.id}" data-st="Risolta">Segna «Risolta»</button>
        </div>
      </div>`).join('') : '<div class="empty">Nessuna richiesta ricevuta.</div>';
    $$('[data-req]').forEach(b => b.addEventListener('click', () => {
      const r = REQ.find(x => x.id == b.dataset.req); r.st = b.dataset.st;
      renderReq(); renderDash(); updBadge(); toast('Richiesta aggiornata: ' + r.st);
    }));
  }
  function updBadge() { const n = REQ.filter(r => r.st === 'Nuova').length; const b = $('#req-b'); b.textContent = n; b.style.display = n ? '' : 'none'; }
  $('#r-f').addEventListener('change', renderReq);

  /* ---------------- export ---------------- */
  const EXP = [
    ['Lista partecipanti', 'Nome, cognome, agenzia, email, stato, data registrazione', 'no'],
    ['Lista check-in hotel', 'Dati richiesti dalla struttura, inclusi documento di identità e luogo/data di emissione', 'si'],
    ['Lista esigenze alimentari', 'Nome, agenzia, tipologia e dettagli comunicati — da inviare al ristorante', 'no'],
    ['Lista note e richieste', 'Note dei partecipanti e messaggi ricevuti dal form contatti', 'no']
  ];
  function renderExp() {
    $('#exp-list').innerHTML = EXP.map(e => `
      <div class="card"><div class="card__b" style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
        <div style="flex:1;min-width:220px">
          <b style="font-size:14.5px">${e[0]}</b>${e[2] === 'si' ? ' <span class="pill pill--b">Dati documento</span>' : ''}
          <div style="font-size:12.5px;color:var(--ink-soft);margin-top:4px">${e[1]}</div>
        </div>
        <div class="tools"><button class="btn btn--s btn--xs" data-x="${e[0]}|Excel">Excel</button>
        <button class="btn btn--o btn--xs" data-x="${e[0]}|CSV">CSV</button></div>
      </div></div>`).join('');
    $$('[data-x]').forEach(b => b.addEventListener('click', () => {
      const [n, f] = b.dataset.x.split('|');
      LOG.unshift({ dt: '2026-08-20 14:10', u: ACC[0].n, a: 'Export «' + n + '» (' + f.toUpperCase() + ')' }); renderLog();
      toast('Nel prototipo il file non viene generato · export registrato nel log: ' + n + ' (' + f + ')');
    }));
  }

  /* ---------------- log & account ---------------- */
  function renderLog() {
    $('#log-list').innerHTML = (LOG.length ? '' : '<div class="empty">Nessuna azione registrata.</div>') + LOG.slice(0, 10).map(l => `
      <div style="display:grid;grid-template-columns:112px 1fr;gap:12px;font-size:12.5px;padding-bottom:10px;border-bottom:1px dashed var(--line)">
        <span style="color:var(--ink-soft)">${l.dt}</span><span><b>${esc(l.u)}</b> — ${esc(l.a)}</span></div>`).join('');
    $('#t-acc').innerHTML = `<thead><tr><th>Organizzatrice</th><th>Email</th><th>Ruolo</th><th>Accesso dati documento</th><th>Ultimo accesso</th></tr></thead><tbody>` +
      ACC.map(a => `<tr><td><b>${esc(a.n)}</b></td><td>${esc(a.em)}</td>
        <td><span class="pill pill--i">${a.ru}</span></td><td>${a.doc === 'Sì' ? '<span class="pill pill--w">Consentito</span>' : '<span class="pill pill--no">Non consentito</span>'}</td>
        <td>${a.last}</td></tr>`).join('') + `</tbody>`;
  }

  renderDash(); renderPart(); renderCont(); renderComRcp(); renderStor(); renderReq(); renderExp(); renderLog(); updBadge();
}
