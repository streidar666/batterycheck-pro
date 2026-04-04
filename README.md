# Battery Test Manager

Applicativo desktop per il controllo e monitoraggio di batterie NiCd FNC, sviluppato con React + TypeScript + Electron.

## Struttura Progetto

```
battery-test-manager/
├── electron/
│   ├── main.ts          # Processo principale Electron
│   ├── preload.ts       # Bridge sicuro tra Node e renderer
│   └── icon.png         # Icona app (512x512)
├── src/
│   ├── components/      # Componenti React
│   ├── store/           # Zustand store con persistenza
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript definitions
│   ├── App.tsx          # Componente principale
│   ├── main.tsx         # Entry point React
│   └── index.css        # Stili globali
├── package.json
├── electron-builder.yml # Config per creare installer
├── vite.config.ts
└── tsconfig.json
```

## Installazione

```bash
npm install
```

## Sviluppo

### Avvio in modalità sviluppo (Vite + Electron)
```bash
npm run electron:dev
```

### Solo frontend (browser)
```bash
npm run dev
```

## Build e Distribuzione

### Windows (.exe installer)
```bash
npm run electron:build
```

### macOS (.dmg)
```bash
npm run electron:build:mac
```

### Linux (.AppImage)
```bash
npm run electron:build:linux
```

Gli installer vengono generati nella cartella `/release/`.

## Funzionalità

- **Configurazione progetto**: Lotto, matricola, operatore, impianto, data, numero celle
- **Inserimento dati**: Tensione (V), livello (0-6), densità (g/cm³) per ogni cella
- **Validazione automatica**: Controlli in tempo reale sui valori inseriti
- **Valutazione stato celle**:
  - ✅ OK (1.300V - 1.450V)
  - ⚠️ Attenzione (< 1.300V o parametri fuori range)
  - 🔴 Critico (≤ 1.200V o ≥ 1.500V)
  - ❌ Errore (valore non valido)
- **Statistiche**: Totali, misurate, attenzioni, critiche + tensione media/min/max
- **Grafico andamento**: Visualizzazione tensioni con Chart.js
- **Report automatico**: Analisi testuale dello stato della batteria
- **Esporta PDF**: Generazione report stampabile con html2canvas + jsPDF
- **Persistenza dati**: Salvataggio automatico con electron-store (desktop) o localStorage (web)

## Valori Default Hoppecke FNC

| Parametro | Valore |
|-----------|--------|
| V Min OK  | 1.200V |
| V Max OK  | 1.450V |
| V Critical| 1.100V |
| V Dead    | 1.000V |

## Punti Critici

1. **`base: './'`** in Vite è obbligatorio per i path relativi in Electron
2. **Icona**: Deve essere minimo 256x256 (PNG o ICO per Windows)
3. **`contextIsolation: true`** per sicurezza nel preload script
4. L'app React funziona sia in browser che come app desktop senza modifiche

## Dipendenze Principali

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Zustand** - State management con persistenza
- **Electron** - Desktop wrapper
- **electron-builder** - Creazione installer
- **electron-store** - Storage persistente locale
- **TailwindCSS** - Styling
- **Chart.js** - Grafici
- **jsPDF + html2canvas** - Esportazione PDF

## Licenza

ISC
