'use strict';

const STORAGE_KEY = 'kitsuneDexDataV1';
const SEARCH_DEBOUNCE_MS = 180;
const toast = document.getElementById('toast');
const clickAudio = document.getElementById('clickAudio');
const notifyAudio = document.getElementById('notifyAudio');

const appState = {
  filter: 'All',
  search: '',
  searchDebounceTimer: null,
  selectedAnimeId: null,
  notesAnimeId: null,
  deleteAnimeId: null,
  countdownTimer: null,
  data: {
    list: [],
    trending: [
      {
        id: 'op',
        title: 'One Piece',
        image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
        description: 'Monkey D. Luffy sails with the Straw Hat crew in search of the ultimate treasure.',
        genre: ['Adventure', 'Action', 'Fantasy'],
        rating: 8.7,
        episodes: 1100,
        seasons: 21,
        releaseDate: '1999-10-20',
        nextSeasonDate: '2026-09-10',
        status: 'Ongoing',
        currentSeason: 21
      },
      {
        id: 'ds',
        title: 'Demon Slayer',
        image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        description: 'Tanjiro Kamado joins the Demon Slayer Corps to save his sister and fight demons.',
        genre: ['Action', 'Supernatural', 'Drama'],
        rating: 8.9,
        episodes: 63,
        seasons: 4,
        releaseDate: '2019-04-06',
        nextSeasonDate: '2026-07-21',
        status: 'Ongoing',
        currentSeason: 4
      },
      {
        id: 'aot',
        title: 'Attack on Titan',
        image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
        description: 'Humanity fights for survival behind walls while uncovering the truth of Titans.',
        genre: ['Action', 'Drama', 'Mystery'],
        rating: 9.1,
        episodes: 94,
        seasons: 4,
        releaseDate: '2013-04-07',
        nextSeasonDate: 'N/A',
        status: 'Completed',
        currentSeason: 4
      },
      {
        id: 'jujutsu',
        title: 'Jujutsu Kaisen',
        image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        description: 'Yuji Itadori enters a world of curses and sorcerers after consuming a cursed relic.',
        genre: ['Action', 'Dark Fantasy'],
        rating: 8.6,
        episodes: 47,
        seasons: 2,
        releaseDate: '2020-10-03',
        nextSeasonDate: '2026-10-05',
        status: 'Ongoing',
        currentSeason: 2
      },
      {
        id: 'vinland',
        title: 'Vinland Saga',
        image: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
        description: 'A young warrior seeks vengeance in a brutal era of Viking conquest.',
        genre: ['Historical', 'Action', 'Drama'],
        rating: 8.8,
        episodes: 48,
        seasons: 2,
        releaseDate: '2019-07-08',
        nextSeasonDate: '2026-11-12',
        status: 'Ongoing',
        currentSeason: 2
      }
    ]
  }
};

function safePlay(audio) {
  if (!audio) return;
  clickAudio?.pause();
  notifyAudio?.pause();
  clickAudio && (clickAudio.currentTime = 0);
  notifyAudio && (notifyAudio.currentTime = 0);
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

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.list)) {
      appState.data.list = parsed.list;
    }
  } catch (_e) {
    appState.data.list = [];
  }
}

function writeStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ list: appState.data.list }));
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
  return 'https://placehold.co/600x340/0b1226/e8eeff?text=KitsuneDex';
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

function getListAnime(id) {
  return appState.data.list.find((a) => a.id === id);
}

function getMergedAnimeById(id) {
  return appState.data.list.find((x) => x.id === id) || appState.data.trending.find((x) => x.id === id) || null;
}

function missingSeasons(anime) {
  const totalSeasons = Number(anime.seasons) || 1;
  const currentSeason = Number(anime.currentSeason) || 1;
  return Math.max(0, totalSeasons - currentSeason);
}

function computeCountdown(dateString) {
  if (!dateString || dateString === 'N/A') return 'No upcoming season announced';
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return 'No upcoming season announced';
  const diff = target - Date.now();
  if (diff <= 0) return 'Now streaming';
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  return `${d}d ${h}h ${m}m remaining`;
}

