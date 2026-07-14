// Service worker MV3 — fait le pont réseau entre le content script (page AI Studio)
// et le serveur local agent-guard-bridge-server. Le fetch se fait ici (pas dans le
// content script) pour éviter les restrictions CSP de la page aistudio.google.com.

async function getSettings() {
  const stored = await chrome.storage.local.get(["serverUrl", "token"]);
  return {
    serverUrl: stored.serverUrl || "http://localhost:4756",
    token: stored.token || "",
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "agent-guard:write") {
    (async () => {
      const { serverUrl, token } = await getSettings();

      if (!token) {
        sendResponse({
          ok: false,
          error: "Aucun token configuré. Ouvre les options de l'extension.",
        });
        return;
      }

      try {
        const res = await fetch(`${serverUrl}/write`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Agent-Guard-Token": token,
          },
          body: JSON.stringify({ path: message.path, content: message.content }),
        });

        const data = await res.json();
        sendResponse({ ok: res.ok, ...data });
      } catch (err) {
        sendResponse({
          ok: false,
          error: `Impossible de joindre le serveur local (${serverUrl}). Est-il lancé ? Détail: ${err.message}`,
        });
      }
    })();

    return true; // réponse asynchrone
  }

  if (message.type === "agent-guard:health") {
    (async () => {
      const { serverUrl } = await getSettings();
      try {
        const res = await fetch(`${serverUrl}/health`);
        const data = await res.json();
        sendResponse({ ok: true, ...data });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();

    return true;
  }

  return false;
});
