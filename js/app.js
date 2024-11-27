playlistClose.onclick = () => {
  playlistContainer.classList.add("remove");
};

volume.onchange = () => {
  video.volume = volume.value / 100;
  document
    .querySelector(".volume-slider")
    .setAttribute("title", `${volume.value}%`);
};

volumeIcon.onclick = () => {
  muteVolume();
};

window.onkeydown = (e) => {
  e.preventDefault;
  if (e.code == "Space") {
    changePlayState();
  }
  if (e.code == "ArrowLeft") {
    rewind(20)
  }
  if (e.code == "ArrowRight") {
    forward(20)
  }
  if (e.code == "ArrowUp") {
    volumeUp(5);
  }
  if (e.code == "ArrowDown") {
    volumeDown(5);
  }
  if (e.key == "P" || e.key == "p") {
    prevFile();
  }
  if (e.key == "N" || e.key == "n") {
    nextFile();
  }
  if (e.key == "M" || e.key == "m") {
    muteVolume();
  }
};

let controlsVisivilityTimeOut = null;

controls.onmouseenter = (e) => {
  if (controlsVisivilityTimeOut !== null) {
    window.clearTimeout(controlsVisivilityTimeOut);
  }
  if (controls.classList.contains("hide")) {
    controls.classList.remove("hide");
    fileName.classList.remove("hide");
  }
};

controls.onmouseleave = (e) => {
  controlsVisivilityTimeOut = window.setTimeout(() => {
    controls.classList.add("hide");
    fileName.classList.add("hide");
    controlsVisivilityTimeOut = null;
  }, 3000);
};

filePicker.onchange = () => {
  pickFiles(filePicker)
};

playlistTrigger.onclick = () => {
  playlistContainer.classList.toggle("remove");
};

playBtn.onclick = () => {
  changePlayState();
};

prevBtn.onclick = () => {
  prevFile();
};

nextBtn.onclick = () => {
  nextFile();
};

slider.onchange = () => {
  video.currentTime = slider.value;
};

slider.oninput = () => {
  video.currentTime = slider.value;
};

video.onplay = () => {
  playBtn.innerHTML = `<i class="ri-pause-fill"></i>`;
};

video.onpause = () => {
  playBtn.innerHTML = `<i class="ri-play-fill" id="play-btn-icon"></i>`;
};

video.addEventListener("error", function () {
  console.log("not supported, playing next file");
  let fileErrorIndex = fileIndex;
  listItem = document.querySelectorAll(".playlist-item");
  Array.from(listItem).forEach((e) => {
    if (e.id == fileErrorIndex) {
      e.classList.add("playlist-item-error");
    }
  });
  nextFile();
});

// serive worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
