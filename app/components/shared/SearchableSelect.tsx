"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import FloatingPortal from "@/app/components/shared/FloatingPortal";
import { isFloatingOverlayNode } from "@/app/lib/floating-position";

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
};

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyOption?: { value: string; label: string };
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

const defaultInputClassName = "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default function SearchableSelect({ id, label, value, onChange, options, placeholder, emptyOption, disabled = false, required = false, className, inputClassName = defaultInputClassName, "aria-label": ariaLabel }: Props) {
  const tCommon = useTranslations("common");
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return options;
    return options.filter((option) => normalize(option.searchText ?? `${option.label} ${option.value}`).includes(needle));
  }, [options, query]);
  const displayOptions = useMemo(() => emptyOption ? [emptyOption, ...filteredOptions] : filteredOptions, [emptyOption, filteredOptions]);
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
  }, []);
  const selectValue = useCallback((nextValue: string) => {
    onChange(nextValue);
    close();
    inputRef.current?.blur();
  }, [close, onChange]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (isFloatingOverlayNode(target)) return;
      close();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, open]);

  function handleFocus() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setHighlightIndex(0);
  }
  function handleBlur() {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) close();
    }, 120);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => Math.min(current + 1, displayOptions.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = displayOptions[highlightIndex];
      if (option) selectValue(option.value);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      inputRef.current?.blur();
    }
  }

  const inputValue = open ? query : selectedOption?.label ?? value;
  const resolvedPlaceholder = placeholder ?? tCommon("searchPlaceholder");

  return (
    <div ref={containerRef} className={className ?? "relative"}>
      {label ? <label htmlFor={inputId} className="mb-2 block text-xs uppercase tracking-wide text-gray-500">{label}</label> : null}
      <input ref={inputRef} id={inputId} type="text" role="combobox" aria-expanded={open} aria-controls={listboxId} aria-autocomplete="list" aria-label={ariaLabel} autoComplete="off" disabled={disabled} required={required} value={inputValue} placeholder={resolvedPlaceholder} className={inputClassName} onFocus={handleFocus} onBlur={handleBlur} onChange={(event) => { setQuery(event.target.value); setHighlightIndex(0); if (!open) setOpen(true); }} onKeyDown={handleKeyDown} />
      {open && displayOptions.length > 0 ? (
        <FloatingPortal anchorRef={containerRef} open={open} matchWidth>
          <ul id={listboxId} role="listbox" className="max-h-full w-full overflow-y-auto rounded-xl border border-gray-700 bg-[#0B1526] py-2 shadow-2xl">
            {displayOptions.map((option, index) => (
              <li key={`${option.value}-${option.label}`} role="option" aria-selected={value === option.value}>
                <button type="button" className={`block w-full px-4 py-2.5 text-left text-sm transition ${index === highlightIndex ? "bg-blue-600/20 text-white" : value === option.value ? "text-blue-300" : "text-gray-200 hover:bg-white/5"}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setHighlightIndex(index)} onClick={() => selectValue(option.value)}>{option.label}</button>
              </li>
            ))}
          </ul>
        </FloatingPortal>
      ) : null}
      {open && displayOptions.length === 0 ? (
        <FloatingPortal anchorRef={containerRef} open={open} matchWidth>
          <div className="w-full rounded-xl border border-gray-700 bg-[#0B1526] px-4 py-3 text-sm text-gray-400 shadow-2xl">{tCommon("noResults")}</div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
