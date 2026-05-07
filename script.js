// KitsuneDex Phase 1.6 Update
// Loading animation patch added below existing Phase 1.5 code

const loadingSkeleton = `
<div class="card loading-card">
 <div style="height:220px;border-radius:18px;background:#1e293b;animation:pulse 1.2s infinite"></div>
 <div class="card-content">
  <div style="height:20px;width:70%;background:#1e293b;border-radius:8px;margin-bottom:12px;animation:pulse 1.2s infinite"></div>
  <div style="height:14px;width:40%;background:#1e293b;border-radius:8px;animation:pulse 1.2s infinite"></div>
 </div>
</div>`;

function showLoadingAnimation(){
 const animeResults=document.getElementById('animeResults');
 if(!animeResults) return;

 animeResults.innerHTML=`
 <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;color:#60a5fa;font-weight:bold">
  <div style="width:22px;height:22px;border:3px solid #2563eb;border-top:3px solid transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
  Searching Anime...
 </div>

 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
  ${loadingSkeleton}
  ${loadingSkeleton}
  ${loadingSkeleton}
 </div>`;
}

const oldSearchAnime = searchAnime;

searchAnime = async function(){
 showLoadingAnimation();
 await oldSearchAnime();
}

const oldAnimateModal = animateModal;

animateModal = function(){
 oldAnimateModal();

 const modal=document.getElementById('animeModal');
 if(modal){
  modal.style.backdropFilter='blur(10px)';
 }
}

let refreshLock=false;

const oldLoadSavedAnime = loadSavedAnime;

loadSavedAnime = function(){
 if(refreshLock) return;

 refreshLock=true;

 requestAnimationFrame(()=>{
  oldLoadSavedAnime();

  setTimeout(()=>{
   refreshLock=false;
  },120);
 });
}

window.addEventListener('unhandledrejection',()=>{
 const animeResults=document.getElementById('animeResults');

 if(animeResults){
  animeResults.innerHTML='<div class="empty-state">Connection problem 😭 Try again.</div>';
 }
});

window.addEventListener('DOMContentLoaded',()=>{
 const style=document.createElement('style');

 style.innerHTML=`
 @keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
 }

 @keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
 }

 .saved-item:hover {
  transform: translateY(-3px);
  transition:.25s;
 }

 .card img {
  transition:.25s;
 }

 .card img:hover {
  transform:scale(1.03);
 }
 `;

 document.head.appendChild(style);
});