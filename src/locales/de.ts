import { Translation } from './types.js'

export const de: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: Nicht-interaktive Umgebung, Review übersprungen',
    confirmReview: 'Möchten Sie diesen Commit überprüfen lassen?',
    opCancelled: 'Vorgang abgebrochen',
    reviewSkipped: 'AI-Review übersprungen',
    initReview: 'AI-Review wird initialisiert...',
    preparingReview: 'Bereite Review für {total} Dateien vor...',
    analyzing: 'Analysiere [{idx}/{total}] {file}',
    taskSubmitted: 'AI-Review-Aufgabe gesendet',
    previewUrl: 'Vorschau-URL',
    confirmCommit: 'Review abgeschlossen. Mit Commit fortfahren?',
    commitCancelled: 'Commit abgebrochen',
    commitConfirmed: 'Commit bestätigt, fahre fort...',
    diffTruncated: '\n...(Diff aufgrund der Länge gekürzt, Gesamtzeilen: {lines})',
    ollamaCheckFailed: 'Warnung: Ollama-Dienst nicht verfügbar oder nicht erreichbar. AI-Review könnte fehlschlagen.',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: Ausstehend',
    statusFailed: 'AI: Fehlgeschlagen',
    statusDone: 'AI: Fertig',
    statusProcessing: 'AI: Verarbeite verbleibende Dateien...',
    emptyReview: 'Kein Review-Inhalt verfügbar',
  },
  prompt: {
    userTemplate: 'Bitte überprüfen Sie den Code basierend auf dem folgenden git diff und geben Sie eine Liste von Problemen und Verbesserungsvorschlägen an:\n\n{diff}'
  }
}
