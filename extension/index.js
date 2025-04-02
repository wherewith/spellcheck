// Inject styles if not present
if (!document.getElementById("spellcheck-style")) {
    const style = document.createElement("style");
    style.id = "spellcheck-style";
    style.textContent = `
        .myDictionaryWord { color: red; cursor: pointer; }
        #myWordTooltip {
            position: absolute;
            background: #333;
            color: #fff;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            display: none;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            pointer-events: auto;
        }
        #myWordTooltip button {
            margin-left: 8px;
            background: #555;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 11px;
            border-radius: 3px;
            padding: 2px 6px;
        }
        #tooltipText .suggestion-item {
            margin-top: 2px;
            padding: 2px 6px;
            background: #444;
            border-radius: 3px;
            cursor: pointer;
        }
        #tooltipText .suggestion-item:hover {
            background: #666;
        }
    `;
    document.head.appendChild(style);
}

// Create tooltip element if it doesn't exist
if (!document.getElementById("myWordTooltip")) {
    const tooltip = document.createElement("div");
    tooltip.id = "myWordTooltip";
    tooltip.innerHTML = `
        <div id="tooltipText"></div>
        <button id="tooltipClose">Close</button>
    `;
    document.body.appendChild(tooltip);

    document.getElementById("tooltipClose").addEventListener("click", () => {
        tooltip.style.display = "none";
    });
}

const tooltip = document.getElementById("myWordTooltip");
const tooltipText = document.getElementById("tooltipText");

// Dictionary stores misspelled words with all suggestions
const dictionary = new Map();       // Map<misspelledWord, suggestions[]>
// Fixed words are stored here so they are not re-highlighted
const fixedWords = new Map();         // Map<misspelledWord, correctedWord>

// Function to highlight dictionary words and reapply fixed words immediately
const highlightDictionaryWords = () => {
    const innerSpans = document.querySelectorAll('.view-line > span > span');
    innerSpans.forEach(innerSpan => {
        // Use the current text content from the editor
        const originalText = innerSpan.textContent;
        const parts = originalText.split(/(\b\w+\b)/);
        const highlighted = parts.map(part => {
            const lower = part.toLowerCase();
            // If the word was fixed, return the corrected text without any highlighting.
            if (fixedWords.has(lower)) {
                return fixedWords.get(lower);
            }
            // Otherwise, if this word exists in our dictionary, wrap it in a span
            if (/^\w+$/.test(part) && dictionary.has(lower)) {
                return `<span class="myDictionaryWord" data-word="${lower}">${part}</span>`;
            }
            return part;
        }).join('');
        innerSpan.innerHTML = highlighted;
    });

    // Attach tooltip events to each highlighted word
    document.querySelectorAll('.myDictionaryWord').forEach(el => {
        el.addEventListener('mouseenter', e => {
            const word = e.target.getAttribute('data-word');
            const suggestions = dictionary.get(word) || [];
            // Clear previous content
            tooltipText.innerHTML = `<strong>Suggestions:</strong>`;
            suggestions.forEach(s => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = s.word;
                div.setAttribute("data-suggestion", s.word);
                div.setAttribute("data-target-word", word);
                div._targetElement = e.target; // store reference for replacement

                div.addEventListener("click", () => {
                    const corrected = s.word;
                    const wrong = word;
                    // Replace the content of the target span with the corrected word
                    div._targetElement.textContent = corrected;
                    div._targetElement.classList.remove("myDictionaryWord");
                    div._targetElement.removeAttribute("data-word");
                    // Save the fixed word so that even if the DOM resets, we reapply the correction
                    fixedWords.set(wrong, corrected);
                    // Remove this word from the dictionary
                    dictionary.delete(wrong);
                    tooltip.style.display = "none";
                });

                tooltipText.appendChild(div);
            });

            tooltip.style.display = 'block';
        });

        el.addEventListener('mousemove', e => {
            tooltip.style.top = `${e.clientY + 10}px`;
            tooltip.style.left = `${e.clientX + 10}px`;
        });

        el.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!tooltip.matches(':hover')) {
                    tooltip.style.display = 'none';
                }
            }, 200);
        });
    });

    tooltip.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
};

// Function to add the most recent word to the dictionary if it is misspelled
const addMostRecentWordToDictionary = () => {
    let activeSpan = null;
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
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
    if (!activeSpan) {
        const innerSpans = document.querySelectorAll('.view-line > span > span');
        if (innerSpans.length > 0) {
            activeSpan = innerSpans[innerSpans.length - 1];
        }
    }
    if (activeSpan) {
        const text = activeSpan.textContent;
        const words = text.match(/\w+/g);
        if (words && words.length > 0) {
            const recentWord = words[words.length - 1];
            const lower = recentWord.toLowerCase();

            // If this word is already fixed or already in the dictionary, do nothing.
            if (fixedWords.has(lower) || dictionary.has(lower)) return;

            const url = `http://localhost:8080/spellcheck?word=${encodeURIComponent(recentWord)}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data.suggestions && data.suggestions.length > 0) {
                        const first = data.suggestions[0];
                        if (first.edit_distance > 0) {
                            // Add the misspelled word and all suggestions to the dictionary
                            dictionary.set(lower, data.suggestions);
                            // Reapply highlighting immediately
                            highlightDictionaryWords();
                        }
                    }
                })
                .catch(err => console.error("Spellcheck request error:", err));
        }
    }
};

// Use a MutationObserver to catch DOM changes (from editor re-renders) and reapply fixes immediately
const container = document.querySelector('.view-line');
if (container) {
    const observer = new MutationObserver(mutations => {
        requestAnimationFrame(() => {
            highlightDictionaryWords();
        });
    });
    observer.observe(container, { childList: true, subtree: true });
}

// Debounced key detection
if (!window.__spellcheckListenerAdded) {
    let timeoutId;
    document.addEventListener('keydown', () => {
        // Immediately reapply fixed words and dictionary highlighting
        highlightDictionaryWords();
        // Debounce the API check for new misspellings
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            addMostRecentWordToDictionary();
            highlightDictionaryWords();
        }, 500);
    });
    window.__spellcheckListenerAdded = true;
}