/**
 * Content script for YouTube to Invidious extension
 * Adds floating button to YouTube iframes for quick access to Invidious
 */

const INVIDIOUS_INSTANCE = 'https://yewtu.be';

// Track processed iframes
let processedIframes = new Set();

// Debug logging state
let debugEnabled = true; // Default to true

// Debug logging function
function debug(...args) {
  if (debugEnabled) {
    console.debug(...args);
  }
}

// Load debug preference from storage
function loadDebugSetting() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['debugEnabled'], (result) => {
      debugEnabled = result.debugEnabled !== false; // Default to true
      resolve(debugEnabled);
    });
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.debugEnabled) {
    debugEnabled = changes.debugEnabled.newValue;
    console.log('[YT2INV] Debug logging changed to:', debugEnabled);
  }
});

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  debug('[YT2INV] Extracting video ID from URL:', url);
  try {
    const urlObj = new URL(url);

    // Format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      debug('[YT2INV] Found video ID from query param:', videoId);
      return videoId;
    }

    // Format: youtube.com/embed/VIDEO_ID
    const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      debug('[YT2INV] Found video ID from embed path:', embedMatch[1]);
      return embedMatch[1];
    }

    // Format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1).split('?')[0];
      debug('[YT2INV] Found video ID from youtu.be:', videoId);
      return videoId;
    }

    debug('[YT2INV] No video ID found in URL');
  } catch (e) {
    debug('[YT2INV] Error parsing URL:', e);
  }

  return null;
}

/**
 * Scan page for YouTube iframes
 */
function checkYouTubeIframes() {
  debug('[YT2INV] 🔍 Scanning page for YouTube iframes...');
  const iframes = document.querySelectorAll('iframe');
  debug('[YT2INV] Found', iframes.length, 'total iframes on page');

  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    debug(`[YT2INV] Iframe ${index + 1}:`, src || '(no src)');

    // Skip if already processed
    if (processedIframes.has(src)) {
      debug(`[YT2INV] Iframe ${index + 1} already processed, skipping`);
      return;
    }

    // Check if it's a YouTube iframe (including youtube-nocookie.com)
    if (src && (src.includes('youtube.com') || src.includes('youtube-nocookie.com') || src.includes('youtu.be'))) {
      debug(`[YT2INV] ✅ Found YouTube iframe!`);
      const videoId = extractVideoId(src);

      if (videoId) {
        debug(`[YT2INV] 🎥 YouTube iframe with video ID:`, videoId);
        processedIframes.add(src);

        // Add floating button to this iframe
        debug(`[YT2INV] Adding floating button to iframe`);
        createFloatingButton(iframe, videoId);
      } else {
        debug(`[YT2INV] ⚠️ YouTube iframe found but could not extract video ID`);
      }
    }
  });

  debug('[YT2INV] Finished scanning iframes');
}

/**
 * Create floating button positioned relative to iframe
 */
function createFloatingButton(iframe, videoId) {
  debug('[YT2INV] Creating floating button for iframe');

  // Create a wrapper container for positioning
  const wrapper = document.createElement('div');
  wrapper.className = 'yt-inv-iframe-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';

  // Wrap the iframe
  if (iframe.parentNode) {
    iframe.parentNode.insertBefore(wrapper, iframe);
    wrapper.appendChild(iframe);
  }

  // Create button
  const button = document.createElement('div');
  button.className = 'yt-inv-floating-btn';
  button.dataset.videoId = videoId;
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <path d="M64 24L44 44L56 44L56 84L44 84L64 104L84 84L72 84L72 44L84 44L64 24Z" fill="white"/>
      <circle cx="34" cy="64" r="6" fill="white"/>
      <circle cx="94" cy="64" r="6" fill="white"/>
    </svg>
  `;

  // Add styles if not already added
  if (!document.getElementById('yt-inv-floating-styles')) {
    const style = document.createElement('style');
    style.id = 'yt-inv-floating-styles';
    style.textContent = `
      .yt-inv-floating-btn {
        position: absolute;
        top: -36px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 48px;
        background: rgba(255, 0, 0, 0.95);
        border-radius: 0 0 24px 24px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 4px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        transition: all 0.3s ease;
      }

      .yt-inv-floating-btn:hover {
        top: 0;
        background: rgba(204, 0, 0, 1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
      }

      .yt-inv-floating-btn svg {
        width: 24px;
        height: 24px;
        margin-bottom: 2px;
      }

      .yt-inv-floating-btn::after {
        content: attr(title);
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        background: #1a1a1a;
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .yt-inv-floating-btn:hover::after {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  button.title = 'Open on Invidious';

  // Add click handler
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const videoId = button.dataset.videoId;
    debug('[YT2INV] Floating button clicked for video:', videoId);
    const invidiousUrl = `${INVIDIOUS_INSTANCE}/watch?v=${videoId}`;
    window.open(invidiousUrl, '_blank');
  });

  wrapper.appendChild(button);

  debug('[YT2INV] ✅ Floating button created for iframe');
}


/**
 * Initialize extension
 */
async function init() {
  // Load debug setting first
  await loadDebugSetting();

  debug('[YT2INV] ========================================');
  debug('[YT2INV] 🚀 YouTube to Invidious extension STARTED');
  debug('[YT2INV] 🌐 Current hostname:', window.location.hostname);
  debug('[YT2INV] 📍 Current URL:', window.location.href);
  debug('[YT2INV] 📄 Document ready state:', document.readyState);
  debug('[YT2INV] ========================================');

  // Scan for YouTube iframes
  if (document.readyState === 'loading') {
    debug('[YT2INV] Waiting for DOMContentLoaded before scanning iframes...');
    document.addEventListener('DOMContentLoaded', () => {
      debug('[YT2INV] DOMContentLoaded fired, scanning for iframes');
      checkYouTubeIframes();
    });
  } else {
    debug('[YT2INV] DOM already loaded, scanning for iframes now');
    checkYouTubeIframes();
  }

  // Watch for dynamically added iframes
  debug('[YT2INV] Setting up MutationObserver for dynamic iframes');
  const observer = new MutationObserver(() => {
    debug('[YT2INV] 🔄 DOM mutation detected, re-scanning for iframes');
    checkYouTubeIframes();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

init();
