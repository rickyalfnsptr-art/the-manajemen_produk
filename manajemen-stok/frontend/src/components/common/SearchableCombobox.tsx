'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customPrefix?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: ComboboxOption, isSelected: boolean) => React.ReactNode;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Pilih atau Ketik Pencarian --',
  searchPlaceholder = 'Ketik untuk memfilter daftar...',
  allowCustom = true,
  customPrefix = '+ Gunakan',
  required = false,
  disabled = false,
  className = '',
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options into ComboboxOption objects
  const normalizedOptions: ComboboxOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value) || (value ? { value, label: value } : null);
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Check if current search query is an exact match with any option
  const isExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedOptions.some((opt) => opt.value.toLowerCase() === q || opt.label.toLowerCase() === q);
  }, [normalizedOptions, searchQuery]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  const handleCustomSelect = () => {
    if (searchQuery.trim()) {
      handleSelect(searchQuery.trim());
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button / Display */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2 bg-slate-50 border rounded-lg text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
            : 'border-slate-300 hover:border-slate-400 hover:bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <span
          className={`truncate text-xs font-semibold ${
            selectedOption ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              title="Hapus Pilihan"
              className="p-1 hover:bg-slate-200 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-scale-up">
          {/* Search Box inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      handleSelect(filteredOptions[0].value);
                    } else if (allowCustom && searchQuery.trim()) {
                      handleCustomSelect();
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
              <span>Menampilkan {filteredOptions.length} pilihan</span>
              <span>Bisa di-scroll &amp; diketik</span>
            </div>
          </div>

          {/* Scrollable Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="truncate">
                        <span className="truncate block">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 block font-normal truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs px-3">
                <p className="font-semibold text-slate-600">Tidak ada pilihan yang cocok</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {allowCustom
                    ? 'Anda dapat mengetik nilai manual di bawah ini'
                    : 'Coba ubah kata kunci pencarian'}
                </p>
              </div>
            )}

            {/* Allow Custom Option if typed query is not in list */}
            {allowCustom && searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={handleCustomSelect}
                className="w-full text-left px-3 py-2 mt-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 transition-colors border border-dashed border-amber-200"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {customPrefix}: <b className="font-mono">"{searchQuery.trim()}"</b>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCombobox;
