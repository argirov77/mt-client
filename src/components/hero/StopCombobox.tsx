'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Stop = { id: number; stop_name: string };

export type StopComboboxHandle = {
  focus: () => void;
};

type Props = {
  stops: Stop[];
  value: string;
  onChange: (id: string) => void;
  onSelect?: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  inputClassName?: string;
  noOptionsText?: string;
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function scoreStop(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;

  const idx = n.indexOf(q);
  if (idx >= 0) return idx === 0 ? 0 : 1 + idx * 0.01;

  const len = q.length;
  let best = Infinity;

  if (n.length >= len) {
    for (let i = 0; i <= n.length - len; i++) {
      const d = levenshtein(n.substring(i, i + len), q);
      if (d < best) best = d;
      if (best === 0) break;
    }
  } else {
    best = levenshtein(n, q);
  }

  for (const word of n.split(/[\s,\-–—()]+/)) {
    if (!word) continue;
    const d = levenshtein(word, q);
    if (d < best) best = d;
  }

  return 10 + best;
}

const StopCombobox = forwardRef<StopComboboxHandle, Props>(function StopCombobox(
  {
    stops,
    value,
    onChange,
    onSelect,
    placeholder,
    disabled,
    ariaLabel,
    inputClassName = '',
    noOptionsText = 'Нет совпадений',
  },
  ref,
) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typing, setTyping] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listboxId = React.useId();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const selectedName = useMemo(() => {
    if (!value) return '';
    return stops.find((s) => String(s.id) === String(value))?.stop_name ?? '';
  }, [value, stops]);

  const sortedStops = useMemo(
    () =>
      [...stops].sort((a, b) =>
        a.stop_name.localeCompare(b.stop_name, undefined, {
          sensitivity: 'base',
        }),
      ),
    [stops],
  );

  // Keep input in sync with selected value when not actively typing.
  useEffect(() => {
    if (!typing) setQuery(selectedName);
  }, [selectedName, typing]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q || (!typing && q === selectedName)) return sortedStops;
    const threshold = Math.max(2, Math.ceil(q.length / 2));
    return sortedStops
      .map((s) => ({ stop: s, score: scoreStop(s.stop_name, q) }))
      .filter((x) => x.score < 10 + threshold)
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.stop.stop_name.localeCompare(b.stop.stop_name, undefined, {
            sensitivity: 'base',
          }),
      )
      .map((x) => x.stop);
  }, [query, sortedStops, selectedName, typing]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setTyping(false);
        setQuery(selectedName);
      }
    }
    if (isOpen) document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [isOpen, selectedName]);

  const pickStop = (s: Stop) => {
    onChange(String(s.id));
    setQuery(s.stop_name);
    setTyping(false);
    setIsOpen(false);
    onSelect?.(String(s.id));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && filtered[activeIndex]) {
        e.preventDefault();
        pickStop(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setTyping(false);
      setQuery(selectedName);
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setTyping(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        className={inputClassName}
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setIsOpen(true);
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setTyping(true);
          setIsOpen(true);
          if (value) onChange('');
        }}
        onKeyDown={onKeyDown}
      />
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-sm text-slate-400">
              {noOptionsText}
            </li>
          ) : (
            filtered.map((s, idx) => (
              <li
                key={s.id}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickStop(s);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  idx === activeIndex
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {s.stop_name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});

export default StopCombobox;
