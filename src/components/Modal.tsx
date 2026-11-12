import { useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from './useFocusTrap';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
  /** Where focus goes when the modal closes, e.g. the board. Defaults to the previous focus. */
  returnFocus?: RefObject<HTMLElement | SVGElement | null>;
  /** Optional themed flourish rendered behind the dialog (bubbles, snow, sand). */
  flourish?: ReactNode;
}

export function Modal({ open, onClose, labelledBy, describedBy, children, returnFocus, flourish }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useFocusTrap(dialog, open, onClose, returnFocus);
  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} />
      {flourish}
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={styles.dialog}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
