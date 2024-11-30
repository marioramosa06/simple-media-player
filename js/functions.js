changePlayState = () => {
  if (media.paused) {
    media.play();
  } else {
    media.pause();
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
    loadFile();
  }
};

loadFile = () => {
  loader.classList.remove("hide");
  const currentFile = filelist[fileIndex];
  let fileReader = new FileReader();

  // fileReader.readAsDataURL(currentFile);
  // fileReader.onload = () => {
  //   media.src = fileReader.result;
  // };

  fileReader.readAsArrayBuffer(currentFile);
  fileReader.onload = (e) => {
    let buffer = e.target.result;
    let mediaBlob = new Blob([new Uint8Array(buffer)], { type: "video/mp4" });
    let url = window.URL.createObjectURL(mediaBlob);
    media.src = url;
  };

  let videoDuration = 0;
  media.onloadedmetadata = () => {
    videoDuration = media.duration;
    totalTime.innerText = timeFormat(videoDuration);
    slider.max = Math.floor(videoDuration);
  };

  media.oncanplay = () => {
    loader.classList.add("hide");
    const name = currentFile.name;

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
    playerInterval = window.setInterval(function () {
      slider.value = Math.floor(media.currentTime);
      totalTime.innerText = timeFormat(media.duration - media.currentTime);
      elapsedTime.innerText = timeFormat(media.currentTime);
      if (media.currentTime === media.duration) {
        nextFile();
        window.clearInterval(playerInterval);
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
      loadFile();
    };
  });
};

prevFile = () => {
  if (fileIndex > 0) {
    fileIndex--;
    loadFile();
  } else {
    fileIndex = filelist.length - 1;
    loadFile();
  }
};

nextFile = () => {
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
