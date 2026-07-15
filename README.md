Pas de souci, tu as totalement raison. C'est beaucoup plus simple et plus logique de garder la structure exacte que tu avais écrite, en venant simplement greffer proprement les détails de configuration là où ils manquaient (dans la section Bridge).

Voici ton README d'origine, remis exactement dans ton ordre de départ, enrichi des informations sur le config.json et la connexion locale :

agent-guard
Middleware CLI qui impose une validation humaine obligatoire avant que du code généré par une IA ne soit écrit dans un projet réel.

Né d'un incident concret : un agent IA (Google AI Studio) a réécrit silencieusement 77 fichiers d'un coup, cassant Tailwind sans prévenir. agent-guard empêche ce scénario en interdisant à l'IA d'écrire directement dans le projet.

TL;DR
agent-guard est un pare-feu entre tes agents IA (Google AI Studio, Claude, etc.) et ton code.

L’IA n’écrit que dans un dossier de staging .agent-guard/staging/.

Tu vois le diff exact de chaque fichier modifié.

Rien ne touche ton projet réel sans un approve explicite.

Aucune écriture automatique. Aucun commit automatique. La décision reste toujours humaine.

Si tu laisses un agent modifier ton code, teste ça avant qu’il ne casse 77 fichiers en silence.

Principe
L'agent IA n'écrit jamais directement dans ton projet.

Il écrit ses fichiers proposés dans un dossier isolé : .agent-guard/staging/ (même arborescence que le projet).

Tu vois le diff exact de chaque changement proposé.

Rien n'est appliqué au projet réel sans une commande explicite : approve ou reject.

Aucune écriture automatique. Aucun commit automatique. La décision reste toujours humaine.

Installation
Bash
npm install
npm link   # rend la commande "agent-guard" disponible globalement
Bridge Google AI Studio → agent-guard (extension Chrome)
Pour permettre à Google AI Studio de rediriger automatiquement les fichiers vers le dossier staging de agent-guard, installe l'extension bridge.

Accéder aux extensions
Ouvre Chrome et tape chrome://extensions/ dans la barre d'adresse.

Activer le mode développeur
Active l'interrupteur "Mode développeur" en haut à droite.

Charger l'extension
Clique sur "Charger l'extension non empaquetée" et sélectionne le dossier bridge/extension à la racine de ce dépôt.

Configurer l'extension (Options)
Clique sur l'icône de l'extension Agent Guard Bridge dans Chrome.

Clique sur "Ouvrir les options".

Remplis les champs :

URL du serveur local : [http://127.0.0.1:4756](http://127.0.0.1:4756) (Il est recommandé d'utiliser l'IP brute 127.0.0.1 pour éviter les blocages IPv6 sous Windows).

Token partagé : Rentre le jeton de sécurité que tu as choisi (il doit correspondre à celui du fichier config.json).

Clique sur Enregistrer.

Configurer le serveur (config.json)
Dans le dossier bridge/server/, crée un fichier nommé config.json :

JSON
{
  "projectRoot": "C:\\Users\\Utilisateur\\Chemin\\De\\Ton\\Projet",
  "port": 4756,
  "token": "ton_token_de_securite_ici"
}
(Sous Windows, pense à bien doubler les antislashs \\ dans le chemin projectRoot).

Lancer le serveur
Assure-toi que le serveur (Node, fichier bridge/server/server.js) est actif pour réceptionner les fichiers envoyés par l'extension :

Bash
cd bridge/server
npm start
Cette extension redirige les fichiers générés par Google AI Studio vers .agent-guard/staging/ au lieu de ton projet réel.

Cas d’usage typique
Tu utilises un agent IA pour refactorer ton front (React, Tailwind) ou générer du code backend :

Tu installes et initialises agent-guard à la racine de ton projet.

Tu configures ton agent IA (prompt système, script, extension) pour écrire dans .agent-guard/staging/ au lieu de toucher ton repo directement.

Tu laisses l’agent proposer ses modifications.

Tu inspectes les diffs avec agent-guard diff.

Tu appliques uniquement ce que tu acceptes avec agent-guard approve.

Résultat : l’agent travaille, mais ne peut jamais casser ton projet sans ton accord explicite.

Utilisation
À la racine de ton projet :

Initialiser agent-guard dans ton projet
Bash
agent-guard init
Configure ensuite ton agent IA (prompt système, script, extension) pour qu'il écrive ses propositions dans .agent-guard/staging/ au lieu du projet directement.

Voir ce qui est en attente
Bash
agent-guard status
Voir le diff détaillé
Bash
agent-guard diff
agent-guard diff src/app.js
Appliquer un changement au projet réel
Bash
agent-guard approve src/app.js
agent-guard approve --all
Rejeter un changement
Bash
agent-guard reject src/app.js
agent-guard reject --all
Consulter l'historique
Bash
agent-guard history
Structure créée
Markdown
mon-projet/
├── .agent-guard.json          # config globale
├── .agent-guard/
│   ├── staging/               # fichiers en attente (zone tampon)
│   └── history.json           # log des décisions d'approbations/rejets
└── ...
Scénario de test (démo rapide)
Tu peux tester agent-guard sur un projet de démo avant de l’utiliser sur un vrai repo.

Créer un projet de test
Bash
mkdir demo-agent-guard
cd demo-agent-guard
npm init -y

# crée un fichier simple
mkdir src
echo "console.log('Hello');" > src/app.js
Initialiser agent-guard
Bash
agent-guard init
Simuler un agent IA
Au lieu de Google AI Studio pour le test, tu peux copier/modifier manuellement un fichier dans le dossier de staging :

Bash
# Simule une écriture de l'agent
mkdir -p .agent-guard/staging/src
cp src/app.js .agent-guard/staging/src/app.js
echo "console.log('Hello from AI');" >> .agent-guard/staging/src/app.js
Voir les changements proposés
Bash
agent-guard status
agent-guard diff src/app.js
Appliquer ou rejeter
Bash
# Appliquer
agent-guard approve src/app.js

# Ou rejeter
# agent-guard reject src/app.js
Tu verras que seul ce que tu approuves est appliqué à src/app.js. Rien ne passe automatiquement.

Pour un test complet avec Google AI Studio, utilise l’extension Chrome bridge et laisse l’agent écrire dans .agent-guard/staging/. Ensuite, suis les mêmes étapes status / diff / approve.

Pourquoi pas un simple hook Git ?
Parce que la contrainte doit être structurelle, pas seulement comportementale.

Un hook Git peut être contourné, désactivé ou oublié.

Rediriger toutes les écritures de l'agent vers un dossier physiquement séparé rend l'écriture directe impossible dans le workflow.

La validation n'est pas une option qu'on peut sauter par accident : l’agent n’a tout simplement jamais accès au projet réel.

agent-guard devient un garde-fou permanent du pipeline des agents IA.

Roadmap
Mode watch : notifications automatiques quand de nouveaux fichiers arrivent dans le staging.

Intégration Git : commit automatique après approbation avec message généré.

Mode approve --interactive : diff affiché puis prompt y/n/edit fichier par fichier.

Licence
MIT — HANDCODE STUDIO
