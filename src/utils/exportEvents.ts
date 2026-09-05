// A preset export happens deep inside a hook, while the prompt that follows it
// lives at the top of the app. A DOM custom event keeps the two apart without
// threading state through the context.

export const PRESET_EXPORTED_EVENT = 'op-preset-exported';

export function notifyPresetExported(): void {
  window.dispatchEvent(new CustomEvent(PRESET_EXPORTED_EVENT));
}

export function onPresetExported(listener: () => void): () => void {
  window.addEventListener(PRESET_EXPORTED_EVENT, listener);
  return () => window.removeEventListener(PRESET_EXPORTED_EVENT, listener);
}
