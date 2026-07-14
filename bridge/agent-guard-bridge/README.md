# Agent Guard Bridge

Relie Google AI Studio à `agent-guard` : le code généré est envoyé vers `.agent-guard/staging/`, **jamais directement dans le projet**. Reconstruit après la perte du bridge d'origine, avec une contrainte en plus : le serveur local est *physiquement incapable* d'écrire ailleurs que dans le dossier staging (protection anti path-traversal testée).

Nécessite `agent-guard` déjà installé et initialisé dans ton projet (voir le repo `agent-guard`).

## Composants

```
agent-guard-bridge/
├── server/          # Serveur local Node — le seul à avoir le droit d'écrire sur disque
└── extension/       # Extension Chrome — bouton "Envoyer" sous chaque bloc de code AI Studio
```

## 1. Installer et lancer le serveur local

```bash
cd server
npm install
cp config.example.json config.json
```

Édite `config.json` :

```json
{
  "projectRoot": "/chemin/absolu/vers/ton/projet",
  "port": 4756,
  "token": "un-secret-long-et-aleatoire-a-toi-de-choisir"
}
```

⚠️ `projectRoot` doit déjà contenir un `.agent-guard.json` (lancé via `agent-guard init` au préalable).

```bash
npm start
```

Tu dois voir :
```
✔ agent-guard-bridge-server actif sur http://localhost:4756
```

Laisse ce terminal ouvert tant que tu utilises AI Studio avec le bridge.

## 2. Installer l'extension Chrome

1. Ouvre `chrome://extensions`
2. Active le **mode développeur** (en haut à droite)
3. Clique **"Charger l'extension non empaquetée"**
4. Sélectionne le dossier `extension/`
5. Clique sur l'icône de l'extension → **Options**
6. Renseigne :
   - **URL du serveur** : `http://localhost:4756`
   - **Token partagé** : exactement le même que dans `config.json`
7. Enregistre

## 3. Utiliser

1. Va sur `https://aistudio.google.com`
2. Génère du code avec l'agent
3. Sous chaque bloc de code, un bouton orange **"Envoyer vers agent-guard"** apparaît
4. Clique dessus

**Pour que le fichier arrive au bon endroit**, demande à l'agent d'indiquer le chemin en première ligne du bloc de code, par exemple :

```
// file: src/components/Header.jsx
```

Si cette ligne n'est pas détectée, l'extension te demande le chemin manuellement avant d'envoyer — rien n'est jamais envoyé sans que le chemin soit confirmé.

5. Une fois envoyé, va dans ton terminal projet :

```bash
agent-guard status
agent-guard diff
agent-guard approve <fichier>   # ou reject
```

## Ce que ce bridge NE fait PAS (volontairement)

- Il n'écrit jamais dans le projet réel — seulement dans `.agent-guard/staging/`.
- Il n'approuve rien automatiquement — `agent-guard approve` reste une commande humaine explicite.
- Le serveur refuse toute requête sans le bon token, et refuse toute tentative de chemin sortant du dossier staging (testé : `../../etc/passwd` et chemins absolus sont rejetés avec un code 400).
- Le CORS du serveur n'autorise que l'origine `https://aistudio.google.com` — pas n'importe quel site.

## Dépannage

| Problème | Cause probable |
|---|---|
| Popup affiche "Serveur injoignable" | Le serveur (`npm start`) n'est pas lancé, ou mauvais port |
| Le bouton passe en rouge "Erreur" | Token différent entre `config.json` et les options de l'extension |
| Aucun bouton n'apparaît sous le code | La structure DOM d'AI Studio a changé — dis-le moi, j'ajuste le sélecteur dans `content.js` |
| "Chemin invalide" à l'envoi | Tentative de chemin absolu ou de `../` — indique un chemin relatif simple, ex: `src/App.jsx` |

## Licence

MIT — HANCODE STUDIO
