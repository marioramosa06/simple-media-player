playlistClose.onclick = (e) => {
  console.log(e);

  hidePlaylist();
};

volume.oninput = () => {
  media.volume = volume.value / 100;
  document
    .querySelector(".volume-slider")
    .setAttribute("title", `${volume.value}%`);
};

volumeIcon.onclick = () => {
  muteVolume();
};

media.ondblclick = (e) => {
  console.log(e);
  document.body.webkitRequestFullScreen();
};

media.ontouchstart = (e) => {
  console.log(e);

  if (!controls.classList.contains("show")) {
    showControls();
  } else {
    hideControls();
  }
};

window.onkeydown = (e) => {
  // e.preventDefault();
  if (e.code == "Space") {
    changePlayState();
  }
  if (e.code == "ArrowLeft") {
    rewind(10);
  }
  if (e.code == "ArrowRight") {
    forward(10);
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
  if (e.key == "L" || e.key == "l") {
    showPlaylist();
  }
  if (e.key == "Escape") {
    hidePlaylist();
  }
};

let timeOut = undefined;
controls.onmouseenter = (e) => {
  if (timeOut !== undefined) {
    window.clearTimeout(timeOut);
  }
  if (controls.classList.contains("hide")) {
    showControls();
    if (playlistContainer.style.display == "block") {
      shrinkPlaylist();
    }
  }
};

controls.onmouseleave = (e) => {
  timeOut = window.setTimeout(() => {
    hideControls();
    if (playlistContainer.style.display == "block") {
      growPlaylist();
    }
    window.clearTimeout(timeOut);
  }, 3000);
};

filePicker.onchange = () => {
  pickFiles(filePicker);
};

playlistTrigger.onclick = () => {
  if (playlistContainer.classList.contains("hide")) {
    showPlaylist();
  } else {
    hidePlaylist();
  }
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

slider.oninput = () => {
  if (typeof playerInterval !== "undefined") {
    window.clearInterval(playerInterval);
  }
  media.currentTime = slider.value;
};

media.onplay = () => {
  playBtn.innerHTML = `<i class="ri-pause-fill"></i>`;
};

media.onpause = () => {
  playBtn.innerHTML = `<i class="ri-play-fill" id="play-btn-icon"></i>`;
};

media.addEventListener("error", function () {
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

media.addEventListener("ended", function (e) {
  console.log("ended", e);
  nextFile();
});

// service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
