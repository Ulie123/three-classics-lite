import type { ReactNode } from 'react';
import { ParticleCanvas, type ParticleFactory } from './ParticleCanvas';
import styles from './SceneFrame.module.css';

export type SceneMode = 'full' | 'thumbnail';

export interface SceneProps {
  /** Full-page backdrop, or a static card thumbnail that only moves while hovered. */
  mode?: SceneMode;
  animate: boolean;
  /** Darken and desaturate behind the board so the scene stays a backdrop. */
  scrim?: boolean;
}

interface SceneFrameProps extends SceneProps {
  name: string;
  particles?: ParticleFactory;
  children: ReactNode;
  /** Animals and objects, on their own layer so the scrim can mute them less than the landscape. */
  props?: ReactNode;
}

/**
 * Layers, back to front: an optional photo (set --scene-photo to a licensed image), the SVG
 * silhouettes, props, one particle canvas, then the scrim.
 *
 * Props are positioned in container units (cqw/cqh), so the same CSS works full-screen and in a
 * card thumbnail. Mark them with data attributes:
 * - data-prop="hero": a signature prop, checked to stay visible beside the board;
 * - data-crosser: something that crosses the scene now and then (removed while paused, so a frozen
 *   frame never shows it mid-flight, and it restarts off-screen);
 * - data-secondary: hidden on small screens, where only the hero remains.
 */
export function SceneFrame({ name, mode = 'full', animate, scrim = false, particles, children, props }: SceneFrameProps) {
  return (
    <div className={styles.scene} data-scene={name} data-mode={mode} data-animate={animate} data-scrim={scrim} aria-hidden="true">
      <div className={styles.photo} />
      <div className={styles.layers}>{children}</div>
      {props && <div className={styles.props}>{props}</div>}
      {particles && <ParticleCanvas create={particles} animate={animate} className={styles.canvas} />}
      {scrim && <div className={styles.scrim} />}
    </div>
  );
}
