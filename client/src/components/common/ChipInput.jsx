import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ChipInput({
  chips = [],
  onChange,
  onAddChip,
  onRemoveChip,
  placeholder = "Add item...",
  id,
  name,
  'aria-label': ariaLabel
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !chips.includes(trimmed)) {
      if (onChange) {
        onChange([...chips, trimmed]);
      } else if (onAddChip) {
        onAddChip(trimmed);
      }
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (chipToRemove, indexToRemove) => {
    if (onChange) {
      onChange(chips.filter((_, idx) => idx !== indexToRemove));
    } else if (onRemoveChip) {
      onRemoveChip(chipToRemove);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          id={id || (name ? `chip-input-${name}` : 'chip-input-field')}
          name={name || 'chipInput'}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder || "Add item"}
          autoComplete="off"
          style={{
            flex: '1 1 200px',
            minWidth: 0,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            fontSize: '0.9rem',
            outline: 'none',
            background: '#FFFFFF',
            color: '#0F172A'
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="btn"
          style={{
            background: '#172554',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '0 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: '0.85rem',
            height: 42,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
        {chips.map((chip, idx) => (
          <span
            key={`${chip}-${idx}`}
            style={{
              background: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
              padding: '4px 10px 4px 12px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: '100%',
              wordBreak: 'break-word'
            }}
          >
            <span>{chip}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove(chip, idx);
              }}
              aria-label={`Remove ${chip}`}
              title={`Remove ${chip}`}
              style={{
                background: 'rgba(79, 70, 229, 0.15)',
                border: 'none',
                color: '#4F46E5',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                padding: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#DC2626';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)';
                e.currentTarget.style.color = '#4F46E5';
              }}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
