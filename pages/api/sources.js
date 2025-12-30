// pages/api/sources.js
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

export default async function handler(req, res) {
  const { id, season, episode } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro "id"' });
  }

  const sources = [];

  try {
    // ✅ 1. Embed69 (soporta TMDB ID directamente)
    try {
      const html = await axios.get(`https://embed69.com/tmdb/${id}`, { headers: HEADERS, timeout: 5000 }).then(r => r.data);
      const match = html.match(/let dataLink\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        const token = match[1];
        // Decodificación simple
        try {
          const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64.length % 4;
          const cleanBase64 = pad ? base64.slice(0, pad - 4) + '='.repeat(4 - pad) : base64;
          const json = JSON.parse(atob(cleanBase64));
          if (json.url) sources.push({ name: 'Embed69', url: json.url, type: 'hls' });
        } catch (e) { /* ignora */ }
      }
    } catch (e) {
      console.warn('Embed69 falló para ID:', id);
    }

    // ✅ 2. VidSrc.to → siempre funciona, embebible
    if (season && episode) {
      sources.push({ name: 'VidSrc (Serie)', url: `https://vidsrc.to/embed/tv/${id}-${season}-${episode}`, type: 'iframe' });
    } else {
      sources.push({ name: 'VidSrc (Película)', url: `https://vidsrc.to/embed/movie/${id}`, type: 'iframe' });
    }

    // ✅ 3. FlixHQ → redirección (no se puede embeddar)
    sources.push({
      name: 'FlixHQ',
      url: season && episode ? `https://flixhq.to/tv/${id}-${season}-${episode}` : `https://flixhq.to/movie/${id}`,
      type: 'external'
    });

  } catch (err) {
    console.error('Error en scraper:', err.message);
  }

  res.status(200).json({ sources });
}
