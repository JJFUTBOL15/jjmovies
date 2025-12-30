// pages/api/embed.js
export default function handler(req, res) {
  const { id, season, episode } = req.query;

  if (!id) {
    res.status(400).send('Error: falta el parámetro ?id=');
    return;
  }

  // Construir la URL del player
  let playerUrl = `https://jjmovies.lat/player?id=${encodeURIComponent(id)}`;
  if (season) playerUrl += `&season=${encodeURIComponent(season)}`;
  if (episode) playerUrl += `&episode=${encodeURIComponent(episode)}`;

  // Código del iframe (como en Noctiflix)
  const iframeCode = `
<iframe class="aspect-video w-full" 
        src="${playerUrl}" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media">
</iframe>
  `.trim();

  // Enviar como HTML puro (sin renderizar, solo texto)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(iframeCode);
}
