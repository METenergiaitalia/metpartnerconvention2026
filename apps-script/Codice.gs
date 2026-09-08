/**
 * MET UP! 2026 — backend a costo zero su Google
 * Google Apps Script + Google Sheets (database) + invio email di conferma.
 *
 * COME USARLO
 * 1. Crea un Google Sheet con i fogli: Partecipanti, Richieste, Log
 *    (intestazioni: vedi setupFogli() — eseguila una volta sola).
 * 2. Estensioni → Apps Script, incolla questo file, salva.
 * 3. Proprietà dello script (Impostazioni progetto → Proprietà script):
 *      API_TOKEN        token casuale lungo, condiviso con la landing
 *      MAIL_MODE        'graph' | 'mailapp'
 *      GRAPH_TENANT     (solo graph) id tenant Entra ID
 *      GRAPH_CLIENT_ID  (solo graph) id applicazione
 *      GRAPH_SECRET     (solo graph) client secret
 *      FROM_ADDRESS     events@metenergiaitalia.it
 *      SITE_URL         URL pubblico della landing
 * 4. Distribuisci → Nuova distribuzione → Applicazione web
 *      Esegui come: me · Accesso: chiunque (l'autorizzazione la fa API_TOKEN)
 * 5. Copia l'URL /exec e mettilo nella landing come API_URL.
 *
 * NIENTE DATI DEL DOCUMENTO NELLE EMAIL: restano solo nel foglio protetto.
 */

const SHEETS = { part: 'Partecipanti', req: 'Richieste', log: 'Log' };

