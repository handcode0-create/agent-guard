const fs = require("fs");
const path = require("path");

const CONFIG_FILENAME = ".agent-guard.json";
const GUARD_DIR = ".agent-guard";

/**
 * Trouve la racine du projet (là où se trouve le dossier .agent-guard),
 * en remontant depuis le répertoire courant.
 */
function findProjectRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, GUARD_DIR))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function paths(projectRoot) {
  const guardDir = path.join(projectRoot, GUARD_DIR);
  return {
    projectRoot,
    guardDir,
    stagingDir: path.join(guardDir, "staging"),
    historyFile: path.join(guardDir, "history.json"),
    configFile: path.join(projectRoot, CONFIG_FILENAME),
  };
}

function loadConfig(projectRoot) {
  const { configFile } = paths(projectRoot);
  if (!fs.existsSync(configFile)) {
    throw new Error(
      `Aucune config trouvée (${CONFIG_FILENAME}). Lance "agent-guard init" d'abord.`
    );
  }
  return JSON.parse(fs.readFileSync(configFile, "utf8"));
}

function defaultConfig() {
  return {
    // Extensions jamais auto-approuvées, même si vides / triviales.
    alwaysReview: ["*"],
    // Dossiers/fichiers à ignorer complètement (jamais proposés, jamais bloqués).
    ignore: ["node_modules", ".git", ".agent-guard", CONFIG_FILENAME],
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  CONFIG_FILENAME,
  GUARD_DIR,
  findProjectRoot,
  paths,
  loadConfig,
  defaultConfig,
};
