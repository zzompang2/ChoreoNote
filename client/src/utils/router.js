const routes = {};
let navigationGuard = null; // () => bool — return true to block navigation

export function route(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function setNavigationGuard(guardFn) {
  navigationGuard = guardFn;
}

export function clearNavigationGuard() {
  navigationGuard = null;
}

export function startRouter() {
  let lastHash = window.location.hash;

  const handleRoute = () => {
    const newHash = window.location.hash;

    // Check guard before allowing navigation
    if (navigationGuard && navigationGuard()) {
      if (!confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
        // Restore previous hash without triggering another hashchange
        history.pushState(null, '', lastHash);
        return;
      }
    }

    lastHash = newHash;
    navigationGuard = null;
    window.onbeforeunload = null;

    const hash = newHash.slice(1) || '/';
    const [path, ...paramParts] = hash.split('/').filter(Boolean);
    const routePath = '/' + (path || '');

    const handler = routes[routePath];
    if (handler) {
      handler(paramParts.join('/'));
    } else if (routes['/']) {
      routes['/'](null);
    }
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