function updateCountdownInModal() {
  const anime = getMergedAnimeById(appState.selectedAnimeId);
  if (!anime) return;
  const countdownEl = document.getElementById('detailsCountdown');
  countdownEl.textContent = computeCountdown(anime.nextSeasonDate);
}

function openModal(animeId) {
  const anime = getMergedAnimeById(animeId);
  if (!anime) return;

  appState.selectedAnimeId = animeId;
  const watchedEpisodes = Number(anime.watchedEpisodes || 0);
  const totalEpisodes = Number(anime.episodes || anime.totalEpisodes || 1);
  const progressValue = percentage(watchedEpisodes, totalEpisodes);

  document.getElementById('detailsImage').src = anime.image || '';
  document.getElementById('detailsTitle').textContent = anime.title || 'Untitled Anime';
  document.getElementById('detailsDescription').textContent = anime.description || 'No description available.';
  document.getElementById('detailsGenre').textContent = Array.isArray(anime.genre) ? anime.genre.join(', ') : 'Unknown';
  document.getElementById('detailsRating').textContent = String(anime.rating ?? 'Not rated');
  document.getElementById('detailsEpisodes').textContent = `${watchedEpisodes}/${totalEpisodes}`;
  document.getElementById('detailsSeasons').textContent = String(anime.seasons || 1);
  document.getElementById('detailsReleaseDate').textContent = anime.releaseDate || 'Unknown';
  document.getElementById('detailsNextSeason').textContent = anime.nextSeasonDate || 'N/A';
  document.getElementById('detailsStatus').textContent = anime.status || 'Watching';
  document.getElementById('detailsCurrentSeason').textContent = String(anime.currentSeason || 1);
  document.getElementById('detailsMissingSeasons').textContent = String(missingSeasons(anime));
  document.getElementById('detailsProgress').textContent = `${watchedEpisodes}/${totalEpisodes}`;
  document.getElementById('detailsProgressBar').style.width = `${progressValue}%`;
  document.getElementById('detailsModal').classList.add('show');

  clearInterval(appState.countdownTimer);
  updateCountdownInModal();
  appState.countdownTimer = setInterval(updateCountdownInModal, 60000);
}

function closeModal() {
  document.getElementById('detailsModal').classList.remove('show');
  clearInterval(appState.countdownTimer);
}

function upsertAnimeFromSource(source, preferredStatus = 'Watching') {
  const existing = getListAnime(source.id);
  if (existing) {
    existing.description = source.description || existing.description;
    existing.genre = source.genre || existing.genre;
    existing.rating = source.rating ?? existing.rating;
    existing.image = source.image || existing.image;
    existing.episodes = source.episodes || existing.episodes;
    existing.seasons = source.seasons || existing.seasons;
    existing.releaseDate = source.releaseDate || existing.releaseDate;
    existing.nextSeasonDate = source.nextSeasonDate || existing.nextSeasonDate;
    existing.currentSeason = source.currentSeason || existing.currentSeason;
    if (!existing.status) existing.status = preferredStatus;
    return existing;
  }

  const item = {
    id: source.id,
    title: source.title,
    image: source.image,
    description: source.description,
    genre: source.genre,
    rating: source.rating,
    episodes: Number(source.episodes) || 1,
    seasons: Number(source.seasons) || 1,
    releaseDate: source.releaseDate || 'Unknown',
    nextSeasonDate: source.nextSeasonDate || 'N/A',
    status: preferredStatus,
    watchedEpisodes: preferredStatus === 'Completed' ? Number(source.episodes) || 1 : 0,
    currentSeason: Number(source.currentSeason) || 1,
    notes: '',
    favorite: false
  };

  appState.data.list.push(item);
  return item;
}

function addAnimeToList(animeId, preferredStatus = 'Watching') {
  const source = getMergedAnimeById(animeId);
  if (!source) return;
  upsertAnimeFromSource(source, preferredStatus);
  writeStorage();
  renderList();
  showToast(`${source.title} saved to My List`);
  notifySound();
}

function setActiveTab(status) {
  appState.filter = status;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.filter === status);
  });
  renderList();
}

