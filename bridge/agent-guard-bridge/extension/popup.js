document.getElementById("test").addEventListener("click", () => {
  const result = document.getElementById("result");
  result.textContent = "Test en cours...";
  result.style.color = "#ccc";

  chrome.runtime.sendMessage({ type: "agent-guard:health" }, (response) => {
    if (response && response.ok) {
      result.style.color = "#2ecc71";
      result.textContent = `✔ Connecté — projet: ${response.projectRoot || "?"}`;
    } else {
      result.style.color = "#e74c3c";
      result.textContent = `✖ ${(response && response.error) || "Serveur injoignable"}`;
    }
  });
});

document.getElementById("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
