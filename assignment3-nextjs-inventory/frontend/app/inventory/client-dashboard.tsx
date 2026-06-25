"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InventoryItem } from "./data-generator";
import MetricCard from "../../components/MetricCard";
import InventoryRow from "../../components/InventoryRow";
import TableSkeleton from "../../components/TableSkeleton";

interface ClientDashboardProps {
  items: InventoryItem[];
}

type SortField = "id" | "name" | "lastUpdated";
type SortOrder = "asc" | "desc";

const ROW_HEIGHT = 50;
const OVERSCAN = 10;

export default function ClientDashboard({ items }: ClientDashboardProps) {
  const router = useRouter();
  
  // SSR hydration guard
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter and pagination states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [typeFilter, setTypeFilter] = useState<string>("All Types");
  
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scrollTop, setScrollTop] = useState(0);

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setFocusedIndex(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pre-parse dates to numeric timestamps for efficient sorting
  const itemsWithTimestamps = useMemo(() => {
    return items.map((item) => ({
      ...item,
      timestamp: new Date(item.lastUpdated).getTime(),
    }));
  }, [items]);

  // Derived filtered and sorted dataset
  const filteredAndSortedItems = useMemo(() => {
    let result = itemsWithTimestamps;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(lowerTerm) || i.id.toLowerCase().includes(lowerTerm)
      );
    }

    if (statusFilter !== "All Statuses") {
      result = result.filter((i) => i.status === statusFilter);
    }

    if (typeFilter !== "All Types") {
      result = result.filter((i) => i.type === typeFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortField === "lastUpdated") {
        return sortOrder === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [itemsWithTimestamps, searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  // Roving focus and keyboard navigation for WAI-ARIA grid compliance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || filteredAndSortedItems.length === 0) return;
      
      if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
        if (document.activeElement && document.activeElement.tagName === "INPUT") {
          return;
        }
        e.preventDefault();
      }

      let nextIndex = focusedIndex;

      switch (e.key) {
        case "ArrowDown":
          nextIndex = Math.min(focusedIndex + 1, filteredAndSortedItems.length - 1);
          break;
        case "ArrowUp":
          nextIndex = Math.max(focusedIndex - 1, 0);
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = filteredAndSortedItems.length - 1;
          break;
        case "Enter":
          if (filteredAndSortedItems[focusedIndex]) {
            handleRowClick(filteredAndSortedItems[focusedIndex].id);
          }
          break;
      }

      if (nextIndex !== focusedIndex) {
        setFocusedIndex(nextIndex);
        
        const container = containerRef.current;
        const rowTop = nextIndex * ROW_HEIGHT;
        const rowBottom = rowTop + ROW_HEIGHT;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        
        if (rowTop < containerTop) {
          container.scrollTop = rowTop;
        } else if (rowBottom > containerBottom) {
          container.scrollTop = rowBottom - container.clientHeight;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, filteredAndSortedItems]);

  const handleRowClick = useCallback((id: string) => {
    router.push(`/inventory/${id}`);
  }, [router]);

  // Summary metrics calculation
  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    
    for (const item of items) {
      if (item.status === "In Stock") inStock++;
      else if (item.status === "Low Stock") lowStock++;
      else if (item.status === "Out of Stock") outOfStock++;
    }
    
    return { inStock, lowStock, outOfStock };
  }, [items]);

  // Virtualization boundaries
  const containerHeight = 500;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    filteredAndSortedItems.length - 1,
    Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
  );
  
  const visibleItems = useMemo(() => {
    const subset = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (filteredAndSortedItems[i]) {
        subset.push({ item: filteredAndSortedItems[i], index: i });
      }
    }
    return subset;
  }, [filteredAndSortedItems, startIndex, endIndex]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map((item) => item.type));
    return Array.from(types).sort();
  }, [items]);

  return (
    <div className="dashboard-container">
      {/* Screen reader live updates */}
      <div aria-live="polite" className="sr-only">
        Showing {filteredAndSortedItems.length} inventory records.
      </div>

      <header className="dashboard-header">
        <h1 className="dashboard-title">Ecommerce Inventory Dashboard</h1>
        <p className="dashboard-subtitle">High-performance custom virtualized table rendering 50,000+ items</p>
      </header>

      {/* Analytics widgets */}
      <div className="metrics-row">
        <MetricCard label="In Stock" value={stats.inStock} indicatorColor="var(--success)" />
        <MetricCard label="Low Stock" value={stats.lowStock} indicatorColor="var(--warning)" />
        <MetricCard label="Out of Stock" value={stats.outOfStock} indicatorColor="var(--error)" />
        <MetricCard label="Total Catalog" value={items.length} indicatorColor="var(--primary)" />
      </div>

      {/* Control filters */}
      <div className="control-bar">
        <input
          type="search"
          placeholder="Search by product name or ID..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input-base search-input"
          aria-label="Search inventory"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setFocusedIndex(0); }}
          className="input-base filter-select"
          aria-label="Filter by status"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setFocusedIndex(0); }}
          className="input-base filter-select"
          aria-label="Filter by type"
        >
          <option value="All Types">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="input-base filter-select"
          aria-label="Sort by field"
        >
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="lastUpdated">Sort by Date</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="input-base filter-select"
          aria-label="Sort order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Virtualized grid */}
      <div 
        ref={containerRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="table-container"
      >
        {!isMounted ? (
          <TableSkeleton rowHeight={ROW_HEIGHT} count={8} />
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="empty-state">
            No products found matching your search.
          </div>
        ) : (
          <table 
            className="inventory-table"
            aria-label="Ecommerce Inventory Data"
            aria-rowcount={filteredAndSortedItems.length}
          >
            <thead className="table-thead">
              <tr className="table-header-row">
                <th scope="col" className="table-th col-id">ID</th>
                <th scope="col" className="table-th col-name">Name</th>
                <th scope="col" className="table-th col-type">Type</th>
                <th scope="col" className="table-th col-status">Status</th>
                <th scope="col" className="table-th col-date">Last Updated</th>
              </tr>
            </thead>
            <tbody className="table-tbody" style={{ height: filteredAndSortedItems.length * ROW_HEIGHT }}>
              {visibleItems.map(({ item, index }) => (
                <InventoryRow 
                  key={item.id} 
                  item={item} 
                  index={index} 
                  isFocused={focusedIndex === index} 
                  rowHeight={ROW_HEIGHT}
                  handleRowClick={handleRowClick} 
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
