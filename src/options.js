/**
 * Options page script for YouTube to Invidious extension
 */

const debugToggle = document.getElementById('debugToggle');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['debugEnabled'], (result) => {
  debugToggle.checked = result.debugEnabled !== false; // Default to true
});

// Save settings when toggle changes
debugToggle.addEventListener('change', () => {
  const debugEnabled = debugToggle.checked;

  chrome.storage.sync.set({ debugEnabled }, () => {
    // Show success message
    status.textContent = 'Settings saved!';
    status.className = 'status success show';

    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  });
});
