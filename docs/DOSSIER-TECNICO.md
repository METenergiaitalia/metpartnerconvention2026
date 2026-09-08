# MET UP! — Dossier tecnico e punti da verificare

**MET Partner Convention 2026 · 14–15 ottobre 2026 · Villa Quaranta, Valpolicella (VR)**
Documento a corredo del prototipo. Versione 1.1 — 21 agosto 2026.

> Questo documento serve a due cose: (1) elencare tutto quello che deve essere deciso o
> verificato **prima** della messa online, (2) descrivere come va costruita la parte
> server, che il prototipo non può contenere.

---

## 1. Cosa contiene il prototipo e cosa no

| | Stato |
|---|---|
| Landing pubblica completa, mobile-first, brandizzata MET | ✅ nel prototipo (`index.html`) |
| Flusso RSVP «Sì» a 5 step + flusso «No» + gestione duplicati + schermata di conferma | ✅ nel prototipo (validazioni lato client) |
| Area riservata Team Marketing: dashboard, partecipanti, contenuti, comunicazioni, storico, richieste, export, log | ✅ mockup navigabile (`admin.html`), dati finti in memoria |
| Template email di conferma e di aggiornamento | ✅ HTML pronti (`email/`) |
| Modalità modifica (live editing): riscrittura dei testi in pagina, colori, sezioni, richieste di modifica per sezione ed export | ✅ nel prototipo — **da rimuovere prima della pubblicazione** |
| Salvataggio reale dei dati, invio reale delle email, autenticazione reale, ruoli, export dei file | ❌ **richiedono la parte server** (§3–§5) |

Nel prototipo i dati inseriti **non vengono salvati né inviati**: restano nella pagina e
si azzerano al ricaricamento. È voluto — così il prototipo può circolare per
l'approvazione senza raccogliere dati personali reali.

---

## 2. Pubblicazione su GitHub: il limite da conoscere subito

GitHub Pages serve **solo file statici**. Ospita perfettamente la landing, ma non può:
salvare una registrazione, inviare una email, autenticare le organizzatrici, generare un
export. Servono quindi due pezzi:

1. **Frontend statico** → GitHub Pages (o Vercel/Netlify collegati alla stessa repo).
2. **Backend + database** → un servizio separato, raggiunto via chiamate HTTPS dal frontend.

Opzioni per il punto 2, in ordine di semplicità operativa:

| Opzione | Pro | Contro |
|---|---|---|
| **Vercel** (Next.js: pagina + API + auth nello stesso progetto) + **Postgres gestito** (Neon/Supabase) | un solo deploy, ambiente moderno, region UE selezionabile | esce dal perimetro IT MET: va approvato come fornitore |
| **Netlify/Cloudflare Functions** + database gestito | frontend statico invariato, backend “a funzioni” | due servizi da governare |
| **Hosting/VM interna MET** (Node o PHP) + Postgres/MySQL MET | dati dentro il perimetro MET, iter privacy più semplice | richiede tempo e presidio dell'IT |
| **Piattaforma eventi esterna** per RSVP + landing statica su Pages | zero sviluppo backend | dati personali su terza parte, look&feel e logiche del brief non replicabili |

> ⚠️ **Repository privata.** Anche senza dati, la repo contiene testi non ancora
> pubblici. Va tenuta **privata** fino al lancio; GitHub Pages su repo privata richiede
> un piano a pagamento (Pro/Team/Enterprise). Se non disponibile: sviluppo su repo
> privata e pubblicazione al lancio.

**Da decidere con IT MET:** dominio pubblico della pagina — un sottodominio MET
(es. `metup.metenergiaitalia.it`, che richiede un record DNS) è preferibile a un URL
`github.io` sia per credibilità sia per la deliverability dei link nelle email.

---

## 3. Configurazione email — da fare lato MET/IT prima del lancio

Le email partono dall'indirizzo indicato nel brief:

- **From name:** MET Energia Italia Events
- **From:** `events@metenergiaitalia.it`
- **Reply-To:** `events@metenergiaitalia.it`

### 3.1 Decisioni preliminari (IT MET)

1. **La casella `events@metenergiaitalia.it` esiste già?** Se no, va creata (casella o
   alias condiviso), perché le risposte dei partner arrivano lì e le organizzatrici
   devono poterle leggere.
