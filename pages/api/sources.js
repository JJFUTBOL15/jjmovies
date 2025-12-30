// pages/api/sources.js
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

function decodeEmbed69(token) {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const obj = JSON.parse(jsonStr);
    return obj.url || obj.source || null;
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
    // 🔍 Intentar Embed69
    const embed69Url = `https://embed69.com/tmdb/${id}`;
    let html = '';
    try {
      const response = await axios.get(embed69Url, { headers: HEADERS, timeout: 5000 });
      html = response.data;
    } catch (e) {
      console.warn('Embed69 no respondió');
    }

    if (html) {
      const match = html.match(/let dataLink\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        const url = decodeEmbed69(match[1]);
        if (url && url.startsWith('http')) {
          sources.push({ name: 'Embed69', url, type: 'hls' });
        }
      }
    }

    // 🌐 FlixHQ (solo redirección)
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

  } catch (err) {
    console.error('Error en API:', err.message);
  }

  res.status(200).json({ sources });
}
