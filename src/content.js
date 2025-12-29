/**
 * Content script for YouTube to Invidious extension
 * Detects bot protection on YouTube and embedded videos
 */

const INVIDIOUS_INSTANCE = 'https://yewtu.be';
const BOT_ERROR_TEXTS = [
  "Sign in to confirm you're not a bot",
  "confirm you're not a bot",
  "confirm that you're not a bot"
];

// Track processed iframes and detected videos
let processedIframes = new Set();
let detectedVideos = new Map(); // Map of videoId -> iframe element
let floatingButton = null;
const isYouTubePage = window.location.hostname.includes('youtube.com');

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  console.debug('[YT2INV] Extracting video ID from URL:', url);
  try {
    const urlObj = new URL(url);

    // Format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      console.debug('[YT2INV] Found video ID from query param:', videoId);
      return videoId;
    }

    // Format: youtube.com/embed/VIDEO_ID
    const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      console.debug('[YT2INV] Found video ID from embed path:', embedMatch[1]);
      return embedMatch[1];
    }

    // Format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1).split('?')[0];
      console.debug('[YT2INV] Found video ID from youtu.be:', videoId);
      return videoId;
    }

    console.debug('[YT2INV] No video ID found in URL');
  } catch (e) {
    console.debug('[YT2INV] Error parsing URL:', e);
  }

  return null;
}

/**
 * Check if the YouTube bot error is present on the page
 */
function checkForBotError() {
  console.debug('[YT2INV] Checking for bot error in page text...');
  const bodyText = document.body.innerText;
  console.debug('[YT2INV] Page text length:', bodyText.length);

  for (const errorText of BOT_ERROR_TEXTS) {
    if (bodyText.includes(errorText)) {
      console.debug('[YT2INV] ✅ Bot error detected! Found text:', errorText);
      return true;
    }
  }

  console.debug('[YT2INV] No bot error text found');
  return false;
}

/**
 * Check YouTube iframes for potential blocking
 */
function checkYouTubeIframes() {
  console.debug('[YT2INV] 🔍 Scanning page for YouTube iframes...');
  const iframes = document.querySelectorAll('iframe');
  console.debug('[YT2INV] Found', iframes.length, 'total iframes on page');

  iframes.forEach((iframe, index) => {
    const src = iframe.src;
    console.debug(`[YT2INV] Iframe ${index + 1}:`, src || '(no src)');

    // Skip if already processed
    if (processedIframes.has(src)) {
      console.debug(`[YT2INV] Iframe ${index + 1} already processed, skipping`);
      return;
    }

    // Check if it's a YouTube iframe (including youtube-nocookie.com)
    if (src && (src.includes('youtube.com') || src.includes('youtube-nocookie.com') || src.includes('youtu.be'))) {
      console.debug(`[YT2INV] ✅ Found YouTube iframe!`);
      const videoId = extractVideoId(src);

      if (videoId) {
        console.debug(`[YT2INV] 🎥 YouTube iframe with video ID:`, videoId);
        processedIframes.add(src);
        detectedVideos.set(videoId, iframe);

        // Add floating button to this iframe
        console.debug(`[YT2INV] Adding floating button to iframe`);
        createFloatingButton(iframe, videoId);
      } else {
        console.debug(`[YT2INV] ⚠️ YouTube iframe found but could not extract video ID`);
      }
    }
  });

  console.debug('[YT2INV] Finished scanning iframes');
}

/**
 * Create floating button positioned relative to iframe
 */
function createFloatingButton(iframe, videoId) {
  console.debug('[YT2INV] Creating floating button for iframe');

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
    console.debug('[YT2INV] Floating button clicked for video:', videoId);
    const invidiousUrl = `${INVIDIOUS_INSTANCE}/watch?v=${videoId}`;
    window.open(invidiousUrl, '_blank');
  });

  wrapper.appendChild(button);

  console.debug('[YT2INV] ✅ Floating button created for iframe');
}


/**
 * Show a simple redirect popup for YouTube pages
 */
