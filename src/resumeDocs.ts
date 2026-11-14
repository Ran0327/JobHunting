const DB_NAME = "tujian-docs";
const STORE = "drafts";

function key(resumeId: string, draftId: string) {
  return `${resumeId}:${draftId}`;
}

function legacyDraftId(resumeId: string, draftId: string) {
  const prefix = `${resumeId}-`;
  return draftId.startsWith(prefix) ? draftId.slice(prefix.length) : "";
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打不开本地文档库"));
  });
}

function readBlob(db: IDBDatabase, storeKey: string) {
  return new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(storeKey);
    request.onsuccess = () => {
      const value = request.result;
      resolve(value instanceof Blob ? value : null);
    };
    request.onerror = () => reject(request.error ?? new Error("没能读取这份简历"));
  });
}

export async function loadDraftDoc(resumeId: string, draftId: string) {
  const db = await openDb();
  try {
    const stored = await readBlob(db, key(resumeId, draftId));
    if (stored) return stored;
    const legacy = legacyDraftId(resumeId, draftId);
    return legacy ? await readBlob(db, key(resumeId, legacy)) : null;
  } finally {
    db.close();
  }
}

export async function saveDraftDoc(resumeId: string, draftId: string, blob: Blob) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(blob, key(resumeId, draftId));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("没能保存这份简历"));
    });
  } finally {
    db.close();
  }
}

export async function deleteDraftDoc(resumeId: string, draftId: string) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      store.delete(key(resumeId, draftId));
      const legacy = legacyDraftId(resumeId, draftId);
      if (legacy) store.delete(key(resumeId, legacy));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("没能删除这份简历"));
      transaction.onabort = () => reject(transaction.error ?? new Error("没能删除这份简历"));
    });
  } finally {
    db.close();
  }
}

export async function clearDraftDocs() {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("没能清理本地文档库"));
      transaction.onabort = () => reject(transaction.error ?? new Error("没能清理本地文档库"));
    });
  } finally {
    db.close();
  }
}
