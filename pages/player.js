// pages/player.js
import { useEffect, useRef, useState } from 'react';

export default function PlayerPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const url = new URL(window.location);
    const id = url.searchParams.get('id');
    const season = url.searchParams.get('season');
    const episode = url.searchParams.get('episode');

    if (!id) {
      setError('Usa ?id=123 en la URL');
      setLoading(false);
      return;
    }

    fetch(`/api/sources?id=${id}${season ? `&season=${season}&episode=${episode}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setSources(data.sources || []);
        if (data.sources?.length > 0) {
          playSource(data.sources[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('No se pudieron cargar fuentes');
        setLoading(false);
      });
  }, []);

  function playSource(source) {
    const p = playerRef.current;
    const i = iframeRef.current;

    if (p) p.style.display = 'none';
    if (i) {
      i.style.display = 'none';
      i.innerHTML = '';
    }

    if (source.type === 'hls') {
      if (p) {
        p.style.display = 'block';
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(source.url);
          hls.attachMedia(p);
          hls.on(Hls.Events.MANIFEST_PARSED, () => p.play());
        } else if (p.canPlayType('application/vnd.apple.mpegurl')) {
          p.src = source.url;
          p.play();
        }
      }
    } else if (source.type === 'iframe') {
      if (i) {
        i.innerHTML = `<iframe src="${source.url}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
        i.style.display = 'block';
      }
    } else if (source.type === 'external') {
      alert(`Copia y pega en tu navegador:\n${source.url}`);
    }
  }

  return (
    <div style={{ background: '#000', color: 'white', margin: 0, padding: 0, height: '100vh', position: 'relative', fontFamily: 'Arial' }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '22px', color: '#ff3333' }}>
          🔍 Buscando fuentes...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', color: '#ff3333' }}>
          {error}
        </div>
      )}

      <video ref={playerRef} controls style={{ display: 'none', width: '100%', height: '100%' }} />
      <div ref={iframeRef} style={{ display: 'none', width: '100%', height: '100%' }} />

      {sources.length > 0 && (
        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '12px', zIndex: 10, width: '160px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff3333' }}>Fuentes:</div>
          {sources.map((src, i) => (
            <button
              key={i}
              onClick={() => playSource(src)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                margin: '4px 0',
                background: '#111',
                color: '#ff6666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {src.name}
            </button>
          ))}
        </div>
      )}

      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    </div>
  );
}
