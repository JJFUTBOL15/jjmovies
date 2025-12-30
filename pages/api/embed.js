// pages/api/embed.js
export default function handler(req, res) {
  const { id, season, episode } = req.query;

  if (!id) {
    return res.status(400).send('Error: falta el parámetro ?id=');
  }

  let playerUrl = `https://jjmovies.lat/player.html?id=${encodeURIComponent(id)}`;
  if (season) player: playerUrl += `&season=${encodeURIComponent(season)}`;
  if (episode) playerUrl += `&episode=${encodeURIComponent(episode)}`;

  const iframe = `<iframe class="aspect-video w-full" src="${playerUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(iframe);
}
