/**
 * SVG / PNG export utilities for the Verilog visualiser.
 *
 * Strategy
 * ─────────
 * React Flow renders nodes as HTML and edges as an inline SVG.  We build a
 * standalone SVG document that:
 *   1. Wraps the edges SVG directly (it is already valid vector markup).
 *   2. Places each node's HTML inside a <foreignObject> so all labels,
 *      colours and icons are preserved.
 *   3. Prepends a solid background <rect> whose colour is read from the
 *      active CSS custom property (--color-bg-canvas).
 *
 * For PNG we serialise the SVG to a data-URL, draw it onto an off-screen
 * <canvas> and call canvas.toBlob() → download.
 *
 * Both functions are async so callers can await them and show a toast.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Trigger a browser file-download with the given data.
 */
function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Read the computed value of a CSS custom property from the root element.
 * Falls back to `fallback` if the property is not defined.
 */
function cssVar(name: string, fallback: string): string {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return val || fallback;
}

// ── Core: build SVG document ──────────────────────────────────────────────────

/**
 * Build a serialised SVG string from the React Flow container element.
 *
 * @param container  The element wrapping the `<ReactFlow>` component.
 * @param theme      Active theme – used to resolve background colour.
 * @returns          A UTF-8 SVG string ready to be saved or drawn.
 */
function buildSvgString(
  container: HTMLElement,
  theme: 'dark' | 'light',
): string {
  // ── 1. Locate key sub-elements ───────────────────────────────────────────
  const viewport = container.querySelector<HTMLElement>(
    '.react-flow__viewport',
  );
  const edgesSvg = container.querySelector<SVGSVGElement>(
    '.react-flow__edges',
  );
  const nodesContainer = container.querySelector<HTMLElement>(
    '.react-flow__nodes',
  );

  if (!viewport || !edgesSvg || !nodesContainer) {
    throw new Error('React Flow DOM structure not found – cannot export.');
  }

  // ── 2. Viewport transform & canvas size ─────────────────────────────────
  // The viewport div carries a CSS transform like:
  //   transform: translateX(Npx) translateY(Npx) scale(N)
  // We capture the *bounding rect of the container* as our export canvas.
  const { width, height } = container.getBoundingClientRect();

  // Background colour from current theme tokens
  const bg =
    theme === 'dark'
      ? cssVar('--color-bg-canvas', '#1a1b26')
      : cssVar('--color-bg-canvas', '#ffffff');

  // ── 3. Clone the viewport transform ─────────────────────────────────────
  const viewportTransform = viewport.style.transform;

  // ── 4. Collect inline styles for nodes ──────────────────────────────────
  // We need to inline computed styles of each node so the foreignObject
  // renders correctly when the SVG is viewed standalone.
  const styledNodes = Array.from(
    nodesContainer.querySelectorAll<HTMLElement>('.react-flow__node'),
  ).map((node) => {
    const rect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // position relative to container
    const relX = rect.left - containerRect.left;
    const relY = rect.top - containerRect.top;
    return {
      x: relX,
      y: relY,
      width: rect.width,
      height: rect.height,
      html: node.outerHTML,
    };
  });

  // ── 5. Clone & clean the edges SVG ──────────────────────────────────────
  const edgesClone = edgesSvg.cloneNode(true) as SVGSVGElement;
  // Remove react-internal attributes that would cause validation warnings
  edgesClone.removeAttribute('id');
  const edgesString = new XMLSerializer().serializeToString(edgesClone);

  // ── 6. Inject a <style> block with the active CSS custom properties ──────
  const styleVars = [
    '--color-bg-canvas',
    '--color-bg-surface',
    '--color-border',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-node-bg',
    '--color-node-border',
    '--color-port-input',
    '--color-port-output',
    '--color-port-inout',
    '--color-wire-default',
    '--color-wire-high',
    '--color-wire-low',
    '--color-wire-reset',
    '--color-accent',
  ];
  const root = getComputedStyle(document.documentElement);
  const cssBlock = styleVars
    .map((v) => `  ${v}: ${root.getPropertyValue(v).trim()};`)
    .join('\n');

  const styleBlock = `<style>
:root {
${cssBlock}
}
.react-flow__node { font-family: "JetBrains Mono", monospace; }
</style>`;

  // ── 7. Build foreignObject nodes ─────────────────────────────────────────
  const foreignObjects = styledNodes
    .map(
      ({ x, y, width: w, height: h, html }) =>
        `<foreignObject x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}">
  <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;">
    ${html}
  </div>
</foreignObject>`,
    )
    .join('\n');

  // ── 8. Build the edges group with the viewport transform ─────────────────
  const edgesGroup = `<g transform="${viewportTransform}">${edgesString}</g>`;

  // ── 9. Assemble final SVG ─────────────────────────────────────────────────
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xhtml="http://www.w3.org/1999/xhtml"
     width="${width.toFixed(0)}"
     height="${height.toFixed(0)}"
     viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}">
  ${styleBlock}
  <!-- Background -->
  <rect width="${width.toFixed(0)}" height="${height.toFixed(0)}" fill="${bg}" />
  <!-- Edges (vector paths) -->
  ${edgesGroup}
  <!-- Nodes (HTML via foreignObject) -->
  ${foreignObjects}
</svg>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Export the React Flow diagram as an SVG file.
 *
 * @param container  The `<div>` wrapping the `<ReactFlow>` component.
 * @param theme      Current colour theme.
 * @param filename   Output file name (default: `diagram.svg`).
 */
export async function exportAsSvg(
  container: HTMLElement,
  theme: 'dark' | 'light',
  filename = 'diagram.svg',
): Promise<void> {
  const svgString = buildSvgString(container, theme);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  // Revoke after a short delay to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

/**
 * Export the React Flow diagram as a PNG file.
 *
 * Renders the SVG into an off-screen canvas then converts to a PNG blob.
 *
 * @param container  The `<div>` wrapping the `<ReactFlow>` component.
 * @param theme      Current colour theme.
 * @param scale      Device-pixel ratio multiplier (default: 2 for retina).
 * @param filename   Output file name (default: `diagram.png`).
 */
export async function exportAsPng(
  container: HTMLElement,
  theme: 'dark' | 'light',
  scale = 2,
  filename = 'diagram.png',
): Promise<void> {
  const svgString = buildSvgString(container, theme);
  const { width, height } = container.getBoundingClientRect();

  // Encode SVG as a data URL
  const encoded = encodeURIComponent(svgString);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get 2D canvas context'));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('canvas.toBlob() returned null'));
            return;
          }
          const url = URL.createObjectURL(blob);
          triggerDownload(url, filename);
          setTimeout(() => URL.revokeObjectURL(url), 5_000);
          resolve();
        },
        'image/png',
      );
    };
    img.onerror = (e) => reject(new Error(`Failed to load SVG image: ${String(e)}`));
    img.src = dataUrl;
  });
}
