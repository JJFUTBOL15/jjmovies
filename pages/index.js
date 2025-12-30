// pages/index.js
import { useEffect, useRef, useState } from 'react';

export default function JJMoviesPlayer() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const season = urlParams.get('season');
    const episode = urlParams.get('episode');

    if (!id) {
      setError('Falta el parámetro ?id= (ej: ?id=550)');
      setLoading(false);
      return;
    }

    // Llamar a tu API en /api/sources
    fetch(`/api/sources?id=${id}${season ? `&season=${season}&episode=${episode}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSources(data.sources);
          if (data.sources.length > 0) {
            playSource(data.sources[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error al conectar con el servidor');
        setLoading(false);
        console.error(err);
      });
  }, []);

  function playSource(source) {
    const player = playerRef.current;
    const iframeContainer = iframeRef.current;

    // Reset
    if (iframeContainer) iframeContainer.innerHTML = '';
    if (player) player.style.display = 'none';
    if (iframeContainer) iframeContainer.style.display = 'none';

    if (source.type === 'hls') {
      // Reproducir con HLS.js
      if (player) {
        player.style.display = 'block';
        if (Hls.isSupported()) {
          if (player.hlsInstance) player.hlsInstance.destroy();
          const hls = new Hls();
          player.hlsInstance = hls;
          hls.loadSource(source.url);
          hls.attachMedia(player);
          hls.on(Hls.Events.MANIFEST_PARSED, () => player.play());
        } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
          player.src = source.url;
          player.play();
        }
      }
    } else if (source.type === 'iframe') {
      if (iframeContainer) {
        iframeContainer.innerHTML = `<iframe src="${source.url}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
        iframeContainer.style.display = 'block';
      }
    } else if (source.type === 'external') {
      if (confirm(`¿Abrir en ${source.name}?\n${source.url}`)) {
        window.open(source.url, '_blank', 'noopener,noreferrer');
      }
    }
  }

  return (
    <div style={{ margin: 0, padding: 0, background: '#000', color: 'white', fontFamily: 'Arial', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Loading o error */}
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', zIndex: 10 }}>
          Buscando fuentes...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
          ❌ {error}
        </div>
      )}

      {/* Video Player (HLS) */}
      <video
        ref={playerRef}
        controls
        style={{ display: 'none', width: '100%', height: '100%', background: '#000' }}
      ></video>

      {/* Iframe Container */}
      <div
        ref={iframeRef}
        style={{ display: 'none', width: '100%', height: '100%' }}
      ></div>

      {/* Lista de servidores (flotante) */}
      {sources.length > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Fuentes:</div>
          {sources.map((src, i) => (
            <button
              key={i}
              onClick={() => playSource(src)}
              style={{
                display: 'block',
                margin: '4px 0',
                padding: '6px 10px',
                background: '#b00',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {src.name}
            </button>
          ))}
        </div>
      )}

      {/* Scripts externos (HLS.js + Plyr no es necesario si usamos controles nativos) */}
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    </div>
  );
}
