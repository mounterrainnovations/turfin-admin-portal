"use client";

import { useState, useRef, useEffect } from "react";
import { 
  CaretLeft, 
  CaretRight, 
  MagnifyingGlass, 
  Storefront, 
  CaretDown,
  XCircle,
  CircleNotch
} from "@phosphor-icons/react";
import { useVendorsList } from "@/domains/vendors/api";
import { useDebounce } from "@/hooks/use-debounce";
import { Vendor } from "@/domains/vendors/types";

interface VendorSelectorProps {
  selectedVendorId: string;
  onSelect: (vendorId: string, vendor?: Vendor) => void;
  error?: string;
  placeholder?: string;
}

export function VendorSelector({ selectedVendorId, onSelect, error, placeholder }: VendorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useVendorsList({
    page,
    limit: 5,
    search: debouncedSearch || undefined,
    excludeStatus: "banned",
  });

  const vendors = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  // We try to find the selected vendor from the current list or fetch it if needed.
  // For now, since the page size is small, if it's not in the list we show ID.
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 border ${error ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200'} rounded-2xl px-5 py-4 text-sm flex items-center justify-between hover:bg-white transition-all focus:border-[#8a9e60] focus:ring-4 focus:ring-[#8a9e60]/5 outline-none text-left group shadow-sm`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selectedVendorId ? 'bg-[#8a9e60] text-white shadow-lg shadow-[#8a9e60]/20' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
            <Storefront size={20} weight={selectedVendorId ? "fill" : "regular"} />
          </div>
          <div className="min-w-0">
            {selectedVendor ? (
              <>
                <p className="font-bold text-gray-800 truncate">{selectedVendor.businessName}</p>
                <p className="text-[10px] text-gray-400 font-mono font-medium truncate">{selectedVendor.id}</p>
              </>
            ) : selectedVendorId ? (
              <>
                <p className="font-bold text-gray-800 truncate">Selected Vendor</p>
                <p className="text-[10px] text-gray-400 font-mono font-medium truncate">{selectedVendorId}</p>
              </>
            ) : (
              <p className="text-gray-400 font-medium">{placeholder || "Search and select a vendor..."}</p>
            )}
          </div>
        </div>
        <CaretDown size={18} weight="bold" className={`text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#8a9e60]' : 'group-hover:text-gray-400'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-[150] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 transition-all focus-within:border-[#8a9e60] focus-within:ring-4 focus-within:ring-[#8a9e60]/5">
              <MagnifyingGlass size={18} weight="bold" className="text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by business name..."
                className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-300 font-medium"
              />
              {search && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                  }} 
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <XCircle size={18} weight="fill" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[280px] overflow-y-auto scrollbar-hide p-2">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <CircleNotch size={32} className="text-[#8a9e60] animate-spin" />
                <p className="text-[10px] font-black text-[#8a9e60] uppercase tracking-[0.2em]">Searching vendors</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Storefront size={24} className="text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400 mb-1">No results found</p>
                <p className="text-[10px] text-gray-400 font-medium px-8">Try searching for a different business name</p>
              </div>
            ) : (
              <div className="space-y-1">
                {vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => {
                      onSelect(vendor.id, vendor);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-[16px] transition-all hover:bg-gray-50 text-left group ${selectedVendorId === vendor.id ? 'bg-[#8a9e60]/5 ring-1 ring-[#8a9e60]/20' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm transition-all ${selectedVendorId === vendor.id ? 'bg-[#8a9e60] text-white' : 'bg-gray-100 text-gray-400 group-hover:scale-105'}`}>
                      {vendor.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${selectedVendorId === vendor.id ? 'text-[#8a9e60]' : 'text-gray-800'}`}>
                        {vendor.businessName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-gray-400 font-mono font-medium truncate">{vendor.id}</p>
                        <span className="w-1 h-3 border-l border-gray-200" />
                        <p className="text-[10px] text-gray-400 font-medium truncate">{vendor.ownerFullName}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(p => p - 1);
                }}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 disabled:opacity-20 hover:bg-white hover:text-[#8a9e60] hover:border-[#8a9e60]/30 transition-all shadow-sm disabled:shadow-none"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Page {page} of {totalPages}
                </span>
                <span className="text-[9px] text-gray-300 font-bold mt-0.5">
                  {meta?.total} total vendors
                </span>
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(p => p + 1);
                }}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 disabled:opacity-20 hover:bg-white hover:text-[#8a9e60] hover:border-[#8a9e60]/30 transition-all shadow-sm disabled:shadow-none"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
