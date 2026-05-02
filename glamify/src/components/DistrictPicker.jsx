import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DISTRICTS,
  IS_PLACEHOLDER_LIST,
  getDistrictById,
} from '@workspace/riyadh-districts';

export { IS_PLACEHOLDER_LIST };

export default function DistrictPicker({
  value,
  onChange,
  placeholder = 'Search Riyadh districts…',
  id,
  required = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => getDistrictById(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DISTRICTS;
    return DISTRICTS.filter(d => {
      return (
        d.id.toLowerCase().includes(q) ||
        d.englishName.toLowerCase().includes(q) ||
        d.arabicName.toLowerCase().includes(q)
      );
    });
  }, [query]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => { setHighlight(0); }, [query]);

  if (IS_PLACEHOLDER_LIST) {
    return (
      <div
        style={{
          padding: '0.75rem 0.875rem',
          border: '1.5px dashed #b91c1c',
          background: '#fef2f2',
          color: '#7f1d1d',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          lineHeight: 1.4,
        }}
        role="alert"
        data-testid="district-picker-placeholder-banner"
      >
        <strong>Setup required:</strong> The approved Riyadh district list has not
        been provided yet. Replace the placeholder entry in
        <code style={{ background: '#fee2e2', padding: '0 4px', borderRadius: 4, margin: '0 4px' }}>
          lib/riyadh-districts/data.json
        </code>
        before providers can pick a location.
      </div>
    );
  }

  const inputDisabled = disabled;

  function commit(d) {
    onChange?.(d.id);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      if (open && filtered[highlight]) { e.preventDefault(); commit(filtered[highlight]); }
    } else if (e.key === 'Escape') { setOpen(false); }
  }

  const displayValue = open ? query : (selected ? `${selected.englishName} — ${selected.arabicName}` : '');

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        className="form-input"
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        disabled={inputDisabled}
        required={required && !value}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        role="combobox"
      />
      {open && !inputDisabled && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '240px',
            overflowY: 'auto',
            margin: 0,
            padding: '0.25rem 0',
            listStyle: 'none',
            background: 'var(--color-bg, #fff)',
            border: '1.5px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted, #6b7280)', fontSize: '0.875rem' }}>
              No districts match "{query}".
            </li>
          )}
          {filtered.map((d, i) => {
            const isSelected = value === d.id;
            const isHighlighted = i === highlight;
            return (
              <li
                key={d.id}
                role="option"
                aria-selected={isSelected}
                onMouseDown={e => { e.preventDefault(); commit(d); }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  background: isHighlighted ? 'rgba(0,0,0,0.06)' : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <span>{d.englishName}</span>
                <span dir="rtl" style={{ color: 'var(--color-text-muted, #6b7280)' }}>{d.arabicName}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
