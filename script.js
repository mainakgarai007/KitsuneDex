// KitsuneDex Emergency Hotfix

// Fix recursive loading/search issue
const originalSearchAnimeFunction = oldSearchAnime || searchAnime;

async function safeSearchAnime(){
 const animeResults=document.getElementById('animeResults');

 if(animeResults){
  animeResults.innerHTML=`
  <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px;color:#60a5fa;font-weight:bold">
   <div style="width:20px;height:20px;border:3px solid #2563eb;border-top:3px solid transparent;border-radius:50%;animation:spin .8s linear infinite"></div>
   Searching Anime...
  </div>`;
 }

 try{
  await originalSearchAnimeFunction();
 }catch(error){
  console.log('Search hotfix active 😭🔥');

  if(animeResults){
   animeResults.innerHTML='<div class="empty-state">Search failed 😭</div>';
  }
 }
}

searchAnime = safeSearchAnime;

// Fix refresh freeze
refreshLock=false;

// Safe modal protection
const safeOpenModal = openModal;

openModal = function(id){
 try{
  safeOpenModal(id);
 }catch(error){
  console.log('Modal hotfix 😭🔥');
 }
}

// Safe my list loading
const safeLoadAnime = loadSavedAnime;

loadSavedAnime = function(){
 try{
  safeLoadAnime();
 }catch(error){
  console.log('MyList hotfix 😭🔥');
 }
}

window.addEventListener('DOMContentLoaded',()=>{
 try{
  loadSavedAnime();
 }catch(error){
  console.log('Startup hotfix 😭🔥');
 }
});