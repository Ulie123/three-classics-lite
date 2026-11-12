import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * While active: moves focus into the container, keeps Tab inside it, calls onEscape on Esc, and
 * on deactivation returns focus to whatever had it before (or to returnFocus if given).
 */
export function useFocusTrap(
  container: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
  returnFocus?: RefObject<HTMLElement | SVGElement | null>,
) {
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const node = container.current;
    if (!active || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    (node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? node).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        escape.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const target = returnFocus?.current ?? previous;
      if (target && 'focus' in target) target.focus({ preventScroll: true });
    };
  }, [active, container, returnFocus]);
}
