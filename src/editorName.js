const STORAGE_KEY = 'proyecto_s_editor';

export function getStoredEditorName() {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveEditorName(name) {
  const clean = (name || '').trim() || 'Desconocido';
  localStorage.setItem(STORAGE_KEY, clean);
  return clean;
}
