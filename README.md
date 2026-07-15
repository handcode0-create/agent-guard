# agent-guard 🛡️

**Middleware CLI qui impose une validation humaine obligatoire avant que du code généré par une IA ne soit écrit dans un projet réel.**

Né d'un incident concret : un agent IA (Google AI Studio) a réécrit silencieusement 77 fichiers d'un coup, cassant Tailwind sans prévenir. `agent-guard` empêche ce scénario en interdisant à l'IA d'écrire directement dans le projet.

---

## ⚡ TL;DR

* **`agent-guard` est un pare-feu** entre tes agents IA (Google AI Studio, Claude, etc.) et ton code.
* **L’IA n’écrit que dans un dossier de staging** `.agent-guard/staging/`.
* **Tu vois le diff exact** de chaque fichier modifié.
* **Rien ne touche ton projet réel** sans un `approve` explicite.
* **Aucune écriture automatique. Aucun commit automatique.** La décision reste toujours humaine.

Si tu laisses un agent modifier ton code, teste ça avant qu’il ne casse 77 fichiers en silence.

---

## 💡 Principe

1. L'agent IA n'écrit jamais directement dans ton projet.
2. Il écrit ses fichiers proposés dans un dossier isolé : `.agent-guard/staging/` (qui reproduit exactement la même arborescence que ton projet).
3. Tu vois le diff exact de chaque changement proposé.
4. Rien n'est appliqué au projet réel sans une commande explicite : `approve` ou `reject`.

---

## 🛠️ Installation

