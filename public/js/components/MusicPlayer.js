import { musicDurationFormat, $ } from "/js/constant.js";
const TAG = "MusicPlayer.js/";

export default class MusicPlayer {
  constructor({ musicInfo, curTime, clickPlayBtn, addFormationBox }) {
    this.$playerSection = $("#player_section");

    this.isMusicPlaying = false;

    // TRACK

    this.$progress = this.$playerSection.querySelector("#progress");
    this.$progress.style.width = "0";

    // TIME TEXT
    this.$curTimeText = this.$playerSection.querySelector("#curtime_text");

    // BUTTON
    const $addBtn = this.$playerSection.querySelector("#add_btn");
    $addBtn.onclick = addFormationBox;

    const $playBtn = this.$playerSection.querySelector("#play_btn");
    $playBtn.onclick = clickPlayBtn;

    this.$playIcon = $playBtn.children[0];
    this.$pauseIcon = $playBtn.children[1];
      
    // DURATION TEXT
    const $durationText = this.$playerSection.querySelector("#duration_text");

    const text = musicDurationFormat(musicInfo.duration, true);
    $durationText.children[0].childNodes[0].data = text.slice(0, -3);
    $durationText.children[1].childNodes[0].data = text.slice(-3);

    this.musicCanPlay = musicInfo.name == "" ? false : true;
    this.$audio = document.getElementById("audio");
    // this.$audio.src = musicInfo.name;
    //this.$audio.onloadedmetadata = () => console.log("노래길이:", this.$audio.duration);
    this._curTime = curTime;
    this.musicDuration = musicInfo.duration; // ms
  }

  setCurTimeText(ms) {
    const text = musicDurationFormat(ms, true);
    this.$curTimeText.children[0].childNodes[0].data = text.slice(0, -3);
    this.$curTimeText.children[1].childNodes[0].data = text.slice(-3);
  }

  moveProgress(ms) {
    this.$progress.style.width = ms / this.musicDuration * 100 + "%";
  }

  play() {
    this.$audio.play();
    this.$playIcon.style.display = "none";
    this.$pauseIcon.style.display = "block";

    this.$progress.style.transitionDuration = this.musicDuration - this._curTime + "ms";
    this.$progress.style.width = "100%";
  }

  /* PAUSE 후, TIME_UNIT 으로 나누어 떨어지는 시간으로 설정 */
  pause(ms) {
    this.$audio.pause();
    this._curTime = ms;
    this.$audio.currentTime = ms / 1000;
    this.setCurTimeText(ms);
    this.$progress.style.transitionDuration = "0s";
    this.moveProgress(ms);
    this.$playIcon.style.display = "block";
    this.$pauseIcon.style.display = "none";
  }

  set curTime(ms) {
    this.pause(ms);
  }

  get audioCurTime() {
    return floorTime(this.$audio.currentTime * 1000);
  }
}
