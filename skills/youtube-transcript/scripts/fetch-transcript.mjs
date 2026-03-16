#!/usr/bin/env node
/**
 * fetch-transcript.mjs — YouTube 자막 추출기
 *
 * Usage:
 *   node scripts/fetch-transcript.mjs --video <videoId|url> [options]
 *
 * Options:
 *   --video   VIDEO_ID or URL (required)
 *   --lang    Language code: ko, en, ja, zh, ... (default: ko)
 *   --auto    Prefer auto-generated captions (default: false)
 *   --max     Max characters to return (default: 20000)
 *   --help    Show this help
 *
 * Exit codes:
 *   0  Success — JSON to stdout
 *   1  No captions available
 *   2  Invalid arguments
 *   3  Network error
 *
 * Output (stdout, JSON):
 *   { videoId, lang, isAuto, truncated, text }
 *
 * Diagnostics go to stderr.
 */

const TIMEOUT_MS = 15000;
const DEFAULT_MAX = 20000;

// ── CLI parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/fetch-transcript.mjs --video <videoId|url> [options]

Fetch a YouTube video transcript and print JSON to stdout.

Options:
  --video VIDEO   YouTube video ID (11 chars) or full URL  [required]
  --lang  LANG    Preferred caption language code (default: ko)
  --auto          Prefer auto-generated captions over manual ones
  --max   N       Maximum characters to return (default: ${DEFAULT_MAX})
  --help          Show this help

Exit codes:
  0  Success
  1  No captions available for this video
  2  Invalid arguments
  3  Network or fetch error

Examples:
  node scripts/fetch-transcript.mjs --video dQw4w9WgXcQ
  node scripts/fetch-transcript.mjs --video https://youtu.be/dQw4w9WgXcQ --lang en
  node scripts/fetch-transcript.mjs --video dQw4w9WgXcQ --lang ko --auto --max 5000`);
  process.exit(0);
}

function getFlag(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
}

const rawVideo = getFlag('--video');
const lang = getFlag('--lang') || 'ko';
const preferAuto = args.includes('--auto');
const maxLength = parseInt(getFlag('--max') || String(DEFAULT_MAX), 10);

if (!rawVideo) {
  console.error('Error: --video is required. Options: YouTube video ID or URL.');
  console.error('Usage: node scripts/fetch-transcript.mjs --video <videoId|url> [--lang ko] [--auto] [--max 20000]');
  process.exit(2);
}

if (isNaN(maxLength) || maxLength <= 0) {
  console.error(`Error: --max must be a positive integer. Received: "${getFlag('--max')}"`);
  process.exit(2);
}

// ── Video ID extraction ───────────────────────────────────────────────────────

function extractVideoId(input) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (host.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const candidate = ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : undefined;
      if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
    }
  } catch {}
  return undefined;
}

const videoId = extractVideoId(rawVideo);
if (!videoId) {
  console.error(`Error: Could not extract a valid YouTube video ID from: "${rawVideo}"`);
  console.error('Expected: 11-character video ID or a YouTube URL (watch, shorts, embed, youtu.be).');
  process.exit(2);
}

// ── Network helpers ───────────────────────────────────────────────────────────

async function fetchText(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: init?.method || 'GET',
      body: init?.body,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Entity decoding ───────────────────────────────────────────────────────────

function decodeEntities(v) {
  return v
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
}

// ── Track normalization ───────────────────────────────────────────────────────

function normalizeTracks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(t => ({ lang_code: t.languageCode, name: t.name?.simpleText, kind: t.kind, baseUrl: t.baseUrl }))
    .filter(t => t.lang_code && t.baseUrl);
}

// ── Track selection ───────────────────────────────────────────────────────────

function selectTrack(tracks, lang, preferAuto) {
  let candidates = lang ? tracks.filter(t => t.lang_code === lang) : [];
  if (candidates.length === 0 && lang?.includes('-')) {
    candidates = tracks.filter(t => t.lang_code === lang.split('-')[0]);
  }
  if (candidates.length === 0) candidates = tracks;
  const manual = candidates.filter(t => t.kind !== 'asr');
  const auto = candidates.filter(t => t.kind === 'asr');
  return preferAuto ? (auto[0] || manual[0]) : (manual[0] || auto[0]);
}

// ── Fetch strategies ──────────────────────────────────────────────────────────

async function fetchTracksFromTimedTextApi(videoId) {
  const xml = await fetchText(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`);
  const tracks = [];
  const re = /<track\b([^>]*?)\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = {};
    const ar = /(\w+)="([^"]*)"/g;
    let am;
    while ((am = ar.exec(m[1] || '')) !== null) attrs[am[1]] = decodeEntities(am[2] || '');
    if (attrs.lang_code) tracks.push({ lang_code: attrs.lang_code, name: attrs.name, kind: attrs.kind });
  }
  return tracks;
}

async function fetchWatchPage(videoId) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const version = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];

  const idx = html.indexOf('ytInitialPlayerResponse');
  if (idx !== -1) {
    const braceStart = html.indexOf('{', idx);
    if (braceStart !== -1) {
      let depth = 0;
      for (let i = braceStart; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}') depth--;
        if (depth === 0) {
          try {
            const pr = JSON.parse(html.slice(braceStart, i + 1));
            const tracks = normalizeTracks(pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
            return { tracks, apiKey, version };
          } catch { break; }
        }
      }
    }
  }
  return { tracks: [], apiKey, version };
}

