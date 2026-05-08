'use strict';

const STORAGE_KEY = 'kitsuneDexDataV2';
const SEARCH_DEBOUNCE_MS = 180;
const FALLBACK_IMAGE = 'https://placehold.co/600x900/0b1226/e8eeff?text=KitsuneDex';

const toast = document.getElementById('toast');
const clickAudio = document.getElementById('clickAudio');
const notifyAudio = document.getElementById('notifyAudio');

const STATUS_CYCLE = ['Watching', 'Completed', 'On Hold', 'Dropped'];

const appState = {
  filter: 'All',
  search: '',
  searchDebounceTimer: null,
  selectedAnimeId: null,
  notesAnimeId: null,
  deleteAnimeId: null,
  countdownTimer: null,
  listRenderQueued: false,
  trendRenderQueued: false,
  catalog: [
    {
      id: 'op',
      title: 'One Piece',
      image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
      banner: 'https://images5.alphacoders.com/606/606263.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'East Blue', totalEpisodes: 61, releaseDate: '1999-10-20', released: true },
        { number: 2, title: 'Grand Line', totalEpisodes: 90, releaseDate: '2001-03-10', released: true },
        { number: 3, title: 'Wano / Egghead', totalEpisodes: 949, releaseDate: '2003-01-12', released: true, nextEpisodeDate: '2026-05-16T10:00:00Z' }
      ],
      movies: [
        { id: 'op-red', title: 'Film Red', afterSeason: 2, releaseDate: '2022-08-06T00:00:00Z' }
      ],
      currentSeason: 3,
      currentEpisode: 0,
      totalEpisodes: 1100,
      status: 'Watching',
      nextReleaseDate: '2026-05-16T10:00:00Z',
      isFinished: false,
      isDiscontinued: false,
      notes: '',
      favorite: false,
      genres: ['Adventure', 'Action', 'Fantasy'],
      rating: 8.7,
      studio: 'Toei Animation',
      releaseDate: '1999-10-20',
      summary: 'Monkey D. Luffy sails with the Straw Hat crew in search of the ultimate treasure.',
      nextSeasonUncertain: false
    },
    {
      id: 'ds',
      title: 'Demon Slayer',
      image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
      banner: 'https://images7.alphacoders.com/100/1007550.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'Tanjiro Kamado, Unwavering Resolve Arc', totalEpisodes: 26, releaseDate: '2019-04-06', released: true },
        { number: 2, title: 'Entertainment District Arc', totalEpisodes: 11, releaseDate: '2021-12-05', released: true },
        { number: 3, title: 'Swordsmith Village Arc', totalEpisodes: 11, releaseDate: '2023-04-09', released: true },
        { number: 4, title: 'Hashira Training Arc', totalEpisodes: 8, releaseDate: '2024-05-12', released: true },
        { number: 5, title: 'Infinity Castle Arc', totalEpisodes: 12, releaseDate: '2026-07-21T00:00:00Z', released: false }
      ],
      movies: [
        { id: 'ds-mugen', title: 'Mugen Train', afterSeason: 1, releaseDate: '2020-10-16T00:00:00Z' }
      ],
      currentSeason: 4,
      currentEpisode: 0,
      totalEpisodes: 68,
      status: 'Watching',
      nextReleaseDate: '2026-07-21T00:00:00Z',
      isFinished: false,
      isDiscontinued: false,
      notes: '',
      favorite: false,
      genres: ['Action', 'Supernatural', 'Drama'],
      rating: 8.9,
      studio: 'ufotable',
      releaseDate: '2019-04-06',
      summary: 'Tanjiro Kamado joins the Demon Slayer Corps to save his sister and fight demons.',
      nextSeasonUncertain: false
    },
    {
      id: 'aot',
      title: 'Attack on Titan',
      image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
      banner: 'https://images8.alphacoders.com/532/532559.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'Season 1', totalEpisodes: 25, releaseDate: '2013-04-07', released: true },
        { number: 2, title: 'Season 2', totalEpisodes: 12, releaseDate: '2017-04-01', released: true },
        { number: 3, title: 'Season 3', totalEpisodes: 22, releaseDate: '2018-07-23', released: true },
        { number: 4, title: 'Final Season', totalEpisodes: 35, releaseDate: '2020-12-07', released: true }
      ],
      movies: [],
      currentSeason: 4,
      currentEpisode: 0,
      totalEpisodes: 94,
      status: 'Completed',
      nextReleaseDate: null,
      isFinished: true,
      isDiscontinued: false,
      notes: '',
      favorite: false,
      genres: ['Action', 'Drama', 'Mystery'],
      rating: 9.1,
      studio: 'WIT Studio / MAPPA',
      releaseDate: '2013-04-07',
      summary: 'Humanity fights for survival behind walls while uncovering the truth of Titans.',
      nextSeasonUncertain: false
    },
    {
      id: 'jujutsu',
      title: 'Jujutsu Kaisen',
      image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
      banner: 'https://images6.alphacoders.com/110/1105027.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'Season 1', totalEpisodes: 24, releaseDate: '2020-10-03', released: true },
        { number: 2, title: 'Hidden Inventory/Shibuya Incident', totalEpisodes: 23, releaseDate: '2023-07-06', released: true },
        { number: 3, title: 'Culling Game', totalEpisodes: 24, releaseDate: '2026-10-05T00:00:00Z', released: false }
      ],
      movies: [
        { id: 'jjk0', title: 'Jujutsu Kaisen 0', afterSeason: 1, releaseDate: '2021-12-24T00:00:00Z' }
      ],
      currentSeason: 2,
      currentEpisode: 0,
      totalEpisodes: 47,
      status: 'Watching',
      nextReleaseDate: '2026-10-05T00:00:00Z',
      isFinished: false,
      isDiscontinued: false,
      notes: '',
      favorite: false,
      genres: ['Action', 'Dark Fantasy'],
      rating: 8.6,
      studio: 'MAPPA',
      releaseDate: '2020-10-03',
      summary: 'Yuji Itadori enters a world of curses and sorcerers after consuming a cursed relic.',
      nextSeasonUncertain: false
    },
    {
      id: 'vinland',
      title: 'Vinland Saga',
      image: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
      banner: 'https://images4.alphacoders.com/103/1033285.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'Season 1', totalEpisodes: 24, releaseDate: '2019-07-08', released: true },
        { number: 2, title: 'Season 2', totalEpisodes: 24, releaseDate: '2023-01-10', released: true },
        { number: 3, title: 'Season 3', totalEpisodes: 24, releaseDate: null, released: false }
      ],
      movies: [],
      currentSeason: 2,
      currentEpisode: 0,
      totalEpisodes: 48,
      status: 'Watching',
      nextReleaseDate: null,
      isFinished: false,
      isDiscontinued: false,
      notes: '',
      favorite: false,
      genres: ['Historical', 'Action', 'Drama'],
      rating: 8.8,
      studio: 'WIT Studio / MAPPA',
      releaseDate: '2019-07-08',
      summary: 'A young warrior seeks vengeance in a brutal era of Viking conquest.',
      nextSeasonUncertain: true
    },
    {
      id: 'ngnl',
      title: 'No Game No Life',
      image: 'https://cdn.myanimelist.net/images/anime/1074/111944.jpg',
      banner: 'https://images7.alphacoders.com/570/570598.jpg',
      type: 'Series',
      seasons: [
        { number: 1, title: 'Season 1', totalEpisodes: 12, releaseDate: '2014-04-09', released: true },
        { number: 2, title: 'Season 2', totalEpisodes: 12, releaseDate: null, released: false }
      ],
      movies: [
        { id: 'ngnl-zero', title: 'No Game No Life: Zero', afterSeason: 1, releaseDate: '2017-07-15T00:00:00Z' }
      ],
      currentSeason: 1,
      currentEpisode: 0,
      totalEpisodes: 12,
      status: 'On Hold',
      nextReleaseDate: null,
      isFinished: false,
      isDiscontinued: true,
      notes: '',
      favorite: false,
      genres: ['Fantasy', 'Isekai'],
      rating: 8.1,
      studio: 'Madhouse',
      releaseDate: '2014-04-09',
      summary: 'Gamer siblings are transported to a world where everything is decided by games.',
      nextSeasonUncertain: true
    }
  ],
  data: {
    list: []
  }
};

