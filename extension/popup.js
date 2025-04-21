// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
  
    toggle.addEventListener('change', () => {
      const isActive = toggle.checked;
      chrome.storage.sync.set({ spellcheckActive: isActive });
      statusText.textContent = isActive ? 'Active' : 'Inactive';
      chrome.runtime.sendMessage({ type: 'toggleSpellcheck', value: isActive });
    });
  });
  