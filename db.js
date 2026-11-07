// Base de dados da app. Há duas versões com a mesma API:
//  - LocalDB: guarda tudo no localStorage do browser (só neste computador).
//  - NuvemDB: guarda no Supabase, com login por email (no telemóvel e no PC).
// A app chama abrirBD() e recebe uma delas: se o config.js tiver os dados do Supabase usa a nuvem,
// senão fica no browser. API: collection(nome).add/onSnapshot e doc("col/id").update/delete.

// Peças comuns às duas versões
const BDComum = {
  newId: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
  merge(a, b) { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) ? BDComum.merge(a?.[k] || {}, b[k]) : b[k]; return o; },
  snap(data, col) {
    const docs = Object.entries(data[col] || {}).map(([id, body]) => ({ id, exists: true, data: () => body }));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false } };
  },
};

// Fotos no browser: ficam no IndexedDB (aguenta muito mais do que o localStorage, que só tem ~5 MB).
const FotosLocais = (() => {
  let abrir;
  const idb = () => abrir ||= new Promise((ok, erro) => {
    const r = indexedDB.open("diario-estudo-fotos", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("fotos");
    r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
  });
  const pedido = (modo, fn) => idb().then(db => new Promise((ok, erro) => {
    const tx = db.transaction("fotos", modo), r = fn(tx.objectStore("fotos"));
    tx.oncomplete = () => ok(r && r.result); tx.onerror = () => erro(tx.error);
  }));
  const urls = {};
  return {
    async guardar(blob) { const id = BDComum.newId(); await pedido("readwrite", st => st.put(blob, id)); return id; },
    async blob(id) { return pedido("readonly", st => st.get(id)); },
    async url(id) { if (urls[id]) return urls[id]; const b = await this.blob(id); if (!b) return null; return urls[id] = URL.createObjectURL(b); },
    async apagar(id) { await pedido("readwrite", st => st.delete(id)); },
  };
})();

const LocalDB = (() => {
  const KEY = "diario-estudo-v1";
  const listeners = {};
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let data = load();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error(e); } };
  const notify = col => (listeners[col] || []).forEach(fn => fn(BDComum.snap(data, col)));

  // Mudanças feitas noutro separador do browser
  window.addEventListener("storage", e => { if (e.key === KEY) { data = load(); Object.keys(listeners).forEach(notify); } });

  return {
    tipo: "local", fotos: FotosLocais,
    collection(col) {
      return {
        async add(body) { const id = BDComum.newId(); (data[col] ||= {})[id] = body; persist(); notify(col); return { id }; },
        onSnapshot(next) { (listeners[col] ||= []).push(next); next(BDComum.snap(data, col)); return () => { listeners[col] = listeners[col].filter(f => f !== next); }; },
      };
    },
    doc(path) {
      const [col, id] = path.split("/");
      return {
        async update(body) { if (!data[col]?.[id]) throw { code: "invalid_argument" }; data[col][id] = BDComum.merge(data[col][id], body); persist(); notify(col); },
        async delete() { if (data[col]) delete data[col][id]; persist(); notify(col); },
      };
    },
    temDados() { return Object.values(data).some(c => c && Object.keys(c).length); },
    exportJSON() { return JSON.stringify(data, null, 2); },
    async importJSON(text) { const d = JSON.parse(text); if (typeof d !== "object" || !d) throw new Error("Ficheiro inválido"); data = d; persist(); Object.keys(listeners).forEach(notify); },
  };
})();

