/**
 * Utility functions for YouTube to Invidious extension
 */

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export function extractVideoId(url) {
  try {
    const urlObj = new URL(url);

    // Format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }

    // Format: youtube.com/embed/VIDEO_ID
    const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    // Format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
  } catch (e) {
    // Invalid URL
    return null;
  }

  return null;
}

/**
 * Check if URL is a YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export function isYouTubeUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com') ||
         url.includes('youtube-nocookie.com') ||
         url.includes('youtu.be');
}

/**
 * Build Invidious URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} instance - Invidious instance URL
 * @returns {string} - Invidious URL
 */
export function buildInvidiousUrl(videoId, instance = 'https://yewtu.be') {
  return `${instance}/watch?v=${videoId}`;
}

/**
 * Get hardcoded fallback Invidious instances
 * Used when API is unavailable
 * @returns {Array} - Array of fallback instance objects
 */
export function getFallbackInstances() {
  return [
    { url: 'https://yewtu.be', name: 'yewtu.be', region: 'US' },
    { url: 'https://inv.nadeko.net', name: 'inv.nadeko.net', region: 'GB' },
    { url: 'https://invidious.fdn.fr', name: 'invidious.fdn.fr', region: 'FR' },
    { url: 'https://invidious.privacydev.net', name: 'invidious.privacydev.net', region: 'US' },
    { url: 'https://vid.puffyan.us', name: 'vid.puffyan.us', region: 'US' }
  ];
}

/**
 * Get user's preferred Invidious instance from storage
 * @returns {Promise<string>} - Preferred instance URL
 */
export async function getPreferredInstance() {
  try {
    const result = await chrome.storage.sync.get(['preferredInstance']);
    return result.preferredInstance || 'https://yewtu.be';
  } catch (error) {
    console.debug('[YT2INV] Error loading preferred instance:', error);
    return 'https://yewtu.be';
  }
}

/**
 * Save user's preferred Invidious instance to storage
 * @param {string} url - Instance URL
 * @param {string} name - Instance name/domain
 * @returns {Promise<void>}
 */
export async function savePreferredInstance(url, name) {
  try {
    await chrome.storage.sync.set({
      preferredInstance: url,
      preferredInstanceName: name
    });
    console.debug('[YT2INV] Saved preferred instance:', url);
  } catch (error) {
    console.debug('[YT2INV] Error saving preferred instance:', error);
  }
}

/**
 * Check if an Invidious instance is healthy
 * @param {string} instanceUrl - Instance URL to check
 * @returns {Promise<boolean>} - True if healthy
 */
export async function checkInstanceHealth(instanceUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${instanceUrl}/api/v1/stats`, {
      signal: controller.signal,
      method: 'HEAD' // Only check if endpoint responds
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.debug('[YT2INV] Health check failed for', instanceUrl, error);
    return false;
  }
}

/**
 * Fetch healthy Invidious instances from API with caching
 * @returns {Promise<Array>} - Array of healthy instance objects
 */
export async function fetchHealthyInstances() {
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  try {
    // Check cache first
    const cached = await chrome.storage.local.get(['instancesCache', 'instancesCacheTimestamp']);

    if (cached.instancesCache && cached.instancesCacheTimestamp) {
      const age = Date.now() - cached.instancesCacheTimestamp;
      if (age < CACHE_TTL) {
        console.debug('[YT2INV] Using cached instances, age:', Math.round(age / 1000), 'seconds');
        return cached.instancesCache;
      }
    }

    // Fetch from API
    console.debug('[YT2INV] Fetching instances from API');
    const response = await fetch('https://api.invidious.io/instances.json');

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Filter healthy instances - API structure is [domain, info]
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
      .sort((a, b) => b.uptime - a.uptime) // Sort by uptime descending
      .slice(0, 20); // Limit to top 20 instances

    // Cache the results
    await chrome.storage.local.set({
      instancesCache: healthy,
      instancesCacheTimestamp: Date.now()
    });

    console.debug('[YT2INV] Fetched and cached', healthy.length, 'healthy instances');
    return healthy;
  } catch (error) {
    console.debug('[YT2INV] Error fetching instances, using fallback:', error);
    return getFallbackInstances();
  }
}
