let toastEl = null;
let toastTimer = null;

export function showToast(message, duration = 2000) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('toast--visible');
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('toast--visible');
  }, duration);
}
