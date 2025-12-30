// api/embed.js
export default async function handler(request) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const id = url.searchParams.get('id');
  const season = url.searchParams.get('season');
  const episode = url.searchParams.get('episode');

  if (!id) {
    return new Response('Error: falta ?id=', { status: 400 });
  }

  let playerUrl = `https://jjmovies.lat/player.html?id=${encodeURIComponent(id)}`;
  if (season) playerUrl += `&season=${encodeURIComponent(season)}`;
  if (episode) playerUrl += `&episode=${encodeURIComponent(episode)}`;

  const iframe = `<iframe class="aspect-video w-full" src="${playerUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;

  return new Response(iframe, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
