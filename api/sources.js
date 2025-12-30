// /api/sources.js
import axios from 'axios';

// Evita bloqueos básicos
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// Decodificador básico de JWT-like (usado en Embed69)
function decodeEmbed69(token) {
  try {
    // Muchas veces es Base64URL + JSON
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const obj = JSON.parse(jsonStr);
    return obj.url || obj.source || obj.hls || null;
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
    // === 1. Intentar Embed69 (usa IMDb ID) ===
    // Primero, obtener IMDb ID desde TMDB (opcional, pero útil)
    // Para este ejemplo, asumimos que el ID es de TMDB
    // NOTA: Podrías llamar a TMDB aquí si quieres, pero lo dejamos para el frontend

    // Alternativa: usar ID de TMDB directamente en algunos mirrors
    // Embed69 soporta también /tmdb/{id}
    const embed69Url = `https://embed69.com/tmdb/${id}`;
    let html = '';
    try {
      const { data } = await axios.get(embed69Url, { headers: HEADERS, timeout: 5000 });
      html = data;
    } catch (e) {
      console.warn('Embed69 timeout o bloqueo');
    }

    if (html) {
      const match = html.match(/let dataLink\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        const token = match[1];
        const url = decodeEmbed69(token);
        if (url && url.startsWith('http')) {
          sources.push({ name: 'Embed69', url, type: 'hls' });
        }
      }
    }

    // === 2. Intentar VerHDLink (soporta TMDB ID) ===
    if (!season) {
      // Solo películas
      const verhdUrl = `https://verhdlink.cam/movie/${id}`;
      try {
        const { data } = await axios.get(verhdUrl, { headers: HEADERS, timeout: 5000 });
        const dropMatch = data.match(/data-link=["']([^"']*dropload[^"']*)["']/);
        if (dropMatch) {
          const dropId = dropMatch[1].split('/').pop();
          // Unlimplay fallback (ajusta si cambia)
          const unlimUrl = `https://unlimplay.com/e/${dropId}`;
          sources.push({ name: 'VerHD / Unlimplay', url: unlimUrl, type: 'iframe' });
        }
      } catch (e) {
        console.warn('VerHDLink falló');
      }
    }

    // === 3. FlixHQ: SOLO redirección (no se puede scrapear fácilmente) ===
    if (season && episode) {
      sources.push({
        name: 'FlixHQ (serie)',
        url: `https://flixhq.to/tv/${id}-${season}-${episode}`,
        type: 'external'
      });
    } else {
      sources.push({
        name: 'FlixHQ (película)',
        url: `https://flixhq.to/movie/${id}`,
        type: 'external'
      });
    }

    // === 4. Cuevana3: redirección (sin scraping realista) ===
    // Aquí necesitarías el slug. Como no lo tenemos, lo omitimos o usas TMDB para generar slug.
    // Opcional: integrar más adelante.

  } catch (err) {
    console.error('Error en scraping:', err.message);
  }

  res.status(200).json({ sources });
}
