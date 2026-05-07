// KitsuneDex Stable Build
let animeCache = {};

function getAnimeList(){
 try{
  return JSON.parse(localStorage.getItem('animeList')) || [];
 }catch{
  return [];
 }
}

function saveAnimeList(data){
 localStorage.setItem('animeList', JSON.stringify(data));
}

function showToast(text){
 const old=document.querySelector('.toast');
 if(old) old.remove();

 const toast=document.createElement('div');
 toast.className='toast';
 toast.innerText=text;
 toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;padding:12px 20px;border-radius:12px;z-index:9999;font-weight:bold;box-shadow:0 0 20px rgba(37,99,235,.5)';
 document.body.appendChild(toast);

 setTimeout(()=>toast.remove(),2000);
}

function showHome(){
 document.getElementById('homePage')?.classList.remove('hidden');
 document.getElementById('myListPage')?.classList.add('hidden');
}

function showMyList(){
 document.getElementById('homePage')?.classList.add('hidden');
 document.getElementById('myListPage')?.classList.remove('hidden');
 loadSavedAnime();
}

function loadingHTML(){
 return `
 <style>
 @keyframes spin{
  from{transform:rotate(0deg)}
  to{transform:rotate(360deg)}
 }
 @keyframes pulse{
  0%{opacity:.5}
  50%{opacity:1}
  100%{opacity:.5}
 }
 </style>

 <div style="display:flex;justify-content:center;align-items:center;gap:12px;padding:20px;color:#60a5fa;font-weight:bold">
  <div style="width:22px;height:22px;border:3px solid #2563eb;border-top:3px solid transparent;border-radius:50%;animation:spin .8s linear infinite"></div>
  Searching Anime...
 </div>

 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
  <div style="height:320px;background:#1e293b;border-radius:18px;animation:pulse 1.2s infinite"></div>
  <div style="height:320px;background:#1e293b;border-radius:18px;animation:pulse 1.2s infinite"></div>
  <div style="height:320px;background:#1e293b;border-radius:18px;animation:pulse 1.2s infinite"></div>
 </div>`;
}

