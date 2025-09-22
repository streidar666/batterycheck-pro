# BatteryCheck Pro

Applicazione web single-page per monitorare le batterie al nichel-cadmio (FNC) da 1.2 V. Permette di registrare i dati delle celle, analizzarli rapidamente e condividere un report stampabile.

## Funzionalità principali
- Configurazione guidata del lotto con numero celle, operatore, data e note.
- Tabella interattiva con convalida istantanea per tensione, livello elettrolita e densità.
- Statistiche automatiche (media/min/max), conteggio anomalie e segnalazione delle celle critiche.
- Grafico dell'andamento delle tensioni tramite Chart.js.
- Generazione di un commento tecnico automatico basato sui valori inseriti.
- Compilazione massiva dei campi, svuotamento rapido e salvataggio automatico in `localStorage`.
- Esportazione del report in PDF pronto per la stampa.

## Come utilizzare il progetto
1. Aprire `index.html` in un browser moderno connesso a Internet (sono utilizzati CDN per React, Tailwind, Chart.js e jsPDF).
2. Compilare i dati del progetto nella finestra di configurazione iniziale.
3. Inserire i valori misurati per ciascuna cella; lo stato viene aggiornato in tempo reale.
4. Premere **Analizza valori** per ottenere un riepilogo automatico.
5. Premere **Esporta PDF** per generare un report da archiviare o condividere.

> I dati vengono salvati automaticamente nel browser; per ripartire da zero è sufficiente usare il pulsante "Cancella configurazione salvata".

## Struttura del repository
- `index.html`: applicazione completa (frontend) con logica React e stili Tailwind.

Non sono richiesti passi di build: l'applicazione gira direttamente dal file HTML.
