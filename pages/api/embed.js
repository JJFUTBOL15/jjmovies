// pages/api/embed.js
export default function handler(req, res) {
  const { id, season, episode } = req.query;
  if (!id) {
    return res.status(400).send('Error: falta ?id=');
  }
  let playerUrl = `https://jjmovies.lat/watch.html?id=${id}`;
  if (season) playerUrl += `&season=${season}`;
  if (episode) playerUrl += `&episode=${episode}`;
  const iframe = `<iframe class="aspect-video w-full" src="${playerUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(iframe);
}
