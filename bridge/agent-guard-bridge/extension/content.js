// Injecté sur https://aistudio.google.com/*
// Ajoute un bouton "Envoyer vers agent-guard" sous chaque bloc de code détecté.
// Le contenu n'est JAMAIS écrit directement quelque part : il part vers le
// service worker (background.js), qui l'envoie au serveur local, qui l'écrit
// uniquement dans .agent-guard/staging/.

const PROCESSED_ATTR = "data-agent-guard-processed";

/**
 * Cherche un chemin de fichier indiqué en commentaire sur la première ligne
 * du bloc de code, ex: "// file: src/components/Header.jsx".
 * Retourne { path, content } — path est null si rien n'est détecté.
 */
function extractFilePathAndContent(rawText) {
  const lines = rawText.split("\n");
  const firstLine = (lines[0] || "").trim();

  const patterns = [
    /^\/\/\s*file:\s*(.+)$/i,
    /^#\s*file:\s*(.+)$/i,
    /^\/\*\s*file:\s*(.+?)\s*\*\/$/i,
    /^<!--\s*file:\s*(.+?)\s*-->$/i,
  ];

  for (const pattern of patterns) {
    const match = firstLine.match(pattern);
    if (match) {
      return {
        path: match[1].trim(),
        content: lines.slice(1).join("\n"),
      };
    }
  }

  return { path: null, content: rawText };
}

function setButtonState(button, state, text) {
  button.dataset.state = state;
  button.textContent = text;
}

async function handleSendClick(button, rawText) {
  const { path: detectedPath, content } = extractFilePathAndContent(rawText);

  let filePath = detectedPath;
  if (!filePath) {
    filePath = window.prompt(
      "Aucun chemin détecté dans le bloc de code (ex: \"// file: src/App.jsx\" en 1ère ligne).\n" +
        "Indique le chemin relatif du fichier dans le projet :"
    );
  }

  if (!filePath) {
    setButtonState(button, "error", "Annulé — pas de chemin");
    setTimeout(() => setButtonState(button, "idle", "Envoyer vers agent-guard"), 2500);
    return;
  }

  setButtonState(button, "sending", "Envoi...");

  chrome.runtime.sendMessage(
    { type: "agent-guard:write", path: filePath, content },
    (response) => {
      if (chrome.runtime.lastError) {
        setButtonState(button, "error", "Erreur extension");
        console.error("Agent Guard Bridge:", chrome.runtime.lastError);
        return;
      }
      if (response && response.ok) {
        setButtonState(button, "sent", `✔ Staged: ${response.staged}`);
      } else {
        setButtonState(button, "error", (response && response.error) || "Échec");
        console.error("Agent Guard Bridge:", response);
      }
      setTimeout(() => setButtonState(button, "idle", "Envoyer vers agent-guard"), 4000);
    }
  );
}

function injectButtonForBlock(preElement) {
  if (preElement.hasAttribute(PROCESSED_ATTR)) return;
  preElement.setAttribute(PROCESSED_ATTR, "true");

  const wrapper = document.createElement("div");
  wrapper.className = "agent-guard-btn-wrapper";

  const button = document.createElement("button");
  button.className = "agent-guard-btn";
  button.type = "button";
  setButtonState(button, "idle", "Envoyer vers agent-guard");

  button.addEventListener("click", () => {
    const codeEl = preElement.querySelector("code") || preElement;
    const rawText = codeEl.innerText;
    handleSendClick(button, rawText);
  });

  wrapper.appendChild(button);
  preElement.insertAdjacentElement("afterend", wrapper);
}

function scanForCodeBlocks() {
  document.querySelectorAll("pre").forEach(injectButtonForBlock);
}

// Scan initial + observation des ajouts dynamiques (AI Studio charge le contenu en streaming).
scanForCodeBlocks();

const observer = new MutationObserver(() => {
  scanForCodeBlocks();
});

observer.observe(document.body, { childList: true, subtree: true });