function safePlay(audio) {
  if (!audio) return;
  clickAudio?.pause();
  notifyAudio?.pause();
  if (clickAudio) clickAudio.currentTime = 0;
  if (notifyAudio) notifyAudio.currentTime = 0;
  audio.play().catch(() => {});
}

function clickSound() {
  safePlay(clickAudio);
}

function notifySound() {
  safePlay(notifyAudio);
}

function showToast(message) {
  toast.textContent = message || 'Done';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function esc(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeImageUrl(url) {
  const value = String(url || '').trim();
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('./') || value.startsWith('/')) {
    return value;
  }
  return FALLBACK_IMAGE;
}

function dateText(value) {
  if (!value) return 'No official announcement yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No official announcement yet';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCountdown(dateString) {
  if (!dateString) return 'No countdown';
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return 'No countdown';
  const diff = target - Date.now();
  if (diff <= 0) return 'Now streaming';
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  return `${d}d ${h}h ${m}m`;
}

function statusToClass(status) {
  const map = {
    Watching: 'watching',
    Completed: 'completed',
    'On Hold': 'on-hold',
    Dropped: 'dropped'
  };
  return map[status] || 'watching';
}

function percentage(watched, total) {
  if (!total || total < 1) return 0;
  return Math.min(100, Math.round((watched / total) * 100));
}

function getCatalogById(id) {
  return appState.catalog.find((anime) => anime.id === id) || null;
}

function getListAnime(id) {
  return appState.data.list.find((anime) => anime.id === id) || null;
}

function getMergedAnimeById(id) {
  const source = getCatalogById(id);
  const saved = getListAnime(id);
  if (!source) return saved;
  if (!saved) return source;
  return { ...source, ...saved };
}

function normalizeCatalogAnime(anime) {
  if (!anime || typeof anime !== 'object') return null;
  if (!anime.id || !anime.title) return null;
  const seasons = Array.isArray(anime.seasons) ? anime.seasons.filter((s) => s && Number(s.totalEpisodes) > 0) : [];
  const movies = Array.isArray(anime.movies) ? anime.movies.filter((m) => m && m.id && m.title) : [];
  const totalEpisodes = seasons.reduce((sum, season) => sum + Number(season.totalEpisodes || 0), 0) || Number(anime.totalEpisodes || 1);

  return {
    ...anime,
    image: safeImageUrl(anime.image),
    banner: safeImageUrl(anime.banner || anime.image),
    seasons,
    movies,
    totalEpisodes
  };
}

function sanitizeCatalog() {
  appState.catalog = appState.catalog.map(normalizeCatalogAnime).filter(Boolean);
}

function createListAnime(source, preferredStatus = 'Watching') {
  const firstSeason = source.seasons[0];
  return {
    id: source.id,
    title: source.title,
    image: source.image,
    banner: source.banner,
    type: source.type || 'Series',
    seasons: source.seasons,
    movies: source.movies,
    currentSeason: Number(firstSeason?.number || 1),
    currentEpisode: 0,
    totalEpisodes: source.totalEpisodes,
    status: preferredStatus,
    nextReleaseDate: source.nextReleaseDate || null,
    isFinished: Boolean(source.isFinished),
    isDiscontinued: Boolean(source.isDiscontinued),
    notes: '',
    favorite: false,
    genres: source.genres || [],
    rating: source.rating ?? 'N/A',
    studio: source.studio || 'Unknown',
    releaseDate: source.releaseDate || null,
    summary: source.summary || 'No storyline summary available.',
    watchedSeasons: [],
    watchedMovies: []
  };
}

function normalizeListAnime(item) {
  const source = getCatalogById(item.id);
  if (!source || !item || !item.id) return null;
  const merged = { ...createListAnime(source), ...item };
  merged.seasons = source.seasons;
  merged.movies = source.movies;
  merged.image = safeImageUrl(merged.image || source.image);
  merged.banner = safeImageUrl(merged.banner || source.banner || source.image);
  merged.currentSeason = Number(merged.currentSeason || source.currentSeason || 1);
  merged.currentEpisode = Math.max(0, Number(merged.currentEpisode || 0));
  merged.status = STATUS_CYCLE.includes(merged.status) ? merged.status : 'Watching';
  merged.notes = String(merged.notes || '');
  merged.favorite = Boolean(merged.favorite);
  merged.watchedSeasons = Array.isArray(merged.watchedSeasons) ? merged.watchedSeasons : [];
  merged.watchedMovies = Array.isArray(merged.watchedMovies) ? merged.watchedMovies : [];
  return merged;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.list)) {
      appState.data.list = parsed.list.map(normalizeListAnime).filter(Boolean);
    }
  } catch (_err) {
    appState.data.list = [];
  }
}

function writeStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ list: appState.data.list }));
}

function getSeason(anime, seasonNumber) {
  return anime.seasons.find((s) => Number(s.number) === Number(seasonNumber)) || null;
}

function getNextSeason(anime, seasonNumber) {
  return anime.seasons.find((s) => Number(s.number) > Number(seasonNumber)) || null;
}

function getMovieAfterSeason(anime, seasonNumber) {
  return anime.movies.find((movie) => Number(movie.afterSeason) === Number(seasonNumber)) || null;
}

function hasWatchedMovie(anime, movieId) {
  return anime.watchedMovies.includes(movieId);
}

function isReleased(dateString) {
  if (!dateString) return false;
  const value = new Date(dateString).getTime();
  return !Number.isNaN(value) && value <= Date.now();
}

function getCurrentSeasonProgress(anime) {
  const season = getSeason(anime, anime.currentSeason) || anime.seasons[0];
  const total = Number(season?.totalEpisodes || 1);
  const watched = Math.min(Number(anime.currentEpisode || 0), total);
  return { season, watched, total };
}

function getTotalWatchedEpisodes(anime) {
  const completedSeasonEpisodes = anime.watchedSeasons.reduce((sum, seasonNumber) => {
    const season = getSeason(anime, seasonNumber);
    return sum + Number(season?.totalEpisodes || 0);
  }, 0);

  const current = getCurrentSeasonProgress(anime);
  return completedSeasonEpisodes + current.watched;
}

