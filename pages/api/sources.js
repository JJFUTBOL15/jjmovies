// pages/api/sources.js
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

function decodeEmbed69(token) {
  try {
    // Normalizar Base64URL
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    // Añadir padding si es necesario
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) base64 = base64.slice(0, -1);
      else base64 += '='.repeat(4 - pad);
    }
    const decoded = atob(base64);
    const json = JSON.parse(decoded);
    return json.url || json.source || json.hls || null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const { id, season, episode } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro "id"' });
  }

  const sources = [];

  try {
    // === 1. Embed69 (soporta TMDB ID directamente) ===
    const embed69Url = `https://embed69.com/tmdb/${id}`;
    let html = '';

    try {
      const response = await axios.get(embed69Url, {
        headers: HEADERS,
        timeout: 6000,
        maxRedirects: 3
      });
      html = response.data;
    } catch (err) {
      console.warn(`Embed69 no respondió para ID: ${id}`);
    }

    if (html) {
      const match = html.match(/let dataLink\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        const token = match[1];
        const url = decodeEmbed69(token);
        if (url && typeof url === 'string' && url.startsWith('http')) {
          sources.push({ name: 'Embed69', url, type: 'hls' });
        }
      }
    }

    // === 2. FlixHQ – solo redirección (no se puede embeddar) ===
    if (season && episode) {
      sources.push({
        name: 'FlixHQ (Serie)',
        url: `https://flixhq.to/tv/${id}-${season}-${episode}`,
        type: 'external'
      });
    } else {
      sources.push({
        name: 'FlixHQ (Película)',
        url: `https://flixhq.to/movie/${id}`,
        type: 'external'
      });
    }

    // === 3. VidSrc.to – ¡opción segura y embebible! ===
    if (season && episode) {
      sources.push({
        name: 'VidSrc (Serie)',
        url: `https://vidsrc.to/embed/tv/${id}-${season}-${episode}`,
        type: 'iframe'
      });
    } else {
      sources.push({
        name: 'VidSrc (Película)',
        url: `https://vidsrc.to/embed/movie/${id}`,
        type: 'iframe'
      });
    }

  } catch (err) {
    console.error('Error en el scraper:', err.message);
  }

  // Si no hay fuentes, devolvemos al menos VidSrc (siempre funciona)
  if (sources.length === 0) {
    if (season && episode) {
      sources.push({
        name: 'VidSrc (Respaldo)',
        url: `https://vidsrc.to/embed/tv/${id}-${season}-${episode}`,
        type: 'iframe'
      });
    } else {
      sources.push({
        name: 'VidSrc (Respaldo)',
        url: `https://vidsrc.to/embed/movie/${id}`,
        type: 'iframe'
      });
    }
  }

  res.status(200).json({ sources });
}
