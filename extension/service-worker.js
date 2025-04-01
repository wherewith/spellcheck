chrome.action.onClicked.addListener(tab => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Inject style for dictionary words if not present
            if (!document.getElementById("spellcheck-style")) {
                const style = document.createElement("style");
                style.id = "spellcheck-style";
                style.textContent = ".myDictionaryWord { color: red; }";
                document.head.appendChild(style);
            }

            // A simple dictionary – replace with a real one or external API
            const dictionary = new Set([
                
            ]);

            // Highlight dictionary words within all inner spans
            const highlightDictionaryWords = () => {
                const innerSpans = document.querySelectorAll('.view-line > span > span');
                innerSpans.forEach(innerSpan => {
                    // Get the plain text content of the span
                    const originalText = innerSpan.textContent;
                    // Split text into words and non-word parts (keeping punctuation/spaces)
                    const parts = originalText.split(/(\b\w+\b)/);
                    // Wrap words found in the dictionary with a span having the CSS class
                    const highlighted = parts.map(part => {
                        if (/^\w+$/.test(part) && dictionary.has(part.toLowerCase())) {
                            return `<span class="myDictionaryWord">${part}</span>`;
                        }
                        return part;
                    }).join('');
                    // Update the innerHTML of the span with the highlighted version
                    innerSpan.innerHTML = highlighted;
                });
            };

            // Add the most recent word to the dictionary and log it
            const addMostRecentWordToDictionary = () => {
                let activeSpan = null;
                // Try to get the active element from the selection
                const selection = window.getSelection();
                if (selection && selection.anchorNode) {
                    // Walk up to find a span that matches our selector
                    let node = selection.anchorNode;
                    while (node && node !== document.body) {
                        if (
                            node.nodeType === Node.ELEMENT_NODE &&
                            node.matches &&
                            node.matches('.view-line > span > span')
                        ) {
                            activeSpan = node;
                            break;
                        }
                        node = node.parentElement;
                    }
                }
                // Fallback: use the last inner span if none is active
                if (!activeSpan) {
                    const innerSpans = document.querySelectorAll('.view-line > span > span');
                    if (innerSpans.length > 0) {
                        activeSpan = innerSpans[innerSpans.length - 1];
                    }
                }
                if (activeSpan) {
                    const text = activeSpan.textContent;
                    // Match all word tokens (letters, digits, underscore)
                    const words = text.match(/\w+/g);
                    if (words && words.length > 0) {
                        const recentWord = words[words.length - 1];
                        console.log("Most recent word:", recentWord);
                        dictionary.add(recentWord.toLowerCase());
                    }
                }
            };

            // Add a debounced keydown listener to trigger the update after typing stops
            if (!window.__spellcheckListenerAdded) {
                let timeoutId;
                const debounceUpdate = () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        addMostRecentWordToDictionary();
                        highlightDictionaryWords();
                    }, 500); // Run 500ms after typing stops
                };

                document.addEventListener('keydown', debounceUpdate);
                window.__spellcheckListenerAdded = true;
            }
        }
    });
});
