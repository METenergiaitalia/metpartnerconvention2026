# MET UP! — pacchetto per GitHub

Sito pubblico e area riservata di **MET UP! – MET Partner Convention 2026**
(14–15 ottobre 2026 · Villa Quaranta, Valpolicella).

Questa cartella è il **pacchetto da caricare su GitHub**: file statici, nessuna
dipendenza esterna, nessuna CDN. Va rigenerata da noi a ogni modifica del
front-end (i sorgenti restano i Design Component nel progetto).

```
index.html                landing pubblica
admin.html                area riservata Team Marketing (mockup navigabile)
programma.html            programma in una pagina, da salvare in PDF
js/metup-site.js          logica landing (nav, countdown, RSVP, form, gallery)
js/metup-admin.js         logica area riservata + dati di esempio
js/doc-page.js            impaginazione del programma stampabile
assets/fonts/             Montserrat self-hosted (nessuna chiamata a Google)
assets/img/               loghi MET e fotografie Villa Quaranta
assets/doc/               programma-met-up-2026.pdf (da inserire)
email/                    template email: conferma registrazione, aggiornamento
apps-script/Codice.gs     backend a costo zero: Google Sheets + Apps Script
docs/dossier-tecnico.html         dossier tecnico — si apre nel browser, stampabile in PDF
docs/guida-backend-google.html   guida IT: setup del backend Google (stampabile)
docs/guida-email-conferma.html   guida IT: invio da events@metenergiaitalia.it (stampabile)
docs/*.md                        le stesse guide in markdown, leggibili su GitHub
.nojekyll                 impedisce a GitHub Pages di processare i file
```

## Documenti

I file in `docs/` con estensione `.html` si aprono con un doppio clic in qualsiasi
browser, senza editor di markdown, e si salvano in PDF con Stampa → Salva come PDF
(o Ctrl/Cmd+P). Le versioni `.md` restano per la lettura diretta su GitHub.

## Pubblicazione su GitHub Pages

1. Repository **privata** fino al lancio (contiene testi non ancora pubblici).
2. Caricare il contenuto di questa cartella nella radice del branch scelto.
3. Settings → Pages → branch + cartella `/ (root)`.

GitHub Pages serve **solo file statici**: ospita la landing e il mockup
dell'area riservata, **non** il backend.

## Cosa manca per il funzionamento reale

Queste funzioni richiedono un servizio server-side (non copribile da Pages):

- salvataggio delle registrazioni e delle richieste su database;
- invio automatico dell'email di conferma e delle comunicazioni dal backend
  con mittente `events@metenergiaitalia.it` (SPF, DKIM, DMARC sul dominio);
- autenticazione delle organizzatrici, ruoli e log degli accessi;
- generazione dei file di export (Excel/CSV).

Soluzione scelta, a costo zero: **Google Sheets come database + Google Apps Script
come endpoint**, con l'email di conferma spedita da `events@metenergiaitalia.it`.
Codice pronto in `apps-script/Codice.gs`, istruzioni in `docs/BACKEND-GOOGLE.md`
e `docs/EMAIL-CONFERMA.md`. Nessuna credenziale o API key va nel front-end.
Checklist privacy: `docs/DOSSIER-TECNICO.md`.

## Prima di andare online

- informativa privacy e cookie policy definitive (Privacy/Legal MET);
- verifica con Villa Quaranta e Privacy MET dei dati richiesti allo step 2;
- autenticazione del dominio email;
- sostituzione dei dati di esempio dell'area riservata;
- inserimento del PDF del programma in `assets/doc/`.

---

Evento riservato alla rete di agenzie partner MET Energia Italia.
Contatti: `events@metenergiaitalia.it`
