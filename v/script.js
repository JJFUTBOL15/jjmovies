// Tu API Key
const API_KEY = '936410eebae74f9895643e085cc4a740';

// Datos simulados de películas por plataforma
// Reemplaza esto con llamadas a tu API cuando esté disponible
const platformMovies = {
  netflix: [
    { id: 'bahunali-the-epic', title: 'Bāhubali: The Epic', rating: 6.4, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'the-great-flood', title: 'The Great Flood', rating: 6.1, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'wake-up-dead-man', title: 'Wake Up Dead Man: A Knives Out Mystery', rating: 7.2, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'frankenstein', title: 'Frankenstein', rating: 7.7, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'kpop-demon-hunters', title: 'KPop Demon Hunters', rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'troll-2', title: 'Troll 2', rating: 6.6, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'a-time-for-bravery', title: 'A Time for Bravery', rating: 7.8, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'parasite', title: 'Parasite', rating: 8.5, poster: 'https://image.tmdb.org/t/p/w500/...jpg' }
  ],
  disneyplus: [
    { id: 'avatar-way-of-water', title: 'Avatar: The Way of Water', rating: 7.6, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'avatar', title: 'Avatar', rating: 7.2, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'zootopia', title: 'Zootopia', rating: 8.2, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'fantastic-four', title: 'The Fantastic 4: First Steps', rating: 7.0, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'avengers', title: 'The Avengers', rating: 7.9, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'home-alone-2', title: 'Home Alone 2: Lost in New York', rating: 6.8, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'muppet-christmas-carol', title: 'The Muppet Christmas Carol', rating: 7.4, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'moana-2', title: 'Moana 2', rating: 7.6, poster: 'https://image.tmdb.org/t/p/w500/...jpg' }
  ],
  max: [
    { id: 'one-battle-after-another', title: 'One Battle After Another', rating: 7.5, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'ne-zha-2', title: 'Ne Zha 2', rating: 8.1, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'superman', title: 'Superman', rating: 7.4, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'sinners', title: 'Sinners', rating: 7.5, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'conjouring-last-rites', title: 'The Conjuring: Last Rites', rating: 6.9, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'great-expectations', title: 'Great Expectations', rating: 7.3, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'it', title: 'It', rating: 7.2, poster: 'https://image.tmdb.org/t/p/w500/...jpg' },
    { id: 'inception', title: 'Inception', rating: 8.4, poster: 'https://image.tmdb.org/t/p/w500/...jpg' }
  ]
};

function cargarHome() {
  document.getElementById('browse-platforms').style.display = 'block';
  document.getElementById('platform-movies').style.display = 'none';
  document.querySelector('.active')?.classList.remove('active');
  document.querySelectorAll('nav ul li a')[0].classList.add('active');
}

function cargarPlataformas() {
  document.getElementById('browse-platforms').style.display = 'block';
  document.getElementById('platform-movies').style.display = 'none';
  document.querySelector('.active')?.classList.remove('active');
  document.querySelectorAll('nav ul li a')[4].classList.add('active');
}

function cargarPlataforma(platform) {
  const platformData = platformMovies[platform] || [];
  const moviesList = document.getElementById('movies-list');
  const platformTitle = document.getElementById('platform-title');

  // Actualizar título
  platformTitle.textContent = `Películas de ${platform.charAt(0).toUpperCase() + platform.slice(1).replace('plus', '+')}`;

  // Limpiar lista
  moviesList.innerHTML = '';

  // Generar tarjetas
  platformData.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-item';
    movieCard.onclick = () => reproducir(movie.id);

    movieCard.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}" />
      <div class="movie-rating">${movie.rating}</div>
      <div class="movie-title">${movie.title}</div>
    `;

    moviesList.appendChild(movieCard);
  });

  // Mostrar sección de películas
  document.getElementById('browse-platforms').style.display = 'none';
  document.getElementById('platform-movies').style.display = 'block';
}

function reproducir(movieId) {
  const playerUrl = `https://jjmovies.lat/player.html?movie=${movieId}&api=${API_KEY}`;
  const playerContainer = document.getElementById('player-container');
  const playerIframe = document.getElementById('player-iframe');

  playerIframe.src = playerUrl;
  playerContainer.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarReproductor() {
  const playerContainer = document.getElementById('player-container');
  const playerIframe = document.getElementById('player-iframe');

  playerIframe.src = '';
  playerContainer.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function buscar() {
  const query = document.getElementById('searchInput').value;
  if (query) {
    alert(`Buscando: "${query}" (funcionalidad de búsqueda por implementar)`);
    // Aquí podrías redirigir a un resultado de búsqueda o filtrar películas
  }
}
