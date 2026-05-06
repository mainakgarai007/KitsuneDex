async function searchAnime() {

    const query = document.getElementById("searchInput").value;

    const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${query}`
    );

    const data = await response.json();

    const animeResults = document.getElementById("animeResults");

    animeResults.innerHTML = "";

    data.data.forEach(anime => {

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

                    <button onclick="saveAnime('${anime.title.replace(/'/g, "") }')">
                        + Add To List
                    </button>
                </div>
            </div>
        `;
    });
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