function showYouTubeRedirectPopup(videoId) {
  console.debug('[YT2INV] Showing redirect popup for YouTube.com');

  const invidiousUrl = `${INVIDIOUS_INSTANCE}/watch?v=${videoId}`;

  const popup = document.createElement('div');
  popup.id = 'yt-inv-popup';
  popup.innerHTML = `
    <div class="yt-inv-content">
      <h3>YouTube is blocked 🚫</h3>
      <p>This video is blocked by YouTube's bot protection.</p>
      <p>Would you like to watch it on Invidious instead?</p>
      <div class="yt-inv-buttons">
        <button id="yt-inv-switch" class="yt-inv-btn yt-inv-btn-primary">
          Switch to Invidious
        </button>
        <button id="yt-inv-close" class="yt-inv-btn yt-inv-btn-secondary">
          Close
        </button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'yt-inv-popup-styles';
  style.textContent = `
    #yt-inv-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      color: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 400px;
    }

    #yt-inv-popup h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
    }

    #yt-inv-popup p {
      margin: 0 0 12px 0;
      line-height: 1.5;
      color: #ccc;
      font-size: 14px;
    }

    .yt-inv-buttons {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .yt-inv-btn {
      flex: 1;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .yt-inv-btn-primary {
      background: #ff0000;
      color: white;
    }

    .yt-inv-btn-primary:hover {
      background: #cc0000;
    }

    .yt-inv-btn-secondary {
      background: #333;
      color: #fff;
    }

    .yt-inv-btn-secondary:hover {
      background: #444;
    }
  `;

  if (!document.getElementById('yt-inv-popup-styles')) {
    document.head.appendChild(style);
  }

  document.body.appendChild(popup);

  document.getElementById('yt-inv-switch').addEventListener('click', () => {
    window.location.href = invidiousUrl;
  });

  document.getElementById('yt-inv-close').addEventListener('click', () => {
    popup.remove();
  });

  console.debug('[YT2INV] YouTube redirect popup shown');
}

/**
 * Main detection logic for YouTube pages
 */
function detectOnYouTubePage() {
  if (checkForBotError()) {
    const videoId = extractVideoId(window.location.href);
    if (videoId) {
      setTimeout(() => showYouTubeRedirectPopup(videoId), 500);
    }
  }
}

/**
 * Initialize extension
 */
function init() {
  console.debug('[YT2INV] ========================================');
  console.debug('[YT2INV] 🚀 YouTube to Invidious extension STARTED');
  console.debug('[YT2INV] 🌐 Current hostname:', window.location.hostname);
  console.debug('[YT2INV] 📍 Current URL:', window.location.href);
  console.debug('[YT2INV] 📄 Document ready state:', document.readyState);
  console.debug('[YT2INV] ❓ Is YouTube page?', isYouTubePage);
  console.debug('[YT2INV] ========================================');

  if (isYouTubePage) {
    console.debug('[YT2INV] Mode: YouTube.com direct page');
    // On YouTube pages, check for bot errors
    if (document.readyState === 'loading') {
      console.debug('[YT2INV] Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', detectOnYouTubePage);
    } else {
      console.debug('[YT2INV] DOM already loaded, running detection now');
      detectOnYouTubePage();
    }

    // Watch for SPA navigation
    console.debug('[YT2INV] Setting up MutationObserver for SPA navigation');
    let popupShown = false;
    const observer = new MutationObserver(() => {
      if (!popupShown && checkForBotError()) {
        const videoId = extractVideoId(window.location.href);
        if (videoId) {
          showYouTubeRedirectPopup(videoId);
          popupShown = true;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    console.debug('[YT2INV] Mode: Third-party page (scanning for YouTube iframes)');
    // On other pages, check for YouTube iframes
    if (document.readyState === 'loading') {
      console.debug('[YT2INV] Waiting for DOMContentLoaded before scanning iframes...');
      document.addEventListener('DOMContentLoaded', () => {
        console.debug('[YT2INV] DOMContentLoaded fired, scanning for iframes');
        checkYouTubeIframes();
      });
    } else {
      console.debug('[YT2INV] DOM already loaded, scanning for iframes now');
      checkYouTubeIframes();
    }

    // Watch for dynamically added iframes
    console.debug('[YT2INV] Setting up MutationObserver for dynamic iframes');
    const observer = new MutationObserver((mutations) => {
      console.debug('[YT2INV] 🔄 DOM mutation detected, re-scanning for iframes');
      checkYouTubeIframes();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

init();
