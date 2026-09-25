import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ChipInput({ chips = [], onChange, placeholder = "Add item..." }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove) => {
    onChange(chips.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            fontSize: '0.9rem',
            outline: 'none',
            background: '#FFFFFF'
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
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((chip, idx) => (
          <span
            key={idx}
            style={{
              background: 'rgba(79, 70, 229, 0.1)',
              color: '#4F46E5',
              padding: '5px 10px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {chip}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
