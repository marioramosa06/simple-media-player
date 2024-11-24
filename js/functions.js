changePlayState = () => {
    if (video.paused) { video.play() }
    else { video.pause() }
}

timeFormat = (t) => {
    let min = Math.floor(t / 60)
    let sec = Math.floor(t - min * 60)
    let time = `${min > 9 ? min : "0" + min} : ${sec > 9 ? sec : "0" + sec}`
    return time
}

loadVideo = () => {
    loader.classList.remove("hide")
    let file = new FileReader()
    file.readAsDataURL(filelist[fileIndex]);
    file.onload = () => { video.setAttribute("src", file.result) }
    let videoDuration = 0
    video.onloadedmetadata = () => {
        videoDuration = video.duration;
        totalTime.innerText = timeFormat(videoDuration);
        slider.max = Math.floor(videoDuration);
    };

    video.oncanplay = () => {
        loader.classList.add("hide")

        let name = filelist[fileIndex].name;

        document.querySelector("title").innerText = name;
        fileName.innerHTML = `${fileIndex + 1} / ${filelist.length} - ${name}`;
        window.setInterval(function () {
            slider.value = Math.floor(video.currentTime);
            totalTime.innerText = timeFormat(video.duration - video.currentTime)

            elapsedTime.innerText = timeFormat(video.currentTime);
            if (video.ended) { nextFile() }
        }, 1000)
    }
}

createPlaylist = (filelist) => {
    let playlistItems = document.createElement("ul")
    playlistItems.setAttribute("class", "playlist")
    Array.from(filelist).forEach((item, index) => {
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
            fileIndex = parseInt(e.id)
            loadVideo()
        }
    });
}

prevFile = () => {
    if (fileIndex > 0) {
        fileIndex--;
        loadVideo();
    }
}

nextFile = () => {
    if (fileIndex < filelist.length - 1) {
        fileIndex++;
        loadVideo();
    }
}

volumeUp = (n) => {
    if (video.volume + (n / 100) <= 1) { video.volume += n / 100 }
    volume.value = video.volume * 100
}

volumeDown = (n) => {
    if (video.volume - (n / 100) >= 0) { video.volume -= n / 100 }
    volume.value = video.volume * 100
}

muteVolume = () => {
    if (!video.muted) {
        video.muted = true;
        volumeIcon.src = "/images/volume-mute.svg"
        volume.disabled = true
        volume.style.cursor = "not-allowed"
    } else {
        video.muted = false
        volumeIcon.src = "/images/volume.svg"
        volume.disabled = false
        volume.style.cursor = "pointer"
    }
}
