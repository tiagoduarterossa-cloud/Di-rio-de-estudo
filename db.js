// Base de dados local: guarda tudo no localStorage do browser.
// Imita a API usada na versão artifact (collection().add/onSnapshot, doc().update/delete),
// para mais tarde se poder trocar por Supabase ou Firebase sem mexer no resto da app.
const LocalDB = (() => {
  const KEY = "diario-estudo-v1";
  const listeners = {};
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let data = load();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error(e); } };
  const snap = col => {
    const docs = Object.entries(data[col] || {}).map(([id, body]) => ({ id, exists: true, data: () => body }));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const notify = col => (listeners[col] || []).forEach(fn => fn(snap(col)));
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) ? merge(a?.[k] || {}, b[k]) : b[k]; return o; };

  // Mudanças feitas noutro separador do browser
  window.addEventListener("storage", e => { if (e.key === KEY) { data = load(); Object.keys(listeners).forEach(notify); } });

  return {
    collection(col) {
      return {
        async add(body) { const id = newId(); (data[col] ||= {})[id] = body; persist(); notify(col); return { id }; },
        onSnapshot(next) { (listeners[col] ||= []).push(next); next(snap(col)); return () => { listeners[col] = listeners[col].filter(f => f !== next); }; },
      };
    },
    doc(path) {
      const [col, id] = path.split("/");
      return {
        async update(body) { if (!data[col]?.[id]) throw { code: "invalid_argument" }; data[col][id] = merge(data[col][id], body); persist(); notify(col); },
        async delete() { if (data[col]) delete data[col][id]; persist(); notify(col); },
      };
    },
    exportJSON() { return JSON.stringify(data, null, 2); },
    importJSON(text) { const d = JSON.parse(text); if (typeof d !== "object" || !d) throw new Error("Ficheiro inválido"); data = d; persist(); Object.keys(listeners).forEach(notify); },
  };
})();
