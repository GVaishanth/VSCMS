const DB_NAME = 'vscms-browser-store';
const DB_VERSION = 2;
const SYSTEM_STORE = 'system';

export const STORE_NAMES = [
  'customers',
  'vehicles',
  'appointments',
  'requests',
  'services',
  'mechanics',
  'parts',
  'partUsage',
  'suppliers',
  'invoices',
  'feedback',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];
export type LocalRow = Record<string, any>;

const KEY_FIELDS: Record<StoreName, string> = {
  customers: 'customer_id',
  vehicles: 'vehicle_id',
  appointments: 'appointment_id',
  requests: 'request_id',
  services: 'service_id',
  mechanics: 'mechanic_id',
  parts: 'part_id',
  partUsage: 'usage_id',
  suppliers: 'supplier_id',
  invoices: 'invoice_id',
  feedback: 'feedback_id',
};

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not provide IndexedDB. Open VSCMS in a standard browser and enable site storage.'));
      databasePromise = null;
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: KEY_FIELDS[name], autoIncrement: true });
        }
      }
      if (!db.objectStoreNames.contains(SYSTEM_STORE)) {
        db.createObjectStore(SYSTEM_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('Could not open the local VSCMS data store.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('The local data store is blocked by another VSCMS tab. Close other tabs and retry.'));
    };
  });
  return databasePromise;
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local data request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Local data transaction was cancelled.'));
    tx.onerror = () => reject(tx.error ?? new Error('Local data transaction failed.'));
  });
}

export async function readAll<T extends LocalRow = LocalRow>(name: StoreName): Promise<T[]> {
  const db = await openDatabase();
  const tx = db.transaction(name, 'readonly');
  const done = transactionDone(tx);
  const rows = await requestValue(tx.objectStore(name).getAll()) as T[];
  await done;
  return rows;
}

export async function readOne<T extends LocalRow = LocalRow>(name: StoreName, id: number): Promise<T | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(name, 'readonly');
  const done = transactionDone(tx);
  const row = await requestValue(tx.objectStore(name).get(id)) as T | undefined;
  await done;
  return row;
}

export async function insertRow(name: StoreName, row: LocalRow): Promise<number> {
  const db = await openDatabase();
  const tx = db.transaction(name, 'readwrite');
  const done = transactionDone(tx);
  const key = await requestValue(tx.objectStore(name).add(row));
  await done;
  return Number(key);
}

export async function saveRow(name: StoreName, row: LocalRow): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(name, 'readwrite');
  const done = transactionDone(tx);
  await requestValue(tx.objectStore(name).put(row));
  await done;
}

/** Persist a small batch atomically within one IndexedDB object store. */
export async function saveRows(name: StoreName, rows: LocalRow[]): Promise<void> {
  if (!rows.length) return;
  const db = await openDatabase();
  const tx = db.transaction(name, 'readwrite');
  const done = transactionDone(tx);
  const store = tx.objectStore(name);
  for (const row of rows) store.put(row);
  await done;
}

export async function deleteRow(name: StoreName, id: number): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(name, 'readwrite');
  const done = transactionDone(tx);
  await requestValue(tx.objectStore(name).delete(id));
  await done;
}

