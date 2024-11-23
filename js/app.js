playlistClose.addEventListener("click", function () {
    playlistContainer.classList.add("remove");
});


let playlist = [];
let videoIndex = 0;

let volume = document.querySelector("#volume")
volume.addEventListener("input", function () {
    video.volume = volume.value / 100
    document.querySelector(".volume-slider")
        .setAttribute("title", `feo: ${volume.value}%`)
})

let volumeIcon = document.querySelector(".volume-icon-img")

volumeIcon.addEventListener("click", function () {
    if (!video.muted) {
        video.muted = true
        this.src = "/images/volume-mute.svg"
        volume.disabled = true
        volume.style.cursor = "not-allowed"
    } else {
        video.muted = false
        this.src = "/images/volume.svg"
        volume.disabled = false
        volume.style.cursor = "pointer"
    }
})

window.addEventListener("keydown", function (e) {
    e.preventDefault;
    console.log(e);
    if (e.code == "Space") {
        changePlayState();
    }
    if (e.code == "ArrowLeft") {
        if (video.currentTime > 5) {
            video.currentTime = video.currentTime - 5;
        }
    }
    if (e.code == "ArrowRight") {
        if (video.currentTime < video.duration - 5) {
            video.currentTime = video.currentTime + 5;
        }
    }
    if (e.key == "P" || e.key == "p") {
        prevFile();
    }
    if (e.key == "N" || e.key == "n") {
        nextFile();
    }
});

let controlsVisivilityTimeOut = null;

controls.addEventListener("mouseenter", function (e) {
    // console.log(e, "enter");
    if (controlsVisivilityTimeOut !== null) {
        window.clearTimeout(controlsVisivilityTimeOut);
    }
    if (controls.classList.contains("hide")) {
        controls.classList.remove("hide");
        fileName.classList.remove("hide");
    }
});

controls.addEventListener("mouseleave", function (e) {
    // console.log(e, "leave");
    controlsVisivilityTimeOut = window.setTimeout(() => {
        controls.classList.add("hide");
        fileName.classList.add("hide");
        controlsVisivilityTimeOut = null;
    }, 3000);
});

filePicker.addEventListener("change", function () {
    if (filePicker.files.length > 0) {

        playlist = filePicker.files;

        let playlistItems = document.createElement("ul");
        playlistItems.setAttribute("class", "playlist");
        Array.from(playlist).forEach((item, index) => {
            // playlistItems.innerHTML += `<li class="playlist-item" id=${index}>
            // <span>${index + 1} - </span> <span>${item.name}</span>
            // </li>`
            let li = document.createElement("li");
            li.setAttribute("id", index);
            li.setAttribute("class", "playlist-item");
            li.innerHTML = `<span>${index + 1} - </span> <span>${item.name}</span>`;
            playlistItems.append(li);
        });

        // console.log(playlistItems);
        // playlistContainer.innerHTML = `<h4 class="playlist-title">Lisitra :</h4>`
        playlistContainer.innerHTML = `<button type="button" class="close-playlist">X</button>`;
        playlistContainer.append(playlistItems);

        playlistClose = document.querySelector(".close-playlist");

        playlistClose.addEventListener("click", function () {
            playlistContainer.classList.add("remove");
        });

        listItem = document.querySelectorAll(".playlist-item");

        Array.from(listItem).map((e) => {
            e.addEventListener("click", function () {
                // console.log(e.id);
                playlistContainer.classList.add("remove");
                videoIndex = parseInt(e.id);
                loadVideo();
            });
        });
        loadVideo();
    }
});

playlistTrigger.addEventListener("click", function () {
    if (playlistContainer.classList.contains("remove")) {
        playlistContainer.classList.remove("remove");
    }
});

playBtn.addEventListener("click", function () {
    changePlayState();
});

prevBtn.addEventListener("click", function () {
    prevFile();
});

nextBtn.addEventListener("click", function () {
    nextFile();
});

slider.addEventListener("change", function () {
    video.currentTime = slider.value;
});
slider.addEventListener("input", function () {
    video.currentTime = slider.value;
});

//change play button state
video.addEventListener("play", function () {
    // playBtnIcon.classList.remove("ri-play-fill")
    // playBtnIcon.classList.add("ri-pause-fill")
    playBtn.innerHTML = `<img src="/images/pause.svg">`;
});
video.addEventListener("pause", function () {
    // playBtnIcon.classList.remove("ri-pause-fill")
    // playBtnIcon.classList.add("ri-play-fill")
    playBtn.innerHTML = `<img src="/images/play.svg" id="play-btn-icon">`;
});



if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("../sw.js")
            .then((registration) => {
                console.log("Service Worker registered:", registration);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}
