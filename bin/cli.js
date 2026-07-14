#!/usr/bin/env node
const chalk = require("chalk");
const { findProjectRoot } = require("../src/config");
const guard = require("../src/guard");

function requireProjectRoot() {
  const root = findProjectRoot();
  if (!root) {
    console.error(
      chalk.red("✖ agent-guard n'est pas initialisé ici.") +
        ' Lance "agent-guard init" à la racine de ton projet.'
    );
    process.exit(1);
  }
  return root;
}

function printPendingList(pending) {
  if (pending.length === 0) {
    console.log(chalk.gray("Aucun changement en attente. Staging vide."));
    return;
  }
  console.log(chalk.bold(`\n${pending.length} changement(s) en attente:\n`));
  for (const item of pending) {
    const badge =
      item.status === "new"
        ? chalk.green("[NOUVEAU]")
        : item.status === "modified"
        ? chalk.yellow("[MODIFIÉ]")
        : chalk.gray("[IDENTIQUE]");
    console.log(`  ${badge} ${item.relPath}`);
  }
  console.log("");
}

function cmdInit() {
  try {
    const p = guard.init(process.cwd());
    console.log(chalk.green("✔ agent-guard initialisé."));
    console.log(chalk.gray(`  Config     : ${p.configFile}`));
    console.log(chalk.gray(`  Staging    : ${p.stagingDir}`));
    console.log(
      "\n" +
        chalk.bold("Prochaine étape : ") +
        "configure ton agent IA (Google AI Studio, script, etc.) pour qu'il écrive\n" +
        "ses fichiers proposés dans " +
        chalk.cyan(p.stagingDir) +
        " (même arborescence que le projet)\n" +
        "au lieu d'écrire directement dans le projet."
    );
  } catch (err) {
    console.error(chalk.red(`✖ ${err.message}`));
    process.exit(1);
  }
}

function cmdStatus() {
  const root = requireProjectRoot();
  printPendingList(guard.listPending(root));
}

function cmdDiff(relPath) {
  const root = requireProjectRoot();
  const pending = guard.listPending(root);

  const targets = relPath ? pending.filter((p) => p.relPath === relPath) : pending;

  if (targets.length === 0) {
    console.log(chalk.gray("Rien à afficher."));
    return;
  }

  for (const item of targets) {
    const d = guard.getDiff(root, item.relPath);
    console.log(chalk.bold(`\n── ${item.relPath} ${item.status === "new" ? "(nouveau fichier)" : ""} ──`));
    console.log(d.text || chalk.gray("(fichier identique, aucun changement)"));
    console.log(chalk.gray(`  +${d.added} / -${d.removed}`));
  }
  console.log("");
}

function cmdApprove(relPath, all) {
  const root = requireProjectRoot();
  const pending = guard.listPending(root);

  if (all) {
    if (pending.length === 0) {
      console.log(chalk.gray("Rien à approuver."));
      return;
    }
    for (const item of pending) {
      guard.approve(root, item.relPath);
      console.log(chalk.green(`✔ appliqué: ${item.relPath}`));
    }
    return;
  }

  if (!relPath) {
    console.error(chalk.red("Précise un fichier, ou utilise --all."));
    process.exit(1);
  }

  try {
    guard.approve(root, relPath);
    console.log(chalk.green(`✔ appliqué: ${relPath}`));
  } catch (err) {
    console.error(chalk.red(`✖ ${err.message}`));
    process.exit(1);
  }
}

function cmdReject(relPath, all) {
  const root = requireProjectRoot();
  const pending = guard.listPending(root);

  if (all) {
    if (pending.length === 0) {
      console.log(chalk.gray("Rien à rejeter."));
      return;
    }
    for (const item of pending) {
      guard.reject(root, item.relPath);
      console.log(chalk.yellow(`✖ rejeté: ${item.relPath}`));
    }
    return;
  }

  if (!relPath) {
    console.error(chalk.red("Précise un fichier, ou utilise --all."));
    process.exit(1);
  }

  try {
    guard.reject(root, relPath);
    console.log(chalk.yellow(`✖ rejeté: ${relPath}`));
  } catch (err) {
    console.error(chalk.red(`✖ ${err.message}`));
    process.exit(1);
  }
}

function cmdHistory() {
  const root = requireProjectRoot();
  const history = guard.getHistory(root);

  if (history.length === 0) {
    console.log(chalk.gray("Historique vide."));
    return;
  }

  console.log(chalk.bold(`\nHistorique (${history.length} entrée(s)):\n`));
  for (const entry of history) {
    const label =
      entry.action === "approved" ? chalk.green("APPROUVÉ") : chalk.red("REJETÉ");
    console.log(`  [${entry.at}] ${label}  ${entry.file}`);
  }
  console.log("");
}

function printHelp() {
  console.log(`
${chalk.bold("agent-guard")} — validation humaine obligatoire avant écriture sur disque

${chalk.bold("Usage:")}
  agent-guard init                 Initialise agent-guard dans le dossier courant
  agent-guard status                Liste les changements proposés en attente
  agent-guard diff [fichier]        Affiche le diff d'un fichier (ou de tous si omis)
  agent-guard approve <fichier>     Applique un changement au projet réel
  agent-guard approve --all         Applique tous les changements en attente
  agent-guard reject <fichier>      Rejette un changement (staging supprimé, projet intact)
  agent-guard reject --all          Rejette tous les changements en attente
  agent-guard history                Affiche l'historique des décisions (approuvé/rejeté)
`);
}

function main() {
  const [, , cmd, arg1] = process.argv;

  switch (cmd) {
    case "init":
      return cmdInit();
    case "status":
      return cmdStatus();
    case "diff":
      return cmdDiff(arg1);
    case "approve":
      return cmdApprove(arg1 === "--all" ? null : arg1, arg1 === "--all");
    case "reject":
      return cmdReject(arg1 === "--all" ? null : arg1, arg1 === "--all");
    case "history":
      return cmdHistory();
    default:
      return printHelp();
  }
}

main();
