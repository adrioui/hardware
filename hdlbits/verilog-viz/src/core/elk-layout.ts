/**
 * ELK layout wrapper
 *
 * Runs the ELK.js layout algorithm on an ElkGraph produced by converter.ts
 * and returns the same graph enriched with x/y coordinates on every node/port.
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode } from 'elkjs/lib/elk-api.js';
import type { ElkGraph } from './converter';

export async function layoutGraph(graph: ElkGraph): Promise<ElkGraph> {
  const elk = new ELK();
  // ElkGraph is structurally compatible with ElkNode (id, children, edges,
  // layoutOptions).  Cast through unknown so TypeScript accepts the call.
  const result = await elk.layout(graph as unknown as ElkNode);
  return result as unknown as ElkGraph;
}
