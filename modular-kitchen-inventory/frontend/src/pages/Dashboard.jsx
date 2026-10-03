import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatISTDateTime } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Layers,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Loader,
  RefreshCw,
  ShoppingBag,
  Clock,
  Plus,
  Minus,
  Printer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Gold and Forest Green themed palette for charts
const COLORS = [
  '#c5a059', // Metallic Gold
  '#3d7c5a', // Forest Green Medium
  '#e5c185', // Soft Gold
  '#2e6246', // Forest Green Dark
  '#f3ebc5', // Champagne Light
  '#244f38', // Deep Jade
  '#8c6c2e', // Bronze Gold
  '#1d3f2d'  // Black Forest Green
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/inventory/dashboard');
      setData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isStaff) {
      fetchDashboardData();
    }

    const handleRefreshEvent = () => {
      console.log("Auto-refreshing dashboard due to WebSocket event...");
      fetchDashboardData();
    };

    window.addEventListener('vudfit-refresh-data', handleRefreshEvent);
    return () => {
      window.removeEventListener('vudfit-refresh-data', handleRefreshEvent);
    };
  }, [isStaff]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (isStaff) {
    return (
      <div className="space-y-8 py-4 animate-fade-in select-none">
        {/* Large Welcome Header */}
        <div className="bg-gradient-to-r from-forest-900 to-forest-950 dark:from-forest-950 dark:to-forest-900 border border-brand-500/10 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-premium">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide font-luxury-title">
              Hello, {user?.full_name || 'Operator'} 👋
            </h1>
            <p className="text-sm sm:text-base text-[#c5a059] font-medium tracking-wide">
              Warehouse Station is Ready. Select an action below to start.
            </p>
          </div>
        </div>

        {/* Action Launcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1: Inward (Receive) */}
          <button
            onClick={() => navigate('/inward')}
            className="flex flex-col text-left group p-6 sm:p-8 rounded-3xl bg-white dark:bg-forest-900 border border-emerald-500/20 dark:border-emerald-500/15 hover:border-emerald-500/50 hover:shadow-lg dark:hover:bg-forest-850 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 cursor-pointer shadow-premium"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-forest-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              📥 Receive Materials
            </h3>
            <p className="text-sm text-slate-500 dark:text-forest-300 leading-relaxed font-semibold">
              Scan and add new items arriving from suppliers into the warehouse stock.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span>Start Receiving</span>
              <span className="transform group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
            </div>
          </button>

          {/* Card 2: Outward (Send) */}
          <button
            onClick={() => navigate('/outward')}
            className="flex flex-col text-left group p-6 sm:p-8 rounded-3xl bg-white dark:bg-forest-900 border border-amber-500/20 dark:border-amber-500/15 hover:border-amber-500/50 hover:shadow-lg dark:hover:bg-forest-850 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-amber-500/15 cursor-pointer shadow-premium"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Minus className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-forest-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              📤 Send Materials
            </h3>
            <p className="text-sm text-slate-500 dark:text-forest-300 leading-relaxed font-semibold">
              Scan and issue stock out of the warehouse to customers or sites.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <span>Start Sending</span>
              <span className="transform group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
            </div>
          </button>

          {/* Card 3: Check Stock */}
          <button
            onClick={() => navigate('/inventory')}
            className="flex flex-col text-left group p-6 sm:p-8 rounded-3xl bg-white dark:bg-forest-900 border border-blue-500/20 dark:border-blue-500/15 hover:border-blue-500/50 hover:shadow-lg dark:hover:bg-forest-850 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer shadow-premium"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Package className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-forest-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              📋 Check Stock
            </h3>
            <p className="text-sm text-slate-500 dark:text-forest-300 leading-relaxed font-semibold">
              Search and view current counts of all materials in the warehouse.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>Open Stock List</span>
              <span className="transform group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
            </div>
          </button>

          {/* Card 4: Print Barcodes */}
          <button
            onClick={() => navigate('/inventory')}
            className="flex flex-col text-left group p-6 sm:p-8 rounded-3xl bg-white dark:bg-forest-900 border border-[#c5a059]/25 dark:border-[#c5a059]/15 hover:border-[#c5a059]/50 hover:shadow-lg dark:hover:bg-forest-850 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-[#c5a059]/15 cursor-pointer shadow-premium"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Printer className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-forest-900 dark:text-white mb-2 group-hover:text-[#c5a059] transition-colors">
              🖨️ Print Barcodes
            </h3>
            <p className="text-sm text-slate-500 text-slate-500 dark:text-forest-300 leading-relaxed font-semibold">
              Search materials and print barcode sticker labels for boxes.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#c5a059]">
              <span>Open Printer Mode</span>
              <span className="transform group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
            </div>
          </button>
        </div>

        {/* Step by Step Visual Guide Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/10 shadow-premium">
          <h2 className="text-lg sm:text-xl font-extrabold text-forest-900 dark:text-white mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-brand-500" />
            <span>How to use the barcode scanner station:</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center font-black text-brand-600 dark:text-brand-400">
                1
              </div>
              <h4 className="font-extrabold text-base text-forest-900 dark:text-white">Choose Action</h4>
              <p className="text-xs text-slate-500 dark:text-forest-300 leading-relaxed">
                Click on the large card above for **Receive Materials** or **Send Materials**.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center font-black text-brand-600 dark:text-brand-400">
                2
              </div>
              <h4 className="font-extrabold text-base text-forest-900 dark:text-white">Scan Barcodes</h4>
              <p className="text-xs text-slate-500 dark:text-forest-300 leading-relaxed">
                Put your cursor inside the scanning box and scan the barcode sticker on each material box.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center font-black text-brand-600 dark:text-brand-400">
                3
              </div>
              <h4 className="font-extrabold text-base text-forest-900 dark:text-white">Input Count & Save</h4>
              <p className="text-xs text-slate-500 dark:text-forest-300 leading-relaxed">
                Check the list, set the correct quantities, take a cargo photo, and click the big save button.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-brand-500" />
          <span className="text-sm font-semibold text-slate-500 dark:text-forest-400">Preparing executive dashboard...</span>
        </div>
      </div>
    );
  }

  // Aggregate category list for chart representation
  const categoryChartData = data?.category_distribution || [];

  // Inward is Gold, Outward is Forest Green
  const movementChartData = data?.weekly_movement || [];

  return (
    <div className="space-y-6">
      
      {/* Upper header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold font-luxury-title tracking-wide text-forest-900 dark:text-white">Warehouse Overview</h1>
          <p className="text-xs text-slate-500 dark:text-forest-300 font-medium tracking-wide">Real-time modular kitchen materials status & logistics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Actions Shortcuts */}
          <button
            onClick={() => navigate('/inward')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-all font-semibold text-xs border border-green-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive</span>
          </button>
          <button
            onClick={() => navigate('/outward')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all font-semibold text-xs border border-red-500/20 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Issue</span>
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-all font-semibold text-xs border border-brand-500/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Barcodes</span>
          </button>
          
          <div className="hidden sm:block h-6 w-px bg-forest-100 dark:bg-forest-900 mx-1"></div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 transition-colors font-semibold text-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid of Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 fade-in">
        
        {/* Total Products */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 wood-accent-top">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 border border-brand-500/20">
            <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Total Products</span>
          <span className="text-xl sm:text-2xl font-bold text-forest-900 dark:text-white mt-1 block truncate font-luxury-title">{data?.total_products}</span>
        </div>

        {/* Total Stock Quantity */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 wood-accent-top">
          <div className="w-9 h-9 rounded-xl bg-forest-500/15 text-forest-600 dark:text-forest-400 flex items-center justify-center mb-3 border border-forest-500/20">
            <Layers className="w-5 h-5 text-forest-600 dark:text-forest-400" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Total Inventory</span>
          <span className="text-xl sm:text-2xl font-bold text-forest-900 dark:text-white mt-1 block truncate font-luxury-title">{data?.total_inventory}</span>
        </div>

        {/* Low Stock count */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 hover:border-amber-500/30 wood-accent-top">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${
            data?.low_stock_count > 0 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' 
              : 'bg-green-500/10 text-green-500 border-green-500/20'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Low Stock Items</span>
          <span className={`text-xl sm:text-2xl font-bold mt-1 block truncate font-luxury-title ${
            data?.low_stock_count > 0 ? 'text-amber-500' : 'text-forest-900 dark:text-white'
          }`}>{data?.low_stock_count}</span>
        </div>

        {/* Inward Transactions Today */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 hover:border-green-500/30 wood-accent-top">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 text-green-500 dark:text-green-400 flex items-center justify-center mb-3 border border-green-500/20">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Inwards Today</span>
          <span className="text-xl sm:text-2xl font-bold text-forest-900 dark:text-white mt-1 block truncate font-luxury-title">{data?.today_inward}</span>
        </div>

        {/* Outward Transactions Today */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 hover:border-red-500/30 wood-accent-top">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-500 dark:text-red-400 flex items-center justify-center mb-3 border border-red-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Outwards Today</span>
          <span className="text-xl sm:text-2xl font-bold text-forest-900 dark:text-white mt-1 block truncate font-luxury-title">{data?.today_outward}</span>
        </div>

        {/* Inventory Valuation */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl craft-hover border-brand-500/5 hover:border-brand-500/35 col-span-2 lg:col-span-1 wood-accent-top">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 border border-brand-500/20">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <span className="architect-badge block text-slate-400 dark:text-forest-400">Stock Value</span>
          <span className="text-xl sm:text-2xl font-bold text-forest-900 dark:text-white mt-1 block truncate font-luxury-title">
            ₹{data?.inventory_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category stock cost (Pie chart) */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4">Inventory Cost Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="cost"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`} 
                  contentStyle={{ borderRadius: '12px', background: '#0b2316', border: '1px solid #c5a059', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Category Health Indicators - Custom visual progress bars */}
          <div className="mt-4 space-y-3 max-h-[8.5rem] overflow-y-auto pr-1 text-xs">
            {categoryChartData.map((item, idx) => {
              const healthPct = Math.min(100, Math.max(10, Math.round((item.value / 400) * 100)));
              const isLow = healthPct < 30;
              const isCritical = healthPct < 15;
              const colorTheme = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-brand-500';

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-forest-800 dark:text-forest-300 truncate font-semibold">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{item.value} units</span>
                  </div>
                  <div className="w-full bg-forest-100 dark:bg-forest-950 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${colorTheme}`} style={{ width: `${healthPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly transactions movement (Stacked bars) */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 lg:col-span-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4">Stock Movement Trend</h3>
          <div className="h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e6246" strokeOpacity={0.15} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#c5a059', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#0b2316', border: '1px solid #c5a059', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Inward" name="Inward (Gold)" fill="#c5a059" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Outward" name="Outward (Forest)" fill="#3d7c5a" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Split Row for Reorder Assistant and Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reorder Assistant panel */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-forest-900 dark:text-white">Reorder Assistant</h3>
            </div>
            <span className="text-[10px] bg-brand-500/10 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              AI Procurement Recommendations
            </span>
          </div>

          <div className="divide-y divide-forest-105 dark:divide-forest-900/60 max-h-[20rem] overflow-y-auto pr-1">
            {data?.reorder_recommendations.length > 0 ? (
              data.reorder_recommendations.map((rec) => (
                <div key={rec.sku} className="py-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-forest-900 dark:text-white truncate">{rec.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-forest-400 mt-1">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-forest-100 dark:bg-forest-950 px-1.5 py-0.5 rounded text-[10px]">{rec.sku}</span>
                      <span>Brand: {rec.brand}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs block text-slate-500 dark:text-forest-400">Stock: {rec.current_stock} / {rec.min_stock} {rec.unit}</span>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block mt-0.5">
                      Suggested order: +{rec.suggested_qty} {rec.unit}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-forest-400">
                <p>No reorders needed. All product stock levels are healthy!</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed logs */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-forest-900 dark:text-white">Recent Transactions</h3>
          </div>

          <div className="relative border-l-2 border-forest-100 dark:border-forest-900 ml-3.5 space-y-5 py-2 max-h-[20rem] overflow-y-auto pr-1">
            {data?.recent_activities.length > 0 ? (
              data.recent_activities.map((act) => {
                const isInward = act.type === 'inward';
                return (
                  <div key={act.id} className="relative pl-6">
                    <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-forest-900 flex items-center justify-center ${
                      isInward ? 'bg-brand-500' : 'bg-forest-500'
                    }`}></span>
                    <div className="text-sm">
                      <span className="font-bold text-forest-900 dark:text-white">{act.product_name}</span>
                      <span className="mx-1.5 text-slate-400 dark:text-forest-500">•</span>
                      <span className={`font-extrabold ${isInward ? 'text-brand-600 dark:text-brand-400' : 'text-forest-600 dark:text-forest-400'}`}>
                        {isInward ? '+' : '-'}{act.quantity} {act.unit}
                      </span>
                      <p className="text-slate-500 dark:text-forest-400 text-xs mt-0.5">{act.details}</p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>By: {act.user_fullname}</span>
                        <span>•</span>
                        <span>{formatISTDateTime(act.timestamp).time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-forest-400">
                <p>No material inward or outward operations logged today.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default Dashboard;
