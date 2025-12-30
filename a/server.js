const express = require('express');
const axios = require('axios');
const app = express();

// Tu API Key de TMDB
const API_KEY = '936410eebae74f9895643e085cc4a740';

// Permitir que cualquier sitio use tu player
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Ruta principal: /player/movie/ID o /player/tv/ID?season=1&episode=1
app.get('/player/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { season, episode } = req.query;

  let title = 'JJMovies.lat - Películas y Series Gratis';

  // Obtener título en español desde TMDB
  try {
    const detailUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=es-ES`;
    const response = await axios.get(detailUrl);
    title = type === 'movie' ? response.data.title : response.data.name;
  } catch (e) {}

  // Fuentes TOP diciembre 2025 (las que usan Cuevana y clones)
  const sources = [
    { name: 'VidSrc.to (HD + Subs Español - El Mejor)', url: season ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}` : `https://vidsrc.to/embed/movie/${id}` },
    { name: 'SuperEmbed (Múltiples servidores)', url: season ? `https://www.superembed.stream/embed/tv/${id}/${season}/${episode}` : `https://www.superembed.stream/embed/movie/${id}` },
    { name: 'AutoEmbed (Rápido y estable)', url: season ? `https://autoembed.cc/embed/tv/${id}/${season}/${episode}` : `https://autoembed.cc/embed/movie/${id}` },
    { name: '2Embed (Clásico potente)', url: season ? `https://www.2embed.stream/embedtv/${id}&s=${season}&e=${episode}` : `https://www.2embed.stream/embed/${id}` },
    { name: 'MultiEmbed (Backup extra)', url: season ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` : `https://multiembed.mov/?video_id=${id}&tmdb=1` }
  ];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, html { margin:0; padding:0; height:100%; background:#000; color:white; font-family:Arial; }
    #player { width:100%; height:calc(100% - 80px); position:relative; }
    iframe { width:100%; height:100%; border:none; }
    .controls { padding:15px; background:#111; text-align:center; }
    button { background:#222; color:white; border:1px solid #444; padding:12px 18px; margin:8px; cursor:pointer; border-radius:8px; font-size:16px; }
    button:hover { background:#444; }
    .loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:28px; z-index:99; background:rgba(0,0,0,0.8); padding:30px; border-radius:15px; }
  </style>
</head>
<body>
  <div id="player">
    <div class="loading">Cargando el mejor servidor...</div>
    <iframe id="frame" allowfullscreen allow="autoplay"></iframe>
  </div>
  <div class="controls">
    <strong>Servidor actual:</strong> <span id="current">${sources[0].name}</span><br><br>
    ${sources.map((s, i) => `<button onclick="cambiar(${i})">${s.name}</button>`).join('')}
  </div>

  <script>
    const urls = ${JSON.stringify(sources.map(s => s.url))};
    const names = ${JSON.stringify(sources.map(s => s.name))};
    let actual = 0;

    function cambiar(i) {
      document.querySelector('.loading').style.display = 'block';
      document.getElementById('frame').src = urls[i];
      document.getElementById('current').textContent = names[i];
      actual = i;
    }

    document.getElementById('frame').onload = () => {
      document.querySelector('.loading').style.display = 'none';
    };

    cambiar(0); // Carga VidSrc.to primero (el mejor)
  </script>
</body>
</html>
  `;

  res.send(html);
});

// Puerto para local y Vercel
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Tu API está corriendo en http://localhost:${port}`);
  console.log(`Prueba: http://localhost:${port}/player/movie/299536`);
});

module.exports = app;