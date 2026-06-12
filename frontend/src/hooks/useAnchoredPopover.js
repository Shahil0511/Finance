import { useEffect, useRef, useState } from 'react';

/**
 * Anchored-popover positioning for portal-rendered dropdowns.
 *
 * Popovers used to render inside their trigger's container — any ancestor
 * with overflow-hidden (the filter card, the table) clipped them (the
 * "half-visible calendar" bug). Portaling to <body> escapes clipping; this
 * hook keeps the portal glued to the trigger and flips it above when there
 * isn't enough room below.
 *
 * @param {boolean} open
 * @param {{ estHeight?: number, matchWidth?: boolean, gap?: number }} opts
 * @returns {{ triggerRef, popRef, style, placement }}
 */
export function useAnchoredPopover(open, { estHeight = 320, matchWidth = false, gap = 6 } = {}) {
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const [style, setStyle] = useState({});
  const [placement, setPlacement] = useState('bottom');

  useEffect(() => {
    if (!open) return;

    const position = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popH = popRef.current?.offsetHeight || estHeight;
      const popW = matchWidth ? rect.width : (popRef.current?.offsetWidth || 280);

      const spaceBelow = window.innerHeight - rect.bottom;
      const flip = spaceBelow < popH + gap && rect.top > spaceBelow;

      const left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8));
      const top = flip ? rect.top - popH - gap : rect.bottom + gap;

      setPlacement(flip ? 'top' : 'bottom');
      setStyle({
        position: 'fixed',
        top: Math.max(8, top),
        left,
        ...(matchWidth ? { width: rect.width } : {}),
        zIndex: 60,
      });
    };

    position();
    // Reposition once the portal has real dimensions, then track viewport changes.
    const raf = requestAnimationFrame(position);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, estHeight, matchWidth, gap]);

  // Outside-click (trigger AND portal both count as inside) + Escape.
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      closeRef.current?.();
    };
    const onKey = (e) => e.key === 'Escape' && closeRef.current?.();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return { triggerRef, popRef, style, placement, onClose: closeRef };
}
