function changePlayState() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function timeFormat(t) {
    let min = Math.floor(t / 60);
    let sec = Math.floor(t - min * 60);
    let time = `${min > 9 ? min : "0" + min} : ${sec > 9 ? sec : "0" + sec}`;
    return time;
}

function loadVideo() {
    // console.log(playlist);
    loader.classList.remove("hide");

    let file = new FileReader();
    file.readAsDataURL(playlist[videoIndex]);
    file.onload = () => {
        video.setAttribute("src", file.result);
        // loader.classList.add("hide")
    };

    let videoDuration = 0;

    video.onloadedmetadata = function () {
        // console.log('metadata loaded!');
        // console.log(this.duration);
        videoDuration = this.duration;
        totalTime.innerText = timeFormat(videoDuration);
        slider.max = Math.floor(videoDuration);
    };

    video.oncanplay = function () {
        loader.classList.add("hide");

        let name = playlist[videoIndex].name;

        document.querySelector("title").innerText = name;
        fileName.innerHTML = `${videoIndex + 1} / ${playlist.length} - ${name}`;
        window.setInterval(function () {
            slider.value = Math.floor(video.currentTime);
            // totalTime.innerText = timeFormat(videoDuration - video.currentTime)
            elapsedTime.innerText = timeFormat(video.currentTime);
            if (video.ended) {
                nextFile();
            }
        }, 1000);
    };
}

function prevFile() {
    if (videoIndex > 0) {
        videoIndex--;
        loadVideo();
    }
}

function nextFile() {
    if (videoIndex < playlist.length - 1) {
        videoIndex++;
        loadVideo();
    }
}