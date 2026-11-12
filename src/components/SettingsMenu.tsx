import { useEffect, useId, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useSettings } from '../app/settings';
import { IconButton } from './Button';
import styles from './SettingsMenu.module.css';

export function SettingsMenu() {
  const { ambientMotion, setAmbientMotion } = useSettings();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className={styles.root}>
      <IconButton
        ref={button}
        label="Settings"
        icon={<Settings strokeWidth={1.75} />}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div id={menuId} className={styles.menu}>
          <button
            type="button"
            role="switch"
            aria-checked={ambientMotion}
            className={styles.row}
            onClick={() => setAmbientMotion(!ambientMotion)}
          >
            <span>Ambient motion</span>
            <span className={styles.switch} aria-hidden="true">
              <span className={styles.thumb} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
