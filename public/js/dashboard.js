import { $, createElemWithHtml } from "/js/constant.js";

const sortContextMenu = $("#sort_contextMenu");

window.onload = () => {
  $(".grid")[0].classList.add("grid--onload");
}
$("#create_note_btn").onclick = createNote;

$("#sort_button").onclick = e => {
  e.stopPropagation();
  
  sortContextMenu.style.display = sortContextMenu.style.display == "flex" ? "none" : "flex";
  sortContextMenu.style.top = $("#sort_button").getBoundingClientRect().height + "px";
  sortContextMenu.style.right = 0;
}

const noteElemList = [];
let currentSort = "createdAt";
let sortBlock = false;
const sortLabel = {
  createdAt: "생성일 순서",
  editedAt: "수정일 순서",
  title: "이름 순서"
};

$("#sort_create").onclick = () => sortNote("createdAt");
$("#sort_edit").onclick   = () => sortNote("editedAt");
$("#sort_title").onclick  = () => sortNote("title");

function sortNote(newSort) {
  if (currentSort == newSort || sortBlock) return;
  sortBlock = true;
  currentSort = newSort;
  
  $("#sort_label").textContent = sortLabel[newSort];
  
  axios.get(`/dashboard/sort?orderby=${newSort}`)
  .then(res => {
    const { notes } = res.data;
    
    const fragment = document.createDocumentFragment();
    
    notes.forEach(note => fragment.append( noteElemList[note.id] ));
    $("#note_container").append(fragment);
  })
  .catch(err => {
    
    console.error(err);
  })
  .finally(() => {
    sortBlock = false;
  });
}

/****************/

/*** FUNCTION ***/

/****************/

function createNote() {
  axios.get('/dashboard/create_note')
  .then(res => {
    const { noteId } = res.data;
    console.log("새로운 노트:", noteId );
    $("a", { href: `/note?id=${noteId}` }).click();
  })
  .catch(err => {
    console.error(err);
  });
}

let selectedNote = null;
const $noteContextMenu = $("#note_contextMenu");

axios.get('/dashboard/get_notes')
.then(res => {
  const { notes } = res.data;
    
  const fragment = document.createDocumentFragment();
  notes.forEach(note => {
    const $note = createElemWithHtml(`
    <div tabindex="0" class="note__container">
      <div class="note__body">
        <div class="note__thumbnail">
        </div>
        <div class="note__titlePart">
          <div class="text__title">${note.title}</div>
          <div class="text__sub">${note.createdAt}</div>
        </div>
      </div>
    </div>
    `);
    
    noteElemList[note.id] = $note;
    
    /* THUMBNAIL */
    const thumbnail = $note.querySelector(".note__thumbnail");
    
    // horizontal axis
    for (let i=-1; i<2; i++) {
      thumbnail.append(createElemWithHtml(`
      	<div class="note__thumbnail_axis" style="
          top: calc(${50 + 120 / 4 * i}% - 0.5px)"></div>
      `));
    }
    
    // vertical axis
    for (let i=-2; i<3; i++) {
      thumbnail.append(createElemWithHtml(`
      	<div class="note__thumbnail_axisVer" style="
          left: calc(${50 + 120 / 4 * i}% - 0.5px)"></div>
      `));
    }
    
    note.dancers.forEach(dancer => {
      thumbnail.append(createElemWithHtml(`
      	<div class="note__thumbnail_dancer" style="
          top: calc(50% + ${dancer.y}% / 4);
          left: calc(50% + ${dancer.x}% / 6);">
          <div class="note__thumbnail_dancerBody" style="background-color: ${dancer.color}"></div>
        </div>
      `))
    });
    
    $note.onclick = () => $("a", { href: `/note?id=${note.noteId}` }).click();
    $note.oncontextmenu = e => e.preventDefault();  // 브라우저 기본 이벤트 제거
    $note.onmousedown = e => {
      // 우클릭 한 경우
      if (e.button == 2 || e.which == 3) {
        e.stopPropagation();
        console.log(note);
        selectedNote = note.id;
        $noteContextMenu.style.display = "flex";
        $noteContextMenu.style.top = e.pageY + "px";
        $noteContextMenu.style.left = e.pageX + "px";
      }
    }
    fragment.append($note);
  });
  $("#note_container").append(fragment);
})
.catch(err => {
  console.error(err);
});

$("#delete_button").onclick = () => {
  console.log("삭제버튼", selectedNote);
  if (!selectedNote) return;
  
  deleteNote(selectedNote);
}

function deleteNote(id) {
  axios.post('/dashboard/delete_note', {
    id: id
  })
  .then(res => {
    console.log("삭제 완료");
		window.location.reload();
  })
  .catch(err => {
    console.error(err);
  });
}