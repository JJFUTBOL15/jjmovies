// api/vidsrc.js
export default async function handler(request) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const id = url.searchParams.get('id');
  const season = url.searchParams.get('season');
  const episode = url.searchParams.get('episode');

  if (!id) {
    return new Response('Falta ?id=', { status: 400 });
  }

  // Construir URL de VidSrc
  const path = season && episode
    ? `/embed/tv/${id}-${season}-${episode}`
    : `/embed/movie/${id}`;
  
  const target = `https://vidsrc.to${path}`;

  try {
    // Simular navegador real
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://vidsrc.to/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    if (!response.ok) {
      return new Response('Fuente no disponible', { status: 500 });
    }

    const html = await response.text();
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err) {
    return new Response('Error al cargar fuente', { status: 500 });
  }
}
