"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { MOTION } from "@/config/motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import styles from "./AnimatedDialog.module.css";

type AnimatedDialogProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
  containerClassName?: string;
  contentClassName?: string;
};

export default function AnimatedDialog({
  open,
  onClose,
  ariaLabel,
  children,
  containerClassName,
  contentClassName,
}: AnimatedDialogProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const animationMs = useMemo(
    () => Math.round((prefersReducedMotion ? MOTION.durations.instant : MOTION.durations.modal) * 1000),
    [prefersReducedMotion],
  );

  useBodyScrollLock(visible);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      return;
    }

    if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, animationMs);

      return () => clearTimeout(timer);
    }
  }, [animationMs, open, visible]);

  if (!visible) return null;

  const overlayClass = `${styles.overlay} ${closing ? styles.overlayExit : styles.overlayEnter}`;
  const panelClass = `${styles.panel} ${closing ? styles.panelExit : styles.panelEnter} ${contentClassName ?? ""}`;

  const animationStyle = {
    ["--modal-duration" as string]: `${animationMs}ms`,
    ["--modal-ease" as string]: prefersReducedMotion ? "linear" : MOTION.ease.standard,
  } satisfies CSSProperties;

  return (
    <div className={overlayClass} style={animationStyle} role="presentation" onClick={onClose}>
      <div className={`${styles.panelWrapper} ${containerClassName ?? ""}`}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={panelClass}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
