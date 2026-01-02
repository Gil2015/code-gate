import { Translation } from './types.js'

export const fr: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: environnement non interactif, révision ignorée',
    confirmReview: 'Voulez-vous effectuer une révision de code pour ce commit ?',
    opCancelled: 'Opération annulée',
    reviewSkipped: 'Révision AI ignorée',
    initReview: 'Initialisation de la révision AI...',
    preparingReview: 'Préparation de la révision pour {total} fichiers...',
    analyzing: 'Analyse en cours [{idx}/{total}] {file}',
    taskSubmitted: 'Tâche de révision AI soumise',
    previewUrl: 'URL de prévisualisation',
    confirmCommit: 'Révision terminée. Continuer le commit ?',
    commitCancelled: 'Commit annulé',
    commitConfirmed: 'Commit confirmé, poursuite de l\'opération...',
    diffTruncated: '\n...(Diff tronqué en raison de la longueur, nombre total de lignes : {lines})',
    ollamaCheckFailed: 'Attention : le service Ollama semble indisponible. La révision AI pourrait échouer.',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: En attente',
    statusFailed: 'AI: Échec',
    statusDone: 'AI: Terminé',
    statusProcessing: 'AI: Traitement des fichiers restants...',
    emptyReview: 'Aucun contenu de révision disponible',
  },
  prompt: {
    userTemplate: 'Veuillez examiner le code sur la base du git diff suivant et fournir une liste de problèmes et de suggestions d\'amélioration :\n\n{diff}'
  }
}
