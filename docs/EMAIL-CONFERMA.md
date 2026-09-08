# Email di conferma — invio automatico da events@metenergiaitalia.it

Guida per IT interno MET. Quando un partner completa la registrazione (dati
anagrafici + dati per il check-in), il sistema invia automaticamente l'email di
conferma. A costo zero, con strumenti già in licenza MET o piani gratuiti.

Una pagina statica **non può** inviare email: la credenziale sarebbe leggibile da
chiunque. Serve un piccolo endpoint server (una funzione, non un server da gestire).
Per l'implementazione Google, vedi [`BACKEND-GOOGLE.md`](BACKEND-GOOGLE.md).

## Flusso

1. Il partner invia il form RSVP.
2. `POST /api/registrazioni` (HTTPS) con i dati.
3. Validazione, controllo email duplicata, salvataggio.
4. Invio email da `events@metenergiaitalia.it` (template `../email/email-conferma.html`).
5. Risposta `200` → la landing mostra «Ci vediamo a MET UP!».
6. Se l'invio fallisce, il record resta salvato e il backend segna «Email conferma: Errore».

I dati del documento non entrano mai nel corpo dell'email né vengono inviati alle
organizzatrici: restano nel database protetto.

## Opzione A (consigliata) — Microsoft Graph, costo zero

Se `events@metenergiaitalia.it` è una casella Microsoft 365, l'invio usa l'API
Graph già compresa nella licenza.

| passo | cosa fare |
|---|---|
| Registrazione app | Entra ID → App registrations → «MET UP 2026 mailer», client secret con scadenza tracciata |
| Permesso | application permission `Mail.Send` + consenso amministratore |
| Restrizione | **Application Access Policy** in Exchange Online, limitata alla sola casella events@ |
| Chiamata | `POST /v1.0/users/events@metenergiaitalia.it/sendMail` con token client-credentials |

Vantaggi: mittente autenticato nativamente, copia in «Posta inviata», risposte
nella casella events@. Limite: tetto giornaliero di destinatari per casella
(ordine di alcune migliaia) — per ~100 partner è ampiamente sufficiente.

## Opzione B — SMTP autenticato Microsoft 365

`smtp.office365.com:587` STARTTLS con un account dedicato. Più semplice da
scrivere, ma richiede SMTP AUTH abilitato (spesso disattivato dalle baseline di
sicurezza) e password da custodire.

## Opzione C — servizio transazionale in piano gratuito

Resend, Brevo, MailerSend, Amazon SES: piani gratuiti sufficienti a questi volumi
(verificare le soglie correnti). Danno le statistiche che nel backend oggi sono
simulate: consegnate, bounce, aperture, click. Richiedono l'autenticazione del
dominio presso il servizio. Impostare `Reply-To: events@metenergiaitalia.it`.

## DNS — recapito e reputazione

| record | nota |
|---|---|
| SPF | un solo record TXT. Con M365: `include:spf.protection.outlook.com`; con l'opzione C aggiungere l'include del servizio |
| DKIM | M365: abilitare la firma DKIM (due CNAME `selector1/2`). Opzione C: i record del servizio |
| DMARC | TXT su `_dmarc`, partire da `p=none; rua=mailto:…`, poi irrigidire |

Se il dominio è già usato per la posta aziendale, SPF e DKIM esistono:
l'attività è di verifica, non di creazione.

## Dove ospitare la funzione (gratis)

- **Google Apps Script** (soluzione scelta, vedi `BACKEND-GOOGLE.md`).
- Azure Functions piano consumo (coerente con il tenant M365, identità gestita).
- Cloudflare Workers / Netlify / Vercel Functions, deploy dal repository GitHub.

La landing statica può restare su GitHub Pages e chiamare la funzione via HTTPS,
con CORS limitato al dominio dell'evento.

## Sicurezza — requisiti non negoziabili

- Nessuna credenziale o API key nel front-end: solo variabili d'ambiente/proprietà lato server.
- HTTPS obbligatorio, CORS limitato al dominio della landing.
- Rate limiting e anti-spam sull'endpoint (limite per IP + honeypot o captcha invisibile).
- Database ad accesso ristretto, backup, cifratura a riposo; dati del documento
  visibili solo ai ruoli autorizzati e con log delle visualizzazioni.
- Nessun dato del documento in email, export non concordati o log applicativi.
- Retention: definire con Privacy MET la cancellazione dopo l'evento.

## Checklist

1. Confermare tipo e piattaforma della casella events@.
2. Scegliere l'opzione di invio (A consigliata).
3. Registrazione app + Application Access Policy sulla sola casella events@.
4. SPF verificato, DKIM attivo, DMARC pubblicato.
5. Deploy della funzione (registrazioni, richieste, comunicazioni).
6. Database e autenticazione delle organizzatrici.
7. Test su caselle interne ed esterne (Gmail, Outlook.com), controllo header
   SPF/DKIM/DMARC e resa su smartphone.
8. Test dei casi «email duplicata» e «invio fallito».
9. Via libera Privacy/Legal MET su informativa, dati dello step 2 e retention.
