// KitsuneDex Phase 1.5 Update
let animeCache = {};
let searchTimeout;
let scrollTimeout;
let clickCooldown=false;

const notifySound = new Audio('sounds/notify.mp3');
notifySound.volume = 0.8;

function playNotifySound(){
 notifySound.currentTime = 0;
 notifySound.play().catch(()=>{});
}

function showToast(message){
 document.querySelectorAll('.toast-notification').forEach(toast=>toast.remove());

 const toast=document.createElement('div');
 toast.className='toast-notification';
 toast.textContent=message;
 toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:14px 22px;border-radius:18px;z-index:9999;font-weight:bold;box-shadow:0 0 20px rgba(37,99,235,.4);opacity:0;transition:.25s';
 document.body.appendChild(toast);

 setTimeout(()=>{
  toast.style.opacity='1';
 },10);

 playNotifySound();
 setTimeout(()=>toast.remove(),2200);
}

function getSafeAnimeList(){
 try{
  const raw=JSON.parse(localStorage.getItem('animeList'));
  return Array.isArray(raw) ? raw : [];
 }catch{
  return [];
 }
}

function normalizeAnimeData(saved){
 return saved.map(anime=>({
  title:String(anime.title || anime || 'Unknown Anime').trim(),
  status:anime.status || 'Watching',
  progress:Math.min(Math.max(0,Number(anime.progress)||0),Math.max(1,Number(anime.total)||12)),
  total:Math.max(1,Number(anime.total)||12),
  favorite:Boolean(anime.favorite),
  season:Math.max(1,Number(anime.season)||1),
  image:anime.image || 'https://placehold.co/600x400?text=Anime',
  nextSeason:anime.nextSeason || 'Coming Soon',
  notes:(anime.notes || '').trim()
 }));
}

function sortAnimeList(saved){
 return [...saved].sort((a,b)=>{
  if(a.favorite!==b.favorite){
   return b.favorite-a.favorite;
  }

  if(a.status!==b.status){
   return a.status==='Watching' ? -1 : 1;
  }

  return b.progress-a.progress;
 });
}

function saveLocalAnime(saved){
 localStorage.setItem('animeList',JSON.stringify(saved));
}