### 1. Installer la CLI globalement
À la racine du projet `agent-guard` :
```bash
npm install
npm link   # Rend la commande "agent-guard" disponible globalement sur ta machine
🔌 Configuration du Pont (Bridge) Google AI Studio → agent-guardPour permettre à Google AI Studio de rediriger automatiquement les fichiers vers le dossier staging de ton projet, tu dois configurer et lancer le serveur local, puis installer l'extension Chrome.Étape 1 : Configurer le serveur local (config.json)Dans le dossier bridge/server/ de ce projet, crée un fichier nommé config.json :JSON{
  "projectRoot": "C:\\Users\\Utilisateur\\Desktop\\MonProjetCible",
  "port": 4756,
  "token": "choisis_un_long_token_de_securite_ici"
}
⚠️ Important (Windows) : Dans le chemin projectRoot, veillez à doubler les antislashs (ex: C:\\MonDossier\\MonProjet) pour respecter le format JSON.OptionDescriptionExemple / ValeurprojectRootLe chemin absolu vers la racine de votre projet de développement cible (où le dossier .agent-guard/staging/ sera créé).C:\\projets\\prestige-driveportLe port local sur lequel le serveur Node.js va écouter les requêtes de l'extension.4756 (par défaut)tokenUne clé secrète aléatoire partagée avec l'extension pour sécuriser le pont d'écriture.Une longue chaîne de caractères de ton choix.Étape 2 : Lancer le serveur de liaisonDémarre le serveur Node pour qu'il écoute les requêtes de l'extension :Bashcd bridge/server
npm start
Étape 3 : Installer l'extension ChromeOuvrez Google Chrome et accédez à chrome://extensions/.Activez le "Mode développeur" (interrupteur en haut à droite).Cliquez sur "Charger l'extension non empaquetée" (en haut à gauche).Sélectionnez le dossier bridge/extension situé à la racine de ce dépôt.Étape 4 : Configurer l'extension ChromeCliquez sur l'icône de l'extension Agent Guard Bridge dans la barre d'outils de Chrome.Cliquez sur "Ouvrir les options".Renseignez les informations de liaison :URL du serveur local : http://127.0.0.1:4756 (Il est fortement recommandé d'utiliser l'IP brute 127.0.0.1 plutôt que localhost pour contourner les conflits de résolution d'hôtes IPv6 sous Windows).Token partagé : Copiez-coller exactement le token défini dans votre fichier config.json.Cliquez sur Enregistrer.Ouvrez à nouveau le popup de l'extension et cliquez sur Tester la connexion pour valider que le statut passe au vert (✔ Connecté).🎯 Cas d’usage typiqueTu utilises un agent IA pour refactorer ton front (React, Tailwind) ou générer du code backend :Tu installes et initialises agent-guard à la racine de ton projet cible.Tu lances ton serveur de liaison bridge/server en arrière-plan.Tu demandes à ton agent sur Google AI Studio d'écrire son code.(Astuce : demande-lui d'indiquer le chemin du fichier sur la première ligne, ex : // file: src/components/PremiumButton.jsx pour que le pont le détecte automatiquement).Tu cliques sur le bouton orange "Envoyer vers agent-guard" apparu sous le bloc de code dans AI Studio.Tu inspectes les diffs avec agent-guard diff.Tu appliques uniquement ce que tu acceptes avec agent-guard approve.💻 Utilisation de la CLIÀ la racine de ton projet de développement :Initialiser agent-guard dans ton projetBashagent-guard init
Voir ce qui est en attente dans le stagingBashagent-guard status
Voir le diff détaillé d'un fichier proposéBashagent-guard diff
agent-guard diff src/app.js
Appliquer un changement au projet réel (fusion)Bashagent-guard approve src/app.js
agent-guard approve --all
Rejeter un changement (supprimer du staging)Bashagent-guard reject src/app.js
agent-guard reject --all
Consulter l'historique des décisionsBashagent-guard history
📂 Structure créée dans ton projetMarkdownmon-projet/
├── .agent-guard.json          # Configuration globale d'agent-guard
├── .agent-guard/
│   ├── staging/               # Zone tampon sécurisée (fichiers en attente de revue)
│   └── history.json           # Log des décisions d'approbation/rejet
└── ...
🚀 Scénario de test (Démo rapide)Tu peux tester agent-guard sur un projet de démo avant de l’utiliser sur un vrai dépôt.1. Créer un projet de testBashmkdir demo-agent-guard
cd demo-agent-guard
npm init -y

# Crée un fichier simple de départ
mkdir src
echo "console.log('Hello');" > src/app.js
2. Initialiser agent-guardBashagent-guard init
3. Simuler l'écriture d'un agent IAPour ce test rapide sans passer par le navigateur, on copie manuellement un fichier modifié dans la zone de staging :Bash# Simule une écriture de l'agent IA dans le staging
mkdir -p .agent-guard/staging/src
cp src/app.js .agent-guard/staging/src/app.js
echo "console.log('Hello from AI');" >> .agent-guard/staging/src/app.js
4. Analyser et validerBash# Voir les changements proposés
agent-guard status

# Voir le diff
agent-guard diff src/app.js

# Appliquer la modification au vrai projet
agent-guard approve src/app.js
Tu verras que seul ce que tu approuves est appliqué à src/app.js. Rien ne passe automatiquement.❓ Pourquoi pas un simple hook Git ?Parce que la contrainte doit être structurelle, pas seulement comportementale.Un hook Git peut être contourné, désactivé ou oublié.Rediriger toutes les écritures de l'agent vers un dossier physiquement séparé rend l'écriture directe impossible dans le workflow de l'IA.La validation n'est pas une option qu'on peut sauter par accident : l’agent n’a tout simplement jamais accès au projet réel.agent-guard devient un garde-fou permanent du pipeline de tes agents IA.🗺️ Roadmap[ ] Mode watch : notifications automatiques quand de nouveaux fichiers arrivent dans le staging.[ ] Intégration Git : commit automatique après approbation avec message de commit généré par l'historique.[ ] Mode approve --interactive : diff affiché dans le terminal puis prompt interactif y/n/edit fichier par fichier.📄 LicenceMIT — HANDCODE STUDIO