function getMovieState(anime, movie) {
  if (hasWatchedMovie(anime, movie.id)) return 'Completed';
  if (!isReleased(movie.releaseDate)) return 'Coming Soon';
  return 'Released';
}

function getNextReleaseInfo(anime) {
  const seasonProgress = getCurrentSeasonProgress(anime);
  if (seasonProgress.season?.nextEpisodeDate) {
    return {
      label: `Next Episode (${seasonProgress.season.title})`,
      date: seasonProgress.season.nextEpisodeDate
    };
  }

  const movie = getMovieAfterSeason(anime, anime.currentSeason);
  if (movie && !hasWatchedMovie(anime, movie.id)) {
    return {
      label: `Movie: ${movie.title}`,
      date: movie.releaseDate
    };
  }

  const nextSeason = getNextSeason(anime, anime.currentSeason);
  if (nextSeason) {
    return {
      label: `Season ${nextSeason.number}`,
      date: nextSeason.releaseDate || anime.nextReleaseDate || null
    };
  }

  return {
    label: anime.isFinished ? 'Full Completed' : 'No official announcement yet',
    date: anime.nextReleaseDate || null
  };
}

function getLifecycleMessage(anime) {
  if (anime.isDiscontinued) return 'Anime was discontinued';

  const seasonProgress = getCurrentSeasonProgress(anime);
  const finishedCurrentSeason = seasonProgress.watched >= seasonProgress.total;
  const nextSeason = getNextSeason(anime, anime.currentSeason);

  if (anime.isFinished && finishedCurrentSeason && !nextSeason) return 'Full Completed';

  if (finishedCurrentSeason) {
    if (nextSeason?.released) {
      return `Season ${anime.currentSeason} Complete • Now Watching Season ${nextSeason.number}`;
    }

    if (nextSeason && !nextSeason.released && nextSeason.releaseDate) {
      return `Season ${anime.currentSeason} Complete • Season ${nextSeason.number} Coming Soon`;
    }

    if (anime.nextSeasonUncertain) {
      return 'Next season maybe discontinued';
    }

    return 'No official announcement yet';
  }

  return anime.status || 'Watching';
}

function ensureInList(animeId, preferredStatus = 'Watching') {
  let item = getListAnime(animeId);
  if (item) return item;
  const source = getCatalogById(animeId);
  if (!source) return null;
  item = createListAnime(source, preferredStatus);
  appState.data.list.push(item);
  writeStorage();
  return item;
}

function addAnimeToList(animeId, preferredStatus = 'Watching') {
  const source = getCatalogById(animeId);
  if (!source) return;
  const created = !getListAnime(animeId);
  ensureInList(animeId, preferredStatus);
  writeStorage();
  queueListRender();
  if (created) {
    showToast(`${source.title} added to My List`);
    notifySound();
  } else {
    showToast(`${source.title} updated`);
  }
}

