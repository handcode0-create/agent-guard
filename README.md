Voici votre `README.md` mis à jour, incluant la section sur l'extension Chrome. Vous pouvez copier ce bloc pour remplacer le contenu actuel de votre fichier :

---

# agent-guard

Middleware CLI qui impose une validation humaine obligatoire avant que du code généré par une IA ne soit écrit dans un projet réel.

Né d'un incident concret : un agent IA (Google AI Studio) a réécrit silencieusement 77 fichiers d'un coup, cassant Tailwind sans prévenir. `agent-guard` empêche ce scénario en interdisant à l'IA d'écrire directement dans le projet.

## Principe

* L'agent IA n'écrit jamais directement dans ton projet.
* Il écrit ses fichiers proposés dans un dossier isolé : `.agent-guard/staging/` (même arborescence que le projet).
* Tu vois le diff exact de chaque changement proposé.
* Rien n'est appliqué au projet réel sans une commande explicite : `approve` ou `reject`.
* Aucune écriture automatique. Aucun commit automatique. La décision reste toujours humaine.

## Installation

```bash
npm install
npm link   # rend la commande "agent-guard" disponible globalement

```

## Installation de l'extension Chrome (Bridge)

Pour permettre à Google AI Studio de rediriger automatiquement les fichiers vers le dossier staging de `agent-guard`, installez l'extension bridge :

1. **Accéder aux extensions** : Ouvrez Chrome et tapez `chrome://extensions/` dans la barre d'adresse.
2. **Activer le mode développeur** : Activez l'interrupteur **"Mode développeur"** en haut à droite.
3. **Charger l'extension** : Cliquez sur **"Charger l'extension non empaquetée"** et sélectionnez le dossier `bridge/extension` à la racine de ce dépôt.
4. **Lancer le serveur** : Assurez-vous que le serveur (`node bridge/server/server.js`) est actif pour réceptionner les fichiers envoyés par l'extension.

## Utilisation

```bash
# À la racine de ton projet
agent-guard init

```

Configure ensuite ton agent IA (prompt système, script, extension) pour qu'il écrive ses propositions dans `.agent-guard/staging/` au lieu du projet directement.

```bash
# Voir ce qui est en attente
agent-guard status

# Voir le diff détaillé
agent-guard diff
agent-guard diff src/app.js

# Appliquer un changement au projet réel
agent-guard approve src/app.js
agent-guard approve --all

# Rejeter un changement
agent-guard reject src/app.js
agent-guard reject --all

# Consulter l'historique
agent-guard history

```

## Structure créée

```text
mon-projet/
├── .agent-guard.json          # config
├── .agent-guard/
│   ├── staging/               # fichiers en attente
│   └── history.json           # log des décisions
└── ...

```

## Pourquoi pas un simple hook Git ?

Parce que la contrainte doit être structurelle, pas comportementale. Rediriger toutes les écritures de l'agent vers un dossier physiquement séparé rend l'écriture directe impossible dans le workflow — la validation n'est pas une option qu'on peut sauter par accident.

## Roadmap

* [ ] **Mode watch** : notifie automatiquement quand de nouveaux fichiers arrivent.
* [ ] **Intégration Git** : commit automatique après approbation avec message généré.
* [ ] **Mode approve --interactive** : diff affiché puis prompt y/n/edit fichier par fichier.

## Licence

MIT — HANDCODE STUDIO
