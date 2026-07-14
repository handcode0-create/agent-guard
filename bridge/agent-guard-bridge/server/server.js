const express = require("express");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(
      `✖ config.json introuvable. Copie config.example.json vers config.json et remplis:\n` +
        `  - projectRoot : chemin absolu vers ton projet (ex: prestige-drive-ci)\n` +
        `  - token       : un secret que tu retrouveras dans les options de l'extension Chrome\n` +
        `  - port        : port local du serveur (par défaut 4756)`
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

const config = loadConfig();

if (!fs.existsSync(config.projectRoot)) {
  console.error(`✖ projectRoot introuvable: ${config.projectRoot}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(config.projectRoot, ".agent-guard.json"))) {
  console.error(
    `✖ agent-guard n'est pas initialisé dans ce projet.\n` +
      `  Lance "agent-guard init" dans ${config.projectRoot} d'abord.`
  );
  process.exit(1);
}

const STAGING_DIR = path.join(config.projectRoot, ".agent-guard", "staging");

const app = express();
app.use(express.json({ limit: "5mb" }));

// CORS restreint : uniquement Google AI Studio a le droit d'appeler ce serveur.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://aistudio.google.com");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Agent-Guard-Token");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function checkToken(req, res, next) {
  const token = req.header("X-Agent-Guard-Token");
  if (!token || token !== config.token) {
    return res.status(401).json({ ok: false, error: "Token invalide ou manquant." });
  }
  next();
}

/**
 * Empêche toute tentative d'échapper au dossier staging (../../etc).
 * Retourne le chemin absolu résolu, ou null si la tentative est invalide.
 */
function resolveSafeStagingPath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return null;
  // Rejette les chemins absolus et les caractères Windows/Unix suspects de sortie.
  if (path.isAbsolute(relativePath)) return null;

  const target = path.normalize(path.join(STAGING_DIR, relativePath));
  const stagingResolved = path.resolve(STAGING_DIR);
  const targetResolved = path.resolve(target);

  if (!targetResolved.startsWith(stagingResolved + path.sep) && targetResolved !== stagingResolved) {
    return null; // tentative de sortie du dossier staging
  }
  return targetResolved;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, projectRoot: config.projectRoot, staging: STAGING_DIR });
});

app.post("/write", checkToken, (req, res) => {
  const { path: relativePath, content } = req.body || {};

  if (typeof content !== "string") {
    return res.status(400).json({ ok: false, error: "Champ 'content' manquant ou invalide." });
  }

  const safeTarget = resolveSafeStagingPath(relativePath);
  if (!safeTarget) {
    return res.status(400).json({
      ok: false,
      error: "Chemin invalide ou tentative de sortie du dossier staging refusée.",
    });
  }

  fs.mkdirSync(path.dirname(safeTarget), { recursive: true });
  fs.writeFileSync(safeTarget, content, "utf8");

  const stagedRelPath = path.relative(STAGING_DIR, safeTarget);
  console.log(`→ écrit dans staging: ${stagedRelPath} (${content.length} caractères)`);

  res.json({ ok: true, staged: stagedRelPath });
});

app.listen(config.port, "127.0.0.1", () => {
  console.log(`✔ agent-guard-bridge-server actif sur http://localhost:${config.port}`);
  console.log(`  Projet   : ${config.projectRoot}`);
  console.log(`  Staging  : ${STAGING_DIR}`);
  console.log(`  Rappel   : ce serveur n'écrit JAMAIS ailleurs que dans .agent-guard/staging/`);
});
