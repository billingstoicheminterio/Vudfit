import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatISTDateTime } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Loader,
  RefreshCw,
  Calendar,
  User as UserIcon,
  MessageSquare,
  Camera,
  X,
  Trash2
} from 'lucide-react';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);
  const [resetting, setResetting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Helper to resolve backend uploads URL
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendBase = api.defaults.baseURL.replace('/api', '');
    return `${backendBase}${url}`;
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Failed to load transactions history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleResetHistory = async () => {
    if (
      window.confirm(
        "Are you absolutely sure you want to RESET the entire transaction history?\n\nThis will delete all transaction records and set all product stock levels back to zero.\n\nThis action CANNOT be undone!"
      )
    ) {
      setResetting(true);
      try {
        await api.post('/transactions/reset');
        alert("Transaction history reset successfully.");
        loadTransactions();
      } catch (error) {
        console.error("Failed to reset transaction history", error);
        alert(error.response?.data?.detail || "Failed to reset transaction history.");
      } finally {
        setResetting(false);
      }
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.supplier_name && t.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.remarks && t.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.user_fullname.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === '' || t.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-900 dark:text-white font-sans">Transaction History</h1>
          <p className="text-sm text-slate-500 dark:text-forest-300">Complete audit log of all inventory movements</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.username === 'master' && (
            <button
              onClick={handleResetHistory}
              disabled={resetting}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-650 hover:bg-red-700 text-white transition-colors font-bold text-sm disabled:opacity-50 cursor-pointer w-fit shadow-md shadow-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>{resetting ? 'Resetting...' : 'Reset history'}</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 transition-colors font-bold text-sm disabled:opacity-50 cursor-pointer w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh history</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 border border-brand-500/10 dark:border-brand-500/15">

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-forest-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product, operator, supplier, invoice, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm placeholder-slate-400 dark:placeholder-forest-500 dark:text-white"
          />
        </div>

        {/* Transaction Type filter */}
        <div className="w-full md:w-56">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
          >
            <option value="">All Movement Types</option>
            <option value="inward">Inward (Add stock)</option>
            <option value="outward">Outward (Consume stock)</option>
            <option value="return">Return (Subtract usage)</option>
          </select>
        </div>

      </div>

      {/* Transactions Table */}
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
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Movement</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Remarks / Destination / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100 dark:divide-forest-900/60">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const isInward = tx.type === 'inward';

                    // Format timestamp beautifully
                    const formattedObj = formatISTDateTime(tx.timestamp);
                    const formattedDate = formattedObj.date;
                    const formattedTime = formattedObj.time;

                    return (
                      <tr key={tx.id} className="hover:bg-forest-100/20 dark:hover:bg-forest-900/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-forest-900 dark:text-white font-bold text-xs">
                            <Calendar className="w-4 h-4 text-brand-500" />
                            <span>{formattedDate}</span>
                          </div>
                          <span className="text-slate-400 dark:text-forest-400 text-[10px] mt-0.5 ml-6 block font-semibold">{formattedTime}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-forest-900 dark:text-white">{tx.product_name}</p>
                          <span className="font-mono bg-forest-100 dark:bg-forest-950 border border-brand-500/10 px-1.5 py-0.5 rounded text-[10px] mt-1 inline-block font-extrabold text-brand-600 dark:text-brand-400 select-all">
                            {tx.product_sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${tx.type === 'inward'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : tx.type === 'return'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {tx.type === 'inward' || tx.type === 'return' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            <span className="capitalize">{tx.type}</span>
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-extrabold text-base ${tx.type === 'inward'
                            ? 'text-brand-600 dark:text-brand-400'
                            : tx.type === 'return'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-forest-600 dark:text-forest-400'
                          }`}>
                          {tx.type === 'inward' || tx.type === 'return' ? '+' : '-'}{tx.quantity}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-forest-300 font-semibold text-xs">
                            <UserIcon className="w-4 h-4 text-brand-500" />
                            <span className="truncate max-w-[120px]">{tx.user_fullname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.type === 'inward' ? (
                            <div className="space-y-1">
                              {tx.supplier_name && (
                                <p className="text-xs text-forest-900 dark:text-white font-bold">
                                  Supplier: <span className="font-medium text-slate-500 dark:text-forest-400">{tx.supplier_name}</span>
                                </p>
                              )}
                              {tx.invoice_number && (
                                <p className="text-[11px] text-forest-900 dark:text-white font-bold">
                                  Invoice: <span className="font-mono text-slate-500 dark:text-forest-400">{tx.invoice_number}</span>
                                </p>
                              )}
                            </div>
                          ) : tx.type === 'return' ? (
                            <div className="space-y-1">
                              {tx.customer_name && (
                                <p className="text-xs text-forest-900 dark:text-white font-bold">
                                  Customer (Return): <span className="font-medium text-slate-500 dark:text-forest-400">{tx.customer_name}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {tx.customer_name ? (
                                <p className="text-xs text-forest-900 dark:text-white font-bold">
                                  Customer: <span className="font-medium text-slate-500 dark:text-forest-400">{tx.customer_name}</span>
                                </p>
                              ) : tx.department ? (
                                <p className="text-xs text-forest-900 dark:text-white font-bold">
                                  Dept: <span className="font-medium text-slate-500 dark:text-forest-400">{tx.department}</span>
                                </p>
                              ) : null}
                            </div>
                          )}
                          {tx.remarks && (
                            <div className="flex items-center space-x-1.5 text-slate-400 dark:text-forest-400 text-xs mt-1 font-medium">
                              <MessageSquare className="w-3 h-3 flex-shrink-0 text-brand-500" />
                              <span className="italic truncate max-w-[180px]">{tx.remarks}</span>
                            </div>
                          )}
                          {tx.image_url && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => setActivePhotoUrl(getProductImageUrl(tx.image_url))}
                                className="inline-flex items-center space-x-1 text-[10px] text-brand-600 hover:text-brand-500 dark:text-brand-405 dark:hover:text-brand-305 font-bold bg-brand-500/5 hover:bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/10 transition-colors cursor-pointer"
                              >
                                <Camera className="w-3 h-3 text-brand-500" />
                                <span>View Photo</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-forest-500">
                      No matching inventory transactions logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/80 backdrop-blur-md fade-in">
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-brand-500/25 bg-forest-900/90 shadow-2xl p-2 animate-zoom-in">
            <img src={activePhotoUrl} alt="Transaction attachment" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-forest-950/80 text-white hover:text-brand-500 border border-white/10 transition-colors cursor-pointer shadow-lg"
              title="Close Image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Transactions;