// Versão nuvem. Tabela no Supabase: registos(id, user_id, colecao, dados). Ver README.
function criarNuvemDB(sb, user) {
  const listeners = {};
  let data = {};
  const notify = col => (listeners[col] || []).forEach(fn => fn(BDComum.snap(data, col)));
  const notifyAll = () => Object.keys(listeners).forEach(notify);
  const falha = error => { if (error) throw { code: error.code || "rede", message: error.message }; };

  async function recarregar() {
    const { data: rows, error } = await sb.from("registos").select("id,colecao,dados");
    falha(error);
    const novo = {};
    rows.forEach(r => { (novo[r.colecao] ||= {})[r.id] = r.dados; });
    data = novo; notifyAll();
  }
  // Quando voltas à app (por ex. depois de usar o telemóvel), vai buscar o que mudou
  document.addEventListener("visibilitychange", () => { if (!document.hidden) recarregar().catch(console.error); });

  const gravar = (col, id, dados) => sb.from("registos").upsert({ id, colecao: col, dados, user_id: user.id }).then(r => falha(r.error));

  // Fotos na nuvem: bucket privado "fotos", uma pasta por pessoa (ver README)
  const caminho = id => `${user.id}/${id}.jpg`, urls = {};
  const fotos = {
    async guardar(blob, idDado) { const id = idDado || BDComum.newId(); const { error } = await sb.storage.from("fotos").upload(caminho(id), blob, { contentType: "image/jpeg", upsert: true }); falha(error); return id; },
    async url(id) { if (urls[id]) return urls[id]; const { data: d, error } = await sb.storage.from("fotos").createSignedUrl(caminho(id), 60 * 60 * 24); if (error) return null; return urls[id] = d.signedUrl; },
    async apagar(id) { await sb.storage.from("fotos").remove([caminho(id)]); },
  };

  return {
    tipo: "nuvem", email: user.email, recarregar, fotos,
    async sair() { await sb.auth.signOut(); location.reload(); },
    collection(col) {
      return {
        async add(body) { const id = BDComum.newId(); await gravar(col, id, body); (data[col] ||= {})[id] = body; notify(col); return { id }; },
        onSnapshot(next) { (listeners[col] ||= []).push(next); next(BDComum.snap(data, col)); return () => { listeners[col] = listeners[col].filter(f => f !== next); }; },
      };
    },
    doc(path) {
      const [col, id] = path.split("/");
      return {
        async update(body) { if (!data[col]?.[id]) throw { code: "invalid_argument" }; const novo = BDComum.merge(data[col][id], body); await gravar(col, id, novo); data[col][id] = novo; notify(col); },
        async delete() { const { error } = await sb.from("registos").delete().eq("id", id); falha(error); if (data[col]) delete data[col][id]; notify(col); },
      };
    },
    temDados() { return Object.values(data).some(c => c && Object.keys(c).length); },
    exportJSON() { return JSON.stringify(data, null, 2); },
    // Junta os dados do ficheiro aos da conta (não apaga nada do que já lá está)
    async importJSON(text) {
      const d = JSON.parse(text); if (typeof d !== "object" || !d) throw new Error("Ficheiro inválido");
      const rows = [];
      for (const col in d) for (const id in d[col] || {}) rows.push({ id, colecao: col, dados: d[col][id], user_id: user.id });
      if (rows.length) { const { error } = await sb.from("registos").upsert(rows); falha(error); }
      await recarregar();
    },
  };
}

// Escolhe a base de dados. pedirLogin(enviar) é chamado quando é preciso entrar:
// a app mostra o formulário e chama enviar(email), que manda o link de entrada para o email.
async function abrirBD({ pedirLogin }) {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.chave) return LocalDB;
  if (location.protocol === "file:") throw new Error("Para usar a nuvem abre a app pelo link do GitHub Pages, não pelo ficheiro.");

  await new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
    s.onload = ok; s.onerror = () => erro(new Error("Sem internet: não consegui ligar ao Supabase."));
    document.head.appendChild(s);
  });
  const sb = window.supabase.createClient(cfg.url, cfg.chave);

  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    pedirLogin(async email => {
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
    });
    // Fica à espera que entres (o link do email abre a app outra vez, já com sessão)
    session = await new Promise(ok => sb.auth.onAuthStateChange((_ev, s) => { if (s) ok(s); }));
  }

  const nuvem = criarNuvemDB(sb, session.user);
  await nuvem.recarregar();
  // Primeira vez na nuvem: leva o que estava guardado neste browser
  if (!nuvem.temDados() && LocalDB.temDados()) {
    await nuvem.importJSON(LocalDB.exportJSON());
    const local = JSON.parse(LocalDB.exportJSON()), ids = [];
    for (const col in local) for (const id in local[col] || {}) ids.push(...(local[col][id].fotos || []));
    for (const id of ids) { const b = await FotosLocais.blob(id).catch(() => null); if (b) await nuvem.fotos.guardar(b, id); }
  }
  return nuvem;
}