/* ------------------------------------------------------------------ setup */
function setupFogli() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const head = {
    Partecipanti: ['Data registrazione', 'Stato', 'Nome', 'Cognome', 'Agenzia', 'Ruolo', 'Email',
      'Esigenze alimentari', 'Dettagli alimentari', 'Note', 'Email conferma',
      'Data nascita', 'Luogo nascita', 'Residenza', 'N. documento', 'Luogo emissione', 'Data emissione'],
    Richieste: ['Data', 'Nome', 'Cognome', 'Agenzia', 'Email', 'Oggetto', 'Messaggio', 'Stato'],
    Log: ['Data', 'Utente', 'Azione']
  };
  Object.keys(head).forEach(name => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(head[name]);
      sh.getRange(1, 1, 1, head[name].length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
}

/* ------------------------------------------------------------- utilities */
function prop(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function sheet(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function json(obj, code) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function logAzione(utente, azione) {
  sheet(SHEETS.log).appendRow([new Date(), utente || 'sistema', azione]);
}
function emailGiaRegistrata(email) {
  const sh = sheet(SHEETS.part);
  if (sh.getLastRow() < 2) return false;
  const col = sh.getRange(2, 7, sh.getLastRow() - 1, 1).getValues().flat();
  return col.some(v => String(v).trim().toLowerCase() === email.trim().toLowerCase());
}

/* --------------------------------------------------------------- routing */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== prop('API_TOKEN')) return json({ ok: false, error: 'unauthorized' });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (body.action) {
        case 'registrazione': return json(registrazione(body.data || {}));
        case 'rifiuto': return json(rifiuto(body.data || {}));
        case 'richiesta': return json(richiesta(body.data || {}));
        default: return json({ ok: false, error: 'unknown action' });
      }
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* GET protetto: usato dall'area riservata per leggere i dati.
   La colonna del documento NON viene mai restituita da qui. */
function doGet(e) {
  if ((e.parameter.token || '') !== prop('API_TOKEN')) return json({ ok: false, error: 'unauthorized' });
  const sh = sheet(SHEETS.part);
  const rows = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues();
  const rq = sheet(SHEETS.req);
  const richieste = rq.getLastRow() < 2 ? [] : rq.getRange(2, 1, rq.getLastRow() - 1, 8).getValues();
  return json({ ok: true, partecipanti: rows, richieste: richieste });
}

/* ---------------------------------------------------------- registrazioni */
function registrazione(d) {
  if (!d.email || !d.nome || !d.cognome || !d.agenzia) return { ok: false, error: 'campi obbligatori mancanti' };
  if (emailGiaRegistrata(d.email)) return { ok: false, error: 'duplicato' };

  const inviata = inviaConferma(d);
  sheet(SHEETS.part).appendRow([
    new Date(), 'CONFERMATO', d.nome, d.cognome, d.agenzia, d.ruolo || '', d.email,
    (d.dietaTipi || []).join(', '), d.dietaNote || '', d.note || '', inviata ? 'Inviata' : 'Errore',
    d.nascitaData || '', d.nascitaLuogo || '', d.residenza || '',
    d.docNumero || '', d.docLuogo || '', d.docData || ''
  ]);
  logAzione(d.email, 'Registrazione confermata' + (inviata ? '' : ' — invio email fallito'));
  return { ok: true, mail: inviata };
}

function rifiuto(d) {
  if (!d.email) return { ok: false, error: 'email mancante' };
  if (emailGiaRegistrata(d.email)) return { ok: false, error: 'duplicato' };
  sheet(SHEETS.part).appendRow([
    new Date(), 'NON PARTECIPA', d.nome || '', d.cognome || '', d.agenzia || '', '', d.email,
    '', '', d.messaggio || '', '—', '', '', '', '', '', ''
  ]);
  logAzione(d.email, 'Risposta negativa registrata');
  return { ok: true };
}

function richiesta(d) {
  if (!d.email || !d.messaggio) return { ok: false, error: 'campi obbligatori mancanti' };
  sheet(SHEETS.req).appendRow([
    new Date(), d.nome || '', d.cognome || '', d.agenzia || '', d.email, d.oggetto || '', d.messaggio, 'Nuova'
  ]);
  inviaNotificaTeam(d);
  return { ok: true };
}

/* ------------------------------------------------------------------ email */
function corpoConferma(d) {
  const site = prop('SITE_URL') || '#';
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0b2b36;line-height:1.6">'
    + '<p>Ciao ' + escapeHtml(d.nome) + ',</p>'
    + '<p>la tua partecipazione a <b>MET UP! – MET Partner Convention 2026</b> è confermata.</p>'
    + '<p>Ti aspettiamo il <b>14 e 15 ottobre 2026</b> a Villa Quaranta, nel cuore della Valpolicella. '
    + 'Abbiamo ricevuto correttamente la tua registrazione.</p>'
    + '<p>Tutte le informazioni sull\'evento, il programma e gli aggiornamenti sono disponibili sulla pagina dedicata.</p>'
    + '<p><a href="' + site + '" style="background:#005870;color:#fff;text-decoration:none;'
    + 'padding:14px 24px;border-radius:100px;font-weight:bold;display:inline-block">VAI A MET UP!</a></p>'
    + '<p>Ti consigliamo di consultare la pagina nei giorni precedenti all\'evento. In caso di aggiornamenti '
    + 'importanti riceverai anche una comunicazione via email.</p>'
    + '<p>Per qualsiasi necessità puoi rispondere direttamente a questa email oppure contattare il Team Marketing '
    + 'dalla pagina dell\'evento.</p>'
    + '<p>A presto,<br>Team Marketing<br>MET Energia Italia</p></div>';
}

function inviaConferma(d) {
  const oggetto = 'Ci vediamo a MET UP! | Partecipazione confermata';
  try {
    if (prop('MAIL_MODE') === 'graph') sendGraph(d.email, oggetto, corpoConferma(d));
    else MailApp.sendEmail({ to: d.email, subject: oggetto, htmlBody: corpoConferma(d), name: 'MET Energia Italia Events' });
    return true;
  } catch (err) {
    logAzione('sistema', 'Invio conferma fallito a ' + d.email + ': ' + err);
    return false;
  }
}

function inviaNotificaTeam(d) {
  const to = prop('FROM_ADDRESS');
  const oggetto = 'MET UP! · Nuova richiesta partner — ' + (d.oggetto || '');
  const html = '<p><b>' + escapeHtml(d.nome + ' ' + d.cognome) + '</b> — ' + escapeHtml(d.agenzia || '') + '<br>'
    + escapeHtml(d.email) + '</p><p><b>Oggetto:</b> ' + escapeHtml(d.oggetto || '') + '</p><p>'
    + escapeHtml(d.messaggio) + '</p>';
  try {
    if (prop('MAIL_MODE') === 'graph') sendGraph(to, oggetto, html);
    else MailApp.sendEmail({ to: to, subject: oggetto, htmlBody: html, replyTo: d.email });
  } catch (err) {
    logAzione('sistema', 'Notifica richiesta non inviata: ' + err);
  }
}

/* Invio tramite Microsoft Graph: il mittente è la casella M365 events@.
   Richiede permesso applicativo Mail.Send limitato a quella casella
   (Application Access Policy in Exchange Online). */
function sendGraph(to, subject, html) {
  const tok = graphToken();
  const from = prop('FROM_ADDRESS');
  const url = 'https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(from) + '/sendMail';
  const payload = {
    message: {
      subject: subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: to } }],
      replyTo: [{ emailAddress: { address: from } }]
    },
    saveToSentItems: true
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + tok },
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) throw new Error('Graph ' + res.getResponseCode() + ': ' + res.getContentText());
}

function graphToken() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('graph_token');
  if (hit) return hit;
  const res = UrlFetchApp.fetch('https://login.microsoftonline.com/' + prop('GRAPH_TENANT') + '/oauth2/v2.0/token', {
    method: 'post', muteHttpExceptions: true,
    payload: {
      client_id: prop('GRAPH_CLIENT_ID'),
      client_secret: prop('GRAPH_SECRET'),
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }
  });
  const body = JSON.parse(res.getContentText());
  if (!body.access_token) throw new Error('token Graph non ottenuto: ' + res.getContentText());
  cache.put('graph_token', body.access_token, 3000);
  return body.access_token;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* --------------------------------------------------------------- test ---- */
function testInvio() {
  const ok = inviaConferma({ nome: 'Prova', email: Session.getEffectiveUser().getEmail() });
  Logger.log('invio: ' + ok);
}