/** Atomic stock issue: write the usage line and reduce inventory in one transaction. */
export async function issuePartUsage(requestId: number, partId: number, quantity: number): Promise<{ usage: LocalRow; part: LocalRow }> {
  const db = await openDatabase();
  const tx = db.transaction(['requests', 'parts', 'partUsage'], 'readwrite');
  const done = transactionDone(tx);
  const requests = tx.objectStore('requests');
  const parts = tx.objectStore('parts');
  const usageStore = tx.objectStore('partUsage');
  const [request, part] = await Promise.all([
    requestValue(requests.get(requestId)) as Promise<LocalRow | undefined>,
    requestValue(parts.get(partId)) as Promise<LocalRow | undefined>,
  ]);
  if (!request) {
    tx.abort();
    await done.catch(() => undefined);
    throw new Error(`Service request ${requestId} was not found.`);
  }
  if (!part) {
    tx.abort();
    await done.catch(() => undefined);
    throw new Error(`Spare part ${partId} was not found.`);
  }
  if (request.service_status === 'CANCELLED') {
    tx.abort();
    await done.catch(() => undefined);
    throw new Error('Parts cannot be issued against a cancelled service request.');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    tx.abort();
    await done.catch(() => undefined);
    throw new Error('Quantity used must be a positive whole number.');
  }
  const stock = Number(part.stock_quantity ?? 0);
  if (stock < quantity) {
    tx.abort();
    await done.catch(() => undefined);
    throw new Error(`Insufficient stock for ${part.part_name}; available quantity is ${stock}.`);
  }
  const usage: LocalRow = {
    request_id: requestId,
    part_id: partId,
    quantity_used: quantity,
    total_cost: Number((quantity * Number(part.unit_price ?? 0)).toFixed(2)),
    part_name: part.part_name,
    unit_price: Number(part.unit_price ?? 0),
    supplier_name: part.supplier_name,
    registration_number: request.registration_number,
    customer_name: request.customer_name,
    service_status: request.service_status,
    appointment_date: request.appointment_date,
  };
  const usageId = Number(await requestValue(usageStore.add(usage)));
  const nextPart = { ...part, stock_quantity: stock - quantity };
  await requestValue(parts.put(nextPart));
  await done;
  return { usage: { ...usage, usage_id: usageId }, part: nextPart };
}

/** Full local backup, for moving records between browsers/devices. */
export async function exportSnapshot(): Promise<Record<string, unknown>> {
  const records = await Promise.all(STORE_NAMES.map(async (name) => [name, await readAll(name)] as const));
  return { format: 'vscms-local-backup', version: 1, exported_at: new Date().toISOString(), records: Object.fromEntries(records) };
}

/** Restore a VSCMS JSON backup atomically; all records stay in this browser. */
export async function importSnapshot(snapshot: unknown): Promise<void> {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('The selected file is not a VSCMS backup.');
  const data = snapshot as { format?: unknown; version?: unknown; records?: Record<string, unknown> };
  if (data.format !== 'vscms-local-backup' || data.version !== 1 || !data.records || typeof data.records !== 'object') {
    throw new Error('Unsupported backup format. Choose a VSCMS local backup JSON file.');
  }
  for (const name of STORE_NAMES) {
    if (!Array.isArray(data.records[name])) throw new Error(`Backup is missing the ${name} collection.`);
    const keyField = KEY_FIELDS[name];
    for (const row of data.records[name] as unknown[]) {
      if (!row || typeof row !== 'object' || !Number.isInteger(Number((row as LocalRow)[keyField]))) {
        throw new Error(`Backup contains an invalid record in ${name}.`);
      }
    }
  }
  const db = await openDatabase();
  const tx = db.transaction([...STORE_NAMES], 'readwrite');
  const done = transactionDone(tx);
  for (const name of STORE_NAMES) {
    const store = tx.objectStore(name);
    store.clear();
    for (const row of data.records[name] as LocalRow[]) store.put(row);
  }
  await done;
}

export async function storageStatus(): Promise<{ connected: boolean; count: number }> {
  const db = await openDatabase();
  const tx = db.transaction([...STORE_NAMES], 'readonly');
  const done = transactionDone(tx);
  const counts = await Promise.all(STORE_NAMES.map(name => requestValue(tx.objectStore(name).count())));
  await done;
  const connected = STORE_NAMES.every(name => db.objectStoreNames.contains(name)) && db.objectStoreNames.contains(SYSTEM_STORE);
  return { connected, count: counts.reduce((a,b)=>a+b,0) };
}

/** Small IndexedDB metadata store for one-time app migrations, excluded from user backups/counts. */
export async function readSystemSetting(key: string): Promise<string | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(SYSTEM_STORE, 'readonly');
  const done = transactionDone(tx);
  const setting = await requestValue(tx.objectStore(SYSTEM_STORE).get(key)) as { value?: string } | undefined;
  await done;
  return setting?.value;
}

export async function writeSystemSetting(key: string, value: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SYSTEM_STORE, 'readwrite');
  const done = transactionDone(tx);
  await requestValue(tx.objectStore(SYSTEM_STORE).put({ key, value }));
  await done;
}