function sanitizeText(text=''){
 return text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderStats(saved){
 const stats=document.getElementById('animeStats');
 if(!stats) return;

 const completed=saved.filter(a=>a.status==='Completed').length;
 const watching=saved.filter(a=>a.status==='Watching').length;
 const favorites=saved.filter(a=>a.favorite).length;
 const episodes=saved.reduce((sum,a)=>sum+a.progress,0);

 stats.innerHTML=`
 <div class="saved-item">
  <h2>📊 Anime Stats</h2>
  <p class="anime-info">✅ Completed: ${completed}</p>
  <p class="anime-info">📺 Watching: ${watching}</p>
  <p class="anime-info">❤️ Favorites: ${favorites}</p>
  <p class="anime-info">🎬 Episodes Watched: ${episodes}</p>
 </div>`;
}

function renderContinueWatching(saved){
 const continueBox=document.getElementById('continueWatching');
 if(!continueBox) return;

 const watching=saved.filter(a=>a.status==='Watching');
 continueBox.innerHTML='';

 if(!watching.length) return;

 continueBox.innerHTML='<h2 style="color:#60a5fa">Continue Watching</h2>';

 watching.slice(0,5).forEach(anime=>{
  continueBox.innerHTML+=`
  <div class="saved-item" style="margin-bottom:12px">
   <h3>📺 ${anime.title}</h3>
   <p class="anime-info">Episode ${anime.progress}/${anime.total}</p>
  </div>`;
 });
}

function renderRecentActivity(saved){
 const activity=document.getElementById('recentActivity');
 if(!activity) return;

 const recent=[...saved].sort((a,b)=>b.progress-a.progress).slice(0,3);
 activity.innerHTML='';

 if(!recent.length) return;

 activity.innerHTML='<h2 style="color:#93c5fd">Recent Activity</h2>';

 recent.forEach(anime=>{
  activity.innerHTML+=`
  <div class="saved-item" style="margin-bottom:10px">
   <p class="anime-info">📺 ${anime.title}</p>
   <p class="anime-info">Episode ${anime.progress}/${anime.total}</p>
  </div>`;
 });
}

function animateModal(){
 const modal=document.getElementById('animeModal');
 if(!modal) return;

 modal.style.opacity='0';
 modal.style.transition='0.25s';

 setTimeout(()=>{
  modal.style.opacity='1';
 },10);
}

function showHome(){
 document.getElementById('homePage')?.classList.remove('hidden');
 document.getElementById('myListPage')?.classList.add('hidden');
 window.scrollTo({top:0,behavior:'smooth'});
}

function showMyList(){
 document.getElementById('homePage')?.classList.add('hidden');
 document.getElementById('myListPage')?.classList.remove('hidden');
 loadSavedAnime();
 window.scrollTo({top:0,behavior:'smooth'});
}

function quickSearch(name){
 const input=document.getElementById('searchInput');
 if(!input) return;
 input.value=name;
 searchAnime();
}

async function searchAnime(){
 clearTimeout(searchTimeout);

 searchTimeout=setTimeout(async()=>{

 showHome();

 const input=document.getElementById('searchInput');
 const animeResults=document.getElementById('animeResults');

 if(!input || !animeResults) return;

 const query=input.value.trim();
 if(!query) return;

 animeResults.innerHTML='<div class="loading">Searching Anime...</div>';

 try{

 const response=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`);
 const data=await response.json();

 animeResults.innerHTML='';

 if(!data.data?.length){
  animeResults.innerHTML='<div class="empty-state">No anime found 😭</div>';
  return;
 }

 const fragment=document.createDocumentFragment();

 data.data.slice(0,12).forEach(anime=>{

  animeCache[anime.mal_id]=anime;

  const card=document.createElement('div');
  card.className='card';

  const safeTitle=sanitizeText(anime.title);
  const safeImage=anime.images?.jpg?.large_image_url || 'https://placehold.co/600x400?text=Anime';

  card.innerHTML=`
   <img loading="lazy" decoding="async" src="${safeImage}" alt="anime">
   <div class="card-content">
    <h2>${safeTitle}</h2>
    <p>⭐ ${anime.score || 'N/A'}</p>
    <p class="status">${anime.status}</p>
    <p class="anime-info">📺 Episodes: ${anime.episodes || '?'}</p>

    <div class="button-group">
     <button onclick="openModal(${anime.mal_id})">Details</button>
     <button onclick="saveAnime('${safeTitle}','Watching','${safeImage}',${anime.episodes || 12})">Watching</button>
     <button onclick="saveAnime('${safeTitle}','Completed','${safeImage}',${anime.episodes || 12})">✔ Done</button>
    </div>
   </div>`;

  fragment.appendChild(card);
 });

 animeResults.appendChild(fragment);

 }catch{
  animeResults.innerHTML='<div class="empty-state">API Error 😭</div>';
 }

 },250);
}

function saveAnime(title,status,image,totalEpisodes){
 if(!title?.trim()) return;

 totalEpisodes=Math.max(1,Number(totalEpisodes)||12);

 let saved=normalizeAnimeData(getSafeAnimeList());

 const existing=saved.find(a=>a.title.toLowerCase()===title.toLowerCase());

 if(existing){
  existing.status=status;
  existing.image=image || existing.image;
  existing.total=totalEpisodes || existing.total;
 }else{
  saved.push({
   title,
   status,
   progress:status==='Completed' ? totalEpisodes : 0,
   total:totalEpisodes,
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
 let saved=normalizeAnimeData(getSafeAnimeList());
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 anime.progress=Math.min(anime.progress+1,anime.total);
 anime.status=anime.progress>=anime.total ? 'Completed' : 'Watching';

 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(anime.status==='Completed' ? `${title} completed 😭🔥` : `${title} progress updated 📺`);
}

function toggleFavorite(title){
 let saved=normalizeAnimeData(getSafeAnimeList());
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;
 anime.favorite=!anime.favorite;
 saveLocalAnime(saved);
 loadSavedAnime();
}

function deleteAnime(title){
 if(!title || typeof title!=='string') return;

 let saved=normalizeAnimeData(getSafeAnimeList());
 saved=saved.filter(a=>a.title!==title);
 saveLocalAnime(saved);
 loadSavedAnime();
 showToast(`${title} deleted 🗑️`);
}

function openNotes(title){
 let saved=normalizeAnimeData(getSafeAnimeList());
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 const userNote=prompt(`Write notes for ${title}`,anime.notes || '');

 if(userNote!==null){
  anime.notes=sanitizeText(userNote.trim());
  saveLocalAnime(saved);
  loadSavedAnime();
  showToast('Notes saved 😭🔥');
 }
}

function openSavedAnimeDetails(title){
 const anime=normalizeAnimeData(getSafeAnimeList()).find(a=>a.title===title);
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 animateModal();

 document.getElementById('modalImage').src=anime.image;
 document.getElementById('modalTitle').textContent=anime.title;
 document.getElementById('modalScore').textContent='⭐ Saved Anime';
 document.getElementById('modalEpisodes').textContent=`📺 Episodes: ${anime.progress}/${anime.total}`;
 document.getElementById('modalStatus').textContent=`🔥 ${anime.status}`;
 document.getElementById('modalGenres').textContent=`🎬 Season ${anime.season}`;
 document.getElementById('modalSynopsis').innerHTML=`⏳ Next Season: ${anime.nextSeason}<br><br>📝 Notes:<br>${anime.notes || 'No notes yet 😭'}`;
}

function openModal(id){
 const anime=animeCache[id];
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 animateModal();

 document.getElementById('modalImage').src=anime.images?.jpg?.large_image_url || '';
 document.getElementById('modalTitle').textContent=anime.title;
 document.getElementById('modalScore').textContent=`⭐ Rating: ${anime.score || 'N/A'}`;
 document.getElementById('modalEpisodes').textContent=`📺 Episodes: ${anime.episodes || '?'}`;
 document.getElementById('modalStatus').textContent=`🔥 ${anime.status}`;
 document.getElementById('modalGenres').textContent=`🎭 ${anime.genres?.map(g=>g.name).join(', ') || 'Unknown'}`;
 document.getElementById('modalSynopsis').innerHTML=`${sanitizeText(anime.synopsis || 'No synopsis')}<br><br>📅 Release: ${anime.aired?.from?.split('T')[0] || 'Unknown'}`;
}

function closeModal(){
 document.getElementById('animeModal').style.display='none';
}

window.onclick=function(event){
 if(event.target===document.getElementById('animeModal')){
  closeModal();
 }
}

window.addEventListener('touchstart',(event)=>{
 const modal=document.getElementById('animeModal');
 if(event.target===modal){
  closeModal();
 }
});

window.addEventListener('error',(e)=>{
 if(e.target.tagName==='IMG'){
  e.target.src='https://placehold.co/600x400?text=Anime';
 }
},true);

window.addEventListener('scroll',()=>{
 clearTimeout(scrollTimeout);
 scrollTimeout=setTimeout(()=>{
  document.body.style.pointerEvents='auto';
 },50);
});

document.addEventListener('click',(e)=>{
 if(e.target.tagName==='BUTTON'){

  if(clickCooldown){
   e.preventDefault();
   return;
  }

  clickCooldown=true;

  setTimeout(()=>{
   clickCooldown=false;
  },120);
 }
});

function loadSavedAnime(){
 const savedAnime=document.getElementById('savedAnime');
 if(!savedAnime) return;

 let saved=normalizeAnimeData(getSafeAnimeList());

 const unique=[];
 const titles=new Set();

 saved.forEach(anime=>{
  const lower=anime.title.toLowerCase();

  if(!titles.has(lower)){
   titles.add(lower);
   unique.push(anime);
  }
 });

 saved=sortAnimeList(unique);
 saveLocalAnime(saved);

 savedAnime.innerHTML='';

 renderStats(saved);
 renderContinueWatching(saved);
 renderRecentActivity(saved);

 if(!saved.length){
  savedAnime.innerHTML='<p>No anime added yet 😭</p>';
  return;
 }

 const fragment=document.createDocumentFragment();

 saved.forEach((anime,index)=>{

  const safeProgress=Math.min(anime.progress,anime.total);
  const progressPercent=Math.floor((safeProgress/anime.total)*100);
  const badge=anime.status==='Completed' ? 'completed-badge' : 'watching-badge';

  const card=document.createElement('div');
  card.className='saved-item';

  card.style.opacity='0';
  card.style.transform='translateY(10px)';
  card.style.transition='0.25s';

  setTimeout(()=>{
   card.style.opacity='1';
   card.style.transform='translateY(0px)';
  },index*40);

  card.innerHTML=`
   <img loading="lazy" decoding="async" onclick="openSavedAnimeDetails('${anime.title.replace(/'/g,'')}')" src="${anime.image}" style="width:100%;height:200px;object-fit:cover;border-radius:18px;margin-bottom:14px;cursor:pointer">

   <div class="list-top">
    <h3>${anime.favorite ? '❤️' : '📺'} ${anime.title}</h3>
    <span class="${badge}">${anime.status}</span>
   </div>

   <p class="anime-info">📺 Episode ${safeProgress}/${anime.total} • ${progressPercent}%</p>

   ${anime.notes ? `<p class="anime-info">📝 ${anime.notes.slice(0,45)}</p>` : ''}

   <div style="background:#0f172a;border-radius:999px;height:10px;overflow:hidden;margin:12px 0">
    <div style="width:${progressPercent}%;height:100%;background:#3b82f6;transition:.4s"></div>
   </div>

   <div class="list-buttons" style="gap:8px;flex-wrap:wrap;justify-content:flex-start">
    <button onclick="openSavedAnimeDetails('${anime.title.replace(/'/g,'')}')">Details</button>
    <button onclick="openNotes('${anime.title.replace(/'/g,'')}')" style="padding:8px 12px;font-size:13px">📝 Note</button>
    <button onclick="updateProgress('${anime.title.replace(/'/g,'')}')">+ Episode</button>
    <button onclick="toggleFavorite('${anime.title.replace(/'/g,'')}')">${anime.favorite ? '💔 Favorite' : '❤️ Favorite'}</button>
    <button onclick="deleteAnime('${anime.title.replace(/'/g,'')}')" class="remove-btn">🗑 Delete</button>
   </div>`;

  fragment.appendChild(card);
 });

 savedAnime.appendChild(fragment);
}

window.addEventListener('DOMContentLoaded',()=>{
 try{
  loadSavedAnime();
 }catch(error){
  console.log('Phase 1.5 protection active 😭🔥');
 }
});