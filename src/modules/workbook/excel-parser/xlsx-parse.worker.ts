import { parentPort, workerData } from 'worker_threads';
import * as XLSX from 'xlsx';

/**
 * Runs off the main thread: XLSX.read() on a large workbook is synchronous and
 * CPU-bound, and was blocking the whole Node event loop (all other requests on
 * the instance) for the duration of the parse. The returned WorkBook is plain
 * data (no functions), so it survives structured clone back to the main thread.
 */
try {
  const { buffer } = workerData as { buffer: Buffer };
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  parentPort?.postMessage({ ok: true, workbook });
} catch (err) {
  parentPort?.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
}
