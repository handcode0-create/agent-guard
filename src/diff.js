const { diffLines } = require("diff");
const chalk = require("chalk");

/**
 * Construit un diff lisible en terminal entre le contenu actuel (target)
 * et le contenu proposé (staging). Retourne { text, added, removed, isNewFile }.
 */
function buildDiff(oldContent, newContent) {
  const isNewFile = oldContent === null;
  const parts = diffLines(oldContent || "", newContent);

  let added = 0;
  let removed = 0;
  const lines = [];

  for (const part of parts) {
    const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
    const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray;

    const partLines = part.value.replace(/\n$/, "").split("\n");
    for (const line of partLines) {
      lines.push(color(prefix + line));
    }

    if (part.added) added += partLines.length;
    if (part.removed) removed += partLines.length;
  }

  return {
    text: lines.join("\n"),
    added,
    removed,
    isNewFile,
  };
}

module.exports = { buildDiff };
