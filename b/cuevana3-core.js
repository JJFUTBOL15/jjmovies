// =============== CONFIGURACIÓN ===============
const TMDB_API_KEY = '936410eebae74f9895643e085cc4a740';
const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
const CUE_BASE = 'https://cuevana3.io'; // ¡Cambiado!

let currentMedia = {
  type: null,
  slug: null,
  season: null,
  episode: null,
  title: 'Cargando...'
};

// =============== INICIO ===============
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const type = params.get('type') || 'movie';
  const season = params.get('season');
  const episode = params.get('episode');

  if (!id) {
    loadHomepage();
    return;
  }

  currentMedia = { type, slug: id, season, episode };
  await loadMediaPage();
});

// =============== PÁGINA PRINCIPAL ===============
async function loadHomepage() {
  document.title = 'JJMOVIES';
  document.getElementById('movie-title').textContent = 'JJMOVIES';
  document.getElementById('movie-overview').textContent = 'Películas y series en tiempo real. VIP: JJ2025';

  setTimeout(() => {
    if (window.location.search === '') {
      window.location.search = 'id=loki&type=series&season=2&episode=1';
    }
  }, 1500);
}

// =============== CARGAR CONTENIDO ===============
async function loadMediaPage() {
  document.getElementById('movie-title').textContent = 'Cargando...';
  document.getElementById('iframe-container').innerHTML = '';
  document.getElementById('player').style.display = 'none';
  document.getElementById('series-controls').classList.add('hidden-force');

  try {
    await fetchTMDBMetadata();
    let videoUrl = await scrapeVideoFromCuevana();

    // Si falla, usar fallback directo
    if (!videoUrl) {
      videoUrl = await tryFallbackServers();
    }

    if (videoUrl) {
      loadVideo(videoUrl);
      if (currentMedia.type === 'series') {
        document.getElementById('series-controls').classList.remove('hidden-force');
        document.getElementById('season-select').value = currentMedia.season || 1;
        document.getElementById('episode-select').value = currentMedia.episode || 1;
      }
    } else {
      document.getElementById('movie-title').textContent += ' — [No se encontró video]';
    }
  } catch (e) {
    console.error(e);
    document.getElementById('movie-title').textContent = 'Error al cargar el contenido';
  }
}

// =============== TMDB ===============
async function fetchTMDBMetadata() {
  try {
    const query = currentMedia.slug.replace(/-/g, ' ');
    const mediaType = currentMedia.type === 'movie' ? 'movie' : 'tv';
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );
    const data = await res.json();

    if (data.results?.[0]) {
      const item = data.results[0];
      currentMedia.title = item.title || item.name || currentMedia.slug.replace(/-/g, ' ');
      const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '';
      document.getElementById('movie-title').textContent = currentMedia.title;
      document.getElementById('movie-overview').textContent = item.overview || 'Sinopsis no disponible.';
      if (backdrop) document.getElementById('backdrop-img').style.backgroundImage = `url(${backdrop})`;
    } else {
      const fallbackTitle = decodeURIComponent(currentMedia.slug.replace(/-/g, ' ')).toUpperCase();
      document.getElementById('movie-title').textContent = fallbackTitle;
    }
  } catch (e) {
    const fallbackTitle = decodeURIComponent(currentMedia.slug.replace(/-/g, ' ')).toUpperCase();
    document.getElementById('movie-title').textContent = fallbackTitle;
  }
}

// =============== SCRAPING PRINCIPAL (PARA cuevana3.io) ===============
async function scrapeVideoFromCuevana() {
  let pageUrl;
  if (currentMedia.type === 'movie') {
    pageUrl = `${CUE_BASE}/pelicula/${currentMedia.slug}/`;
  } else {
    // Para series, ir a la página principal de la serie
    pageUrl = `${CUE_BASE}/serie/${currentMedia.slug}/`;
  }

  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(pageUrl)}`);
    if (!res.ok) return null;
    const html = await res.text();

    // Buscar el enlace del episodio específico
    const seasonNum = currentMedia.season || 1;
    const episodeNum = currentMedia.episode || 1;

    // En cuevana3.io, los episodios están en bloques con data-season y data-episode
    const regex = new RegExp(
      `<a[^>]*href=["']([^"']*)["'][^>]*data-season=["']\\s*${seasonNum}\\s*["'][^>]*data-episode=["']\\s*${episodeNum}\\s*["']`,
      'i'
    );
    const match = html.match(regex);

    if (match) {
      let epUrl = match[1];
      if (epUrl.startsWith('/')) epUrl = CUE_BASE + epUrl;
      return await extractVideoFromPage(epUrl);
    }

    // Alternativa: buscar por texto "Episodio X"
    const epRegex = new RegExp(
      `<a[^>]*href=["']([^"']*)["'][^>]*>\\s*Episodio\\s+${episodeNum}\\b`,
      'i'
    );
    const textMatch = html.match(epRegex);
    if (textMatch) {
      let epUrl = textMatch[1];
      if (epUrl.startsWith('/')) epUrl = CUE_BASE + epUrl;
      return await extractVideoFromPage(epUrl);
    }

    // Último recurso: intentar URL directa
    const fallbackUrl = `${CUE_BASE}/serie/${currentMedia.slug}/temporada-${seasonNum}/episodio-${episodeNum}/`;
    return await extractVideoFromPage(fallbackUrl);

  } catch (e) {
    console.warn('Fallo scraping:', e);
    return null;
  }
}

