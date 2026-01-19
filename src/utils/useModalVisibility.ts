import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type ModalVisibilityState = {
  shouldRender: boolean;
  isClosing: boolean;
  animationDuration: number;
  prefersReducedMotion: boolean;
};

export function useModalVisibility(
  isOpen: boolean,
  baseDuration = 300,
): ModalVisibilityState {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationDuration = prefersReducedMotion
    ? Math.min(120, Math.max(60, Math.round(baseDuration / 2)))
    : baseDuration;

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) return;

    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, animationDuration);

    return () => window.clearTimeout(timeout);
  }, [isOpen, shouldRender, animationDuration]);

  return { shouldRender, isClosing, animationDuration, prefersReducedMotion };
}
