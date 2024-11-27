changePlayState = () => {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
};

timeFormat = (t) => {
    const min = Math.floor(t / 60);
    const sec = Math.floor(t - min * 60);
    let time = `${min > 9 ? min : "0" + min}:${sec > 9 ? sec : "0" + sec}`;
    return time;
};

pickFiles = (fileinput) => {
    if (fileinput.files.length > 0) {
        filelist = fileinput.files;
        fileIndex = 0;
        createPlaylist(filelist);
        loadVideo();
    }
};

loadVideo = () => {
    loader.classList.remove("hide");
    let file = new FileReader();
    file.readAsDataURL(filelist[fileIndex]);
    file.onload = () => {
        video.setAttribute("src", file.result);
    };
    let videoDuration = 0;
    video.onloadedmetadata = () => {
        videoDuration = video.duration;
        totalTime.innerText = timeFormat(videoDuration);
        slider.max = Math.floor(videoDuration);
        videoW = video.videoWidth;
        videoH = video.videoHeight;
    };

    video.oncanplay = () => {
        loader.classList.add("hide");
        let name = filelist[fileIndex].name;

        document.title = name;
        fileName.innerHTML = `${fileIndex + 1} - ${name}`;

        Array.from(listItem).forEach((e) => {
            if (e.id == fileIndex) {
                e.classList.add("playlist-item-playing");
            } else {
                if (e.classList.contains("playlist-item-playing")) {
                    e.classList.remove("playlist-item-playing");
                }
            }
        });
        window.setInterval(function () {
            slider.value = Math.floor(video.currentTime);
            totalTime.innerText = timeFormat(video.duration - video.currentTime);

            elapsedTime.innerText = timeFormat(video.currentTime);
            if (video.ended) {
                nextFile();
            }
        }, 1000);
    };
};

createPlaylist = (filelist) => {
    let playlistItems = document.createElement("ul");
    playlistItems.setAttribute("class", "playlist");
    Array.from(filelist).forEach((item, index) => {
        let li = document.createElement("li");
        li.setAttribute("id", index);
        li.setAttribute("class", "playlist-item");
        li.innerHTML = `<span>${index + 1} - </span> <span>${item.name}</span>`;
        playlistItems.append(li);
    });
    playlistContainer.innerHTML = `<button type="button" class="close-playlist">
        <i class="ri-close-fill" ></i>
    </button>`;
    playlistContainer.append(playlistItems);
    playlistClose = document.querySelector(".close-playlist");
    playlistClose.onclick = () => {
        playlistContainer.classList.add("remove");
    };
    listItem = document.querySelectorAll(".playlist-item");
    Array.from(listItem).map((e) => {
        e.onclick = () => {
            playlistContainer.classList.add("remove");
            fileIndex = parseInt(e.id);
            loadVideo();
        };
    });
};

prevFile = () => {
    if (fileIndex > 0) {
        fileIndex--;
        loadVideo();
    }
};

nextFile = () => {
    if (fileIndex < filelist.length - 1) {
        fileIndex++;
        loadVideo();
    }
};

rewind = (n) => {
    if (video.currentTime > n) {
        video.currentTime = video.currentTime - n;
    }
};
forward = (n) => {
    if (video.currentTime < video.duration - n) {
        video.currentTime = video.currentTime + n;
    }
};
volumeUp = (n) => {
    if (video.volume + n / 100 <= 1) {
        video.volume += n / 100;
    }
    volume.value = video.volume * 100;
};

volumeDown = (n) => {
    if (video.volume - n / 100 >= 0) {
        video.volume -= n / 100;
    }
    volume.value = video.volume * 100;
};

muteVolume = () => {
    if (!video.muted) {
        video.muted = true;
        volumeIcon.classList.remove("ri-volume-up-fill");
        volumeIcon.classList.add("ri-volume-mute-fill");
        volume.disabled = true;
        volume.style.cursor = "not-allowed";
    } else {
        video.muted = false;
        volumeIcon.classList.remove("ri-volume-mute-fill");
        volumeIcon.classList.add("ri-volume-up-fill");
        volume.disabled = false;
        volume.style.cursor = "pointer";
    }
};
