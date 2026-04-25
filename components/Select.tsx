"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { CaretDown, MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react";

export interface SelectOption {
  label: string;
  value: string;
  [key: string]: any;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // Styling for the trigger button
  dropdownClassName?: string; // Styling for the dropdown container
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  disabled?: boolean;
  
  // Server-side search support
  asyncSearch?: boolean; // disables client-side filtering and lets parent handle search
  onSearchChange?: (query: string) => void;
  searchByOptions?: { label: string; value: string }[];
  searchByValue?: string;
  onSearchByChange?: (value: string) => void;
  loading?: boolean;
  useFixed?: boolean; // Renders dropdown with fixed positioning to avoid parent clipping
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  dropdownClassName = "",
  searchable = false,
  searchPlaceholder = "Search...",
  pagination = false,
  itemsPerPage = 5,
  disabled = false,
  asyncSearch = false,
  onSearchChange,
  searchByOptions,
  searchByValue,
  onSearchByChange,
  loading = false,
  useFixed = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update coordinates when opened in fixed mode
  const updateCoords = useCallback(() => {
    if (useFixed && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [useFixed]);

  // Handle viewport changes in fixed mode
  useEffect(() => {
    if (!isOpen || !useFixed) return;

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, useFixed, updateCoords]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredOptions = useMemo(() => {
    if (!searchable || asyncSearch) return options;
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchable, searchQuery, asyncSearch]);

  const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);

  const paginatedOptions = useMemo(() => {
    if (!pagination) return filteredOptions;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOptions.slice(start, start + itemsPerPage);
  }, [filteredOptions, pagination, currentPage, itemsPerPage]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
    if (onSearchChange) onSearchChange(""); // Reset parent search too
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setCurrentPage(1);
      if (onSearchChange) onSearchChange(""); // Reset parent search when reopened
      updateCoords(); // Calculate position immediately
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center justify-between w-full focus:outline-none transition-colors ${className} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown
          size={14}
          className={`shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } text-gray-400`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`${useFixed ? "fixed" : "absolute"} z-50 mt-1 min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dropdownClassName}`}
          style={useFixed ? { top: coords.top, left: coords.left, width: coords.width } : { width: "100%" }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus-within:border-[#8a9e60] transition-colors">
                {searchByOptions && searchByOptions.length > 0 && onSearchByChange && (
                  <div className="relative shrink-0 flex items-center border-r border-gray-100 pr-2 mr-1">
                    <select
                      value={searchByValue}
                      onChange={(e) => onSearchByChange(e.target.value)}
                      className="text-[10px] font-semibold text-gray-500 bg-transparent outline-none cursor-pointer appearance-none pr-3"
                    >
                      {searchByOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <CaretDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
                <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-xs text-gray-700 outline-none w-full"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#8a9e60] animate-spin"></div>
              </div>
            )}
            
            {paginatedOptions.length === 0 && !loading ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                No options found.
              </div>
            ) : (
              paginatedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#8a9e60]/10 text-[#8a9e60] font-semibold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {pagination && totalPages > 1 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
              >
                <CaretLeft size={14} />
              </button>
              <span className="text-[10px] font-medium text-gray-500">
                {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
              >
                <CaretRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
