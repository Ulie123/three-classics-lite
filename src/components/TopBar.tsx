import type { ReactNode } from 'react';
import styles from './TopBar.module.css';

interface TopBarProps {
  left?: ReactNode;
  title: string;
  right?: ReactNode;
}

export function TopBar({ left, title, right }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>{left}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>{right}</div>
    </header>
  );
}
