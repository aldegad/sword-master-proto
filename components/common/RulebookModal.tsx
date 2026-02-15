'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RulebookContent } from '@/components/rulebook/RulebookContent';

interface RulebookModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulebookModal({ open, onClose }: RulebookModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="rulebook-modal-overlay"
      onClick={onClose}
      role="presentation"
      id="rulebook-modal-overlay"
    >
      <section
        className="rulebook-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rulebook-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rulebook-modal-header">
          <h2 id="rulebook-modal-title">룰북</h2>
          <button id="close-rulebook-modal" type="button" className="site-button" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className="rulebook-modal-body">
          <RulebookContent className="rulebook rulebook-in-modal" />
        </div>
      </section>
    </div>,
    document.body
  );
}
