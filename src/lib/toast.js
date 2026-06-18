export function showToast(message, type = 'info', duration = 3500) {
  try {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
  } catch (e) {
    // fallback - no-op in non-browser environments
    // eslint-disable-next-line no-console
    console.warn('showToast failed', e);
  }
}

export default showToast;
