async function searchAnime() {

    const query = document.getElementById("searchInput").value;

    const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${query}`
    );

    const data = await response.json();

    const animeResults = document.getElementById("animeResults");

    animeResults.innerHTML = "";

    data.data.forEach(anime => {

        const animeData = encodeURIComponent(JSON.stringify(anime));

        animeResults.innerHTML += `
            <div class="card">
                <img src="${anime.images.jpg.image_url}" alt="anime">
                
                <div class="card-content">
                    <h2>${anime.title}</h2>

                    <p>⭐ ${anime.score || "N/A"}</p>

                    <p class="status">
                        ${anime.status}
                    </p>

                    <p class="anime-info">
                        Episodes: ${anime.episodes || "?"}
                    </p>

                    <p class="anime-info">
                        Type: ${anime.type || "Unknown"}
                    </p>

                    <button onclick="openModal('${animeData}')">
                        View Details
                    </button>

                    <br><br>

                    <button onclick="saveAnime('${anime.title.replace(/'/g, "") }')">
                        + Add To List
                    </button>
                </div>
            </div>
        `;
    });
}

function openModal(animeString){

    const anime = JSON.parse(decodeURIComponent(animeString));

    document.getElementById("animeModal").style.display = "block";

    document.getElementById("modalImage").src = anime.images.jpg.large_image_url;

    document.getElementById("modalTitle").innerText = anime.title;

    document.getElementById("modalScore").innerText = `⭐ Rating: ${anime.score || "N/A"}`;

    document.getElementById("modalEpisodes").innerText = `📺 Episodes: ${anime.episodes || "Unknown"}`;

    document.getElementById("modalStatus").innerText = `🔥 Status: ${anime.status}`;

    const genres = anime.genres.map(g => g.name).join(', ');

    document.getElementById("modalGenres").innerText = `🎭 Genres: ${genres}`;

    document.getElementById("modalSynopsis").innerText = anime.synopsis || "No synopsis available.";
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

    let saved = JSON.parse(
        localStorage.getItem("animeList")
    ) || [];

    if(!saved.includes(title)){
        saved.push(title);

        localStorage.setItem(
            "animeList",
            JSON.stringify(saved)
        );

        loadSavedAnime();

        alert(title + " added to your list!");
    }
}

function loadSavedAnime(){

    let saved = JSON.parse(
        localStorage.getItem("animeList")
    ) || [];

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