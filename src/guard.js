const fs = require("fs");
const path = require("path");
const { paths, loadConfig, defaultConfig, GUARD_DIR } = require("./config");
const { buildDiff } = require("./diff");

/**
 * Initialise agent-guard dans le dossier courant : crée .agent-guard/,
 * .agent-guard/staging/, .agent-guard.json et history.json.
 */
function init(projectRoot = process.cwd()) {
  const p = paths(projectRoot);

  if (fs.existsSync(p.configFile)) {
    throw new Error("agent-guard est déjà initialisé ici.");
  }

  fs.mkdirSync(p.stagingDir, { recursive: true });
  fs.writeFileSync(p.configFile, JSON.stringify(defaultConfig(), null, 2) + "\n");
  fs.writeFileSync(p.historyFile, JSON.stringify([], null, 2) + "\n");

  return p;
}

/** Liste tous les fichiers récursivement sous un dossier. */
function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

/**
 * Retourne la liste des changements en attente : fichiers présents dans
 * staging/, avec leur statut par rapport au projet réel.
 */
function listPending(projectRoot) {
  const p = paths(projectRoot);
  const stagedFiles = walk(p.stagingDir);

  return stagedFiles.map((relPath) => {
    const stagingPath = path.join(p.stagingDir, relPath);
    const targetPath = path.join(p.projectRoot, relPath);

    const newContent = fs.readFileSync(stagingPath, "utf8");
    const targetExists = fs.existsSync(targetPath);
    const oldContent = targetExists ? fs.readFileSync(targetPath, "utf8") : null;

    const status = !targetExists
      ? "new"
      : oldContent === newContent
      ? "unchanged"
      : "modified";

    return { relPath, stagingPath, targetPath, status };
  });
}

/** Construit le diff détaillé pour un fichier en attente donné. */
function getDiff(projectRoot, relPath) {
  const p = paths(projectRoot);
  const stagingPath = path.join(p.stagingDir, relPath);
  const targetPath = path.join(p.projectRoot, relPath);

  if (!fs.existsSync(stagingPath)) {
    throw new Error(`Pas de changement en attente pour: ${relPath}`);
  }

  const newContent = fs.readFileSync(stagingPath, "utf8");
  const oldContent = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : null;

  return buildDiff(oldContent, newContent);
}

function appendHistory(projectRoot, entry) {
  const p = paths(projectRoot);
  const history = JSON.parse(fs.readFileSync(p.historyFile, "utf8"));
  history.push({ ...entry, at: new Date().toISOString() });
  fs.writeFileSync(p.historyFile, JSON.stringify(history, null, 2) + "\n");
}

/** Applique un changement approuvé : copie staging -> target, log, nettoie staging. */
function approve(projectRoot, relPath) {
  const p = paths(projectRoot);
  const stagingPath = path.join(p.stagingDir, relPath);
  const targetPath = path.join(p.projectRoot, relPath);

  if (!fs.existsSync(stagingPath)) {
    throw new Error(`Pas de changement en attente pour: ${relPath}`);
  }

  const content = fs.readFileSync(stagingPath, "utf8");
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
  fs.rmSync(stagingPath);

  appendHistory(projectRoot, { action: "approved", file: relPath });
}

/** Rejette un changement proposé : supprime le staging sans toucher au projet. */
function reject(projectRoot, relPath) {
  const p = paths(projectRoot);
  const stagingPath = path.join(p.stagingDir, relPath);

  if (!fs.existsSync(stagingPath)) {
    throw new Error(`Pas de changement en attente pour: ${relPath}`);
  }

  fs.rmSync(stagingPath);
  appendHistory(projectRoot, { action: "rejected", file: relPath });
}

function getHistory(projectRoot) {
  const p = paths(projectRoot);
  return JSON.parse(fs.readFileSync(p.historyFile, "utf8"));
}

module.exports = {
  GUARD_DIR,
  init,
  listPending,
  getDiff,
  approve,
  reject,
  getHistory,
  loadConfig,
};
