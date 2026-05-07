// KitsuneDex Notes + Details Update
let animeCache = {};
const notifySound = new Audio('sounds/notify.mp3');
notifySound.volume = 0.8;

function playNotifySound(){
 notifySound.currentTime = 0;
 notifySound.play().catch(()=>{});
}

function showToast(message){
 const oldToast=document.querySelector('.toast-notification');
 if(oldToast) oldToast.remove();

 const toast=document.createElement('div');
 toast.className='toast-notification';
 toast.innerText=message;
 toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;padding:14px 22px;border-radius:18px;z-index:9999;font-weight:bold';
 document.body.appendChild(toast);

 playNotifySound();
 setTimeout(()=>toast.remove(),2500);
}

function normalizeAnimeData(saved){
 return saved.map(anime=>({
  title:anime.title || anime || 'Unknown Anime',
  status:anime.status || 'Watching',
  progress:Number(anime.progress)||0,
  total:Number(anime.total)||12,
  favorite:anime.favorite||false,
  season:Number(anime.season)||1,
  image:anime.image||'',
  nextSeason:anime.nextSeason||'Coming Soon',
  notes:anime.notes||''
 }));
}

function saveLocalAnime(saved){
 localStorage.setItem('animeList',JSON.stringify(saved));
}

function showHome(){
 const home=document.getElementById('homePage');
 const list=document.getElementById('myListPage');
 if(home) home.classList.remove('hidden');
 if(list) list.classList.add('hidden');
}

function showMyList(){
 const home=document.getElementById('homePage');
 const list=document.getElementById('myListPage');
 if(home) home.classList.add('hidden');
 if(list) list.classList.remove('hidden');
 loadSavedAnime();
}

function quickSearch(name){
 const input=document.getElementById('searchInput');
 if(input){
  input.value=name;
  searchAnime();
 }
}

async function searchAnime(){
 showHome();

 const query=document.getElementById('searchInput').value.trim();
 if(!query) return;

 const animeResults=document.getElementById('animeResults');
 animeResults.innerHTML='<div class="loading">Loading Anime...</div>';

 try{

 const response=await fetch(`https://api.jikan.moe/v4/anime?q=${query}`);
 const data=await response.json();

 animeResults.innerHTML='';

 if(!data.data || data.data.length===0){
  animeResults.innerHTML='<div class="empty-state">No anime found 😭</div>';
  return;
 }

 data.data.forEach(anime=>{

  animeCache[anime.mal_id]=anime;

  animeResults.innerHTML+=`
  <div class="card">
   <img src="${anime.images.jpg.large_image_url}" alt="anime">

   <div class="card-content">
    <h2>${anime.title}</h2>
    <p>⭐ ${anime.score || 'N/A'}</p>
    <p class="status">${anime.status}</p>
    <p class="anime-info">📺 Episodes: ${anime.episodes || '?'}</p>

    <div class="button-group">
     <button onclick="openModal(${anime.mal_id})">Details</button>
     <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Watching','${anime.images.jpg.large_image_url}',${anime.episodes || 12})">Watching</button>
     <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Completed','${anime.images.jpg.large_image_url}',${anime.episodes || 12})">✔ Done</button>
    </div>
   </div>
  </div>`;
 });

 }catch(error){
  animeResults.innerHTML='<div class="empty-state">API Error 😭</div>';
 }
}

function saveAnime(title,status,image,totalEpisodes){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);

 const existing=saved.find(a=>a.title===title);

 if(existing){
  existing.status=status;
  existing.image=image || existing.image;
  existing.total=totalEpisodes || existing.total;
 }else{
  saved.push({
   title,
   status,
   progress:status==='Completed'?totalEpisodes:0,
   total:totalEpisodes || 12,
   favorite:false,
   season:1,
   image:image || '',
   nextSeason:'Coming Soon',
   notes:''
  });
 }

 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} added 😭🔥`);
}

function updateProgress(title){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 if(anime.progress<anime.total){
  anime.progress++;
 }

 if(anime.progress>=anime.total){
  anime.progress=anime.total;
  anime.status='Completed';
  showToast(`${title} season completed 😭🔥`);
 }

 saveLocalAnime(saved);
 loadSavedAnime();
}

function toggleFavorite(title){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime=saved.find(a=>a.title===title);
 if(anime) anime.favorite=!anime.favorite;
 saveLocalAnime(saved);
 loadSavedAnime();
}

function deleteAnime(title){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 saved=saved.filter(a=>a.title!==title);
 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} deleted 🗑️`);
}