function advanceAfterSeasonCompletion(anime) {
  const season = getSeason(anime, anime.currentSeason);
  if (!season) return;

  if (!anime.watchedSeasons.includes(season.number)) {
    anime.watchedSeasons.push(season.number);
  }

  const movie = getMovieAfterSeason(anime, season.number);
  if (movie && !hasWatchedMovie(anime, movie.id)) {
    const state = getMovieState(anime, movie);
    if (state === 'Released') {
      anime.watchedMovies.push(movie.id);
      showToast(`Movie completed: ${movie.title}`);
      notifySound();
    } else {
      anime.status = 'On Hold';
      showToast(`${movie.title} • Coming Soon`);
      return;
    }
  }

  const nextSeason = getNextSeason(anime, season.number);
  if (nextSeason?.released) {
    anime.currentSeason = nextSeason.number;
    anime.currentEpisode = 0;
    anime.status = 'Watching';
    showToast(`Season ${season.number} complete • Now watching Season ${nextSeason.number}`);
    return;
  }

  if (nextSeason && !nextSeason.released) {
    anime.status = 'On Hold';
    showToast(`Season ${season.number} complete • Season ${nextSeason.number} coming soon`);
    return;
  }

  anime.status = anime.isDiscontinued ? 'Dropped' : 'Completed';
  showToast(anime.isDiscontinued ? 'Anime was discontinued' : 'Full Completed');
}

function updateEpisode(animeId) {
  const anime = ensureInList(animeId, 'Watching');
  if (!anime) return;

  const seasonProgress = getCurrentSeasonProgress(anime);
  if (!seasonProgress.season) return;

  anime.currentEpisode = Math.min(seasonProgress.watched + 1, seasonProgress.total);
  if (anime.currentEpisode >= seasonProgress.total) {
    advanceAfterSeasonCompletion(anime);
  } else if (anime.status !== 'Watching') {
    anime.status = 'Watching';
  }

  writeStorage();
  queueListRender();
  queueTrendRender();
  if (appState.selectedAnimeId === animeId) fillDetailsModal(animeId);
}

function cycleStatus(animeId) {
  const anime = ensureInList(animeId, 'Watching');
  if (!anime) return;
  const idx = STATUS_CYCLE.indexOf(anime.status);
  anime.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  writeStorage();
  queueListRender();
  if (appState.selectedAnimeId === animeId) fillDetailsModal(animeId);
}

function toggleFavorite(animeId) {
  const anime = ensureInList(animeId, 'Watching');
  if (!anime) return;
  anime.favorite = !anime.favorite;
  writeStorage();
  queueListRender();
  if (appState.selectedAnimeId === animeId) fillDetailsModal(animeId);
}

function openNotes(animeId) {
  const anime = ensureInList(animeId, 'Watching');
  if (!anime) return;
  appState.notesAnimeId = animeId;
  document.getElementById('notesInput').value = anime.notes || '';
  document.getElementById('notesModal').classList.add('show');
}

function closeNotes() {
  document.getElementById('notesModal').classList.remove('show');
  appState.notesAnimeId = null;
}

function saveNotes() {
  const anime = getListAnime(appState.notesAnimeId);
  if (!anime) return;
  anime.notes = document.getElementById('notesInput').value.trim();
  writeStorage();
  queueListRender();
  if (appState.selectedAnimeId === anime.id) fillDetailsModal(anime.id);
  closeNotes();
  showToast('Notes saved');
  notifySound();
}

function askDelete(animeId) {
  appState.deleteAnimeId = animeId;
  document.getElementById('confirmModal').classList.add('show');
}

function cancelDelete() {
  appState.deleteAnimeId = null;
  document.getElementById('confirmModal').classList.remove('show');
}

function confirmDelete() {
  const id = appState.deleteAnimeId;
  appState.data.list = appState.data.list.filter((anime) => anime.id !== id);
  writeStorage();
  queueListRender();
  cancelDelete();
  showToast('Anime removed');
}

function filteredCatalog() {
  const query = appState.search.toLowerCase();
  return appState.catalog.filter((anime) => {
    if (!anime?.id || !anime?.title) return false;
    return anime.title.toLowerCase().includes(query);
  });
}

function sortedList() {
  return [...appState.data.list].sort((a, b) => Number(b.favorite) - Number(a.favorite));
}

function filteredList() {
  const query = appState.search.toLowerCase();
  return sortedList().filter((anime) => {
    if (!anime?.id || !anime?.title) return false;
    const statusOk = appState.filter === 'All' ? true : appState.filter === 'Favorites' ? anime.favorite : anime.status === appState.filter;
    const searchOk = anime.title.toLowerCase().includes(query);
    return statusOk && searchOk;
  });
}