2. **Chi invia tecnicamente le email?** Due strade:
   - **SMTP autenticato** sul tenant di posta MET (es. Microsoft 365): nessun fornitore
     nuovo, ma limiti di invio per casella (su M365 tipicamente ~10.000 destinatari/giorno
     e 30 destinatari/messaggio, da verificare sul tenant) e nessuna statistica di
     consegna/apertura. Per ~100 destinatari è sufficiente, purché si inviino messaggi
     individuali e non un unico invio in copia.
   - **Servizio transazionale via API** (Resend, Brevo, SendGrid, Mailjet, Postmark…):
     invio affidabile, webhook per consegne/bounce/aperture/click — che è ciò che
     alimenta la colonna «Stato» dello storico invii. Richiede l'approvazione di un
     fornitore e la delega di autenticazione sul dominio.
3. **Region dei dati:** se si scegli un servizio esterno, selezionare region UE e
   verificare che il DPA/GDPR sia in essere.

### 3.2 Autenticazione del dominio (DNS)

Da verificare **e documentare** prima del primo invio. Il prototipo non può leggerli:
vanno controllati con l'IT o con i comandi seguenti.

```bash
dig +short TXT metenergiaitalia.it            # SPF (record che inizia con v=spf1)
dig +short TXT _dmarc.metenergiaitalia.it     # DMARC
dig +short MX  metenergiaitalia.it            # provider di posta in uso
# DKIM: il selettore dipende dal provider, es. Microsoft 365:
dig +short CNAME selector1._domainkey.metenergiaitalia.it
```

Checklist:

- [ ] **SPF** — un solo record `v=spf1` sul dominio, che includa il servizio di invio
      scelto. Attenzione al limite di 10 lookup DNS: non aggiungere `include:` a caso.
- [ ] **DKIM** — chiavi generate dal provider e pubblicate (di norma due CNAME o un TXT
      con selettore dedicato). Firma con il dominio `metenergiaitalia.it`, non con il
      dominio del fornitore, altrimenti l'allineamento DMARC fallisce.
- [ ] **DMARC** — record presente e allineato. Se oggi è `p=none`, va bene per partire;
      valutare con IT il passaggio a `quarantine`. Impostare un indirizzo `rua=` per i report.
- [ ] **Return-Path / bounce** — dove tornano i messaggi non consegnati e chi li guarda.
- [ ] **Test pratico** prima del lancio: invio a caselle Gmail, Outlook/M365 e a un dominio
      aziendale di un'agenzia partner; controllo header (`Authentication-Results`:
      spf=pass, dkim=pass, dmarc=pass) e resa su smartphone.
- [ ] **Test anti-spam** (es. mail-tester.com) sul template reale, non su un testo di prova.

### 3.3 Regole non negoziabili nel codice

- Nessuna credenziale, API key o stringa di connessione nel frontend o nella repo:
  solo variabili d'ambiente sul server (`.env` fuori dal versionamento, secret del provider di hosting).
- Le immagini delle email (logo, lettering) devono stare su **URL assoluti ospitati**:
  Gmail e Outlook bloccano i data-URI. Nei template i segnaposto sono `{{URL_LOGO}}` e `{{URL_BRINGING}}`.
- **Nessun dato del documento di identità nelle email**, in nessun caso — nemmeno nelle
  notifiche interne alle organizzatrici (§39 del brief).
- Coda di invio con retry: se un invio fallisce, lo stato del partecipante diventa
  «Email conferma: Errore» e resta rinviabile dal backend (già previsto nel mockup).

---

## 4. Modello dati proposto

