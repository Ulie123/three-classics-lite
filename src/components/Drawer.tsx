import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { useFocusTrap } from './useFocusTrap';
import styles from './Drawer.module.css';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A panel that slides in from the right, used for the rules. */
export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const panel = useRef<HTMLElement>(null);
  const titleId = useId();
  useFocusTrap(panel, open, onClose);
  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton label="Close" icon={<X strokeWidth={1.75} />} onClick={onClose} data-autofocus />
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
