/**
 * Content script for YouTube to Invidious extension
 * Adds floating button to YouTube iframes for quick access to Invidious
 */

import { extractVideoId, isYouTubeUrl, buildInvidiousUrl } from './utils.js';

const INVIDIOUS_INSTANCE = 'https://yewtu.be';

// Track processed iframes
let processedIframes = new Set();

/**
 * Scan page for YouTube iframes
 */
function checkYouTubeIframes() {
  const iframes = document.querySelectorAll('iframe');

  iframes.forEach((iframe) => {
    const src = iframe.src;

    // Skip if already processed
    if (processedIframes.has(src)) {
      return;
    }

    // Check if it's a YouTube iframe (including youtube-nocookie.com)
    if (isYouTubeUrl(src)) {
      const videoId = extractVideoId(src);

      if (videoId) {
        processedIframes.add(src);
        createFloatingButton(iframe, videoId);
      }
    }
  });
}

/**
 * Create floating button positioned relative to iframe
 */
function createFloatingButton(iframe, videoId) {
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
    const invidiousUrl = buildInvidiousUrl(videoId, INVIDIOUS_INSTANCE);
    window.open(invidiousUrl, '_blank');
  });

  wrapper.appendChild(button);
}


/**
 * Initialize extension
 */
function init() {
  // Scan for YouTube iframes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkYouTubeIframes();
    });
  } else {
    checkYouTubeIframes();
  }

  // Watch for dynamically added iframes
  const observer = new MutationObserver(() => {
    checkYouTubeIframes();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

init();