function updateEpisode(animeId) {
  const anime = getListAnime(animeId);
  if (!anime) return;
  anime.watchedEpisodes = Math.min((anime.watchedEpisodes || 0) + 1, anime.episodes || 1);
  if (anime.watchedEpisodes >= anime.episodes) {
    anime.status = 'Completed';
    anime.currentSeason = anime.seasons;
    showToast(`${anime.title} marked as Completed`);
  }
  writeStorage();
  renderList();
}

function cycleStatus(animeId) {
  const anime = getListAnime(animeId);
  if (!anime) return;
  const statuses = ['Watching', 'Completed', 'On Hold', 'Dropped'];
  const idx = statuses.indexOf(anime.status);
  anime.status = statuses[(idx + 1) % statuses.length];
  writeStorage();
  renderList();
}

function toggleFavorite(animeId) {
  const anime = getListAnime(animeId);
  if (!anime) return;
  anime.favorite = !anime.favorite;
  writeStorage();
  renderList();
}

function openNotes(animeId) {
  const anime = getListAnime(animeId);
  if (!anime) return;
  appState.notesAnimeId = animeId;
  document.getElementById('notesInput').value = anime.notes || '';
  document.getElementById('notesModal').classList.add('show');
}

function saveNotes() {
  const anime = getListAnime(appState.notesAnimeId);
  if (!anime) return;
  anime.notes = document.getElementById('notesInput').value.trim();
  writeStorage();
  renderList();
  closeNotes();
  showToast('Notes saved');
  notifySound();
}

function closeNotes() {
  document.getElementById('notesModal').classList.remove('show');
  appState.notesAnimeId = null;
}

function askDelete(animeId) {
  appState.deleteAnimeId = animeId;
  document.getElementById('confirmModal').classList.add('show');
}

function confirmDelete() {
  const removeId = appState.deleteAnimeId;
  appState.data.list = appState.data.list.filter((a) => a.id !== removeId);
  writeStorage();
  renderList();
  document.getElementById('confirmModal').classList.remove('show');
  appState.deleteAnimeId = null;
  showToast('Anime deleted');
}

function cancelDelete() {
  appState.deleteAnimeId = null;
  document.getElementById('confirmModal').classList.remove('show');
}

function renderTrending() {
  const row = document.getElementById('trendingRow');
  const query = appState.search.toLowerCase();
  const list = appState.data.trending.filter((anime) => anime.title.toLowerCase().includes(query));

  if (!list.length) {
    row.innerHTML = '<div class="empty">No trending anime match this search.</div>';
    return;
  }

  row.innerHTML = list.map((anime) => `
    <article class="trend-card" data-id="${anime.id}">
      <img src="${safeImageUrl(anime.image)}" alt="${esc(anime.title)}" loading="lazy" />
      <div class="body">
        <h3 class="trend-title">${esc(anime.title)}</h3>
        <p class="rating">⭐ ${esc(anime.rating)}</p>
      </div>
    </article>
  `).join('');
}

function sortedList() {
  return [...appState.data.list].sort((a, b) => Number(b.favorite) - Number(a.favorite));
}

function filteredList() {
  const query = appState.search.toLowerCase();
  return sortedList().filter((anime) => {
    const statusOk = appState.filter === 'All' ? true : anime.status === appState.filter;
    const searchOk = anime.title.toLowerCase().includes(query);
    return statusOk && searchOk;
  });
}

