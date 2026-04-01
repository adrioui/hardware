/**
 * Toast — simple bottom-right notification.
 * Auto-dismisses after `duration` ms (default 3 s).
 */

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  variant?: 'success' | 'error' | 'info';
}

interface ToastItemProps {
  msg: ToastMessage;
  onDismiss: (id: number) => void;
  duration?: number;
}

function ToastItem({ msg, onDismiss, duration = 3000 }: ToastItemProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(msg.id), 300); // wait for fade-out
    }, duration);
    return () => clearTimeout(timer);
  }, [msg.id, duration, onDismiss]);

  const bgColor =
    msg.variant === 'error'
      ? 'var(--color-wire-reset)'
      : msg.variant === 'info'
        ? 'var(--color-text-muted)'
        : 'var(--color-port-input)';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: '8px 14px',
        borderRadius: 6,
        background: 'var(--color-bg-surface)',
        border: `1px solid ${bgColor}`,
        color: 'var(--color-text-primary)',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease, transform 300ms ease',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: bgColor,
          flexShrink: 0,
        }}
      />
      {msg.text}
    </div>
  );
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {messages.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
