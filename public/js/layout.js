import { $ } from "/js/constant.js";

document.onclick = () => {
  [...$(".dropdown")].forEach(
    dropdown => dropdown.style.display = "none");
}