```
partecipanti
  id                    uuid, PK
  stato                 enum('CONFERMATO','NON_PARTECIPA')
  nome, cognome         text
  agenzia               text
  email                 citext UNIQUE   -- identificativo, gestione duplicati
  -- dati check-in: solo per CONFERMATO, cifrati a riposo
  nascita_data          date
  nascita_luogo         text
  residenza             text
  doc_numero            text  (cifrato)
  doc_luogo_emissione   text
  doc_data_emissione    date
  -- esigenze
  esigenze_flag         boolean
  esigenze_tipi         text[]          -- vegetariano, vegano, senza glutine, …
  esigenze_note         text
  note                  text
  messaggio_no          text            -- solo per NON_PARTECIPA
  privacy_accettata_at  timestamptz     -- prova del consenso
  creato_at             timestamptz
  aggiornato_at         timestamptz
  email_conferma_stato  enum('inviata','errore','in_coda')
  email_conferma_at     timestamptz
  ip_registrazione      inet            -- solo se Privacy MET lo autorizza (anti-abuso)

richieste            (form «Contatta il Team Marketing»)
  id, creato_at, nome, cognome, agenzia, email, oggetto, messaggio,
  stato enum('nuova','in_gestione','risolta'), assegnata_a, note_interne

contenuti            (tutto ciò che le organizzatrici modificano)
  chiave text PK, valore jsonb, aggiornato_da, aggiornato_at, pubblicato boolean
  -- programma, info utili, faq, testi, immagini, aggiornamenti, alert

comunicazioni
  id, creato_at, inviata_at, autore, oggetto, titolo, messaggio, cta_label,
  destinatari_tipo, destinatari_count, stato,
  metriche jsonb   -- consegnate, bounce, aperture, click (se il provider li espone)

utenti_admin
  id, nome, email, password_hash, ruolo enum('amministratrice','editor'),
  puo_vedere_documenti boolean, mfa_secret, ultimo_accesso_at, attivo

log_admin
  id, quando, utente_id, azione, oggetto_tipo, oggetto_id, dettaglio jsonb, ip
  -- traccia obbligatoria per: visualizzazione dati documento, export,
  --   modifica dati partecipante, invio comunicazioni, login/logout
```

Endpoint minimi:

```
POST /api/rsvp                  registrazione (Sì / No) → salvataggio + email
GET  /api/content               contenuti pubblici della landing
POST /api/richieste             form contatti → email a events@ + record
--- protetti (sessione admin) ---
GET/PATCH /api/partecipanti     elenco, scheda, correzione dati
GET  /api/partecipanti/:id/documento   restituisce il dato in chiaro + scrive nel log
POST /api/export                genera xlsx/csv (link a scadenza, mai allegato email)
PUT  /api/content               salvataggio contenuti
POST /api/comunicazioni/test    invio di prova all'organizzatrice
POST /api/comunicazioni/invia   invio reale (conferma esplicita richiesta)
GET  /api/log                   log amministrativo
```

---

## 5. Sicurezza — requisiti implementativi

- **HTTPS** obbligatorio, HSTS attivo; nessuna pagina raggiungibile in HTTP.
- **Autenticazione backend**: account individuali per ciascuna organizzatrice (mai
  credenziali condivise), password policy MET, **2FA**, sessioni con scadenza,
  blocco dopo N tentativi falliti.
- **Ruoli**: `amministratrice` (tutto) / `editor` (contenuti e comunicazioni, senza
  accesso ai dati del documento). Il flag «accesso dati documento» è per-utente.
- **Cifratura a riposo** del numero di documento (colonna cifrata o cifratura
  applicativa con chiave in secret manager); mai in chiaro nei log applicativi.
- **Protezione form pubblici**: rate limiting per IP e per email, honeypot o captcha
  privacy-friendly (es. Turnstile/hCaptcha — da approvare con Privacy), validazione
  server-side di **tutti** i campi (quella del prototipo è solo lato client),
  sanificazione dell'output per evitare XSS nei campi liberi (note, messaggi).
- **Export**: generati on-demand, link firmato a scadenza breve, download tracciato nel
  log, **nessun export inviato per email**.
- **Backup** giornaliero del database con retention definita e prova di ripristino.
- **Cancellazione**: procedura e data di cancellazione dei dati documento **subito dopo
  l'evento** (vedi §6).
- **Nessuna credenziale nel frontend** e nessun segreto committato: `.gitignore` su
  `.env*`, scansione della repo prima di renderla pubblica.
- **Dipendenze**: le sole terze parti caricate dalla landing sono l'embed di Google Maps
  (§7) — font Montserrat e loghi sono self-hosted, quindi nessuna chiamata a
  `fonts.gstatic.com`.

---

## 6. Privacy — punti da chiudere con Privacy/Legal MET

Il punto più delicato del progetto: si raccolgono **dati di documento di identità** di
persone esterne all'azienda.

- [ ] **Minimizzazione (§15 del brief).** Verificare con Villa Quaranta *quali* dati
      servono realmente per la comunicazione alloggiati/Questura. In genere bastano
      nome, cognome, data e luogo di nascita, cittadinanza/residenza e tipo+numero del
      documento; **luogo e data di emissione sono spesso non necessari**. Se non servono,
      vanno eliminati dal form (basta modificare lo step 2).
