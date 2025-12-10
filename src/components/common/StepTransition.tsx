"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { MOTION } from "@/config/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import styles from "./StepTransition.module.css";

type StepTransitionProps = {
  activeKey: number | string;
  children: ReactNode;
  className?: string;
};

type TransitionItem = {
  key: number | string;
  node: ReactNode;
  direction: 1 | -1;
};

export default function StepTransition({ activeKey, children, className }: StepTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [current, setCurrent] = useState<{ key: number | string; node: ReactNode }>({
    key: activeKey,
    node: children,
  });
  const [exiting, setExiting] = useState<TransitionItem | null>(null);
  const previousKeyRef = useRef<number | string>(activeKey);

  const direction = useMemo<1 | -1>(() => {
    const prevKey = previousKeyRef.current;
    if (typeof prevKey === "number" && typeof activeKey === "number") {
      return activeKey > prevKey ? 1 : -1;
    }
    return 1;
  }, [activeKey]);

  useEffect(() => {
    setCurrent((prev) => {
      if (prev.key === activeKey) {
        return { key: activeKey, node: children };
      }

      setExiting({ key: prev.key, node: prev.node, direction });
      previousKeyRef.current = activeKey;

      return { key: activeKey, node: children };
    });
  }, [activeKey, children, direction]);

  const handleExitEnd = () => {
    setExiting(null);
  };

  const animationStyle = useMemo(() => {
    const duration = prefersReducedMotion ? MOTION.durations.instant : MOTION.durations.base;
    return {
      ["--step-duration" as string]: `${Math.round(duration * 1000)}ms`,
      ["--step-ease" as string]: prefersReducedMotion ? "linear" : MOTION.ease.out,
    } satisfies CSSProperties;
  }, [prefersReducedMotion]);

  const enterClassName = direction === 1 ? styles.enterFromBottom : styles.enterFromTop;
  const exitClassName = direction === 1 ? styles.exitToTop : styles.exitToBottom;

  return (
    <div className={`${styles.container} ${className ?? ""}`} style={animationStyle}>
      {exiting ? (
        <div
          key={`exit-${exiting.key}`}
          className={`${styles.layer} ${styles.exiting} ${exitClassName}`}
          onAnimationEnd={handleExitEnd}
        >
          {exiting.node}
        </div>
      ) : null}
      <div key={current.key} className={`${styles.layer} ${enterClassName}`}>
        {current.node}
      </div>
    </div>
  );
}
