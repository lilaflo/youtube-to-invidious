/**
 * Background script for YouTube to Invidious extension
 * Handles extension icon clicks and injects content script on-demand
 */

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject content script into the active tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content.js']
    });

    console.debug('[YT2INV] Content script injected into tab:', tab.id);
  } catch (error) {
    console.error('[YT2INV] Failed to inject content script:', error);
  }
});
