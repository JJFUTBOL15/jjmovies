// api/video.js

export default async function handler(req, res) {
  const { id, type = 'movie', season, episode } = req.query;

  if (!id) {
    return res.status(400).send('Error: falta el parámetro "id"');
  }

  try {
    // Paso 1: Obtener IMDB ID desde TMDB
    const query = id.replace(/-/g, ' ');
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/${mediaType}?api_key=936410eebae74f9895643e085cc4a740&query=${encodeURIComponent(query)}&include_adult=false`
    );
    const tmdbData = await tmdbRes.json();

    if (!tmdbData.results?.[0]?.external_ids?.imdb_id) {
      throw new Error('IMDB ID no encontrado');
    }

    const imdbId = tmdbData.results[0].external_ids.imdb_id;

    // Paso 2: Scrapear embed69.com
    const embedUrl = `https://embed69.com/v/${imdbId}`;
    const embedRes = await fetch(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await embedRes.text();

    // Paso 3: Extraer dataLink (Base64 JWT)
    const match = html.match(/let dataLink = '([^']+)'/);
    if (!match) throw new Error('dataLink no encontrado');

    const token = match[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    const videoUrl = payload.url;

    if (!videoUrl) throw new Error('URL de video no extraída');

    // Paso 4: Devolver iframe listo
    const iframe = `
      <iframe 
        class="aspect-video w-full" 
        src="https://jjmovies.lat/player.html?url=${encodeURIComponent(videoUrl)}" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media"
      ></iframe>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(iframe);

  } catch (e) {
    console.error('Error:', e.message);
    res.status(404).send(`
      <div style="background:#000; color:#fff; padding:20px; text-align:center; font-family:sans-serif;">
        <h2>⛔ Video no disponible</h2>
        <p>Lo sentimos, este contenido no está accesible en este momento.</p>
        <p style="font-size:0.8em; margin-top:10px;">ID: ${id}</p>
      </div>
    `);
  }
}
