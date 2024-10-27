const htmlTitle = document.getElementById("title");
const filePicker = document.querySelector("#file");
const video = document.querySelector("#video");
const controls = document.querySelector(".controls");
const playBtn = document.getElementById("play-btn");
const playBtnIcon = document.getElementById("play-btn-icon");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const slider = document.getElementById("slider");
const elapsedTime = document.getElementById("time-elapsed");
const totalTime = document.getElementById("time-total");
const fileName = document.querySelector(".file-name");

let playlist = [];
let videoIndex = 0;

function changePlayState() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function timeFormat(t) {
    let min = Math.floor(t / 60)
    let sec = Math.floor(t - (min * 60))
    let time = `${min > 9 ? min : "0" + min} : ${sec > 9 ? sec : "0" + sec}`
    return time
}

function loadVideo() {
    let file = new FileReader();
    file.readAsDataURL(playlist[videoIndex]);
    file.onload = () => {
        video.setAttribute("src", file.result);
    };

    let videoDuration = 0
    video.onloadedmetadata = function () {
        console.log('metadata loaded!');
        console.log(this.duration); //this refers to myVideo
        videoDuration = this.duration
        totalTime.innerText = timeFormat(videoDuration)
        slider.max = Math.floor(videoDuration);
    };

    if (file.DONE) {
        let name = playlist[videoIndex].name
        htmlTitle.innerText = name
        fileName.innerHTML = name
        window.setInterval(function () {
            slider.value = Math.floor(video.currentTime);
            // totalTime.innerText = timeFormat(videoDuration - video.currentTime)
            elapsedTime.innerText = timeFormat(video.currentTime)
            if (video.ended) {
                nextFile()
            }
        }, 1000);
    }
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

window.addEventListener("keydown", function (e) {
    e.preventDefault;
    console.log(e);
    if (e.code == "Space") {
        changePlayState();
    }
    if (e.code == "ArrowLeft") {
        if (video.currentTime > 5) {
            video.currentTime = video.currentTime - 5
        }
    }
    if (e.code == "ArrowRight") {
        if (video.currentTime < video.duration - 5) {
            video.currentTime = video.currentTime + 5
        }
    }
    if (e.key == "P" || e.key == "p") {
        prevFile()
    }
    if (e.key == "N" || e.key == "n") {
        nextFile()
    }
});

let controlsVisivilityTimeOut = null;

window.addEventListener("mousemove", function () {
    if (controlsVisivilityTimeOut !== null) {
        window.clearTimeout(controlsVisivilityTimeOut);
    }
    if (controls.classList.contains("hide")) {
        controls.classList.remove("hide");
        fileName.classList.remove("hide")
    }
    controlsVisivilityTimeOut = this.setTimeout(() => {
        controls.classList.add("hide");
        fileName.classList.add("hide");
        controlsVisivilityTimeOut = null;
    }, 3000);
});


filePicker.addEventListener("change", function () {
    playlist = filePicker.files;
    loadVideo();
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
    video.currentTime = slider.value
})
slider.addEventListener("input", function () {
    video.currentTime = slider.value
})

//change play button state
video.addEventListener("play", function () {
    playBtnIcon.classList.remove("ri-play-fill")
    playBtnIcon.classList.add("ri-pause-fill")
});
video.addEventListener("pause", function () {
    playBtnIcon.classList.remove("ri-pause-fill")
    playBtnIcon.classList.add("ri-play-fill")
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
