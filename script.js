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
                <img src="${anime.images.jpg.image_url}" alt="">
                
                <div class="card-content">
                    <h2>${anime.title}</h2>

                    <p>⭐ ${anime.score || "N/A"}</p>

                    <p class="status">
                        ${anime.status}
                    </p>

                    <button onclick="saveAnime('${anime.title}')">
                        Add
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

        alert(title + " added to your list!");
    }
}