async function fetchTracksFromYoutubei(videoId, apiKey, version) {
  const clients = [
    { name: 'ANDROID', id: '3', ver: '20.10.38',  ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip' },
    { name: 'IOS',     id: '5', ver: '20.10.4',   ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)' },
    { name: 'WEB',     id: '1', ver: version || '2.20260213.01.00', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  ];
  for (const c of clients) {
    try {
      const res = await fetchText(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.youtube.com',
          'X-Youtube-Client-Name': c.id,
          'X-Youtube-Client-Version': c.ver,
          'User-Agent': c.ua,
        },
        body: JSON.stringify({
          context: { client: { clientName: c.name, clientVersion: c.ver, hl: 'en', gl: 'US' } },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });
      const tracks = normalizeTracks(JSON.parse(res)?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
      if (tracks.length > 0) {
        console.error(`[fetch-transcript] YouTubei success — client: ${c.name}, tracks: ${tracks.length}`);
        return tracks;
      }
    } catch (e) {
      console.error(`[fetch-transcript] YouTubei failed — client: ${c.name}, error: ${e.message}`);
    }
  }
  return [];
}

// ── Transcript parsing ────────────────────────────────────────────────────────

function parseJson3(payload) {
  try {
    const data = JSON.parse(payload);
    const parts = [];
    for (const event of (data?.events || [])) {
      for (const seg of (event?.segs || [])) {
        const t = typeof seg?.utf8 === 'string' ? seg.utf8 : '';
        if (t.trim()) parts.push(t);
      }
    }
    return parts.length > 0 ? parts.join(' ') : null;
  } catch { return null; }
}

function parseTimedTextXml(payload) {
  if (!payload?.trim().startsWith('<')) return '';
  const parts = [];
  const re = /<text\b[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(payload)) !== null) {
    const v = decodeEntities(m[1] || '').replace(/\s+/g, ' ').trim();
    if (v) parts.push(v);
  }
  return parts.join(' ');
}

async function fetchTranscriptText(videoId, track) {
  const baseUrl = track.baseUrl ?? (() => {
    const p = new URLSearchParams({ v: videoId, lang: track.lang_code });
    if (track.kind === 'asr') p.set('kind', 'asr');
    if (track.name) p.set('name', track.name);
    return `https://www.youtube.com/api/timedtext?${p}`;
  })();

  const jsonUrl = baseUrl.includes('?') ? `${baseUrl}&fmt=json3` : `${baseUrl}?fmt=json3`;
  const jsonText = await fetchText(jsonUrl).catch(() => '');
  const fromJson = parseJson3(jsonText);
  if (fromJson) return fromJson;

  const xmlText = jsonText || await fetchText(baseUrl).catch(() => '');
  return parseTimedTextXml(xmlText);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.error(`[fetch-transcript] videoId=${videoId} lang=${lang} preferAuto=${preferAuto} max=${maxLength}`);

  let tracks = [];

  // Strategy 1: timedtext list API
  try {
    tracks = await fetchTracksFromTimedTextApi(videoId);
    console.error(`[fetch-transcript] timedtext API — tracks: ${tracks.length}`);
  } catch (e) {
    console.error(`[fetch-transcript] timedtext API failed — ${e.message}`);
  }

  // Strategy 2: watch page player response
  let apiKey, version;
  if (tracks.length === 0) {
    try {
      const page = await fetchWatchPage(videoId);
      tracks = page.tracks;
      apiKey = page.apiKey;
      version = page.version;
      console.error(`[fetch-transcript] watch page — tracks: ${tracks.length}`);
    } catch (e) {
      console.error(`[fetch-transcript] watch page failed — ${e.message}`);
    }
  }

  // Strategy 3: YouTubei internal API
  if (tracks.length === 0 && apiKey) {
    try {
      tracks = await fetchTracksFromYoutubei(videoId, apiKey, version);
    } catch (e) {
      console.error(`[fetch-transcript] YouTubei all clients failed — ${e.message}`);
    }
  }

  if (tracks.length === 0) {
    console.error(`Error: No captions available for video "${videoId}".`);
    console.error('The video may have no subtitles, be private, or region-restricted.');
    process.exit(1);
  }

  const track = selectTrack(tracks, lang, preferAuto);
  if (!track) {
    console.error(`Error: No captions track found for lang="${lang}".`);
    console.error(`Available tracks: ${tracks.map(t => `${t.lang_code}${t.kind === 'asr' ? '(auto)' : ''}`).join(', ')}`);
    process.exit(1);
  }

  console.error(`[fetch-transcript] selected track — lang: ${track.lang_code}, kind: ${track.kind || 'manual'}`);

  let text;
  try {
    text = await fetchTranscriptText(videoId, track);
  } catch (e) {
    console.error(`Error: Network error while fetching transcript — ${e.message}`);
    process.exit(3);
  }

  if (!text) {
    console.error(`Error: Transcript data was empty for video "${videoId}".`);
    process.exit(1);
  }

  const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  const truncated = text.replace(/\s+/g, ' ').trim().length > maxLength;

  // Structured JSON to stdout
  console.log(JSON.stringify({
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    lang: track.lang_code,
    isAuto: track.kind === 'asr',
    truncated,
    charCount: trimmed.length,
    text: trimmed,
  }));
}

main().catch(e => {
  console.error(`Error: Unexpected error — ${e.message}`);
  process.exit(3);
});
