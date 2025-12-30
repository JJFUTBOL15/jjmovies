// api/video.js
import fetch from 'node-fetch';

const CUE_BASE = 'https://cuevana3.io';
const YOUR_PLAYER_DOMAIN = 'https://jjmovies.lat'; // Cambia esto por tu dominio real

export default async function handler(req, res) {
  const { id, type = 'movie', season, episode } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro "id"' });
  }

  try {
    let videoUrl = null;

    if (type === 'movie') {
      videoUrl = await scrapeMovie(id);
    } else if (type === 'series' && season && episode) {
      videoUrl = await scrapeEpisode(id, season, episode);
    } else {
      return res.status(400).json({ error: 'Para series, incluye season y episode' });
    }

    if (!videoUrl) {
      return res.status(404).send(`
        <div style="background:#111; color:white; padding:20px; text-align:center;">
          <h2>Video no encontrado</h2>
          <p>El contenido solicitado no está disponible.</p>
        </div>
      `);
    }

    // Generar el iframe embebible (igual que noctiflix.lat)
    const iframeHtml = `
      <iframe 
        class="aspect-video w-full" 
        src="${YOUR_PLAYER_DOMAIN}/player.html?url=${encodeURIComponent(videoUrl)}" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media"
      ></iframe>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(iframeHtml);

  } catch (e) {
    console.error(e);
    res.status(500).send(`
      <div style="background:#111; color:white; padding:20px; text-align:center;">
        <h2>Error interno</h2>
        <p>Hubo un problema al cargar el video.</p>
      </div>
    `);
  }
}

// === SCRAPING FUNCTIONS ===
async function scrapeMovie(slug) {
  const url = `${CUE_BASE}/pelicula/${slug}/`;
  const html = await fetchHtml(url);
  return extractVideoLink(html);
}

async function scrapeEpisode(slug, season, episode) {
  const seriesUrl = `${CUE_BASE}/serie/${slug}/`;
  const html = await fetchHtml(seriesUrl);

  const regex = new RegExp(
    `<a[^>]*href=["']([^"']*)["'][^>]*data-season=["']\\s*${season}\\s*["'][^>]*data-episode=["']\\s*${episode}\\s*["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) {
    const epUrl = match[1].startsWith('http') ? match[1] : CUE_BASE + match[1];
    const epHtml = await fetchHtml(epUrl);
    return extractVideoLink(epHtml);
  }
  return null;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JJMOVIES/1.0)' }
  });
  return await response.text();
}

function extractVideoLink(html) {
  // Buscar showEmbed
  const embedMatch = html.match(/<iframe[^>]*src=["']([^"']*embed-page\?showEmbed=[^"']*)["']/i);
  if (embedMatch) {
    return resolveShowEmbed(embedMatch[1]);
  }

  // Buscar trembed
  const trembedMatch = html.match(/<iframe[^>]*src=["']([^"']*trembed[^"']*)["']/i);
  if (trembedMatch) {
    return trembedMatch[1].startsWith('http') ? trembedMatch[1] : CUE_BASE + trembedMatch[1];
  }

  return null;
}

function resolveShowEmbed(embedUrl) {
  try {
    const url = new URL(embedUrl.startsWith('http') ? embedUrl : CUE_BASE + embedUrl);
    const encoded = url.searchParams.get('showEmbed');
    if (encoded) {
      return atob(encoded); // Decodificar Base64
    }
  } catch (e) {}
  return embedUrl;
}
