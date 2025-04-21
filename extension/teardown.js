// teardown.js
(() => {
  // Remove spell‑check artefacts
  document.getElementById("spellcheck-style")?.remove();
  document.getElementById("myWordTooltip")?.remove();
  document.querySelectorAll(".myDictionaryWord")
    .forEach(span => span.replaceWith(document.createTextNode(span.textContent)));

  // Remove Rewrite UI
  document.getElementById("rewrite-button")?.remove();
  document.getElementById("rewrite-modal-backdrop")?.remove();
})();