// MY LIST DETAILS BUTTON
function openSavedAnimeDetails(title){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 document.getElementById('modalImage').src=anime.image || '';
 document.getElementById('modalTitle').innerText=anime.title;
 document.getElementById('modalScore').innerText=`⭐ Saved Anime`;
 document.getElementById('modalEpisodes').innerText=`📺 Episodes: ${anime.progress}/${anime.total}`;
 document.getElementById('modalStatus').innerText=`🔥 ${anime.status}`;
 document.getElementById('modalGenres').innerText=`🎬 Season ${anime.season}`;

 const countdown=Math.floor(Math.random()*120)+1;

 document.getElementById('modalSynopsis').innerHTML=`
 ⏳ Next Season Countdown: ${countdown} Days<br><br>
 📅 Next Season: ${anime.nextSeason}<br>
 📺 Progress: ${anime.progress}/${anime.total}<br>
 🎬 Current Season: ${anime.season}<br>
 🔥 Status: ${anime.status}<br>
 ❤️ Favorite: ${anime.favorite ? 'Yes 😭🔥' : 'No'}
 `;
}

// NOTES SYSTEM
function openNotes(title){
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 const userNote=prompt(`Write notes for ${title}`,anime.notes || '');

 if(userNote!==null){
  anime.notes=userNote;
  saveLocalAnime(saved);
  showToast('Notes saved 😭🔥');
 }
}

function openModal(id){
 const anime=animeCache[id];
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 document.getElementById('modalImage').src=anime.images.jpg.large_image_url;
 document.getElementById('modalTitle').innerText=anime.title;
 document.getElementById('modalScore').innerText=`⭐ Rating: ${anime.score || 'N/A'}`;
 document.getElementById('modalEpisodes').innerText=`📺 Episodes: ${anime.episodes || '?'}`;
 document.getElementById('modalStatus').innerText=`🔥 ${anime.status}`;
 document.getElementById('modalGenres').innerText=`🎭 ${anime.genres.map(g=>g.name).join(', ')}`;

 document.getElementById('modalSynopsis').innerHTML=`
 ${anime.synopsis || 'No synopsis'}<br><br>
 📅 Release: ${anime.aired?.from?.split('T')[0] || 'Unknown'}<br>
 🎬 Studio: ${anime.studios?.map(s=>s.name).join(', ') || 'Unknown'}<br>
 🏆 Rank: ${anime.rank || 'N/A'}<br>
 ❤️ Favorites: ${anime.favorites || 0}<br>
 ⏳ Next Season: Coming Soon 😭🔥
 `;
}

function closeModal(){
 document.getElementById('animeModal').style.display='none';
}

window.onclick=function(event){
 const modal=document.getElementById('animeModal');
 if(event.target===modal){
  closeModal();
 }
}

function loadSavedAnime(){
 const savedAnime=document.getElementById('savedAnime');
 let saved=normalizeAnimeData(JSON.parse(localStorage.getItem('animeList')) || []);

 savedAnime.innerHTML='';

 if(saved.length===0){
  savedAnime.innerHTML='<p>No anime added yet 😭</p>';
  return;
 }

 saved.sort((a,b)=>b.favorite-a.favorite);

 saved.forEach(anime=>{

  const safeProgress=Math.min(anime.progress,anime.total);
  const progressPercent=Math.floor((safeProgress/anime.total)*100);
  const badge=anime.status==='Completed' ? 'completed-badge' : 'watching-badge';

  savedAnime.innerHTML+=`
  <div class="saved-item">

   ${anime.image ? `<img onclick="openSavedAnimeDetails('${anime.title.replace(/'/g,'')}')" src="${anime.image}" style="width:100%;height:200px;object-fit:cover;border-radius:18px;margin-bottom:14px;cursor:pointer">` : ''}

   <div class="list-top">
    <h3>${anime.favorite ? '❤️' : '📺'} ${anime.title}</h3>
    <span class="${badge}">${anime.status}</span>
   </div>

   <p class="anime-info">🎬 Season ${anime.season}</p>
   <p class="anime-info">📺 Episode ${safeProgress}/${anime.total}</p>

   <div style="background:#0f172a;border-radius:999px;height:10px;overflow:hidden;margin:12px 0">
    <div style="width:${progressPercent}%;height:100%;background:#3b82f6"></div>
   </div>

   <div class="list-buttons" style="gap:8px;flex-wrap:wrap;justify-content:flex-start">

    <button onclick="openSavedAnimeDetails('${anime.title.replace(/'/g,'')}')">Details</button>

    <button onclick="openNotes('${anime.title.replace(/'/g,'')}')" style="padding:8px 12px;font-size:13px">📝 Note</button>

    <button onclick="updateProgress('${anime.title.replace(/'/g,'')}')">+ Episode</button>

    <button onclick="toggleFavorite('${anime.title.replace(/'/g,'')}')">${anime.favorite ? '💔 Favorite' : '❤️ Favorite'}</button>

    <button onclick="deleteAnime('${anime.title.replace(/'/g,'')}')" class="remove-btn">🗑 Delete</button>

   </div>

  </div>`;
 });
}

loadSavedAnime();