function renderList() {
  const grid = document.getElementById('myListGrid');
  const list = filteredList();

  if (!list.length) {
    grid.innerHTML = '<div class="empty">No anime in this view yet.</div>';
    return;
  }

  grid.innerHTML = list.map((anime) => {
    const progress = percentage(anime.watchedEpisodes, anime.episodes);
    const statusClass = statusToClass(anime.status);
    const notes = anime.notes ? anime.notes : 'No notes yet';
    const safeTitle = esc(anime.title);
    const safeNotes = esc(notes);

    return `
      <article class="list-card">
        <img class="list-thumb" src="${safeImageUrl(anime.image)}" alt="${safeTitle}" loading="lazy" />
        <div class="body list-main">
          <div class="row top-row">
            <h3>${anime.favorite ? '❤️ ' : ''}${safeTitle}</h3>
            <button class="more-btn" data-action="status" data-id="${anime.id}" aria-label="Change status">⋮</button>
          </div>
          <span class="badge ${statusClass}">${anime.status}</span>
          <p class="small">Episode ${anime.watchedEpisodes}/${anime.episodes}</p>
          <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
          <p class="small list-note" tabindex="0" title="${safeNotes}">📝 ${safeNotes}</p>

          <div class="actions">
            <button data-action="details" data-id="${anime.id}">Details</button>
            <button data-action="episode" data-id="${anime.id}">+ Episode</button>
            <button class="heart-btn" data-action="favorite" data-id="${anime.id}" aria-label="${anime.favorite ? 'Unfavorite anime' : 'Favorite anime'}">${anime.favorite ? '❤️' : '🤍'}</button>
            <button data-action="notes" data-id="${anime.id}">Edit Note</button>
            <button data-action="delete" data-id="${anime.id}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
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
  showToast('Profile center coming soon');
  activateNav('profile');
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

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(appState.searchDebounceTimer);
    appState.searchDebounceTimer = setTimeout(() => {
      appState.search = value;
      renderTrending();
      renderList();
    }, SEARCH_DEBOUNCE_MS);
  });

  document.getElementById('searchBtn')?.addEventListener('click', () => {
    clickSound();
    appState.search = document.getElementById('searchInput').value.trim();
    renderTrending();
    renderList();
  });

  document.getElementById('menuIconBtn')?.addEventListener('click', () => {
    clickSound();
    showToast('Menu coming soon');
  });

  document.getElementById('topSearchBtn')?.addEventListener('click', () => {
    clickSound();
    document.getElementById('searchInput').focus();
  });

  document.getElementById('statusTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    clickSound();
    setActiveTab(tab.dataset.filter);
  });

  document.getElementById('trendingRow').addEventListener('click', (e) => {
    const card = e.target.closest('.trend-card');
    if (!card) return;
    clickSound();
    openModal(card.dataset.id);
  });

  document.getElementById('myListGrid').addEventListener('click', (e) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;
    const { action, id } = target.dataset;
    clickSound();

    if (action === 'details') openModal(id);
    if (action === 'episode') updateEpisode(id);
    if (action === 'status') cycleStatus(id);
    if (action === 'favorite') toggleFavorite(id);
    if (action === 'notes') openNotes(id);
    if (action === 'delete') askDelete(id);
  });

  document.getElementById('modalAddToList').addEventListener('click', () => {
    clickSound();
    if (!appState.selectedAnimeId) return;
    addAnimeToList(appState.selectedAnimeId, 'Watching');
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

  document.querySelector('.bottom-nav').addEventListener('click', (e) => {
    const navBtn = e.target.closest('.nav-item');
    if (!navBtn) return;
    clickSound();
    const nav = navBtn.dataset.nav;
    if (nav === 'home') goHome();
    if (nav === 'explore') goExplore();
    if (nav === 'list') goMyList();
    if (nav === 'profile') goProfile();
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal.id === 'detailsModal') closeModal();
        if (modal.id === 'notesModal') closeNotes();
        if (modal.id === 'confirmModal') cancelDelete();
      }
    });
  });
}

function ensureDefaultList() {
  if (appState.data.list.length) return;
  const defaults = ['op', 'ds'];
  defaults.forEach((id) => {
    const source = appState.data.trending.find((x) => x.id === id);
    if (!source) return;
    const item = upsertAnimeFromSource(source, id === 'op' ? 'Watching' : 'On Hold');
    if (id === 'op') {
      item.watchedEpisodes = 1085;
      item.currentSeason = 21;
      item.notes = 'Egghead arc is peak.';
      item.favorite = true;
    }
    if (id === 'ds') {
      item.watchedEpisodes = 51;
      item.currentSeason = 4;
      item.notes = 'Waiting for next season release.';
    }
  });
  writeStorage();
}

function hideLoadingScreen() {
  const loading = document.getElementById('loadingScreen');
  setTimeout(() => loading.classList.add('hide'), 650);
}

function init() {
  readStorage();
  ensureDefaultList();
  bindEvents();
  renderTrending();
  renderList();
  hideLoadingScreen();
}

window.addEventListener('DOMContentLoaded', init);
