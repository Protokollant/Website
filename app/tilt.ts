// Each panel tracks its own hover surface; pointer movement never renders React.
export function attachTilt(
  target: HTMLElement,
  surface: HTMLElement,
  host: Window = window,
) {
  let bounds: DOMRect | null = null;
  let desiredX = 0;
  let desiredY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let lastTime = 0;

  function animate(time: number) {
    const delta = lastTime ? Math.min(time - lastTime, 64) : 16.67;
    lastTime = time;
    const blend = 1 - Math.exp(-delta / 65);
    currentX += (desiredX - currentX) * blend;
    currentY += (desiredY - currentY) * blend;
    const settled =
      Math.abs(desiredX - currentX) < 0.01 &&
      Math.abs(desiredY - currentY) < 0.01;
    if (settled) {
      currentX = desiredX;
      currentY = desiredY;
    }
    target.style.transform = `rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
    frame = settled ? 0 : host.requestAnimationFrame(animate);
    if (settled) lastTime = 0;
  }

  function schedule() {
    if (!frame) frame = host.requestAnimationFrame(animate);
  }
  function enter(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    bounds = surface.getBoundingClientRect();
    move(event);
  }
  function move(event: PointerEvent) {
    if (
      event.pointerType === 'touch' ||
      !bounds ||
      !bounds.width ||
      !bounds.height
    )
      return;
    desiredX =
      (0.5 -
        Math.max(
          0,
          Math.min(1, (event.clientY - bounds.top) / bounds.height),
        )) *
      20;
    desiredY =
      (Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) -
        0.5) *
      24;
    schedule();
  }
  function reset() {
    bounds = null;
    desiredX = 0;
    desiredY = 0;
    if (currentX || currentY || frame) schedule();
  }
  function refresh() {
    if (bounds) bounds = surface.getBoundingClientRect();
  }
  function visibility() {
    if (host.document.hidden) reset();
  }

  target.style.willChange = 'transform';
  surface.addEventListener('pointerenter', enter, { passive: true });
  surface.addEventListener('pointermove', move, { passive: true });
  surface.addEventListener('pointerleave', reset);
  surface.addEventListener('pointercancel', reset);
  surface.addEventListener('transitionend', refresh);
  host.addEventListener('blur', reset);
  host.addEventListener('resize', refresh, { passive: true });
  host.addEventListener('scroll', refresh, { passive: true, capture: true });
  host.document.addEventListener('visibilitychange', visibility);
  return () => {
    host.cancelAnimationFrame(frame);
    surface.removeEventListener('pointerenter', enter);
    surface.removeEventListener('pointermove', move);
    surface.removeEventListener('pointerleave', reset);
    surface.removeEventListener('pointercancel', reset);
    surface.removeEventListener('transitionend', refresh);
    host.removeEventListener('blur', reset);
    host.removeEventListener('resize', refresh);
    host.removeEventListener('scroll', refresh, true);
    host.document.removeEventListener('visibilitychange', visibility);
    target.style.transform = '';
    target.style.willChange = '';
  };
}
