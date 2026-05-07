let animeCache = {};

const languageDatabase = {
    "Naruto": ["Hindi", "Bengali"],
    "One Piece": ["Hindi", "Tamil"],
    "Solo Leveling": ["Hindi", "Bengali"],
    "Bleach": ["Hindi"],
    "Jujutsu Kaisen": ["Hindi", "Tamil"],
    "Kimetsu no Yaiba": ["Hindi", "Bengali"]
};

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

    const query = document.getElementById("searchInput").value.trim();

    if(!query) return;

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("emptyState").classList.add("hidden");

    const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${query}`
    );

    const data = await response.json();

    document.getElementById("loading").classList.add("hidden");

    const animeResults = document.getElementById("animeResults");

    animeResults.innerHTML = "";

    animeCache = {};

    if(!data.data || data.data.length === 0){
        document.getElementById("emptyState").classList.remove("hidden");
        return;
    }

    data.data.forEach(anime => {

        animeCache[anime.mal_id] = anime;

        animeResults.innerHTML += `
            <div class="card">
                <img src="${anime.images.jpg.image_url}" alt="anime">
                
                <div class="card-content">
                    <h2>${anime.title}</h2>

                    <p>⭐ ${anime.score || "N/A"}</p>

                    <p class="status">${anime.status}</p>

                    <p class="anime-info">
                        📺 Episodes: ${anime.episodes || "?"}
                    </p>

                    <p class="anime-info">
                        🎬 Type: ${anime.type || "Unknown"}
                    </p>

                    ${getLanguageTags(anime.title)}

                    <div class="button-group">
                        <button onclick="openModal(${anime.mal_id})">
                            Details
                        </button>

                        <button onclick="saveAnime('${anime.title.replace(/'/g, "") }')">
                            Watching
                        </button>

                        <button onclick="markCompleted('${anime.title.replace(/'/g, "") }')">
                            ✔ Done
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function openModal(id){

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
    document.getElementById("animeModal").style.display = "none";
}

window.onclick = function(event){
    const modal = document.getElementById("animeModal");

    if(event.target == modal){
        modal.style.display = "none";
    }
}

function saveAnime(title){

    let saved = JSON.parse(localStorage.getItem("animeList")) || [];

    if(!saved.includes(title)){
        saved.push(title);

        localStorage.setItem(
            "animeList",
            JSON.stringify(saved)
        );

        loadSavedAnime();
    }
}

function markCompleted(title){

    let completed = JSON.parse(localStorage.getItem("completedAnime")) || [];

    if(!completed.includes(title)){

        completed.push(title);

        localStorage.setItem(
            "completedAnime",
            JSON.stringify(completed)
        );

        alert(title + ' marked completed!');
    }
}

function loadSavedAnime(){

    let saved = JSON.parse(localStorage.getItem("animeList")) || [];

    const savedAnime = document.getElementById("savedAnime");

    savedAnime.innerHTML = "";

    saved.forEach(title => {

        savedAnime.innerHTML += `
            <div class="saved-item">
                📺 ${title}
            </div>
        `;
    });
}

function quickSearch(name){

    document.getElementById("searchInput").value = name;

    searchAnime();
}

loadSavedAnime();