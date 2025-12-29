// ============================
// CONFIGURACIÓN
// ============================
const API_KEY = '936410eebae74f9895643e085cc4a740';
const PROXY_URL = 'https://api.codetabs.com/v1/proxy?quest=';

let movieData = {
  id: null,
  type: 'movie',
  season: null,
  episode: null,
  imdb_id: null,
  title: '',
  backdrop: ''
};

// ============================
// INICIO
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const season = urlParams.get('season');
  const episode = urlParams.get('episode');

  if (!id) {
    document.getElementById('movie-title').textContent = 'Error: ID no proporcionado';
    return;
  }

  movieData.id = id;
  if (season && episode) {
    movieData.type = 'tv';
    movieData.season = parseInt(season);
    movieData.episode = parseInt(episode);
    fetchTMDBTVData(id, season, episode);
  } else {
    movieData.type = 'movie';
    fetchTMDBData(id);
  }
});

// ============================
// TMDB: PELÍCULAS
// ============================
async function fetchTMDBData(id) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=external_ids`);
    const data = await res.json();
    if (data.success === false) throw new Error('Película no encontrada');
    
    movieData.title = data.title;
    movieData.backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '';
    movieData.imdb_id = data.external_ids?.imdb_id || null;
    
    updateUI(data.title, data.overview, movieData.backdrop);
    setTimeout(startScraping, 1500);
  } catch (e) {
    document.getElementById('movie-title').textContent = 'Error al cargar película';
    console.error(e);
  }
}

// ============================
// TMDB: SERIES
// ============================
async function fetchTMDBTVData(id, season, episode) {
  try {
    const seriesRes = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&append_to_response=external_ids`);
    const seriesData = await seriesRes.json();
    if (seriesData.success === false) throw new Error('Serie no encontrada');

    movieData.title = seriesData.name;
    movieData.backdrop = seriesData.backdrop_path ? `https://image.tmdb.org/t/p/original${seriesData.backdrop_path}` : '';
    movieData.imdb_id = seriesData.external_ids?.imdb_id || null;

    const epRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}/episode/${episode}?api_key=${API_KEY}`);
    const epData = await epRes.json();

    updateUI(`${seriesData.name} - T${season} E${episode}`, epData.overview || 'Sinopsis no disponible.', movieData.backdrop);

    populateSeasons(seriesData.seasons, season);
    populateEpisodes(id, season, episode);
    setTimeout(startScraping, 1500);
  } catch (e) {
    document.getElementById('movie-title').textContent = 'Error al cargar serie';
    console.error(e);
  }
}

function updateUI(title, overview, backdrop) {
  document.getElementById('movie-title').textContent = title;
  document.getElementById('movie-overview').textContent = overview || 'Sinopsis no disponible.';
  if (backdrop) document.getElementById('backdrop-img').style.backgroundImage = `url(${backdrop})`;
}

function populateSeasons(seasons, selectedSeason) {
  const select = document.getElementById('season-select');
  select.innerHTML = '';
  seasons
    .filter(s => s.season_number > 0)
    .forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.season_number;
      opt.textContent = `Temporada ${s.season_number}`;
      opt.selected = s.season_number == selectedSeason;
      select.appendChild(opt);
    });
  document.getElementById('series-controls').classList.remove('hidden-force');
}

async function populateEpisodes(tvId, season, selectedEpisode) {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${season}?api_key=${API_KEY}`);
  const data = await res.json();
  const select = document.getElementById('episode-select');
  select.innerHTML = '';
  (data.episodes || []).forEach(ep => {
    const opt = document.createElement('option');
    opt.value = ep.episode_number;
    opt.textContent = `Ep. ${ep.episode_number}: ${ep.name}`;
    opt.selected = ep.episode_number == selectedEpisode;
    select.appendChild(opt);
  });
}

