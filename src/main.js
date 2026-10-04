import './styles/main.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { createStore } from './state/store.js';
import { createRouter } from './ui/router.js';
import { homeScreen, howScreen, prepareScreen, thumbScreen } from './ui/screens/basicScreens.js';
import { calibrationScreen, fingerScreen, sizerScreen } from './ui/screens/screenMeasureScreens.js';
import { converterScreen, dialog, resultScreen, savedScreen } from './ui/screens/resultScreens.js';

const store = createStore();
const router = createRouter({
  root: document.getElementById('app'),
  store,
  screens: {
    home: homeScreen,
    prepare: prepareScreen,
    sizer: sizerScreen,
    finger: fingerScreen,
    result: resultScreen,
    converter: converterScreen,
    saved: savedScreen,
    calibration: calibrationScreen,
    how: howScreen,
    thumb: thumbScreen,
    dialog,
  },
});
router.start();

// Botón/gesto Atrás de Android cuando corre empaquetada con Capacitor.
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', () => {
    if (store.getState().dialog) store.set({ dialog: null });
    else if (router.nav.canGoBack()) router.nav.back();
    else App.exitApp();
  });
}

// Solo para pruebas E2E.
window.__ringSizer = { store, router };
