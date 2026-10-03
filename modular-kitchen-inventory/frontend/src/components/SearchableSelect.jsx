import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = "Select option...",
  className = "",
  allowCustom = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  // Sync selected value with search input text when not actively editing
  useEffect(() => {
    if (!isFocused) {
      const selectedOption = options.find(opt => opt.value === value || String(opt.value) === String(value) || opt.label === value);
      if (selectedOption) {
        setSearch(selectedOption.label);
      } else {
        setSearch(value || '');
      }
    }
  }, [value, options, isFocused]);

  // Filter options dynamically:
  // When focused/typing, filter by search text; if search text is empty, show all options
  const filteredOptions = isFocused && search.trim() !== ''
    ? options.filter(opt => String(opt.label || '').toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
        // Reset search field to display the currently selected option
        const selectedOption = options.find(opt => opt.value === value || String(opt.value) === String(value) || opt.label === value);
        setSearch(selectedOption ? selectedOption.label : value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [value, options]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearch(option.label);
    setIsFocused(false);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setIsFocused(true);
    setIsOpen(true);
    if (allowCustom) {
      onChange(val);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    setIsOpen(true);
    if (e.target && typeof e.target.select === 'function') {
      e.target.select();
    }
  };

  const hasExactMatch = options.some(
    opt => String(opt.label || '').toLowerCase() === search.trim().toLowerCase() || String(opt.value || '').toLowerCase() === search.trim().toLowerCase()
  );

  const displayOptions = [...filteredOptions];
  if (allowCustom && search.trim() !== '' && !hasExactMatch) {
    displayOptions.push({
      value: search.trim(),
      label: `+ Add "${search.trim()}"`,
      isCustomAdd: true
    });
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-medium"
        />
        <ChevronDown
          className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 cursor-pointer pointer-events-none"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl shadow-lg select-none">
          {displayOptions.length > 0 ? (
            displayOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur before select handler
                    handleSelect(opt);
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    opt.isCustomAdd
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold border-t border-forest-100 dark:border-forest-800 hover:bg-brand-100'
                      : isSelected
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-forest-900 dark:text-slate-200 hover:bg-forest-50 dark:hover:bg-forest-900/60'
                  }`}
                >
                  {opt.label}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2.5 text-xs text-slate-400 italic">No matching options found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
