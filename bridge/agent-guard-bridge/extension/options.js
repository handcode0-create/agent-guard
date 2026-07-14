const serverUrlInput = document.getElementById("serverUrl");
const tokenInput = document.getElementById("token");
const status = document.getElementById("status");

async function load() {
  const stored = await chrome.storage.local.get(["serverUrl", "token"]);
  serverUrlInput.value = stored.serverUrl || "http://localhost:4756";
  tokenInput.value = stored.token || "";
}

/**
 * Nettoie une URL collée accidentellement au format Markdown, ex:
 * "[http://127.0.0.1:4756](http://127.0.0.1:4756)" -> "http://127.0.0.1:4756"
 */
function sanitizeUrl(raw) {
  const trimmed = raw.trim();
  const markdownMatch = trimmed.match(/^\[(https?:\/\/[^\]]+)\]\(https?:\/\/[^)]+\)$/);
  if (markdownMatch) return markdownMatch[1];
  return trimmed;
}

document.getElementById("save").addEventListener("click", async () => {
  const cleanUrl = sanitizeUrl(serverUrlInput.value) || "http://localhost:4756";
  serverUrlInput.value = cleanUrl;

  await chrome.storage.local.set({
    serverUrl: cleanUrl,
    token: tokenInput.value.trim(),
  });
  status.textContent = "✔ Enregistré.";
  status.style.color = "#2ecc71";
  setTimeout(() => (status.textContent = ""), 2500);
});

load();
