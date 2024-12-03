pickFiles = (fileinput) => {
  if (fileinput.files.length > 0) {
    filelist = Array.from(fileinput.files);
    fileIndex = 0;
    createPlaylist(filelist);
    loadFile();
  }
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
      loadFile();
    };
  });
};

loadFile = () => {
  loader.classList.remove("hide");
  const currentFile = filelist[fileIndex];
  let fileReader = new FileReader();

  fileReader.readAsArrayBuffer(currentFile);
  fileReader.onload = (e) => {
    let mediaBlob = new Blob([new Uint8Array(e.target.result)]);
    media.src = window.URL.createObjectURL(mediaBlob);
  };

  media.onloadedmetadata = () => {
    totalTime.innerText = timeFormat(media.duration);
    slider.max = Math.floor(media.duration);
  };

  media.oncanplay = () => {
    loader.classList.add("hide");
    document.title = currentFile.name;
    fileName.innerHTML = `${fileIndex + 1} - ${currentFile.name}`;

    Array.from(listItem).forEach((e) => {
      if (e.id == fileIndex) {
        e.classList.add("playlist-item-playing");
      } else {
        if (e.classList.contains("playlist-item-playing")) {
          e.classList.remove("playlist-item-playing");
        }
      }
    });
    playerInterval = window.setInterval(function () {
      slider.value = Math.floor(media.currentTime);
      totalTime.innerText = timeFormat(media.duration - media.currentTime);
      elapsedTime.innerText = timeFormat(media.currentTime);
    }, 1000);
  };
};

showPlaylist = () => {
  playlistContainer.style.display = "block";
  playlistContainer.classList.add("show");
  playlistContainer.classList.remove("hide");
}

hidePlaylist = () => {
  playlistContainer.classList.remove("show");
  playlistContainer.classList.add("hide");
  playlistContainer.style.display = "none";
}

showControls = () => {
  controls.classList.remove("hide");
  fileName.classList.remove("hide");
  controls.classList.add("show");
  fileName.classList.add("show");
  playlistContainer.classList.remove("playlist-container-grow");
  playlistContainer.style.height = "calc(100vh - 145px)";
  playlistContainer.style.bottom = "105px";
}

hideControls = () => {
  controls.classList.remove("show");
  fileName.classList.remove("show");
  controls.classList.add("hide");
  fileName.classList.add("hide");
  playlistContainer.classList.add("playlist-container-grow");
  playlistContainer.style.height = "calc(100vh - 40px)";
  playlistContainer.style.bottom = "20px";
}

changePlayState = () => {
  if (media.paused) {
    media.play();
  } else {
    media.pause();
  }
};

prevFile = () => {
  clearPlayerInterval();
  if (fileIndex > 0) {
    fileIndex--;
    loadFile();
  } else {
    fileIndex = filelist.length - 1;
    loadFile();
  }
};

nextFile = () => {
  clearPlayerInterval();
  if (fileIndex < filelist.length - 1) {
    fileIndex++;
    loadFile();
  } else {
    fileIndex = 0;
    loadFile();
  }
};

rewind = (n) => {
  if (media.currentTime > n) {
    media.currentTime = media.currentTime - n;
  }
};

forward = (n) => {
  if (media.currentTime < media.duration - n) {
    media.currentTime = media.currentTime + n;
  }
};

shufflePlaylist = (arr) => {
  let shuffled = [];
  while (arr.length > shuffled.length) {
    let randomFile = arr[Math.floor(Math.random() * arr.length)]

    if (!shuffled.includes(randomFile)) {
      shuffled.push(randomFile)
    }
    console.log(randomFile);
  }
  return shuffled;
};

toggleShuffle = () => {
  if (!shuffle) {
    shuffle = true;
    shuffleBtn.style.backgroundColor = "var(--primary)";
    if (filelist.length >= 3) {
      filelist = shufflePlaylist(filelist);
      createPlaylist(filelist);
    }
    console.log("shuffle: on");
  } else {
    shuffle = false;
    shuffleBtn.style.backgroundColor = "var(--background)";
    console.log("shuffle: off");
  }
};

toggleRepeat = () => {
  console.log("toggle repeat");
};


volumeUp = (n) => {
  if (media.volume + n / 100 <= 1) {
    media.volume += n / 100;
  }
  volume.value = media.volume * 100;
};

volumeDown = (n) => {
  if (media.volume - n / 100 >= 0) {
    media.volume -= n / 100;
  }
  volume.value = media.volume * 100;
};

muteVolume = () => {
  if (!media.muted) {
    media.muted = true;
    volumeIcon.classList.remove("ri-volume-up-fill");
    volumeIcon.classList.add("ri-volume-mute-fill");
    volume.disabled = true;
    volume.style.cursor = "not-allowed";
  } else {
    media.muted = false;
    volumeIcon.classList.remove("ri-volume-mute-fill");
    volumeIcon.classList.add("ri-volume-up-fill");
    volume.disabled = false;
    volume.style.cursor = "pointer";
  }
};

timeFormat = (timeInSecond) => {
  const hour = Math.floor(timeInSecond / 3600);
  const min = Math.floor((timeInSecond - hour * 3600) / 60);
  const sec = Math.floor(timeInSecond - hour * 3600 - min * 60);
  let timeFormated = "";
  if (hour < 1) {
    timeFormated = `${min > 9 ? min : "0" + min}:${sec > 9 ? sec : "0" + sec}`;
  } else {
    timeFormated = `${hour > 9 ? hour : "0" + hour}:${min > 9 ? min : "0" + min
      }:${sec > 9 ? sec : "0" + sec}`;
  }
  return timeFormated;
};

clearPlayerInterval = () => {
  if (typeof playerInterval !== "undefined") {
    window.clearInterval(playerInterval);
  }
};
