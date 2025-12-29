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
