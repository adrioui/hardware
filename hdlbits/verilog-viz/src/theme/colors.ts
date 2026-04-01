/** Signal semantic types, mapped to wire color tokens. */
export type SignalType = 'clock' | 'reset' | 'control' | 'data';

/** Map a signal type to the corresponding CSS custom property value. */
export const SIGNAL_COLORS: Record<SignalType, string> = {
  clock:   'var(--color-wire-clock)',
  reset:   'var(--color-wire-reset)',
  control: 'var(--color-wire-control)',
  data:    'var(--color-wire-data)',
} as const;

/**
 * Infer the semantic signal type from a port / net name.
 * Uses common naming conventions found in RTL designs.
 */
export function inferSignalType(name: string): SignalType {
  if (/clk|clock/i.test(name)) return 'clock';
  if (/rst|reset/i.test(name)) return 'reset';
  if (/en|sel|ctrl|valid|ready/i.test(name)) return 'control';
  return 'data';
}
