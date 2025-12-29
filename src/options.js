/**
 * Options page script for YouTube to Invidious extension
 */

const debugToggle = document.getElementById('debugToggle');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['debugEnabled'], (result) => {
  console.log('Loaded settings:', result);
  debugToggle.checked = result.debugEnabled !== false; // Default to true
  console.log('Debug toggle set to:', debugToggle.checked);
});

// Save settings when toggle changes
debugToggle.addEventListener('change', () => {
  const debugEnabled = debugToggle.checked;
  console.log('Saving debug setting:', debugEnabled);

  chrome.storage.sync.set({ debugEnabled }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      status.textContent = 'Error saving settings!';
      status.className = 'status error show';
    } else {
      console.log('Settings saved successfully');
      // Show success message
      status.textContent = 'Settings saved!';
      status.className = 'status success show';
    }

    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  });
});
