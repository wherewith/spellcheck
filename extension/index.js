// index.js
(() => {
    const dictionary = new Map();
    const fixedWords = new Map();
    let observer, timeout;
  
    // 1. Inject styles + tooltip container
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
  
    if (!document.getElementById("myWordTooltip")) {
      const tooltip = document.createElement("div");
      tooltip.id = "myWordTooltip";
      tooltip.innerHTML = `
        <div id="tooltipText"></div>
        <button id="tooltipClose">Close</button>
      `;
      document.body.appendChild(tooltip);
      tooltip.querySelector("#tooltipClose")
        .addEventListener("click", () => tooltip.style.display = "none");
    }
    const tooltipEl = document.getElementById("myWordTooltip");
    const tooltipText = document.getElementById("tooltipText");
  
    // 2. Highlight function
    function highlightDictionaryWords() {
      document.querySelectorAll('.view-line > span > span')
        .forEach(span => {
          const parts = span.textContent.split(/(\b\w+\b)/);
          span.innerHTML = parts.map(p => {
            const w = p.toLowerCase();
            if (fixedWords.has(w)) return fixedWords.get(w);
            if (/^\w+$/.test(p) && dictionary.has(w)) {
              return `<span class="myDictionaryWord" data-word="${w}">${p}</span>`;
            }
            return p;
          }).join('');
        });
  
      document.querySelectorAll('.myDictionaryWord')
        .forEach(el => {
          el.onmouseenter = e => {
            const word = el.dataset.word;
            const sugg = dictionary.get(word) || [];
            tooltipText.innerHTML = `<strong>Suggestions:</strong>`;
            sugg.forEach(s => {
              const item = document.createElement("div");
              item.className = "suggestion-item";
              item.textContent = s.word;
              item.onclick = () => {
                el.textContent = s.word;
                el.classList.remove("myDictionaryWord");
                el.removeAttribute("data-word");
                fixedWords.set(word, s.word);
                dictionary.delete(word);
                tooltipEl.style.display = "none";
              };
              tooltipText.appendChild(item);
            });
            tooltipEl.style.display = "block";
          };
          el.onmousemove = e => {
            tooltipEl.style.top = `${e.clientY + 10}px`;
            tooltipEl.style.left = `${e.clientX + 10}px`;
          };
          el.onmouseleave = () => {
            setTimeout(() => {
              if (!tooltipEl.matches(':hover')) tooltipEl.style.display = "none";
            }, 200);
          };
        });
    }
  
    // 3. Spellcheck fetcher
    function addMostRecentWordToDictionary() {
      let span = null;
      const sel = window.getSelection();
      if (sel.anchorNode) {
        let node = sel.anchorNode;
        while (node && node !== document.body) {
          if (node.nodeType === 1 && node.matches('.view-line > span > span')) {
            span = node;
            break;
          }
          node = node.parentElement;
        }
      }
      if (!span) {
        const list = document.querySelectorAll('.view-line > span > span');
        span = list[list.length - 1];
      }
      if (!span) return;
      const words = span.textContent.match(/\w+/g);
      if (!words) return;
      const w = words.pop().toLowerCase();
      if (fixedWords.has(w) || dictionary.has(w)) return;
  
      fetch(`http://localhost:8080/spellcheck?word=${encodeURIComponent(w)}`)
        .then(r => r.json())
        .then(data => {
          if (data.suggestions?.length && data.suggestions[0].edit_distance > 0) {
            dictionary.set(w, data.suggestions);
            highlightDictionaryWords();
          }
        })
        .catch(console.error);
    }
  
    // 4. Observe editor re-renders
    const container = document.querySelector('.view-line');
    if (container) {
      observer = new MutationObserver(() => {
        requestAnimationFrame(highlightDictionaryWords);
      });
      observer.observe(container, { childList: true, subtree: true });
    }
  
    // 5. Kick it off and bind key listener
    highlightDictionaryWords();
    document.addEventListener('keydown', () => {
      highlightDictionaryWords();
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        addMostRecentWordToDictionary();
        highlightDictionaryWords();
      }, 500);
    });
  })();
  