- [ ] **Alternativa da valutare:** raccogliere i dati documento **direttamente al
      check-in in hotel** anziché online. È l'opzione con il rischio più basso; il form
      si ridurrebbe a nome, agenzia, email, esigenze alimentari e note.
- [ ] **Base giuridica** del trattamento per ciascuna finalità (organizzazione evento,
      obblighi della struttura ricettiva, comunicazioni sull'evento).
- [ ] **Informativa privacy dedicata all'evento**, redatta da Privacy/Legal: finalità,
      base giuridica, categorie di dati, destinatari (Villa Quaranta, provider email,
      hosting), tempi di conservazione, diritti dell'interessato. Il link nel form e nel
      footer oggi è un **segnaposto**: senza il testo definitivo non si pubblica.
- [ ] **Cookie policy / banner:** la pagina come è ora non usa cookie né analytics; con
      Google Maps in iframe c'è comunque un trasferimento verso Google al caricamento →
      valutare se serve il banner o se sostituire la mappa (§7). Se si aggiungono
      analytics, il banner diventa obbligatorio.
- [ ] **Ruoli GDPR:** Villa Quaranta e i fornitori (hosting, servizio email) come
      responsabili del trattamento → nomine ex art. 28 e DPA firmati.
- [ ] **Trasferimento a Villa Quaranta:** canale sicuro concordato (non email in chiaro),
      formato e data dell'invio della lista check-in.
- [ ] **Conservazione:** definire quando cancellare i dati documento (proposta:
      entro X giorni dalla fine dell'evento) e chi esegue la cancellazione; il resto dei
      dati (partecipazione, esigenze, note) con una retention propria.
- [ ] **Registro dei trattamenti**: aggiornamento a cura di Privacy MET.
- [ ] **Consenso a video:** il checkbox attuale è di *presa visione* dell'informativa e
      viene salvato con data/ora. Se durante l'evento sono previste foto/video, serve un
      punto aggiuntivo (informativa immagini) da concordare.

---

## 7. Google Maps: due modi

Oggi la landing incorpora la mappa con l'embed pubblico di Google Maps (nessuna API key,
nessun costo). Implica una connessione dell'utente ai server Google al caricamento della
sezione.

Alternative, in ordine di privacy crescente:

1. **Click-to-load**: al posto dell'iframe, un'immagine statica della zona con un
   pulsante «Mostra la mappa» — la mappa si carica solo su azione dell'utente. Consigliata.
2. **Solo pulsanti**: nessun iframe, solo i link «Apri il percorso»/«Ottieni indicazioni»
   (che già funzionano e aprono l'app di navigazione dell'utente).
3. Mantenere l'iframe, coprendolo con l'informativa cookie.

I tre percorsi (treno, aereo, auto) e la destinazione sono già impostati con l'indirizzo
esatto: `Villa Quaranta Tommasi Wine Resort, Via Ospedaletto 57, 37026 Pescantina (VR)`.

---

## 8. Materiali da ricevere

| Materiale | Formato | Dove va |
|---|---|---|
| ~~Foto Villa Quaranta — esterno/parco~~ — **ricevuta** (vista aerea) | — | hero sezione Location ✅ |
| ~~Gallery: camere, sale meeting, ristorante, aree esterne, Valpolicella, SPA~~ — **ricevute** | — | gallery Location ✅ |
| Visual hero (opzionale) | JPG, 2400×1400 px, soggetto leggibile anche scurito | sfondo prima schermata |
| ~~Foto delle organizzatrici~~ — **ricevuta** (Maia Ingaramo, Ambra Demi) | — | sezione «Hai bisogno di noi?» ✅ |
| Programma in PDF (quando definitivo) | PDF < 5 MB | pulsante «Scarica il programma» |
| Testo informativa privacy e cookie policy | DOCX/PDF | link nel form e nel footer |
| Liberatoria/autorizzazione all'uso delle foto della struttura | — | archivio MET |

Il prototipo mostra ogni slot con formato e dimensioni richieste: le foto si caricano dal
backend, senza toccare il codice.

**Immagini già inserite.** Le sette fotografie di Villa Quaranta e della Valpolicella
fornite dal Marketing sono nel prototipo (ritagliate e compresse) e si trovano anche come
file singoli in `assets/img/location/`. Due note per l'implementazione:

- nel prototipo sono incorporate nell'HTML (data-URI) perché il file deve funzionare con un
  doppio clic: per questo `index.html` pesa circa 1,2 MB. **Nel sito reale vanno servite
  come file separati** con `loading="lazy"`, formati moderni (WebP/AVIF) e `srcset` per
  mobile: il primo caricamento scende sotto i 300 KB;
- va confermata con Villa Quaranta l'**autorizzazione all'uso** delle immagini della
  struttura, e verificata la fonte della foto dei vigneti (l'unica non riconducibile a un
  set ufficiale della struttura).

---

## 9. Contenuti: cosa manca ancora (e come si comporta il sito)

Dove l'informazione non c'è, **non compare un campo vuoto**: compare
«Informazioni in arrivo — Stiamo definendo gli ultimi dettagli. Torna presto per scoprire
tutti gli aggiornamenti.» Oggi sono in questo stato:

- **conferma degli orari**: quelli in pagina sono ripresi dall'edizione precedente e sono
  dichiarati «indicativi, ancora da confermare» (da validare con Villa Quaranta)
- attività/intrattenimento della fascia 18:45–19:30 e dettagli della cena
- orari di check-in e check-out
- dress code e servizi della struttura
- eventuale data di chiusura delle iscrizioni (da decidere: consigliata, con alert in pagina)

---

## 10. Prima di andare online — checklist finale

- [ ] Testi approvati dal Marketing MET (naming, claim, descrittore, testi hero e concept)
- [ ] Dati dello step 2 confermati con Villa Quaranta **e** con Privacy/IT MET
- [ ] Informativa privacy e cookie policy pubblicate e linkate
- [ ] SPF, DKIM, DMARC verificati e test di consegna superati su Gmail/Outlook/domini agenzie
- [ ] Casella `events@metenergiaitalia.it` attiva, presidiata e con risposte monitorate
- [ ] Account backend creati per le due organizzatrici, con 2FA e ruoli distinti
- [ ] Backup e procedura di cancellazione dei dati documento definiti per iscritto
- [ ] Test del flusso completo su smartphone reale (iOS + Android): registrazione, email, mappa
- [ ] Test duplicato: seconda registrazione con la stessa email → messaggio corretto
- [ ] Verifica accessibilità: contrasti, navigazione da tastiera, dimensione dei campi
- [ ] Rate limiting e anti-spam attivi sui due form pubblici
- [ ] `noindex` deciso: oggi la pagina è esclusa dai motori di ricerca (evento riservato).
      Se si vuole indicizzabile, va rimosso il meta tag in `index.html`
- [ ] **Modalità modifica rimossa** dal file pubblicato (blocco `build/07-editor.html`)
- [ ] Link della landing inserito nel Save the Date

---

## 11. Note di brand

Tutto il prototipo segue il **MET Corporate Identity Book 2023**:

- **Colori** — Pantone 7470 C `#005870` (primario), 636 C `#88d2e7`, 3258 C `#46c3b2`,
  360 C `#6bc04b`, 7406 C `#F4c400`, Cool Gray 10 C `#63656A`.
- **Gradienti** — 01 `#003242 → #0095b4`, 02 `#005870 → #88d2e7`, 03 `#005870 → #6bc04b`.
- **Font** — Montserrat, il web font ufficiale indicato dal manuale come sostituto di Gotham.
- **Logo** — usato solo nelle versioni fornite (bianca su fondi scuri, primaria su fondi
  chiari), senza rotazioni, ombre, contorni o alterazioni di colore; il logogramma a
  “perle” non è mai usato da solo, come prescrive il manuale.
- **Concept visuale** — gli archi di sfere della hero riprendono l'arco di perle del
  logogramma (il manuale lo descrive come «slancio dinamico» e «unità»): rappresentano
  connessione → rete → valore restando lontani dall'estetica “rete informatica”.
- **Lettering** «Bringing new energy to Europe» nel footer e nelle email, nella versione
  bianca fornita.

Il naming **MET UP!** e il claim «Connettersi. Fare rete. Creare valore.» sono elementi di
progetto, non presenti nel manuale: se il Marketing di Gruppo deve validarli, meglio farlo
prima di distribuire il Save the Date.
