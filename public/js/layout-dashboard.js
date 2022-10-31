import { $ } from "/js/constant.js";
import Toast from "./components/Toast.js";

const $profileContextMenu = $("#profile_contextMenu");

$("#profile_button").onclick = e => {
  e.stopPropagation();
  $profileContextMenu.style.display = "flex";
  $profileContextMenu.style.right = 0;
}

const $createNoteContextMenu = $("#create_note_contextMenu");

$("#add_note_button").onclick = e => {
  e.stopPropagation();
  const { top, left, height } = e.target.getBoundingClientRect();
  $createNoteContextMenu.style.display = "flex";
  $createNoteContextMenu.style.left = left + "px";
  $createNoteContextMenu.style.top = height + top + "px";
}

$("#load_file_input").onchange = e => handleFile(e.target.files[0]);

function handleFile(file) {
  console.log(file);
  
  if (file === undefined) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const result = JSON.parse(e.target.result);

      if(!checkDB(result)) {
        new Toast("파일이 훼손되었습니다!", "warning");
        return;
      }
      
      console.log(result);
      const [ dancers, formations, noteInfo ] = result;
      
      axios.post('/note/load', {
        dancers,
        formations,
        noteInfo,
      })
      .then(res => {
        console.log("불러오기 완료");
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
      })
      
    } catch (err) {
      console.error(err);
    }
  }
  
  reader.readAsText(file);
  
  /**
   * JSON 파일의 형식이 올바른지 확인
   * @param {Array} result 
   * @returns 
   */
  function checkDB(result) {
    const [dancers, formations, noteInfo] = result;

    // dancers, formations, noteInfo 3개가 있어야 함
    if(result.length != 3) {
      console.error("Length is not 3.");
      return false;
    }

    if(dancers == undefined || formations == undefined || noteInfo == undefined) {
      console.error("Some array are undefined.");
      return true;
    }

    return true;
  }
}
