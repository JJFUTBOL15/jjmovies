const express = require('express');
const axios = require('axios');
const app = express();

// Tu API Key TMDB
const API_KEY = '936410eebae74f9895643e085cc4a740';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Player con múltiples servidores (como Cuevana pro)
app.get('/player/:type/:id', async (req, res) => {
  const { type, id } = req.params; // movie o tv
  const { season, episode } = req.query;

  let title = 'Reproduciendo en JJMovies.lat';

  try {
    const detailUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=es-ES`;
    const response = await axios.get(detailUrl);
    title = type === 'movie' ? response.data.title : response.data.name;
  } catch (e) {}

  // Fuentes TOP diciembre 2025 (prioridad: mejores subs ES/LATAM y estabilidad)
  const sources = [
    { name: 'VidSrc Pro (HD + Subs ES)', url: season ? `https://vidsrc.stream/embed/tv/${id}-${season}-${episode}` : `https://vidsrc.stream/embed/movie/${id}` },
    { name: 'MultiEmbed (Rápido LATAM)', url: season ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` : `https://multiembed.mov/?video_id=${id}&tmdb=1` },
    { name: 'SuperEmbed (Múltiples hosts)', url: season ? `https://player.superembed.stream/tv/${id}/${season}/${episode}` : `https://player.superembed.stream/movie/${id}` },
    { name: 'AutoEmbed (Nuevo y potente)', url: season ? `https://autoembed.cc/tv/tmdb/${id}-${season}-${episode}` : `https://autoembed.cc/movie/tmdb/${id}` },
    { name: '2Embed (Clásico fallback)', url: season ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` : `https://www.2embed.cc/embed/${id}` }
  ];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - JJMovies.lat</title>
  <style>
    body, html { margin:0; padding:0; height:100%; background:#000; color:white; font-family:Arial; }
    #player { width:100%; height:calc(100% - 70px); position:relative; }
    iframe { width:100%; height:100%; border:none; }
    .controls { padding:10px; background:#111; text-align:center; }
    button { background:#333; color:white; border:none; padding:10px 15px; margin:5px; cursor:pointer; border-radius:5px; }
    button:hover { background:#555; }
    .loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:24px; }
  </style>
</head>
<body>
  <div id="player">
    <div class="loading">Cargando el mejor servidor...</div>
    <iframe id="frame" allowfullscreen allow="autoplay"></iframe>
  </div>
  <div class="controls">
    <strong>Servidor:</strong> <span id="current">${sources[0].name}</span><br>
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

    cambiar(0); // Carga el mejor primero
  </script>
</body>
</html>
  `;

  res.send(html);
});

module.exports = app;
