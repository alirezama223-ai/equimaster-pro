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
import type { SearchableSelectOption } from "@/app/components/shared/SearchableSelect";

type Props = {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

export default function SearchableMultiSelect({
  id,
  values,
  onChange,
  options,
  placeholder = "Search and add…",
  disabled = false,
  className,
  inputClassName,
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const availableOptions = useMemo(
    () => options.filter((option) => !values.includes(option.value)),
    [options, values]
  );

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return availableOptions;
    return availableOptions.filter((option) => {
      const haystack = (option.searchText ?? `${option.label} ${option.value}`).toLowerCase();
      return haystack.includes(needle);
    });
  }, [availableOptions, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
  }, []);

  const addValue = useCallback(
    (nextValue: string) => {
      if (!nextValue || values.includes(nextValue)) return;
      onChange([...values, nextValue]);
      setQuery("");
      setHighlightIndex(0);
      inputRef.current?.focus();
    },
    [onChange, values]
  );

  const removeValue = useCallback(
    (value: string) => {
      onChange(values.filter((item) => item !== value));
    },
    [onChange, values]
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, open]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (!open && event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightIndex];
      if (option) addValue(option.value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <div ref={containerRef} className={className ?? "space-y-3"}>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          className={inputClassName}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setHighlightIndex(0);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) close();
            }, 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightIndex(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />

        {open && filteredOptions.length > 0 ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-700 bg-[#0B1526] py-2 shadow-2xl"
          >
            {filteredOptions.map((option, index) => (
              <li key={option.value} role="option" aria-selected={false}>
                <button
                  type="button"
                  className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                    index === highlightIndex
                      ? "bg-blue-600/20 text-white"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => addValue(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {open && filteredOptions.length === 0 ? (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-700 bg-[#0B1526] px-4 py-3 text-sm text-gray-400 shadow-2xl">
            {availableOptions.length === 0 ? "All disciplines selected." : "No matches found."}
          </div>
        ) : null}
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/10 px-3 py-1 text-sm text-blue-100"
            >
              {value}
              <button
                type="button"
                className="text-blue-300 hover:text-white"
                aria-label={`Remove ${value}`}
                onClick={() => removeValue(value)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
