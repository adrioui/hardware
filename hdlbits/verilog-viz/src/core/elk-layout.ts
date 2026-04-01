/**
 * ELK layout wrapper
 *
 * Runs the ELK.js layout algorithm on an ElkGraph produced by converter.ts
 * and returns the same graph enriched with x/y coordinates on every node/port.
 *
 * We import ELK's API layer only (elk-api.js) and supply the heavy worker code
 * via Vite's `?url` asset import so it lands in a separate chunk (~1.5 MB)
 * instead of the main bundle.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ELKConstructor = require('elkjs/lib/elk-api.js').default as new (opts?: object) => { layout: (g: unknown) => Promise<unknown> };
import type { ElkNode } from 'elkjs/lib/elk-api.js';
import type { ElkGraph } from './converter';

// Vite copies elk-worker.min.js to dist/assets/ and returns its public URL.
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';

// Lazily instantiated singleton so the Worker is only created on first use.
let elkInstance: InstanceType<typeof ELKConstructor> | null = null;

function getElk() {
  if (!elkInstance) {
    elkInstance = new ELKConstructor({
      workerUrl: elkWorkerUrl,
      workerFactory: (url?: string) => new Worker(url ?? elkWorkerUrl),
    }) as InstanceType<typeof ELKConstructor>;
  }
  return elkInstance;
}

export async function layoutGraph(graph: ElkGraph): Promise<ElkGraph> {
  const elk = getElk();
  // ElkGraph is structurally compatible with ElkNode (id, children, edges,
  // layoutOptions). Cast through unknown so TypeScript accepts the call.
  const result = await elk.layout(graph as unknown as ElkNode);
  return result as unknown as ElkGraph;
}
