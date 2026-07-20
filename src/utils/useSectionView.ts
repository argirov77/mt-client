"use client";

import { useEffect, useRef } from "react";

import { trackViewSection, type SectionName } from "@/lib/analytics";

/**
 * Отправляет view_section, когда секция становится видимой примерно на 50%.
 * Дедуп — один раз за сессию на секцию (реализован внутри trackViewSection
 * через sessionStorage), плюс локальный ref, чтобы не дёргать обсёрвер после
 * первого срабатывания.
 *
 * Порог ~50% считается двумя способами (чтобы работать и для высоких секций,
 * которые физически не могут занять 50% собственной площади в кадре):
 *   • ≥50% площади самой секции в кадре, либо
 *   • видимая часть секции покрывает ≥50% высоты вьюпорта.
 *
 * Возвращает ref, который нужно повесить на корневой элемент секции.
 */
export function useSectionView<T extends HTMLElement = HTMLElement>(
  section: SectionName,
) {
  const ref = useRef<T | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const viewportHeight = entry.rootBounds?.height ?? 0;
          const viewportCoverage =
            viewportHeight > 0 ? entry.intersectionRect.height / viewportHeight : 0;
          const visibleEnough =
            entry.intersectionRatio >= 0.5 || viewportCoverage >= 0.5;
          if (!visibleEnough) continue;
          if (!firedRef.current) {
            firedRef.current = true;
            trackViewSection(section);
          }
          observer.disconnect();
          break;
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section]);

  return ref;
}
