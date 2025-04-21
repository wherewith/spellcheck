// index.js
(() => {
  // ─── PART 1: Rewrite‑UI ─────────────────────────────────────────────────────

  // Create Rewrite button
  const rewriteBtn = document.createElement('button');
  rewriteBtn.id = 'rewrite-button';
  rewriteBtn.textContent = 'Rewrite';
  Object.assign(rewriteBtn.style, {
    position: 'absolute',
    display: 'none',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    zIndex: 99999
  });
  document.body.appendChild(rewriteBtn);

  // Create Modal backdrop + dialog
  const backdrop = document.createElement('div');
  backdrop.id = 'rewrite-modal-backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000
  });
  const modal = document.createElement('div');
  modal.id = 'rewrite-modal';
  Object.assign(modal.style, {
    background: '#fff',
    padding: '1rem',
    borderRadius: '6px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  });
  const textarea = document.createElement('textarea');
  Object.assign(textarea.style, {
    width: '100%',
    height: '120px',
    marginBottom: '0.75rem',
    fontSize: '14px'
  });
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  Object.assign(saveBtn.style, {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    marginRight: '0.5rem'
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  Object.assign(cancelBtn.style, {
    background: '#aaa',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer'
  });
  modal.append(textarea, saveBtn, cancelBtn);
  backdrop.append(modal);
  document.body.append(backdrop);

  let currentRange = null;

  // Show Rewrite button on text selection
  document.addEventListener('mouseup', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      rewriteBtn.style.display = 'none';
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      rewriteBtn.style.display = 'none';
      return;
    }
    currentRange = range.cloneRange();
    rewriteBtn.style.top  = `${window.scrollY + rect.top - rewriteBtn.offsetHeight - 6}px`;
    rewriteBtn.style.left = `${window.scrollX + rect.left}px`;
    rewriteBtn.style.display = 'block';
  });

  // Hide button if clicking elsewhere
  document.addEventListener('mousedown', e => {
    if (!rewriteBtn.contains(e.target)) {
      rewriteBtn.style.display = 'none';
    }
  });

  // Open modal on Rewrite click
  rewriteBtn.addEventListener('click', () => {
    if (!currentRange) return;
    textarea.value = currentRange.toString();
    backdrop.style.display = 'flex';
    rewriteBtn.style.display = 'none';
  });

  // Cancel
  cancelBtn.addEventListener('click', () => {
    backdrop.style.display = 'none';
  });

  // Save replacement via /rewrite
  saveBtn.addEventListener('click', () => {
    const original = textarea.value;
    if (!original || !currentRange) {
      backdrop.style.display = 'none';
      return;
    }

    // Call your backend
    fetch('http://localhost:8080/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: original })
    })
    .then(res => res.json())
    .then(json => {
      const rewritten = json.rewritten || original;
      // perform replacement
      currentRange.deleteContents();
      currentRange.insertNode(document.createTextNode(rewritten));
    })
    .catch(err => {
      console.error('Rewrite API error:', err);
      // fallback to original text
      currentRange.deleteContents();
      currentRange.insertNode(document.createTextNode(original));
    })
    .finally(() => {
      backdrop.style.display = 'none';
    });
  });


  // ─── PART 2: Spell‑Check Overlay ────────────────────────────────────────────

  const dictionary = new Map();    // Map<lowercaseMisspelled, suggestions[]>
  const fixedWords = new Map();    // Map<lowercaseMisspelled, correctedWord>
  let observer, timeout;

  // 1. Inject spell‑check CSS & tooltip container
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
        z-index: 99999;
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
        el.onmouseenter = () => {
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
          tooltipEl.style.top  = `${e.clientY + 10}px`;
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

  // 5. Start
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