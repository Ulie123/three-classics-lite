import { useId } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  return (
    <Modal open={open} onClose={onCancel} labelledBy={titleId} describedBy={message ? messageId : undefined}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {message && (
        <p id={messageId} className={styles.message}>
          {message}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} data-autofocus>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
