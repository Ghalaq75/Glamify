import { useEffect, useRef, useState } from 'react';

export function MultiSelectChips({
  options,
  value = [],
  onChange,
  placeholder = 'Select…',
  id,
  ariaLabel = 'Categories',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleMouse(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        if (triggerRef.current) triggerRef.current.focus();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleMouse);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const selected = Array.isArray(value) ? value : [];
  const isSelected = (opt) => selected.includes(opt);

  function toggle(opt) {
    if (isSelected(opt)) onChange(selected.filter((x) => x !== opt));
    else onChange([...selected, opt]);
  }

  function remove(opt) {
    onChange(selected.filter((x) => x !== opt));
  }

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? '1 category selected'
      : `${selected.length} categories selected`;

  return (
    <div className="multi-chip-wrap" ref={wrapRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className="form-input multi-chip-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={selected.length === 0 ? 'multi-chip-placeholder' : ''}>{summary}</span>
        <span className="multi-chip-caret" aria-hidden="true">▾</span>
      </button>

      {selected.length > 0 && (
        <div className="multi-chip-list" role="list">
          {selected.map((opt) => (
            <span key={opt} className="multi-chip" role="listitem">
              {opt}
              <button
                type="button"
                className="multi-chip-remove"
                onClick={() => remove(opt)}
                aria-label={`Remove ${opt}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="multi-chip-menu" role="group" aria-label={ariaLabel}>
          {options.map((opt) => {
            const checked = isSelected(opt);
            return (
              <label key={opt} className="multi-chip-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MultiSelectChips;
