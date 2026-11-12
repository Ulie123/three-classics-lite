import { useEffect, useRef } from 'react';
import { subscribe } from './ticker';

/** A particle system drawn in CSS pixels. Created per canvas size; stepped by the shared ticker. */
export interface ParticleField {
  update(dt: number, now: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/**
 * @param scale particle-count multiplier: 1 at 1440×900, less on small screens
 * @param canvas the canvas being drawn, so a field can find its own scene (e.g. to sync with a prop)
 */
export type ParticleFactory = (width: number, height: number, scale: number, canvas: HTMLCanvasElement) => ParticleField;

interface ParticleCanvasProps {
  create: ParticleFactory;
  animate: boolean;
  className?: string;
}

const REFERENCE_AREA = 1440 * 900;

export function ParticleCanvas({ create, animate, className }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let field: ParticleField | null = null;
    let width = 0;
    let height = 0;

    function render() {
      if (!ctx || !field) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      field.draw(ctx);
    }

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const scale = Math.min(1.2, Math.max(0.3, (width * height) / REFERENCE_AREA));
      field = create(width, height, scale, canvas);
      render();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const unsubscribe = animate
      ? subscribe((dt, now) => {
          field?.update(dt, now);
          render();
        })
      : undefined;

    return () => {
      observer.disconnect();
      unsubscribe?.();
    };
  }, [create, animate]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
