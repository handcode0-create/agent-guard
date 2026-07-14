# agent-guard

Middleware CLI qui impose une **validation humaine obligatoire** avant que du code généré par une IA ne soit écrit dans un projet réel.

Né d'un incident concret : un agent IA (Google AI Studio) a réécrit silencieusement 77 fichiers d'un coup, cassant Tailwind sans prévenir. `agent-guard` empêche ce scénario en interdisant à l'IA d'écrire directement dans le projet.

## Principe

1. L'agent IA n'écrit **jamais** directement dans ton projet.
2. Il écrit ses fichiers proposés dans un dossier isolé : `.agent-guard/staging/` (même arborescence que le projet).
3. Tu vois le **diff exact** de chaque changement proposé.
4. Rien n'est appliqué au projet réel sans une commande explicite : `approve` ou `reject`.

Aucune écriture automatique. Aucun commit automatique. La décision reste toujours humaine.

## Installation

```bash
npm install
npm link   # rend la commande "agent-guard" disponible globalement
```

## Utilisation

```bash
# À la racine de ton projet
agent-guard init
```

Configure ensuite ton agent IA (prompt système, script, extension) pour qu'il écrive ses propositions dans `.agent-guard/staging/` au lieu du projet directement.

```bash
# Voir ce qui est en attente
agent-guard status

# Voir le diff détaillé (tous les fichiers, ou un seul)
agent-guard diff
agent-guard diff src/app.js

# Appliquer un changement au projet réel
agent-guard approve src/app.js

# Appliquer tous les changements en attente
agent-guard approve --all

# Rejeter un changement (le projet réel n'est jamais touché)
agent-guard reject src/app.js
agent-guard reject --all

# Consulter l'historique des décisions
agent-guard history
```

## Commandes

| Commande | Effet |
|---|---|
| `agent-guard init` | Initialise `.agent-guard/` et la config dans le dossier courant |
| `agent-guard status` | Liste les changements proposés (nouveau / modifié) |
| `agent-guard diff [fichier]` | Affiche le diff coloré (ligne par ligne) |
| `agent-guard approve <fichier\|--all>` | Copie staging → projet réel, log l'approbation |
| `agent-guard reject <fichier\|--all>` | Supprime le staging, log le rejet, projet réel intact |
| `agent-guard history` | Historique horodaté de toutes les décisions |

## Structure créée dans ton projet

```
mon-projet/
├── .agent-guard.json          # config
├── .agent-guard/
│   ├── staging/                # fichiers proposés par l'IA, en attente de validation
│   └── history.json            # log de toutes les décisions approve/reject
└── ... (ton projet réel, jamais modifié sans validation)
```

## Pourquoi pas un simple hook Git ou un fs.writeFile intercepté ?

Parce que la contrainte doit être **structurelle**, pas comportementale. Un hook qu'on peut oublier de configurer, ou un wrapper que l'agent peut contourner en écrivant ailleurs, ne protège pas vraiment. Rediriger toutes les écritures de l'agent vers un dossier physiquement séparé du projet rend l'écriture directe simplement impossible dans le workflow — la validation n'est pas une option qu'on peut sauter par accident.

## Roadmap possible

- [ ] Mode `watch` : notifie automatiquement quand de nouveaux fichiers arrivent en staging
- [ ] Intégration Git : commit automatique (mais toujours après approbation humaine) avec message généré à partir de la description du changement
- [ ] Extension Chrome bridge (Google AI Studio) qui redirige nativement les écritures vers staging
- [ ] Mode `approve --interactive` : diff affiché puis prompt y/n/edit fichier par fichier

## Licence

MIT — HANCODE STUDIO
