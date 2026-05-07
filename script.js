let animeCache = {};

const notifySound = new Audio('sounds/notify.mp3');
const buttonSound = new Audio('sounds/button.mp3');
const adminSound = new Audio('sounds/admin.mp3');

notifySound.volume = 0.8;
buttonSound.volume = 0.35;
adminSound.volume = 1;

const languageDatabase = {
    "Naruto": ["Hindi", "Bengali"],
    "One Piece": ["Hindi", "Tamil"],
    "Solo Leveling": ["Hindi", "Bengali"],
    "Bleach": ["Hindi"],
    "Jujutsu Kaisen": ["Hindi", "Tamil"],
    "Kimetsu no Yaiba": ["Hindi", "Bengali"]
};

function playNotifySound(){
    notifySound.currentTime = 0;
    notifySound.play().catch(() => {});
}

function playButtonSound(){
    buttonSound.currentTime = 0;
    buttonSound.play().catch(() => {});
}

function playAdminSound(){
    adminSound.currentTime = 0;
    adminSound.play().catch(() => {});
}

function showToast(message,type='normal'){

    const oldToast = document.querySelector('.toast-notification');

    if(oldToast){
        oldToast.remove();
    }

    const toast = document.createElement('div');

    toast.className = 'toast-notification';

    toast.innerText = message;

    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#2563eb';
    toast.style.color = 'white';
    toast.style.padding = '14px 22px';
    toast.style.borderRadius = '18px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 0 25px rgba(37,99,235,0.5)';
    toast.style.fontWeight = 'bold';

    document.body.appendChild(toast);

    if(type === 'admin'){
        playAdminSound();
    }else{
        playNotifySound();
    }

    setTimeout(() => {
        toast.remove();
    },2500);
}

function showHome(){

    playButtonSound();

    document.getElementById("homePage").classList.remove("hidden");
    document.getElementById("myListPage").classList.add("hidden");
}

function showMyList(){

    playButtonSound();

    document.getElementById("homePage").classList.add("hidden");
    document.getElementById("myListPage").classList.remove("hidden");

    loadSavedAnime();
}

function getLanguageTags(title){

    let tags = `
        <div class="language-tags">
            <span>English</span>
            <span>Japanese</span>
    `;

    if(languageDatabase[title]){
        tags += `<span class="multi">Multi ▼</span>`;
    }

    tags += `</div>`;

    return tags;
}

function getCommunityLanguages(title){

    if(!languageDatabase[title]) return "";

    return languageDatabase[title]
        .map(lang => `• ${lang}`)
        .join("\n");
}

async function searchAnime() {

    playButtonSound();

    showHome();

    const query = document.getElementById("searchInput").value.trim();

    if(!query) return;

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("emptyState").classList.add("hidden");

    try{

        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}`);

        const data = await response.json();

        document.getElementById("loading").classList.add("hidden");

        const animeResults = document.getElementById("animeResults");

        animeResults.innerHTML = "";

        animeCache = {};

        if(!data.data || data.data.length === 0){
            document.getElementById("emptyState").classList.remove("hidden");
            return;
        }

        showToast('Anime results loaded 😭🔥');

        data.data.forEach(anime => {

            animeCache[anime.mal_id] = anime;

            animeResults.innerHTML += `
                <div class="card">
                    <img src="${anime.images.jpg.image_url}" alt="anime">

                    <div class="card-content">
                        <h2>${anime.title}</h2>

                        <p>⭐ ${anime.score || "N/A"}</p>

                        <p class="status">${anime.status}</p>

                        <p class="anime-info">📺 Episodes: ${anime.episodes || "?"}</p>

                        <p class="anime-info">🎬 Type: ${anime.type || "Unknown"}</p>

                        ${getLanguageTags(anime.title)}

                        <div class="button-group">

                            <button onclick="openModal(${anime.mal_id})">
                                Details
                            </button>

                            <button onclick="saveAnime('${anime.title.replace(/'/g, "") }','Watching')">
                                Watching
                            </button>

                            <button onclick="saveAnime('${anime.title.replace(/'/g, "") }','Completed')">
                                ✔ Done
                            </button>

                        </div>
                    </div>
                </div>
            `;
        });

    }catch(error){

        document.getElementById("loading").classList.add("hidden");

        showToast('API error 😭');
    }
}

function openModal(id){

    playButtonSound();

    const anime = animeCache[id];

    if(!anime) return;

    document.getElementById("animeModal").style.display = "block";

    document.getElementById("modalImage").src = anime.images.jpg.large_image_url;
    document.getElementById("modalTitle").innerText = anime.title;
    document.getElementById("modalScore").innerText = `⭐ Rating: ${anime.score || "N/A"}`;
    document.getElementById("modalEpisodes").innerText = `📺 Episodes: ${anime.episodes || "Unknown"}`;
    document.getElementById("modalStatus").innerText = `🔥 Status: ${anime.status}`;

    const genres = anime.genres.map(g => g.name).join(', ');

    document.getElementById("modalGenres").innerText = `🎭 Genres: ${genres}`;

    const extraLanguages = getCommunityLanguages(anime.title);

    document.getElementById("modalSynopsis").innerText =
        (anime.synopsis || "No synopsis available.") +
        (extraLanguages ? `\n\n🌐 Community Languages:\n${extraLanguages}` : "");
}

function closeModal(){

    playButtonSound();

    document.getElementById("animeModal").style.display = "none";
}

window.onclick = function(event){

    const modal = document.getElementById("animeModal");

    if(event.target == modal){
        modal.style.display = "none";
    }
}

function saveAnime(title,status){

    playButtonSound();

    let saved = JSON.parse(localStorage.getItem("animeList")) || [];

    const existing = saved.find(anime => anime.title === title);

    if(existing){
        existing.status = status;
    }else{
        saved.push({title,status});
    }

    localStorage.setItem("animeList", JSON.stringify(saved));

    loadSavedAnime();

    showToast(`${title} added to ${status}`);
}

function loadSavedAnime(){

    let saved = JSON.parse(localStorage.getItem("animeList")) || [];

    const savedAnime = document.getElementById("savedAnime");

    savedAnime.innerHTML = "";

    if(saved.length === 0){
        savedAnime.innerHTML = `<p>No anime added yet 😭</p>`;
        return;
    }

    saved.forEach(anime => {

        let statusClass = anime.status === 'Completed' ? 'completed-badge' : 'watching-badge';

        savedAnime.innerHTML += `
            <div class="saved-item">
                <div class="list-top">
                    <h3>📺 ${anime.title}</h3>
                    <span class="${statusClass}">${anime.status}</span>
                </div>
            </div>
        `;
    });
}

function quickSearch(name){

    playButtonSound();

    document.getElementById("searchInput").value = name;

    searchAnime();
}

loadSavedAnime();