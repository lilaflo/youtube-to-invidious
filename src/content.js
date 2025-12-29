/**
 * Content script for YouTube to Invidious extension
 * Adds floating button to YouTube iframes for quick access to Invidious
 */

import {
  extractVideoId,
  isYouTubeUrl,
  buildInvidiousUrl,
  getPreferredInstance,
  checkInstanceHealth,
  fetchHealthyInstances,
  savePreferredInstance
} from './utils.js';

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

      /* Instance picker modal styles */
      .yt-inv-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .yt-inv-modal {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .yt-inv-modal h2 {
        margin: 0 0 12px 0;
        font-size: 20px;
        color: #333;
      }

      .yt-inv-modal p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 14px;
      }

      .yt-inv-instance-list {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 20px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .yt-inv-instance-item {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background 0.2s;
      }

      .yt-inv-instance-item:last-child {
        border-bottom: none;
      }

      .yt-inv-instance-item:hover {
        background: #f5f5f5;
      }

      .yt-inv-instance-item input[type="radio"] {
        margin-right: 12px;
        cursor: pointer;
      }

      .yt-inv-instance-name {
        font-weight: 500;
        color: #333;
      }

      .yt-inv-instance-region {
        color: #666;
        font-size: 13px;
      }

      .yt-inv-instance-health {
        margin-left: auto;
        color: #28a745;
        font-size: 13px;
      }

      .yt-inv-remember {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        font-size: 14px;
        color: #333;
        cursor: pointer;
      }

      .yt-inv-remember input {
        margin-right: 8px;
        cursor: pointer;
      }

      .yt-inv-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .yt-inv-modal-actions button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .yt-inv-btn-cancel {
        background: #f5f5f5;
        color: #333;
      }

      .yt-inv-btn-cancel:hover {
        background: #e0e0e0;
      }

      .yt-inv-btn-open {
        background: #ff0000;
        color: white;
      }

      .yt-inv-btn-open:hover {
        background: #cc0000;
      }
    `;
    document.head.appendChild(style);
  }

  button.title = 'Open on Invidious';

  // Add click handler
  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    const videoId = button.dataset.videoId;

    // Get preferred instance
    const preferredInstance = await getPreferredInstance();

    // Check health
    const isHealthy = await checkInstanceHealth(preferredInstance);

    if (isHealthy) {
      // Open immediately
      const url = buildInvidiousUrl(videoId, preferredInstance);
      window.open(url, '_blank');
    } else {
      // Show instance picker
      showInstancePickerModal(videoId, preferredInstance);
    }
  });

  wrapper.appendChild(button);
}

/**
 * Show instance picker modal
 * @param {string} videoId - YouTube video ID
 * @param {string} failedInstance - Instance that failed health check
 */
async function showInstancePickerModal(videoId, failedInstance) {
  // Fetch healthy instances
  const instances = await fetchHealthyInstances();

  if (instances.length === 0) {
    alert('No healthy Invidious instances available. Please try again later.');
    return;
  }

  // Create and show modal
  const modal = createInstancePickerUI(instances, videoId, failedInstance);
  document.body.appendChild(modal);

  // Focus first radio button for accessibility
  const firstRadio = modal.querySelector('input[type="radio"]');
  if (firstRadio) {
    firstRadio.focus();
  }
}

/**
 * Create instance picker modal UI
 * @param {Array} instances - Array of instance objects
 * @param {string} videoId - YouTube video ID
 * @param {string} failedInstance - Instance that failed
 * @returns {HTMLElement} - Modal element
 */
function createInstancePickerUI(instances, videoId, failedInstance) {
  const overlay = document.createElement('div');
  overlay.className = 'yt-inv-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'yt-inv-modal';

  // Header
  const title = document.createElement('h2');
  title.textContent = 'Select Invidious Instance';
  modal.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.textContent = `Your preferred instance (${failedInstance}) is currently unavailable. Please select an alternative:`;
  modal.appendChild(subtitle);

  // Instance list
  const listContainer = document.createElement('div');
  listContainer.className = 'yt-inv-instance-list';

  instances.forEach((instance, index) => {
    const label = document.createElement('label');
    label.className = 'yt-inv-instance-item';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'instance';
    radio.value = instance.url;
    if (index === 0) radio.checked = true; // Preselect first

    const name = document.createElement('span');
    name.className = 'yt-inv-instance-name';
    name.textContent = instance.name;

    const flag = document.createElement('span');
    flag.className = 'yt-inv-instance-region';
    flag.textContent = ' ' + instance.flag;

    const health = document.createElement('span');
    health.className = 'yt-inv-instance-health';
    health.textContent = instance.uptime ? ` ✓ ${instance.uptime}%` : ' ✓';

    label.appendChild(radio);
    label.appendChild(name);
    label.appendChild(flag);
    label.appendChild(health);

    listContainer.appendChild(label);
  });

  modal.appendChild(listContainer);

  // Remember checkbox
  const rememberLabel = document.createElement('label');
  rememberLabel.className = 'yt-inv-remember';
  const rememberCheckbox = document.createElement('input');
  rememberCheckbox.type = 'checkbox';
  rememberCheckbox.id = 'yt-inv-remember-checkbox';
  const rememberText = document.createElement('span');
  rememberText.textContent = ' Remember my choice';
  rememberLabel.appendChild(rememberCheckbox);
  rememberLabel.appendChild(rememberText);
  modal.appendChild(rememberLabel);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'yt-inv-modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'yt-inv-btn-cancel';
  cancelBtn.onclick = () => overlay.remove();

  const openBtn = document.createElement('button');
  openBtn.textContent = 'Open Video';
  openBtn.className = 'yt-inv-btn-open';
  openBtn.onclick = () => {
    const selected = modal.querySelector('input[name="instance"]:checked');
    const remember = rememberCheckbox.checked;
    if (selected) {
      handleInstanceSelection(selected.value, videoId, remember);
      overlay.remove();
    }
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(openBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);

  // Close on ESC key
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
    }
  });

  // Close on overlay click (not modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  return overlay;
}

/**
 * Handle instance selection from modal
 * @param {string} instanceUrl - Selected instance URL
 * @param {string} videoId - YouTube video ID
 * @param {boolean} remember - Whether to save preference
 */
async function handleInstanceSelection(instanceUrl, videoId, remember) {
  // Save preference if requested
  if (remember) {
    const instanceName = instanceUrl.replace('https://', '').replace('http://', '');
    await savePreferredInstance(instanceUrl, instanceName);
  }

  // Open video on selected instance
  const url = buildInvidiousUrl(videoId, instanceUrl);
  window.open(url, '_blank');
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
