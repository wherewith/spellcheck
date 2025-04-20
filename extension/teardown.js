// teardown.js
(() => {
    // remove style
    document.getElementById("spellcheck-style")?.remove();
    // remove tooltip
    document.getElementById("myWordTooltip")?.remove();
    // unwrap any highlighted words
    document.querySelectorAll(".myDictionaryWord")
      .forEach(span => span.replaceWith(document.createTextNode(span.textContent)));
  })();
  