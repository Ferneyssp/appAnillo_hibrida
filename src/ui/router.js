import { h } from './components.js';
import { t } from './messages.js';

/** Pestañas inferiores (como la barra de navegación de las imágenes de referencia). */
export const TABS = [
  { route: 'home', label: 'Anillo' },
  { route: 'finger', label: 'Dedo' },
  { route: 'converter', label: 'Convertidor' },
  { route: 'saved', label: 'Guardadas' },
];
const DEEP_LINKS = ['how', 'calibration', 'converter', 'saved', 'finger'];

/**
 * Enrutador con pila sincronizada con el historial (botón Atrás de Android/navegador).
 * Pantallas "interactive" (medidores, calibración) gestionan su propio DOM: el router no las
 * vuelve a dibujar en cada cambio de estado, solo al cambiar de ruta (evita interrumpir el
 * arrastre del deslizador).
 */
export function createRouter({ root, store, screens, startRoute = 'home' }) {
  let stack = [];
  let pendingRoute = null;
  let cleanup = null;
  let currentScreen = null;

  const current = () => stack[stack.length - 1];

  const nav = {
    push(route) {
      if (current() === route) return;
      stack.push(route);
      history.pushState({ depth: stack.length - 1 }, '', `#/${route}`);
      render(true);
    },
    back() {
      if (stack.length > 1) history.back();
    },
    /** Cambia de pestaña o reinicia el flujo: deja la pila en [home, route]. */
    reset(route) {
      if (pendingRoute) return;
      if (stack.length <= 1) {
        if (route === startRoute) render(true);
        else nav.push(route);
        return;
      }
      pendingRoute = route;
      history.go(-(stack.length - 1));
    },
    canGoBack: () => stack.length > 1,
    current,
  };

  window.addEventListener('popstate', (event) => {
    if (!event.state) {
      const route = location.hash.replace('#/', '');
      stack = [startRoute];
      history.replaceState({ depth: 0 }, '', `#/${startRoute}`);
      if (DEEP_LINKS.includes(route)) nav.push(route);
      else render(true);
      return;
    }
    stack = stack.slice(0, (event.state.depth ?? 0) + 1);
    if (stack.length === 0) stack = [startRoute];
    if (pendingRoute) {
      const route = pendingRoute;
      pendingRoute = null;
      if (route !== startRoute) {
        nav.push(route);
        return;
      }
    }
    render(true);
  });

  const isTabRoot = (route) => TABS.some((tab) => tab.route === route);

  function topBar(screen) {
    if (screen.hideTopBar) return null;
    return h(
      'header',
      { class: 'top-bar' },
      screen.back
        ? h('button', { type: 'button', class: 'icon-btn', 'aria-label': t.back, onClick: nav.back }, '‹')
        : h('span', { class: 'icon-spacer' }),
      h('h1', { class: 'top-title', tabindex: '-1' }, screen.title),
      screen.help
        ? h('button', { type: 'button', class: 'icon-btn help', 'aria-label': t.help, onClick: () => nav.push('how') }, '?')
        : h('span', { class: 'icon-spacer' }),
    );
  }

  function bottomNav() {
    return h(
      'nav',
      { class: 'tab-bar', 'aria-label': 'Secciones' },
      TABS.map((tab) =>
        h(
          'button',
          {
            type: 'button',
            class: `tab${current() === tab.route ? ' active' : ''}`,
            'aria-current': current() === tab.route ? 'page' : null,
            onClick: () => nav.reset(tab.route),
          },
          tab.label,
        ),
      ),
    );
  }

  function overlays(state) {
    const nodes = [];
    if (state.dialog && screens.dialog) nodes.push(screens.dialog({ state, store, nav }));
    if (state.toast) {
      nodes.push(h('div', { class: 'toast', role: 'status' }, state.toast));
      setTimeout(() => store.getState().toast === state.toast && store.set({ toast: null }), 2200);
    }
    return nodes;
  }

  function render(routeChanged = false) {
    const state = store.getState();
    cleanup?.();
    cleanup = null;
    const oldScroll = root.querySelector('.content')?.scrollTop ?? 0;
    const screen = (screens[current()] ?? screens[startRoute])({ state, store, nav });
    currentScreen = screen;
    root.replaceChildren(
      ...[
        topBar(screen),
        h(
          'main',
          { class: `content align-${screen.align ?? 'top'} ${screen.className ?? ''}`, 'data-route': current() },
          h('div', { class: 'content-inner' }, screen.content),
        ),
        screen.bottom?.length ? h('footer', { class: 'bottom-bar' }, h('div', { class: 'bottom-inner' }, screen.bottom)) : null,
        isTabRoot(current()) ? bottomNav() : null,
        ...overlays(state),
      ].filter(Boolean),
    );
    const content = root.querySelector('.content');
    if (routeChanged) {
      content.scrollTop = 0;
      root.querySelector('.top-title')?.focus({ preventScroll: true });
      document.title = screen.title ? `${screen.title} · ${t.appName}` : t.appName;
    } else {
      content.scrollTop = oldScroll;
    }
    cleanup = screen.onMount?.(root) ?? null;
  }

  /** Vuelve a montar solo las capas superpuestas (diálogo, aviso). */
  function refreshLayers(state) {
    root.querySelectorAll('.sheet-backdrop, .toast').forEach((n) => n.remove());
    root.append(...overlays(state));
  }

  function onStateChange(state, changes) {
    if (pendingRoute) return;
    const keys = Object.keys(changes);
    // Las pantallas interactivas (medidores) solo se redibujan si cambia algo de lo que dependen.
    if (currentScreen?.interactive && !keys.some((k) => currentScreen.dependsOn?.includes(k))) {
      refreshLayers(state);
      return;
    }
    render(false);
  }

  return {
    start() {
      const initial = location.hash.replace('#/', '');
      stack = [startRoute];
      history.replaceState({ depth: 0 }, '', `#/${startRoute}`);
      store.subscribe(onStateChange);
      render(true);
      if (DEEP_LINKS.includes(initial)) nav.push(initial);
    },
    nav,
  };
}
