import { describe, it, expect } from 'vitest';
import { extractVideoId, isYouTubeUrl, buildInvidiousUrl } from '../src/utils.js';

describe('extractVideoId', () => {
  it('should extract video ID from youtube.com/watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from youtube.com/embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from youtu.be URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from youtube-nocookie.com/embed URL', () => {
    const url = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should handle video IDs with hyphens and underscores', () => {
    const url = 'https://www.youtube.com/watch?v=abc-123_XYZ';
    expect(extractVideoId(url)).toBe('abc-123_XYZ');
  });

  it('should handle youtu.be URLs with query parameters', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ?t=42';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid URL', () => {
    const url = 'not a valid url';
    expect(extractVideoId(url)).toBeNull();
  });

  it('should return null for non-YouTube URL', () => {
    const url = 'https://example.com/video';
    expect(extractVideoId(url)).toBeNull();
  });

  it('should return null for YouTube URL without video ID', () => {
    const url = 'https://www.youtube.com';
    expect(extractVideoId(url)).toBeNull();
  });
});

describe('isYouTubeUrl', () => {
  it('should return true for youtube.com URL', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for youtube-nocookie.com URL', () => {
    expect(isYouTubeUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for youtu.be URL', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return false for non-YouTube URL', () => {
    expect(isYouTubeUrl('https://example.com')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isYouTubeUrl(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isYouTubeUrl(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isYouTubeUrl('')).toBe(false);
  });
});

describe('buildInvidiousUrl', () => {
  it('should build Invidious URL with default instance', () => {
    const url = buildInvidiousUrl('dQw4w9WgXcQ');
    expect(url).toBe('https://yewtu.be/watch?v=dQw4w9WgXcQ');
  });

  it('should build Invidious URL with custom instance', () => {
    const url = buildInvidiousUrl('dQw4w9WgXcQ', 'https://invidious.example.com');
    expect(url).toBe('https://invidious.example.com/watch?v=dQw4w9WgXcQ');
  });

  it('should handle video IDs with special characters', () => {
    const url = buildInvidiousUrl('abc-123_XYZ');
    expect(url).toBe('https://yewtu.be/watch?v=abc-123_XYZ');
  });
});