function renderTrending() {
  appState.trendRenderQueued = false;
  const row = document.getElementById('trendingRow');
  const list = filteredCatalog();

  if (!list.length) {
    row.innerHTML = '<div class="empty">No trending anime match this search.</div>';
    return;
  }

  row.innerHTML = list.map((anime) => {
    const onList = Boolean(getListAnime(anime.id));
    return `
      <article class="trend-card" data-id="${esc(anime.id)}">
        <img src="${safeImageUrl(anime.image)}" alt="${esc(anime.title)}" loading="lazy" />
        <div class="body">
          <h3 class="trend-title">${esc(anime.title)}</h3>
          <p class="rating">⭐ ${esc(anime.rating)} ${onList ? '• In List' : ''}</p>
        </div>
      </article>
    `;
  }).join('');
}

function renderList() {
  appState.listRenderQueued = false;
  const grid = document.getElementById('myListGrid');
  const list = filteredList();

  if (!list.length) {
    grid.innerHTML = '<div class="empty">No anime in this view yet.</div>';
    return;
  }

  grid.innerHTML = list.map((anime) => {
    const totalWatched = getTotalWatchedEpisodes(anime);
    const totalEpisodes = Number(anime.totalEpisodes || 1);
    const progress = percentage(totalWatched, totalEpisodes);
    const statusClass = statusToClass(anime.status);
    const lifecycle = getLifecycleMessage(anime);
    const safeNotes = esc(anime.notes || 'No notes yet');

    return `
      <article class="list-card">
        <img class="list-thumb" src="${safeImageUrl(anime.image)}" alt="${esc(anime.title)}" loading="lazy" />
        <div class="list-main">
          <div class="row">
            <h3 title="${esc(anime.title)}">${esc(anime.title)}</h3>
            <button class="more-btn" data-action="status" data-id="${esc(anime.id)}" aria-label="Cycle status">↻</button>
          </div>
          <span class="badge ${statusClass}">${esc(anime.status)}</span>
          <p class="small">${esc(lifecycle)}</p>
          <p class="small">Episodes ${totalWatched}/${totalEpisodes}</p>
          <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
          <p class="small list-note" title="${safeNotes}">📝 ${safeNotes}</p>

          <div class="actions">
            <button data-action="details" data-id="${esc(anime.id)}">Details</button>
            <button data-action="episode" data-id="${esc(anime.id)}">+ Episode</button>
            <button class="heart-btn" data-action="favorite" data-id="${esc(anime.id)}" aria-label="${anime.favorite ? 'Unfavorite' : 'Favorite'}">${anime.favorite ? '❤️' : '🤍'}</button>
            <button data-action="notes" data-id="${esc(anime.id)}">Notes</button>
            <button data-action="status" data-id="${esc(anime.id)}">Status</button>
            <button data-action="delete" data-id="${esc(anime.id)}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function queueListRender() {
  if (appState.listRenderQueued) return;
  appState.listRenderQueued = true;
  requestAnimationFrame(renderList);
}

function queueTrendRender() {
  if (appState.trendRenderQueued) return;
  appState.trendRenderQueued = true;
  requestAnimationFrame(renderTrending);
}

function setActiveTab(filter) {
  appState.filter = filter;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  queueListRender();
}

function activateNav(name) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.nav === name);
  });
}

function goHome() {
  document.getElementById('homeSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateNav('home');
}

function goExplore() {
  document.getElementById('trendingSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateNav('explore');
}

function goMyList() {
  document.getElementById('listSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateNav('list');
}

function goProfile() {
  setActiveTab('Favorites');
  goMyList();
  showToast('Showing favorites');
  activateNav('profile');
}

function fillMovieTimeline(anime) {
  const timeline = document.getElementById('detailsMovieTimeline');
  if (!anime.movies.length) {
    timeline.innerHTML = '<li>No movies in timeline.</li>';
    return;
  }

  timeline.innerHTML = anime.movies.map((movie) => {
    const state = getMovieState(anime, movie);
    const countdown = state === 'Coming Soon' ? ` • ${formatCountdown(movie.releaseDate)}` : '';
    return `<li>${esc(movie.title)} • ${esc(state)}${esc(countdown)}</li>`;
  }).join('');
}

function fillDetailsModal(animeId) {
  const merged = getMergedAnimeById(animeId);
  if (!merged) return;

  const anime = ensureInList(animeId, merged.status || 'Watching') || merged;
  const totalWatched = getTotalWatchedEpisodes(anime);
  const totalEpisodes = Number(anime.totalEpisodes || 1);
  const remaining = Math.max(0, totalEpisodes - totalWatched);
  const progressValue = percentage(totalWatched, totalEpisodes);
  const release = getNextReleaseInfo(anime);

  document.getElementById('detailsBanner').src = safeImageUrl(anime.banner || anime.image);
  document.getElementById('detailsImage').src = safeImageUrl(anime.image);
  document.getElementById('detailsTitle').textContent = anime.title || 'Untitled Anime';
  document.getElementById('detailsSummary').textContent = anime.summary || 'No storyline summary available.';
  document.getElementById('detailsGenres').textContent = (anime.genres || []).join(', ') || 'Unknown';
  document.getElementById('detailsRating').textContent = String(anime.rating ?? 'N/A');
  document.getElementById('detailsStudio').textContent = anime.studio || 'Unknown';
  document.getElementById('detailsReleaseDate').textContent = dateText(anime.releaseDate);
  document.getElementById('detailsTotalSeasons').textContent = String(anime.seasons.length);
  document.getElementById('detailsWatchedSeasons').textContent = String(anime.watchedSeasons.length);
  document.getElementById('detailsMissingSeasons').textContent = String(Math.max(0, anime.seasons.length - anime.watchedSeasons.length));
  document.getElementById('detailsWatchedEpisodes').textContent = String(totalWatched);
  document.getElementById('detailsRemainingEpisodes').textContent = String(remaining);
  document.getElementById('detailsNextRelease').textContent = release.label;
  document.getElementById('detailsCountdown').textContent = formatCountdown(release.date);
  document.getElementById('detailsStatus').textContent = getLifecycleMessage(anime);
  document.getElementById('detailsProgressText').textContent = `${totalWatched}/${totalEpisodes} episodes watched`;
  document.getElementById('detailsProgressBar').style.width = `${progressValue}%`;
  document.getElementById('detailsNotesPreview').textContent = anime.notes || 'No notes yet.';
  document.getElementById('modalFavoriteToggle').textContent = anime.favorite ? '❤️' : '🤍';

  fillMovieTimeline(anime);
}

function openModal(animeId) {
  if (!getMergedAnimeById(animeId)) return;
  appState.selectedAnimeId = animeId;
  fillDetailsModal(animeId);
  document.getElementById('detailsModal').classList.add('show');

  clearInterval(appState.countdownTimer);
  appState.countdownTimer = setInterval(() => {
    if (!appState.selectedAnimeId) return;
    fillDetailsModal(appState.selectedAnimeId);
  }, 60000);
}

function closeModal() {
  document.getElementById('detailsModal').classList.remove('show');
  appState.selectedAnimeId = null;
  clearInterval(appState.countdownTimer);
}

function setupSectionObserver() {
  const sections = [
    { id: 'homeSection', nav: 'home' },
    { id: 'trendingSection', nav: 'explore' },
    { id: 'listSection', nav: 'list' }
  ];

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const match = sections.find((s) => s.id === visible.target.id);
    if (match) activateNav(match.nav);
  }, { threshold: [0.3, 0.55, 0.8] });

  sections.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element) observer.observe(element);
  });
}

function renderSkeletons() {
  document.getElementById('trendingRow').innerHTML = '<div class="skeleton-card" style="min-width:145px"></div><div class="skeleton-card" style="min-width:145px"></div><div class="skeleton-card" style="min-width:145px"></div>';
  document.getElementById('myListGrid').innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
}

function ensureDefaultList() {
  if (appState.data.list.length) return;

  const defaults = [
    { id: 'op', status: 'Watching', currentSeason: 3, currentEpisode: 920, favorite: true, notes: 'Egghead arc is peak.' },
    { id: 'ds', status: 'On Hold', currentSeason: 4, currentEpisode: 8, notes: 'Waiting for next season release.' }
  ];

  defaults.forEach((seed) => {
    const source = getCatalogById(seed.id);
    if (!source) return;
    const item = createListAnime(source, seed.status);
    item.currentSeason = seed.currentSeason;
    item.currentEpisode = seed.currentEpisode;
    item.favorite = Boolean(seed.favorite);
    item.notes = seed.notes || '';
    for (let s = 1; s < seed.currentSeason; s += 1) {
      item.watchedSeasons.push(s);
    }
    appState.data.list.push(item);
  });

  writeStorage();
}

function bindEvents() {
  document.getElementById('homeBtn').addEventListener('click', () => {
    clickSound();
    goHome();
  });

  document.getElementById('myListBtn').addEventListener('click', () => {
    clickSound();
    goMyList();
  });

  document.getElementById('topSearchBtn').addEventListener('click', () => {
    clickSound();
    document.getElementById('searchInput').focus();
  });

  document.getElementById('searchInput').addEventListener('input', (event) => {
    clearTimeout(appState.searchDebounceTimer);
    const value = event.target.value.trim();
    appState.searchDebounceTimer = setTimeout(() => {
      appState.search = value;
      queueTrendRender();
      queueListRender();
    }, SEARCH_DEBOUNCE_MS);
  });

  document.getElementById('searchInput').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    clickSound();
    clearTimeout(appState.searchDebounceTimer);
    appState.search = event.target.value.trim();
    queueTrendRender();
    queueListRender();
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    clickSound();
    clearTimeout(appState.searchDebounceTimer);
    appState.search = document.getElementById('searchInput').value.trim();
    queueTrendRender();
    queueListRender();
  });

  document.getElementById('statusTabs').addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (!tab) return;
    clickSound();
    setActiveTab(tab.dataset.filter);
  });

  document.getElementById('trendingRow').addEventListener('click', (event) => {
    const card = event.target.closest('.trend-card');
    if (!card) return;
    clickSound();
    openModal(card.dataset.id);
  });

  document.getElementById('myListGrid').addEventListener('click', (event) => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    clickSound();
    const { action, id } = target.dataset;
    if (action === 'details') openModal(id);
    if (action === 'episode') updateEpisode(id);
    if (action === 'favorite') toggleFavorite(id);
    if (action === 'notes') openNotes(id);
    if (action === 'delete') askDelete(id);
    if (action === 'status') cycleStatus(id);
  });

  document.getElementById('modalAddToList').addEventListener('click', () => {
    clickSound();
    if (!appState.selectedAnimeId) return;
    addAnimeToList(appState.selectedAnimeId, 'Watching');
    fillDetailsModal(appState.selectedAnimeId);
  });

  document.getElementById('modalIncEpisode').addEventListener('click', () => {
    clickSound();
    if (!appState.selectedAnimeId) return;
    updateEpisode(appState.selectedAnimeId);
  });

  document.getElementById('modalOpenNotes').addEventListener('click', () => {
    clickSound();
    if (!appState.selectedAnimeId) return;
    openNotes(appState.selectedAnimeId);
  });

  document.getElementById('modalFavoriteToggle').addEventListener('click', () => {
    clickSound();
    if (!appState.selectedAnimeId) return;
    toggleFavorite(appState.selectedAnimeId);
    fillDetailsModal(appState.selectedAnimeId);
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    clickSound();
    closeModal();
  });

  document.getElementById('modalCloseSecondary').addEventListener('click', () => {
    clickSound();
    closeModal();
  });

  document.getElementById('saveNotes').addEventListener('click', () => {
    clickSound();
    saveNotes();
  });

  document.getElementById('cancelNotes').addEventListener('click', () => {
    clickSound();
    closeNotes();
  });

  document.getElementById('confirmDelete').addEventListener('click', () => {
    clickSound();
    confirmDelete();
  });

  document.getElementById('cancelDelete').addEventListener('click', () => {
    clickSound();
    cancelDelete();
  });

  document.querySelector('.bottom-nav').addEventListener('click', (event) => {
    const navBtn = event.target.closest('.nav-item');
    if (!navBtn) return;
    clickSound();
    const nav = navBtn.dataset.nav;
    if (nav === 'home') goHome();
    if (nav === 'explore') goExplore();
    if (nav === 'list') goMyList();
    if (nav === 'profile') goProfile();
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      if (modal.id === 'detailsModal') closeModal();
      if (modal.id === 'notesModal') closeNotes();
      if (modal.id === 'confirmModal') cancelDelete();
    });
  });
}

function hideLoadingScreen() {
  const loading = document.getElementById('loadingScreen');
  setTimeout(() => loading.classList.add('hide'), 650);
}

function init() {
  sanitizeCatalog();
  renderSkeletons();
  readStorage();
  ensureDefaultList();
  bindEvents();
  setupSectionObserver();

  setTimeout(() => {
    renderTrending();
    renderList();
  }, 260);

  hideLoadingScreen();
}

window.addEventListener('DOMContentLoaded', init);
