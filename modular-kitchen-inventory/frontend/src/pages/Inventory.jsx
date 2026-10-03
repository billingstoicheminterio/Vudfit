import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader,
  RefreshCw,
  TrendingDown,
  Activity,
  Printer
} from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  const [stockItems, setStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState('name'); // 'name', 'sku', 'current_stock', 'min_stock'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Stock Adjustment Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState(null);
  const [adjustType, setAdjustType] = useState('outward'); // 'inward' or 'outward'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const openAdjustmentModal = (item) => {
    setSelectedAdjustItem(item);
    setAdjustType('outward');
    setAdjustQty('');
    setAdjustRemarks('Trial stock correction (Master Adjustment)');
    setAdjustError('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdjustItem) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      setAdjustError('Please enter a valid quantity greater than zero.');
      return;
    }

    setAdjustLoading(true);
    setAdjustError('');

    try {
      await api.post('/transactions/adjust-stock', {
        product_id: selectedAdjustItem.product_id,
        quantity: qty,
        type: adjustType,
        remarks: adjustRemarks
      });
      
      loadInventoryStatus();
      setShowAdjustModal(false);
    } catch (err) {
      console.error(err);
      setAdjustError(err.response?.data?.detail || 'Stock adjustment failed.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const loadInventoryStatus = async () => {
    try {
      const [stockRes, catRes] = await Promise.all([
        api.get('/inventory/status'),
        api.get('/categories')
      ]);
      setStockItems(stockRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Failed to load inventory status", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventoryStatus();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadInventoryStatus();
  };

  // Sort & Filter logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredItems = stockItems
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === '' || item.category_name === categoryFilter;

      const matchesStatus =
        statusFilter === '' || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate summary counts
  const summary = {
    total: stockItems.length,
    healthy: stockItems.filter(i => i.status === 'healthy').length,
    low: stockItems.filter(i => i.status === 'low').length,
    critical: stockItems.filter(i => i.status === 'critical').length,
  };

  return (
    <div className="space-y-6">

      {/* Header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-900 dark:text-white">
            {isStaff ? "📋 Check Stock" : "Current Stock Levels"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-forest-300">
            {isStaff ? "Type any material name below to see how many we have left in the warehouse." : "Monitor availability levels and reorder triggers"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 transition-colors font-bold text-sm disabled:opacity-50 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{isStaff ? "Refresh List" : "Refresh stock"}</span>
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        
        {/* Total catalog items */}
        <div 
          onClick={() => setStatusFilter('')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === '' 
              ? 'border-brand-500/55 bg-brand-500/5 shadow-md ring-2 ring-brand-500/10 dark:ring-brand-500/15' 
              : 'border-brand-500/5 hover:border-brand-500/20'
          }`}
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block">Items Monitored</span>
          <span className="text-xl font-bold text-forest-900 dark:text-white mt-1 block">{summary.total}</span>
        </div>

        {/* Healthy Items */}
        <div 
          onClick={() => setStatusFilter('healthy')}
          className={`glass-panel p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'healthy' 
              ? 'border-green-500/55 bg-green-550/5 shadow-md ring-2 ring-green-500/10 dark:ring-green-500/15' 
              : 'border-brand-500/5 hover:border-green-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block">Healthy Stock</span>
            <span className="text-xl font-bold text-green-500 mt-1 block">{summary.healthy}</span>
          </div>
          <CheckCircle className={`w-8 h-8 transition-colors ${statusFilter === 'healthy' ? 'text-green-500' : 'text-green-500/25'}`} />
        </div>

        {/* Low Stock Items */}
        <div 
          onClick={() => setStatusFilter('low')}
          className={`glass-panel p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'low' 
              ? 'border-amber-500/55 bg-amber-500/5 shadow-md ring-2 ring-amber-500/10 dark:ring-amber-500/15' 
              : 'border-brand-500/5 hover:border-amber-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block">Low Stock</span>
            <span className="text-xl font-bold text-amber-500 mt-1 block">{summary.low}</span>
          </div>
          <AlertTriangle className={`w-8 h-8 transition-colors ${statusFilter === 'low' ? 'text-amber-500' : 'text-amber-500/25'}`} />
        </div>

        {/* Critical Stock Items */}
        <div 
          onClick={() => setStatusFilter('critical')}
          className={`glass-panel p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === 'critical' 
              ? 'border-red-500/55 bg-red-550/5 shadow-md ring-2 ring-red-500/10 dark:ring-red-500/15' 
              : 'border-brand-500/5 hover:border-red-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block">Critical Stock</span>
            <span className="text-xl font-bold text-red-500 mt-1 block">{summary.critical}</span>
          </div>
          <XCircle className={`w-8 h-8 transition-colors ${statusFilter === 'critical' ? 'text-red-500 animate-pulse' : 'text-red-500/25'}`} />
        </div>

      </div>

      {/* Filter and Search controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 border border-brand-500/10 dark:border-brand-500/15">

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 dark:text-forest-400 pointer-events-none" />
          <input
            type="text"
            placeholder={isStaff ? "🔍 Type here to search (for example: hinge, plywood, channel)..." : "Filter stock by SKU, Name, or Brand..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-11 pr-4 bg-white/50 dark:bg-forest-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm placeholder-slate-450 dark:text-white ${isStaff ? "border-brand-500/40 py-3.5 text-base font-bold" : "border-forest-200 dark:border-forest-800 py-2.5"
              }`}
          />
        </div>

        {!isStaff && (
          <>
            {/* Category filter */}
            <div className="w-full md:w-48 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 dark:text-forest-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
              >
                <option value="">All Status Levels</option>
                <option value="healthy">Healthy Only</option>
                <option value="low">Low Stock Only</option>
                <option value="critical">Critical Stock Only</option>
              </select>
            </div>
          </>
        )}

      </div>

      {/* Stock Levels Table */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="glass-panel border border-brand-500/10 dark:border-brand-500/15 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-forest-50/50 dark:bg-forest-950/60 border-b border-forest-100 dark:border-forest-900 text-forest-600 dark:text-forest-300 font-bold text-xs uppercase tracking-wider select-none">
                  <th className="px-6 py-4 cursor-pointer hover:text-brand-500 dark:hover:text-white" onClick={() => handleSort('sku')}>
                    <div className="flex items-center space-x-1">
                      <span>SKU</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-brand-500 dark:hover:text-white" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Product Details</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:text-brand-500 dark:hover:text-white" onClick={() => handleSort('min_stock')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Min Stock</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:text-brand-500 dark:hover:text-white" onClick={() => handleSort('current_stock')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Current Stock</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-wider select-none">Status</th>
                  <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-wider select-none">Print Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100 dark:divide-forest-900/60">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isHealthy = item.status === 'healthy';
                    const isLow = item.status === 'low';
                    const isCritical = item.status === 'critical';

                    return (
                      <tr key={item.product_id} className="hover:bg-forest-100/20 dark:hover:bg-forest-900/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-brand-600 dark:text-brand-400 select-all">{item.sku}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-forest-900 dark:text-white">{item.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-forest-400 mt-0.5">Barcode: {item.barcode}</p>
                        </td>
                        <td className="px-6 py-4 font-medium">{item.brand}</td>
                        <td className="px-6 py-4">
                          <span className="bg-forest-100 dark:bg-forest-950 text-forest-800 dark:text-brand-400 border border-brand-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                            {item.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-500 dark:text-forest-300">
                          {item.min_stock} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1.5 min-w-[120px]">
                            <div className="flex justify-between items-baseline">
                              <span className={`font-extrabold text-base ${isCritical ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-forest-900 dark:text-slate-100'
                                }`}>
                                {item.current_stock}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">{item.unit}</span>
                            </div>
                            <div className="w-full bg-forest-100 dark:bg-forest-950 rounded-full h-1.5 overflow-hidden border border-forest-200/20 dark:border-forest-900/10">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                style={{ width: `${Math.min(100, (item.current_stock / Math.max(1, item.min_stock)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${isCritical
                              ? 'bg-red-550/10 text-red-500 border-red-550/20 animate-pulse'
                              : isLow
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-green-550/10 text-green-500 border-green-500/20'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'
                              }`}></span>
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => navigate(`/print-labels?sku=${item.sku}&autoprint=true`)}
                              className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/25 text-[#c5a059] hover:bg-[#c5a059]/20 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                              title="Print Barcode sticker"
                            >
                              <Printer className="w-4 h-4 text-brand-500" />
                            </button>
                            {user?.username === 'master' && (
                              <button
                                onClick={() => openAdjustmentModal(item)}
                                className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center cursor-pointer"
                                title="Direct Stock Adjustment"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-forest-500">
                      No matching material records in stock database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedAdjustItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-forest-900 border border-slate-200 dark:border-forest-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-forest-900 dark:text-white flex items-center space-x-2">
              <span className="text-red-500 font-extrabold">🔧 Master Stock Adjustment</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-forest-400 mt-1">
              Directly adjust stock levels without requiring a customer profile. Restricted to Master Admin.
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-forest-950 rounded-xl border border-slate-100 dark:border-forest-900">
              <p className="text-xs font-semibold text-forest-900 dark:text-white truncate">
                Item: <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{selectedAdjustItem.sku}</span> - {selectedAdjustItem.name}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-forest-300 mt-1">
                Current Warehouse Stock: <span className="font-bold">{selectedAdjustItem.current_stock} {selectedAdjustItem.unit}</span>
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              {/* Type */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('outward')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      adjustType === 'outward'
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : 'bg-white dark:bg-forest-900 border-slate-200 dark:border-forest-800 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Deduct Stock (Outward)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('inward')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      adjustType === 'inward'
                        ? 'bg-green-500/10 border-green-500 text-green-500'
                        : 'bg-white dark:bg-forest-900 border-slate-200 dark:border-forest-800 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Add Stock (Inward)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block mb-1.5">Quantity ({selectedAdjustItem.unit})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Enter change quantity..."
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-slate-250 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider block mb-1.5">Remarks / Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trial stock removal, count correction"
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-slate-250 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {adjustError && (
                <p className="text-xs text-red-500 font-semibold">{adjustError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-forest-800 rounded-xl text-xs font-bold text-slate-500 dark:text-forest-300 hover:bg-slate-50 dark:hover:bg-forest-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                    adjustType === 'outward'
                      ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-400'
                      : 'bg-green-500 hover:bg-green-600 disabled:bg-green-400'
                  }`}
                >
                  {adjustLoading ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
