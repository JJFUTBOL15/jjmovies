// =============== CONFIGURACIÓN ===============
const TMDB_API_KEY = '936410eebae74f9895643e085cc4a740';
const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
const CUE_BASE = 'https://cue.cuevana3.nu';

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

  // Redirige a un contenido de ejemplo para probar
  setTimeout(() => {
    if (window.location.search === '') {
      window.location.search = 'id=stranger-things&type=series&season=1&episode=1';
    }
  }, 1500);
}

// =============== CARGAR PELÍCULA O SERIE ===============
async function loadMediaPage() {
  document.getElementById('movie-title').textContent = 'Cargando...';
  document.getElementById('iframe-container').innerHTML = '';
  document.getElementById('player').style.display = 'none';
  document.getElementById('series-controls').classList.add('hidden-force');

  try {
    await fetchTMDBMetadata();
    const videoUrl = await scrapeVideoFromCuevana();
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

// =============== SCRAPING MEJORADO PARA PELÍCULAS Y SERIES ===============
async function scrapeVideoFromCuevana() {
  if (currentMedia.type === 'movie') {
    const pageUrl = `${CUE_BASE}/pelicula/${currentMedia.slug}/`;
    return await extractVideoFromPage(pageUrl);
  } else {
    // Para series: siempre usar la página PRINCIPAL de la serie
    const seriesPageUrl = `${CUE_BASE}/serie/${currentMedia.slug}/`;
    const res = await fetch(`${PROXY}${encodeURIComponent(seriesPageUrl)}`);
    const html = await res.text();

    const seasonNum = currentMedia.season || 1;
    const episodeNum = currentMedia.episode || 1;

    // Estrategia 1: buscar por atributos data-season y data-episode
    const regex1 = new RegExp(
      `<a[^>]*href=["']([^"']*)["'][^>]*data-season=["']\\s*${seasonNum}\\s*["'][^>]*data-episode=["']\\s*${episodeNum}\\s*["']`,
      'i'
    );
    const match1 = html.match(regex1);
    if (match1) {
      let epUrl = match1[1];
      if (epUrl.startsWith('/')) epUrl = CUE_BASE + epUrl;
      return await extractVideoFromPage(epUrl);
    }

    // Estrategia 2: buscar dentro del bloque de la temporada
    const seasonHeaderRegex = new RegExp(`<h3[^>]*>\\s*Temporada\\s+${seasonNum}\\s*<\\/h3>`, 'i');
    const seasonIndex = html.search(seasonHeaderRegex);
    if (seasonIndex !== -1) {
      const rest = html.slice(seasonIndex);
      const nextSeasonIndex = rest.search(/<h3[^>]*>Temporada\s+\d+/i);
      const seasonBlock = nextSeasonIndex !== -1 ? rest.slice(0, nextSeasonIndex) : rest;

      const epRegex = new RegExp(
        `<a[^>]*href=["']([^"']*)["'][^>]*>\\s*Episodio\\s*${episodeNum}\\b`,
        'i'
      );
      const match2 = seasonBlock.match(epRegex);
      if (match2) {
        let epUrl = match2[1];
        if (epUrl.startsWith('/')) epUrl = CUE_BASE + epUrl;
        return await extractVideoFromPage(epUrl);
      }
    }

    // Estrategia 3: intentar URL directa como fallback
    const fallbackUrl = `${CUE_BASE}/serie/${currentMedia.slug}/temporada-${seasonNum}/episodio-${episodeNum}/`;
    return await extractVideoFromPage(fallbackUrl);
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

    // 3. Buscar enlaces en atributos data-link (como VerHD)
    const dataLinkMatch = html.match(/data-link=["']([^"']+)["']/);
    if (dataLinkMatch) {
      return dataLinkMatch[1];
    }

    return null;
  } catch (e) {
    console.warn('Error al scrapear página:', pageUrl, e);
    return null;
  }
}

// =============== RESOLVER showEmbed (Base64 + fakeplayer) ===============
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

// =============== REPRODUCIR VIDEO ===============
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

// =============== NAVEGACIÓN DE SERIES ===============
function onSeasonChange(season) {
  window.location.search = `id=${currentMedia.slug}&type=series&season=${season}&episode=1`;
}

function onEpisodeChange(episode) {
  window.location.search = `id=${currentMedia.slug}&type=series&season=${currentMedia.season}&episode=${episode}`;
}
