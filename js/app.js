let playlist = []
let videoIndex = 0

playlistClose.onclick = () => { playlistContainer.classList.add("remove") }

let volume = document.querySelector("#volume")

volume.onchange = () => {
    video.volume = volume.value / 100
    document.querySelector(".volume-slider").setAttribute("title", `${volume.value}%`)
}

volumeIcon.onclick = () => { muteVolume() }

window.onkeydown = (e) => {
    e.preventDefault;
    if (e.code == "Space") { changePlayState(); }
    if (e.code == "ArrowLeft") {
        if (video.currentTime > 5) {
            video.currentTime = video.currentTime - 5;
        }
    }
    if (e.code == "ArrowRight") {
        if (video.currentTime < video.duration - 5) {
            video.currentTime = video.currentTime + 5
        }
    }
    if (e.code == "ArrowUp") { volumeUp(5) }
    if (e.code == "ArrowDown") { volumeDown(5) }
    if (e.key == "P" || e.key == "p") { prevFile() }
    if (e.key == "N" || e.key == "n") { nextFile() }
    if (e.key == "M" || e.key == "m") { muteVolume() }
}

let controlsVisivilityTimeOut = null;

controls.onmouseenter = (e) => {
    if (controlsVisivilityTimeOut !== null) { window.clearTimeout(controlsVisivilityTimeOut) }
    if (controls.classList.contains("hide")) {
        controls.classList.remove("hide")
        fileName.classList.remove("hide")
    }
}

controls.onmouseleave = (e) => {
    controlsVisivilityTimeOut = window.setTimeout(() => {
        controls.classList.add("hide");
        fileName.classList.add("hide");
        controlsVisivilityTimeOut = null;
    }, 3000);
}

filePicker.onchange = () => {
    if (filePicker.files.length > 0) {
        playlist = filePicker.files
        let playlistItems = document.createElement("ul")
        playlistItems.setAttribute("class", "playlist")
        Array.from(playlist).forEach((item, index) => {
            let li = document.createElement("li")
            li.setAttribute("id", index)
            li.setAttribute("class", "playlist-item")
            li.innerHTML = `<span>${index + 1} - </span> <span>${item.name}</span>`
            playlistItems.append(li)
        });
        playlistContainer.innerHTML = `<button type="button" class="close-playlist">hiala</button>`
        playlistContainer.append(playlistItems)
        playlistClose = document.querySelector(".close-playlist")
        playlistClose.onclick = () => { playlistContainer.classList.add("remove") }
        listItem = document.querySelectorAll(".playlist-item")
        Array.from(listItem).map((e) => {
            e.onclick = () => {
                playlistContainer.classList.add("remove")
                videoIndex = parseInt(e.id)
                loadVideo()
            }
        });
        loadVideo()
    }
}

playlistTrigger.onclick = () => {
    playlistContainer.classList.toggle("remove")
}

playBtn.onclick = () => { changePlayState() }

prevBtn.onclick = () => { prevFile() }

nextBtn.onclick = () => { nextFile() }

slider.onchange = () => { video.currentTime = slider.value }

slider.oninput = () => { video.currentTime = slider.value }

video.onplay = () => { playBtn.innerHTML = `<img src="/images/pause.svg">` }

video.onpause = () => { playBtn.innerHTML = `<img src="/images/play.svg" id="play-btn-icon">` }

// serive worker
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