// ============================
// SCRAPING
// ============================
async function startScraping() {
  const sources = [];

  // Estrategia 1: Embed69 (requiere IMDb)
  if (movieData.imdb_id) {
    try {
      const embed69Url = `https://embed69.com/tv/${movieData.imdb_id}`;
      const res = await fetch(PROXY_URL + encodeURIComponent(embed69Url));
      const text = await res.text();
      const match = text.match(/let dataLink = (\[.*?\]);/);
      if (match) {
        const links = JSON.parse(match[1]);
        links.forEach(link => {
          const decoded = decodeJWT(link);
          if (decoded && decoded.startsWith('http')) sources.push({ name: 'Embed69', url: decoded });
        });
      }
    } catch (e) {}
  }

  // Estrategia 2: VerHD
  if (movieData.imdb_id) {
    try {
      const verhdUrl = `https://verhdlink.cam/movie/${movieData.imdb_id}`;
      const res = await fetch(PROXY_URL + encodeURIComponent(verhdUrl));
      const text = await res.text();
      const dropMatch = text.match(/data-link=['"](https?:\/\/.*?dropload.*?)['"]/);
      if (dropMatch) {
        const url = dropMatch[1].replace('dropload.io', 'unlimplay.com');
        sources.push({ name: 'VerHD', url });
      }
    } catch (e) {}
  }

  // Estrategia 3: Blog fallback (por título)
  try {
    const blogSearch = `https://darkstatonmovies1.blogspot.com/search?q=${encodeURIComponent(movieData.title)}`;
    const res = await fetch(PROXY_URL + blogSearch);
    const text = await res.text();
    const firstLink = text.match(/<a class="post-title"[^>]*href=['"]([^'"]+)['"]/)?.[1];
    if (firstLink) {
      const postRes = await fetch(PROXY_URL + encodeURIComponent(firstLink));
      const postText = await postRes.text();
      const iframeMatch = postText.match(/src=['"](.*?videoUrl=([^'"]+))['"]/);
      if (iframeMatch) {
        const realUrl = base64UrlDecode(iframeMatch[2]);
        if (realUrl) sources.push({ name: 'Blog', url: realUrl });
      }
    }
  } catch (e) {}

  displaySources(sources.length ? sources : [{ name: 'No disponible', url: '#' }]);
}

// ============================
// UTILIDADES
// ============================
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((payload.length + 2) % 4);
    const jsonText = atob(padded);
    const json = JSON.parse(jsonText);
    return json.url || json.source || null;
  } catch (e) { return null; }
}

function base64UrlDecode(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  } catch (e) { return null; }
}

// ============================
// REPRODUCCIÓN
// ============================
function displaySources(sources) {
  const container = document.getElementById('server-list-container');
  container.innerHTML = '<h3 class="text-lg mb-2">Servidores:</h3>';
  sources.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.textContent = `${src.name} ${sources.length > 1 ? i + 1 : ''}`;
    if (src.url === '#') {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      btn.onclick = () => loadVideo(src.url);
    }
    container.appendChild(btn);
  });
}

function loadVideo(url) {
  const iframeContainer = document.getElementById('iframe-container');
  const video = document.getElementById('player');
  iframeContainer.innerHTML = '';
  video.style.display = 'none';

  if (url.endsWith('.m3u8')) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      video.style.display = 'block';
      video.play().catch(e => console.log('Auto-play blocked'));
    }
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = "100%";
    iframe.height = "500";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.allow = "autoplay";
    iframeContainer.appendChild(iframe);
  }
}

// ============================
// CONTROL DE SERIES
// ============================
async function onSeasonChange(season) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('season', season);
  urlParams.set('episode', '1');
  window.history.replaceState(null, '', `?${urlParams.toString()}`);
  movieData.season = parseInt(season);
  populateEpisodes(movieData.id, season, 1);
  onEpisodeChange(1);
}

function onEpisodeChange(episode) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('episode', episode);
  window.history.replaceState(null, '', `?${urlParams.toString()}`);
  movieData.episode = parseInt(episode);
  setTimeout(startScraping, 500);
}

// Inicializar Plyr
document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('player');
  if (player) new Plyr(player);
});
