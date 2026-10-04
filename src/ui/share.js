import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/** Compartir: hoja nativa de Android (Capacitor), Web Share API o portapapeles. */
export async function shareTextOut(text) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: 'Mi talla de anillo', text });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title: 'Mi talla de anillo', text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
