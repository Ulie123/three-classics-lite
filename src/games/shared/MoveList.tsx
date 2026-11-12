import { useEffect, useRef, type ReactNode } from 'react';
import type { HistoryEntry, Side } from '../../api/types';
import styles from './MoveList.module.css';

interface MoveListProps<M> {
  history: HistoryEntry<M>[];
  swatch: (side: Side) => ReactNode;
}

export function MoveList<M>({ history, swatch }: MoveListProps<M>) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const node = list.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [history.length]);

  if (history.length === 0) {
    return <p className={styles.empty}>No moves yet.</p>;
  }
  return (
    <ol ref={list} className={styles.list} aria-label="Move list">
      {history.map((entry) => (
        <li key={entry.ply} className={styles.item}>
          <span className={styles.ply}>{entry.ply + 1}</span>
          <span className={styles.swatch}>{swatch(entry.side)}</span>
          <span className={styles.notation}>{entry.notation}</span>
        </li>
      ))}
    </ol>
  );
}
