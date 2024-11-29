async function fetchPlaylistData() {
    const response = await fetch("Playlists/");
    const rawHTML = await response.text();

    // Parse HTML and extract playlist items
    const tempElement = document.createElement("div");
    tempElement.innerHTML = rawHTML;

    const playlistListItems = Array.from(
        tempElement.getElementsByTagName("li")
    ).slice(1);
    const playlists = playlistListItems.map((listItem) => {
        const playlistAnchor = listItem.querySelector("a");
        return {
            playlistName: playlistAnchor.title,
            playlistURL: playlistAnchor.href,
        };
    });

    // Fetch and parse playlist data
    const playListData = await Promise.all(
        playlists.map(async (playlist) => {
            const response = await fetch(
                `${playlist.playlistURL}/playlist.json`
            );
            return response.json();
        })
    );

    return playListData;
}

async function fetchAndProcessSongs(playlist) {
    const songs = playlist.songs;
    const processedSongs = songs.map((song) => ({
        songTitle: extractSongName(song),
        songUrl: song,
    }));
    return processedSongs;
}

function extractSongName(url) {
    const decodedUrl = decodeURIComponent(url);
    const fileName = decodedUrl.split("/").pop();
    const songName = fileName.replace(/\.[^/.]+$/, "");

    return songName;
}

function renderPlaylists(playlists) {
    let playlistContainer = document.querySelector(".card-container");
    for (const item of playlists) {
        const myCard = `
        <div class="card bg-grey flex flex-column justify-center rounded">
          <img src="${
              item.playlistCover
          }" class="cover rounded" alt="Playlist Cover">
          <div class="card-content flex align-center gap-1">
            <div>
              <h2>${item.playlistName}</h2>
              <p>${item.playlistDesc}</p>
            </div>
            <div class="play pointer">
              <img src="Assets/cover-play.svg" class="play-button" id="${playlists.indexOf(
                  item
              )}" alt="Play Button">
            </div>
          </div>
        </div>
      `;
        playlistContainer.innerHTML += myCard;
    }
}

function renderSongs(songs, audioElement) {
    let songList = document.querySelector(".song-list");
    songList.innerHTML = ""; // Clear previous songs
    songs.forEach((element) => {
        songList.innerHTML += `
        <li id="${songs.indexOf(
            element
        )}" style="padding-inline: 1rem;" class="song flex gap-1 align-center space-between rounded pointer">
        <div class="info">
          ${element.songTitle.replace(".mp3", "")}
        </div>
        </li>
      `;
    });

    Array.from(
        document.querySelector(".song-list").getElementsByTagName("li")
    ).forEach((e) => {
        e.addEventListener("click", () => {
            playSong(audioElement, songs[parseInt(e.id)].songUrl)
        })
    });
}

function playSong(audioElement, songUrl) {
    if (!audioElement.paused) {
        audioElement.pause();
    }
    audioElement.src = songUrl;
    audioElement.play();

    document.querySelector(".song-info > span").innerHTML = extractSongName(
        audioElement.src
    );
}

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
};

(async function main() {
    const globalPlayPauseButton = document.querySelector("#play-song");
    const previousButton = document.querySelector("#previous-song");
    const nextButton = document.querySelector("#next-song");

    const audioElement = new Audio();
    let currentPlaylist = null;
    let currentSongIndex = 0;

    const playlists = await fetchPlaylistData();
    renderPlaylists(playlists);

    // Handle playlist click events
    const playlistPlayButtons = document.querySelectorAll(".play-button");
    playlistPlayButtons.forEach((btn) => {
        btn.addEventListener("click", async (event) => {
            const playlistId = event.target.id;
            currentPlaylist = playlists[playlistId];
            currentSongIndex = 0;

            // Fetch and process song data for the selected playlist
            const extractedSongData = await fetchAndProcessSongs(
                currentPlaylist
            );
            playSong(audioElement, extractedSongData[currentSongIndex].songUrl);
            renderSongs(extractedSongData, audioElement);

            // Update global play-pause button state
            updateGlobalPlayPauseButton("pause");
        });
    });

    // Global play-pause button logic
    globalPlayPauseButton.addEventListener("click", async () => {
        if (audioElement.paused) {
            if (!currentPlaylist) {
                // Handle default state
                currentPlaylist = playlists[0];
                const extractedSongData = await fetchAndProcessSongs(
                    currentPlaylist
                );
                currentSongIndex = 0;
                playSong(
                    audioElement,
                    extractedSongData[currentSongIndex].songUrl
                );
                renderSongs(extractedSongData);
            } else {
                audioElement.play();
            }
            updateGlobalPlayPauseButton("pause");
        } else {
            audioElement.pause();
            updateGlobalPlayPauseButton("play");
        }
    });

    // Update song-time
    setInterval(() => {
        const songTimeElement = document.getElementsByClassName("song-time")[0];
        if (!audioElement.paused) {
            // Get current time and duration
            const currentTime = audioElement.currentTime;
            const duration = audioElement.duration;

            // Update the song time element
            songTimeElement.innerHTML = `${formatTime(
                currentTime
            )}/${formatTime(duration || 0)}`;
        } else {
            // Display default time when paused
            songTimeElement.innerHTML = `00:00/00:00`;
        }
    }, 500);

    // Audio playback event listeners for auto-play next song
    audioElement.addEventListener("ended", () => {
        if (currentPlaylist) {
            const extractedSongData = currentPlaylist.songs;
            currentSongIndex =
                (currentSongIndex + 1) % extractedSongData.length;
            playSong(audioElement, extractedSongData[currentSongIndex]);
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentPlaylist) {
            if (currentSongIndex == currentPlaylist.songs.length - 1) {
                currentSongIndex = 0;
                playSong(audioElement, currentPlaylist.songs[currentSongIndex]);
            } else {
                currentSongIndex++;
                playSong(audioElement, currentPlaylist.songs[currentSongIndex]);
            }
        }
    });

    previousButton.addEventListener("click", () => {
        if (currentPlaylist) {
            if (currentSongIndex == 0) {
                currentSongIndex = currentPlaylist.songs.length - 1;
                playSong(audioElement, currentPlaylist.songs[currentSongIndex]);
            } else {
                currentSongIndex--;
                playSong(audioElement, currentPlaylist.songs[currentSongIndex]);
            }
        }
    });
    // Helper function to update play-pause button
    function updateGlobalPlayPauseButton(state) {
        if (state === "play") {
            globalPlayPauseButton.src = "Assets/music-play.svg";
        } else if (state === "pause") {
            globalPlayPauseButton.src = "Assets/pause.svg";
        }
    }
})();