async function searchAnime(){
 const input=document.getElementById('searchInput');
 const animeResults=document.getElementById('animeResults');

 if(!input || !animeResults) return;

 const query=input.value.trim();
 if(!query) return;

 animeResults.innerHTML=loadingHTML();

 try{
  const response=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`);
  const data=await response.json();

  animeResults.innerHTML='';

  if(!data.data || !data.data.length){
   animeResults.innerHTML='<p>No anime found 😭</p>';
   return;
  }

  data.data.forEach(anime=>{
   animeCache[anime.mal_id]=anime;

   const card=document.createElement('div');
   card.className='card';
   card.style.transition='.25s';

   const image=anime.images?.jpg?.large_image_url || 'https://placehold.co/400x600?text=Anime';

   card.innerHTML=`
   <img src="${image}" alt="anime" loading="lazy" style="transition:.25s">
   <div class="card-content">
    <h2>${anime.title}</h2>
    <p>⭐ ${anime.score || 'N/A'}</p>
    <p>📺 ${anime.episodes || '?'} Episodes</p>

    <div class="button-group">
      <button onclick="openModal(${anime.mal_id})">Details</button>
      <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Watching','${image}',${anime.episodes || 12})">Watching</button>
      <button onclick="saveAnime('${anime.title.replace(/'/g,'')}','Completed','${image}',${anime.episodes || 12})">Done</button>
    </div>
   </div>`;

   card.onmouseenter=()=>card.style.transform='translateY(-4px)';
   card.onmouseleave=()=>card.style.transform='translateY(0px)';

   animeResults.appendChild(card);
  });

 }catch(error){
  animeResults.innerHTML='<p>API Error 😭</p>';
 }
}

function quickSearch(name){
 const input=document.getElementById('searchInput');
 if(!input) return;

 input.value=name;
 searchAnime();
}

function saveAnime(title,status,image,total){
 const saved=getAnimeList();

 const existing=saved.find(a=>a.title===title);

 if(existing){
  existing.status=status;
 }else{
  saved.push({
   title,
   status,
   image,
   total,
   progress:status==='Completed' ? total : 0,
   favorite:false,
   notes:''
  });
 }

 saveAnimeList(saved);
 loadSavedAnime();
 showToast(title + ' saved 😭🔥');
}

function loadSavedAnime(){
 const savedAnime=document.getElementById('savedAnime');
 if(!savedAnime) return;

 const saved=getAnimeList();

 savedAnime.innerHTML='';

 if(!saved.length){
  savedAnime.innerHTML='<p>No anime added 😭</p>';
  return;
 }

 saved.sort((a,b)=>Number(b.favorite)-Number(a.favorite));

 saved.forEach(anime=>{
  const progress=Math.floor((anime.progress / anime.total) * 100);

  const card=document.createElement('div');
  card.className='saved-item';
  card.style.transition='.25s';

  card.innerHTML=`
   <img src="${anime.image}" style="width:100%;height:200px;object-fit:cover;border-radius:14px" loading="lazy">

   <h3>${anime.favorite ? '❤️' : '📺'} ${anime.title}</h3>

   <p>${anime.status}</p>
   <p>Episode ${anime.progress}/${anime.total}</p>

   <div style="background:#1e293b;height:10px;border-radius:999px;overflow:hidden;margin:10px 0">
    <div style="width:${progress}%;height:100%;background:#3b82f6;transition:.3s"></div>
   </div>

   ${anime.notes ? `<p>📝 ${anime.notes}</p>` : ''}

   <div class="list-buttons" style="display:flex;gap:8px;flex-wrap:wrap">
    <button onclick="openSavedAnimeDetails('${anime.title.replace(/'/g,'')}')">Details</button>
    <button onclick="updateProgress('${anime.title.replace(/'/g,'')}')">+ Episode</button>
    <button onclick="toggleFavorite('${anime.title.replace(/'/g,'')}')">❤️</button>
    <button onclick="openNotes('${anime.title.replace(/'/g,'')}')">📝</button>
    <button onclick="deleteAnime('${anime.title.replace(/'/g,'')}')">🗑</button>
   </div>`;

   card.onmouseenter=()=>card.style.transform='translateY(-4px)';
   card.onmouseleave=()=>card.style.transform='translateY(0px)';

   savedAnime.appendChild(card);
  });
}

function updateProgress(title){
 const saved=getAnimeList();
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 anime.progress=Math.min(anime.progress + 1, anime.total);

 if(anime.progress >= anime.total){
  anime.status='Completed';
 }

 saveAnimeList(saved);
 loadSavedAnime();
}

function toggleFavorite(title){
 const saved=getAnimeList();
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 anime.favorite=!anime.favorite;
 saveAnimeList(saved);
 loadSavedAnime();
}

function openNotes(title){
 const saved=getAnimeList();
 const anime=saved.find(a=>a.title===title);
 if(!anime) return;

 const note=prompt('Write note', anime.notes || '');

 if(note !== null){
  anime.notes=note;
  saveAnimeList(saved);
  loadSavedAnime();
 }
}

function deleteAnime(title){
 const saved=getAnimeList().filter(a=>a.title !== title);
 saveAnimeList(saved);
 loadSavedAnime();
 showToast('Anime deleted 🗑');
}

function openModal(id){
 const anime=animeCache[id];
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 document.getElementById('animeModal').style.backdropFilter='blur(8px)';
 document.getElementById('modalImage').src=anime.images?.jpg?.large_image_url || '';
 document.getElementById('modalTitle').innerText=anime.title;
 document.getElementById('modalScore').innerText='⭐ ' + (anime.score || 'N/A');
 document.getElementById('modalEpisodes').innerText='📺 Episodes: ' + (anime.episodes || '?');
 document.getElementById('modalStatus').innerText='🔥 ' + anime.status;
 document.getElementById('modalGenres').innerText='🎭 ' + anime.genres?.map(g=>g.name).join(', ');
 document.getElementById('modalSynopsis').innerText=anime.synopsis || 'No synopsis';
}

function openSavedAnimeDetails(title){
 const anime=getAnimeList().find(a=>a.title===title);
 if(!anime) return;

 document.getElementById('animeModal').style.display='block';
 document.getElementById('modalImage').src=anime.image;
 document.getElementById('modalTitle').innerText=anime.title;
 document.getElementById('modalScore').innerText='⭐ Saved Anime';
 document.getElementById('modalEpisodes').innerText='📺 Episodes: ' + anime.progress + '/' + anime.total;
 document.getElementById('modalStatus').innerText='🔥 ' + anime.status;
 document.getElementById('modalGenres').innerText='📝 Notes';
 document.getElementById('modalSynopsis').innerText=anime.notes || 'No notes';
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

window.addEventListener('DOMContentLoaded',()=>{
 loadSavedAnime();
});