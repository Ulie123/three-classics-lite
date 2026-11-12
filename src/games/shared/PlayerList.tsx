import type { ReactNode } from 'react';
import styles from './PlayerList.module.css';

export function PlayerList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

interface PlayerRowProps {
  swatch: ReactNode;
  name: string;
  role: string;
  detail?: string;
  /** Whose turn it is; marked with a bar as well as weight, not colour alone. */
  active: boolean;
}

export function PlayerRow({ swatch, name, role, detail, active }: PlayerRowProps) {
  return (
    <li className={styles.row} data-active={active}>
      <span className={styles.swatch}>{swatch}</span>
      <span className={styles.who}>
        <span className={styles.name}>{name}</span>
        <span className={styles.role}>{role}</span>
      </span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </li>
  );
}
