let animeCache = {};
const notifySound = new Audio('sounds/notify.mp3');
notifySound.volume = 0.8;

function playNotifySound(){
 notifySound.currentTime = 0;
 notifySound.play().catch(()=>{});
}

function showToast(message){
 const oldToast = document.querySelector('.toast-notification');
 if(oldToast) oldToast.remove();

 const toast = document.createElement('div');
 toast.className = 'toast-notification';
 toast.innerText = message;
 toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;padding:14px 22px;border-radius:18px;z-index:9999;font-weight:bold;box-shadow:0 0 25px rgba(37,99,235,.5)`;
 document.body.appendChild(toast);
 playNotifySound();
 setTimeout(()=>toast.remove(),2500);
}

function normalizeAnimeData(saved){
 return saved.map(anime=>{
   if(typeof anime === 'string'){
      return {
       title:anime,
       status:'Watching',
       progress:0,
       total:12,
       favorite:false
      };
   }
   return {
    progress:anime.progress || 0,
    total:anime.total || 12,
    favorite:anime.favorite || false,
    ...anime
   };
 });
}

function saveLocalAnime(saved){
 localStorage.setItem('animeList',JSON.stringify(saved));
}

function showHome(){
 document.getElementById('homePage').classList.remove('hidden');
 document.getElementById('myListPage').classList.add('hidden');
}

function showMyList(){
 document.getElementById('homePage').classList.add('hidden');
 document.getElementById('myListPage').classList.remove('hidden');
 loadSavedAnime();
}

async function searchAnime(){
 showHome();
 const query = document.getElementById('searchInput').value.trim();
 if(!query) return;

 const animeResults = document.getElementById('animeResults');
 animeResults.innerHTML = '<div class="loading">Loading...</div>';

 try{
  const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}`);
  const data = await response.json();

  animeResults.innerHTML = '';

  data.data.forEach(anime=>{
   animeCache[anime.mal_id] = anime;

   animeResults.innerHTML += `
   <div class="card">
    <img src="${anime.images.jpg.image_url}" alt="anime">
    <div class="card-content">
      <h2>${anime.title}</h2>
      <p>⭐ ${anime.score || 'N/A'}</p>
      <p class="status">${anime.status}</p>
      <div class="button-group">
       <button onclick="openModal(${anime.mal_id})">Details</button>
       <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Watching')">Watching</button>
       <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Completed')">✔ Done</button>
      </div>
    </div>
   </div>`;
  });
 }catch{
   animeResults.innerHTML = '<div class="empty-state">API Error 😭</div>';
 }
}

function saveAnime(title,status){
 let saved = normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const existing = saved.find(a=>a.title===title);

 if(existing){
   existing.status = status;
 }else{
   saved.push({
    title,
    status,
    progress:0,
    total:12,
    favorite:false
   });
 }

 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} added 😭🔥`);
}

function toggleFavorite(title){
 let saved = normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime = saved.find(a=>a.title===title);
 if(anime){
   anime.favorite = !anime.favorite;
 }
 saveLocalAnime(saved);
 loadSavedAnime();
}

function updateProgress(title){
 let saved = normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime = saved.find(a=>a.title===title);
 if(anime && anime.progress < anime.total){
   anime.progress++;
 }
 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} episode updated 📺`);
}

function deleteAnime(title){
 let saved = normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 saved = saved.filter(a=>a.title!==title);
 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} deleted 🗑️`);
}

function openModal(id){
 const anime = animeCache[id];
 if(!anime) return;

 document.getElementById('animeModal').style.display = 'block';
 document.getElementById('modalImage').src = anime.images.jpg.large_image_url;
 document.getElementById('modalTitle').innerText = anime.title;
 document.getElementById('modalScore').innerText = `⭐ Rating: ${anime.score || 'N/A'}`;
 document.getElementById('modalEpisodes').innerText = `📺 Episodes: ${anime.episodes || '?'}`;
 document.getElementById('modalStatus').innerText = `🔥 ${anime.status}`;
 document.getElementById('modalGenres').innerText = `🎭 ${anime.genres.map(g=>g.name).join(', ')}`;
 document.getElementById('modalSynopsis').innerText = anime.synopsis || 'No synopsis';
}

function closeModal(){
 document.getElementById('animeModal').style.display = 'none';
}

function loadSavedAnime(){
 const savedAnime = document.getElementById('savedAnime');
 let saved = normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);

 savedAnime.innerHTML = '';

 if(saved.length===0){
  savedAnime.innerHTML = '<p>No anime added yet 😭</p>';
  return;
 }

 saved.forEach(anime=>{
   const progressPercent = Math.floor((anime.progress / anime.total) * 100);
   const badge = anime.status === 'Completed' ? 'completed-badge' : 'watching-badge';

   savedAnime.innerHTML += `
   <div class="saved-item">
      <div class="list-top">
        <h3>${anime.favorite ? '❤️' : '📺'} ${anime.title}</h3>
        <span class="${badge}">${anime.status}</span>
      </div>

      <p class="anime-info">Season 1 • Episode ${anime.progress}/${anime.total}</p>

      <div style="background:#0f172a;border-radius:999px;height:10px;overflow:hidden;margin:12px 0">
       <div style="width:${progressPercent}%;height:100%;background:#3b82f6"></div>
      </div>

      <div class="list-buttons" style="gap:10px;flex-wrap:wrap;justify-content:flex-start">
        <button onclick="updateProgress('${anime.title.replace(/'/g,'')}')">+ Episode</button>
        <button onclick="toggleFavorite('${anime.title.replace(/'/g,'')}')">${anime.favorite ? '💔 Remove Favorite' : '❤️ Favorite'}</button>
        <button onclick="deleteAnime('${anime.title.replace(/'/g,'')}')" class="remove-btn">🗑 Delete</button>
      </div>
   </div>`;
 });
}

loadSavedAnime();