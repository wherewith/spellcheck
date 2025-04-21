// service-worker.js
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type !== 'toggleSpellcheck') return;
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        const file = msg.value ? 'index.js' : 'teardown.js';
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [file]
        }).catch(err => console.error(`inject ${file} failed:`, err));
      }
    });
  });
  