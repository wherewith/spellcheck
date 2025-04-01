chrome.action.onClicked.addListener(tab => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Inject style for misspelled words if not present
            if (!document.getElementById("spellcheck-style")) {
                const style = document.createElement("style");
                style.id = "spellcheck-style";
                style.textContent = ".myMisspelled { color: red; }";
                document.head.appendChild(style);
            }

            // A simple dictionary – replace with a real one or external API
            const dictionary = new Set([
                "this", "is", "a", "sample", "text", "with", "some", "correct", "words"
            ]);

            const isMisspelled = word => {
                return !dictionary.has(word.toLowerCase());
            };

            const highlightMisspellings = () => {
                const innerSpans = document.querySelectorAll('.view-line > span > span');
                innerSpans.forEach(innerSpan => {
                    // Use textContent to get plain text (avoids picking up HTML tags)
                    const originalText = innerSpan.textContent;

                    // Split the text into words and non-word parts while preserving punctuation/spaces
                    const parts = originalText.split(/(\b\w+\b)/);

                    // Wrap misspelled words with a span that uses the CSS class
                    const highlighted = parts.map(part => {
                        if (/^\w+$/.test(part) && isMisspelled(part)) {
                            return `<span class="myMisspelled">${part}</span>`;
                        }
                        return part;
                    }).join('');

                    // Replace the inner HTML with our highlighted version
                    innerSpan.innerHTML = highlighted;
                });
            };

            // Add a debounced keydown listener to trigger spellchecking after typing stops
            if (!window.__spellcheckListenerAdded) {
                let timeoutId;
                const debounceHighlight = () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(highlightMisspellings, 500); // Run 500ms after typing stops
                };

                document.addEventListener('keydown', debounceHighlight);
                window.__spellcheckListenerAdded = true;
            }
        }
    });
});