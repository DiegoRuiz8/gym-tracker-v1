// src/components/ui/StyledSelect.tsx
//
// Dropdown custom que reemplaza el <select> nativo con un look coherente
// con el resto del app. El <select> nativo no se puede estilizar realmente
// (las <option> las controla el navegador/sistema), lo que rompe el tema
// oscuro y se ve inconsistente entre desktop y móvil.
//
// Accesibilidad:
// - Escape cierra y devuelve foco al trigger.
// - Click fuera cierra.
// - aria-haspopup, aria-expanded, role="listbox" y role="option".
// - focus visible en el trigger.

import { useEffect, useRef, useState } from "react";
import "../../styles/styled-select.css";

type StyledSelectOption = {
  value: string;
  label: string;
};

type StyledSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: StyledSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
};

export default function StyledSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select...",
  ariaLabel,
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="styled-select-root">
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`styled-select-trigger ${
          !selectedOption ? "is-placeholder" : ""
        } ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="styled-select-value">{displayLabel}</span>
        <svg
          className={`styled-select-chevron ${isOpen ? "is-open" : ""}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="styled-select-panel" role="listbox">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`styled-select-option ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <span className="styled-select-option-label">
                  {option.label}
                </span>
                {isSelected && (
                  <svg
                    className="styled-select-check"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}