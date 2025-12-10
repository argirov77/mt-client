import { useEffect } from "react";

let lockCount = 0;
const PREV_OVERFLOW = "data-prev-overflow";
const PREV_PADDING = "data-prev-padding";

export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return undefined;

    const body = document.body;
    const docEl = document.documentElement;
    const scrollbarWidth = window.innerWidth - docEl.clientWidth;

    if (lockCount === 0) {
      body.setAttribute(PREV_OVERFLOW, body.style.overflow);
      body.setAttribute(PREV_PADDING, body.style.paddingRight);
    }

    lockCount += 1;
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.overflow = body.getAttribute(PREV_OVERFLOW) || "";
        body.style.paddingRight = body.getAttribute(PREV_PADDING) || "";
        body.removeAttribute(PREV_OVERFLOW);
        body.removeAttribute(PREV_PADDING);
      }
    };
  }, [active]);
}
