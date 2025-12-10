"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import styles from "./StepTransition.module.css";

type StepTransitionProps = {
  activeKey: number;
  children: ReactNode;
  durationMs?: number;
};

export default function StepTransition({ activeKey, children, durationMs = 240 }: StepTransitionProps) {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const [currentContent, setCurrentContent] = useState<ReactNode>(children);
  const [leavingContent, setLeavingContent] = useState<ReactNode | null>(null);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (activeKey === currentKey) {
      setCurrentContent(children);
      return;
    }

    const isForward = activeKey > currentKey;
    setDirection(isForward ? "up" : "down");
    setLeavingContent(currentContent);
    setCurrentKey(activeKey);
    setCurrentContent(children);
    setIsTransitioning(true);

    const timer = window.setTimeout(() => {
      setLeavingContent(null);
      setIsTransitioning(false);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [activeKey, children, currentContent, currentKey, durationMs]);

  const enterClassName = useMemo(() => {
    if (!isTransitioning) return "";
    return direction === "up" ? styles.enterDown : styles.enterUp;
  }, [direction, isTransitioning]);

  const exitClassName = useMemo(
    () => (direction === "up" ? styles.exitUp : styles.exitDown),
    [direction]
  );

  const style = useMemo(
    () => ({ "--step-transition-duration": `${durationMs}ms` }) as CSSProperties,
    [durationMs]
  );

  return (
    <div className={styles.container} style={style}>
      {leavingContent ? (
        <div className={`${styles.layer} ${styles.leaving} ${exitClassName}`}>{leavingContent}</div>
      ) : null}
      <div className={`${styles.layer} ${enterClassName}`}>{currentContent}</div>
    </div>
  );
}
