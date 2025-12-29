/**
 * Options page script for YouTube to Invidious extension
 */

const debugToggle = document.getElementById('debugToggle');
const instanceSelect = document.getElementById('instanceSelect');
const testConnectionBtn = document.getElementById('testConnection');
const instanceStatus = document.getElementById('instanceStatus');
const status = document.getElementById('status');

// Utility functions from utils.js (copied for options page)
async function fetchHealthyInstances() {
  const CACHE_TTL = 15 * 60 * 1000;

  try {
    const cached = await chrome.storage.local.get(['instancesCache', 'instancesCacheTimestamp']);
    if (cached.instancesCache && cached.instancesCacheTimestamp) {
      const age = Date.now() - cached.instancesCacheTimestamp;
      if (age < CACHE_TTL) {
        return cached.instancesCache;
      }
    }

    const response = await fetch('https://api.invidious.io/instances.json');
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const healthy = data
      .filter(([, info]) => {
        return (
          info?.type === 'https' &&
          info?.monitor &&
          info.monitor.down === false &&
          info.monitor.uptime > 80
        );
      })
      .map(([domain, info]) => ({
        url: info.uri,
        name: domain,
        flag: info.flag || '🌍',
        uptime: Math.round(info.monitor.uptime)
      }))
      .sort((a, b) => b.uptime - a.uptime)
      .slice(0, 20);

    await chrome.storage.local.set({
      instancesCache: healthy,
      instancesCacheTimestamp: Date.now()
    });

    return healthy;
  } catch (error) {
    console.debug('[YT2INV] Error fetching instances:', error);
    return [
      { url: 'https://yewtu.be', name: 'yewtu.be', region: 'US' },
      { url: 'https://inv.nadeko.net', name: 'inv.nadeko.net', region: 'GB' },
      { url: 'https://invidious.fdn.fr', name: 'invidious.fdn.fr', region: 'FR' },
      { url: 'https://invidious.privacydev.net', name: 'invidious.privacydev.net', region: 'US' },
      { url: 'https://vid.puffyan.us', name: 'vid.puffyan.us', region: 'US' }
    ];
  }
}

async function checkInstanceHealth(instanceUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${instanceUrl}/api/v1/stats`, {
      signal: controller.signal,
      method: 'HEAD'
    });
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Load instances and populate select
async function loadInstances() {
  const instances = await fetchHealthyInstances();
  instanceSelect.innerHTML = '';

  instances.forEach(instance => {
    const option = document.createElement('option');
    option.value = instance.url;
    option.textContent = `${instance.name}  ${instance.flag}`;
    instanceSelect.appendChild(option);
  });

  // Load saved preference
  const result = await chrome.storage.sync.get(['preferredInstance']);
  if (result.preferredInstance) {
    instanceSelect.value = result.preferredInstance;
  }
}

// Load saved settings
chrome.storage.sync.get(['debugEnabled'], (result) => {
  console.debug('Loaded settings:', result);
  debugToggle.checked = result.debugEnabled !== false;
  console.debug('Debug toggle set to:', debugToggle.checked);
});

// Load instances on page load
loadInstances();

// Save instance preference when changed
instanceSelect.addEventListener('change', async () => {
  const selectedUrl = instanceSelect.value;
  const selectedName = instanceSelect.options[instanceSelect.selectedIndex].text.split(' (')[0];

  await chrome.storage.sync.set({
    preferredInstance: selectedUrl,
    preferredInstanceName: selectedName
  });

  status.textContent = 'Instance preference saved!';
  status.className = 'status success show';
  setTimeout(() => status.classList.remove('show'), 2000);
});

// Test connection button
testConnectionBtn.addEventListener('click', async () => {
  const selectedUrl = instanceSelect.value;
  if (!selectedUrl) return;

  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = 'Testing...';
  instanceStatus.textContent = '';

  const isHealthy = await checkInstanceHealth(selectedUrl);

  testConnectionBtn.disabled = false;
  testConnectionBtn.textContent = 'Test Connection';

  if (isHealthy) {
    instanceStatus.textContent = '✓ Connection successful';
    instanceStatus.style.color = '#28a745';
  } else {
    instanceStatus.textContent = '✗ Connection failed';
    instanceStatus.style.color = '#dc3545';
  }

  setTimeout(() => {
    instanceStatus.textContent = '';
  }, 3000);
});

// Save settings when toggle changes
debugToggle.addEventListener('change', () => {
  const debugEnabled = debugToggle.checked;
  console.debug('Saving debug setting:', debugEnabled);

  chrome.storage.sync.set({ debugEnabled }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      status.textContent = 'Error saving settings!';
      status.className = 'status error show';
    } else {
      console.debug('Settings saved successfully');
      status.textContent = 'Settings saved!';
      status.className = 'status success show';
    }

    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  });
});