// =============== Extraer video de cualquier página ===============
async function extractVideoFromPage(pageUrl) {
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(pageUrl)}`);
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Buscar embed-page?showEmbed=...
    const embedMatch = html.match(/<iframe[^>]*src=["']([^"']*embed-page\?showEmbed=[^"']*)["']/i);
    if (embedMatch) {
      return await resolveCuevanaEmbed(embedMatch[1]);
    }

    // 2. Buscar trembed directo
    const trembedMatch = html.match(/<iframe[^>]*src=["']([^"']*trembed[^"']*)["']/i);
    if (trembedMatch) {
      let url = trembedMatch[1];
      if (url.startsWith('/')) url = CUE_BASE + url;
      return url;
    }

    // 3. Buscar enlaces en botones con class="btlink"
    const buttonMatch = html.match(/<a[^>]*class=["'][^"']*btlink[^"']*["'][^>]*href=["']([^"']+)["']/i);
    if (buttonMatch) {
      let url = buttonMatch[1];
      if (url.startsWith('/')) url = CUE_BASE + url;
      return url;
    }

    return null;
  } catch (e) {
    console.warn('Error al scrapear página:', pageUrl, e);
    return null;
  }
}

// =============== RESOLVER showEmbed ===============
async function resolveCuevanaEmbed(embedUrl) {
  const fullUrl = embedUrl.startsWith('http') ? embedUrl : CUE_BASE + embedUrl;
  const url = new URL(fullUrl);
  const encoded = url.searchParams.get('showEmbed');
  if (!encoded) return fullUrl;

  try {
    const fakePlayerUrl = atob(encoded);
    const res = await fetch(`${PROXY}${encodeURIComponent(fakePlayerUrl)}`);
    const html = await res.text();

    const redirectMatch = html.match(/window\.(top\.)?location\.href\s*=\s*["']([^"']+)["']/);
    if (redirectMatch) return redirectMatch[2];

    const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if (iframeMatch) return iframeMatch[1];

    return fakePlayerUrl;
  } catch (e) {
    return fullUrl;
  }
}

// =============== FALLBACK: SERVIDORES DIRECTOS ===============
async function tryFallbackServers() {
  const slug = currentMedia.slug;
  const isSeries = currentMedia.type === 'series';
  const s = currentMedia.season || 1;
  const e = currentMedia.episode || 1;

  // Lista de servidores probables
  const servers = [];

  if (isSeries) {
    const epSlug = `${slug}-s${s}e${e}`;
    servers.push(
      `https://dood.to/e/${epSlug}`,
      `https://fembed.com/v/${epSlug}`,
      `https://streamtape.com/e/${epSlug}`,
      `https://doo.lat/e/${epSlug}`
    );
  } else {
    servers.push(
      `https://dood.to/e/${slug}`,
      `https://fembed.com/v/${slug}`,
      `https://streamtape.com/e/${slug}`,
      `https://doo.lat/e/${slug}`
    );
  }

  // Probar cada servidor (solo devuelve el primero)
  for (const url of servers) {
    try {
      // No necesitamos verificar el status, solo devolver el primero
      return url;
    } catch (e) {
      continue;
    }
  }

  return null;
}

// =============== REPRODUCIR ===============
function loadVideo(url) {
  const iframeContainer = document.getElementById('iframe-container');
  const playerEl = document.getElementById('player');
  iframeContainer.innerHTML = '';

  if (url.includes('.m3u8')) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(playerEl);
      playerEl.style.display = 'block';
    }
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '550';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; encrypted-media';
    iframeContainer.appendChild(iframe);
    playerEl.style.display = 'none';
  }

  if (typeof Plyr !== 'undefined') {
    new Plyr('#player');
  }
}

// =============== SERIES ===============
function onSeasonChange(season) {
  window.location.search = `id=${currentMedia.slug}&type=series&season=${season}&episode=1`;
}

function onEpisodeChange(episode) {
  window.location.search = `id=${currentMedia.slug}&type=series&season=${currentMedia.season}&episode=${episode}`;
}
