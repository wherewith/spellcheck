// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
  
    chrome.storage.sync.get('spellcheckActive', ({ spellcheckActive }) => {
      toggle.checked = !!spellcheckActive;
      statusText.textContent = spellcheckActive ? 'Active' : 'Inactive';
    });
  
    toggle.addEventListener('change', () => {
      const isActive = toggle.checked;
      chrome.storage.sync.set({ spellcheckActive: isActive });
      statusText.textContent = isActive ? 'Active' : 'Inactive';
      chrome.runtime.sendMessage({ type: 'toggleSpellcheck', value: isActive });
    });
  });
  