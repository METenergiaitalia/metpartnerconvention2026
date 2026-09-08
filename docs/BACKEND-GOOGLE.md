# Backend a costo zero — Google Sheets + Apps Script

Guida per IT interno MET. Obiettivo: raccogliere le registrazioni di MET UP! 2026,
inviare l'email di conferma da `events@metenergiaitalia.it` e far vedere alle
organizzatrici tutto ciò che arriva, **senza costi** e senza server da gestire.

Codice pronto: [`../apps-script/Codice.gs`](../apps-script/Codice.gs)

## Architettura

```
landing statica (GitHub Pages)
   → POST  Web App Google Apps Script      (validazione + antiduplicati)
   → write Google Sheet                    (database: Partecipanti/Richieste/Log)
   → mail  events@metenergiaitalia.it      (Microsoft Graph oppure MailApp)
area riservata (admin.html) → GET con token → tabelle e dashboard
```

## Setup

1. Google Sheet «MET UP 2026 — Registrazioni» in un **Drive condiviso MET**
   (non nel Drive personale di una persona), accesso alle sole organizzatrici + IT.
2. Estensioni → Apps Script: incollare `Codice.gs`, salvare, eseguire una volta
   `setupFogli()` (crea fogli e intestazioni).
3. Impostazioni progetto → Proprietà script:

   | proprietà | valore |
   |---|---|
   | `API_TOKEN` | stringa casuale lunga |
   | `MAIL_MODE` | `graph` (dominio su Microsoft 365) o `mailapp` (Google Workspace) |
   | `FROM_ADDRESS` | `events@metenergiaitalia.it` |
   | `SITE_URL` | URL pubblico della landing |
   | `GRAPH_TENANT` / `GRAPH_CLIENT_ID` / `GRAPH_SECRET` | solo in modalità `graph` |

4. Distribuisci → Nuova distribuzione → Applicazione web.
   «Esegui come: me», «Accesso: chiunque» (l'autorizzazione la fa il token).
5. Copiare l'URL `/exec` e configurarlo nella landing.
6. Eseguire `testInvio()` per autorizzare lo script e verificare l'arrivo della mail.

> Ogni modifica al codice richiede una **nuova versione della distribuzione**.

## Mittente

- **Dominio su Microsoft 365** → modalità `graph`: registrazione app in Entra ID,
  permesso applicativo `Mail.Send`, **Application Access Policy** che limita l'app
  alla sola casella `events@`. SPF/DKIM del tenant già validi.
- **Dominio su Google Workspace** → modalità `mailapp`: lo script gira con
  l'account che possiede l'indirizzo (o un alias «Invia come» verificato).
- Mai spedire da un indirizzo @gmail.com o da un dominio diverso.

Prima dell'invio massivo: SPF verificato, DKIM attivo, DMARC pubblicato
(vedi `EMAIL-CONFERMA.md`).

## Endpoint

| azione | metodo | note |
|---|---|---|
| `registrazione` | POST | crea il partecipante confermato + invia la conferma |
| `rifiuto` | POST | registra «NON PARTECIPA» |
| `richiesta` | POST | salva la richiesta e notifica events@ |
| lettura dati | GET | solo con token; **non** restituisce le colonne del documento |

## Sicurezza e privacy

- Il foglio **è** il controllo accessi: condivisione ristretta, nessun link pubblico.
- Token di scrittura (front-end) e token di lettura (area riservata) devono essere distinti.
- Nessun segreto nel repository.
- Dati del documento: solo nel foglio, mai in email, mai negli export non concordati,
  con log delle visualizzazioni (foglio `Log`).
- Da chiudere con Privacy/Legal MET: base giuridica, informativa, retention,
  ammissibilità di Google Workspace per questi dati, dati realmente richiesti da
  Villa Quaranta per il check-in.

## Limiti noti

- Quote Apps Script su email/giorno e chiamate esterne (diverse tra consumer e
  Workspace): per ~100 partner sono sufficienti, ma vanno verificate al setup.
- Sheets non è un database transazionale: lo script usa `LockService`; adatto fino
  a qualche migliaio di righe.
- Nessuna statistica di consegna (aperture, click, bounce): richiede un servizio
  transazionale, anche in piano gratuito.
- Backup: cronologia versioni del foglio + export periodico.
