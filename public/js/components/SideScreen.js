import { STAGE_WIDTH, STAGE_HEIGHT, PIXEL_PER_SEC, TIMELINE_PADDING, TIME_UNIT,
HANDLE_WIDTH, COLOR_NUM, $ } from "/js/constant.js";
const TAG = "SideScreen.js/";

export default class SideScreen {
  constructor({
    dancerArray,
    addDancer,
    deleteDancer,
    changeDancerName,
    changeDancerColor
  }) {
    this.dancerArray = dancerArray;
    this.changeDancerName = changeDancerName;
    this.deleteDancer = deleteDancer;
    this.changeDancerColor = changeDancerColor;
    this.screenIsShown = true;

    this.$sideScreen = $("#sidebar");

    $("#add_dancer_button").onclick = addDancer;

    this.createDancerButtonElem = function(dancer) {
      const $dancerButtonContainer = $("div.sidebar_container");
      const $dancerButton = $("div.sidebar_button");
      const $dancerIndex = $(
        "label.sidebar_button__dancerIndex",
        { textNode: dancer.id+1 }
      );
      $dancerIndex.style.backgroundColor = dancer.color;
      const $colorInput = $(
        "input.sidebar_button__colorInput",
        { type: "color", value: dancer.color });
      $dancerIndex.append($colorInput);

      const $name = $(
        "input.sidebar_input",
        {
          type: "text", value: dancer.name,
          maxlength: 20, placeholder: "이름을 입력해주세요."
        });
      $name.onchange = () => {
        // 앞뒤 공백 제거 (정규표현식 사용)
        const newName = $name.value.replace(/^\s+|\s+$/gm, "");
        if(newName == "")
        $name.value = dancer.name;
        else {
          $name.value = newName;
          changeDancerName(dancer.id, newName);
        }
      }

      const $deleteButton = $("div.sidebar_button__deleteButton");
      $deleteButton.onclick = () => {
        if(window.confirm("정말 삭제하시겠습니까? 되돌릴 수 없어요!"))
        deleteDancer(dancer.id);
      }

      $dancerButton.append($dancerIndex, $name, $deleteButton);
      $dancerButtonContainer.append($dancerButton);
      
      this.selectedDancer = null;
      
      $dancerButton.onclick = e => {
        console.log("선택", dancer.id);
        
        if (this.selectedDancer != null) {
          $("#dancer_list").children[this.selectedDancer].classList.remove("sidebar_button--selected");
        }
        this.selectedDancer = dancer.id;
        $("#dancer_list").children[this.selectedDancer].classList.add("sidebar_button--selected");
      	
        $("#dancer_list").children[this.selectedDancer].append($("#edit_dancer"));
      }
      
      return $dancerButtonContainer;
    }
    
    dancerArray.forEach(dancer => {
      this.$sideScreen.querySelector("#dancer_list").append(this.createDancerButtonElem(dancer));
    });

    // document.getElementById("main_section").appendChild(this.$sideScreen);

    const $rightToolbar = document.getElementById("right_toolbar");
    if(document.getElementById("dancer_btn"))
    document.getElementById("dancer_btn").onclick = () => {
      this.screenIsShown = !this.screenIsShown;
      this.$sideScreen.style.right = this.screenIsShown ? "0" : "-240px";
      $rightToolbar.style.width = this.screenIsShown ? "288px" : "48px";
    };

  }

  addDancer(id) {
    const dancer = this.dancerArray[id];
    this.$sideScreen.querySelector("#dancer_list").append(this.createDancerButtonElem(dancer));
  }

  removeDancer(id) {
    this.$sideScreen.lastChild.removeChild(this.$sideScreen.lastChild.children[id]);
    [...this.$sideScreen.lastChild.children].forEach(($elem, id) => {
      $elem.firstChild.innerText = id+1;
    });
  }
}