import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatISTDateTime } from '../utils/dateFormatter';
import api from '../utils/api';
import { ArrowLeft, Printer, Loader, AlertCircle, Calendar, Layers, ClipboardList } from 'lucide-react';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoiceData = async () => {
    try {
      const res = await api.get(`/customers/${id}/invoice`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || 'Failed to load customer statement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-brand-500" />
          <span className="text-sm font-semibold text-slate-500 dark:text-forest-400">Loading usage statement...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 glass-panel border-red-500/25 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg text-forest-900 dark:text-white">Error Loading Statement</h3>
        <p className="text-slate-500 dark:text-forest-300 text-sm">{error}</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-forest-950 rounded-xl text-sm font-bold cursor-pointer"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const { customer, items } = data;
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendBase = api.defaults.baseURL.replace('/api', '');
    return `${backendBase}${url}`;
  };
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action panel (hidden on print) */}
      <div className="flex items-center justify-between no-print bg-white/40 dark:bg-forest-900/20 p-4 rounded-2xl border border-forest-100 dark:border-forest-850">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-forest-100 dark:hover:bg-forest-900/50 text-slate-500 dark:text-forest-300 font-bold text-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold text-sm shadow-md shadow-brand-500/10 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Requisition Note</span>
        </button>
      </div>

      {/* Printable Statement Container */}
      <div className="bg-white dark:bg-forest-950 border border-slate-200 dark:border-forest-900 overflow-hidden rounded-3xl shadow-sm print-area print:border-none print:shadow-none">
        
        {/* Invoice Header Banner */}
        <div className="bg-[#0b3121] text-white p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center border-b-[5px] border-[#c5a059] print:bg-[#0b3121] print:text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-widest text-[#c5a059]">VUDFIT</h1>
            <p className="text-[9px] tracking-[0.25em] font-bold text-white/90 uppercase mt-1 print:hidden">LUXURY LIVING INTERIOR SYSTEMS</p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <h2 className="text-lg md:text-xl font-extrabold tracking-wider text-white">GOODS REQUISITION NOTE</h2>
            <p className="text-xs text-white/80 mt-1">Ref: <span className="font-mono font-bold">VUD-REQ-{customer.id}-{new Date().getFullYear()}</span></p>
            <p className="text-xs text-white/80 mt-0.5">Date: {currentDate}</p>
          </div>
        </div>

        {/* Client & Company Addresses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-200 dark:border-forest-900 print:grid-cols-2">
          {/* Requisitioned For */}
          <div className="p-6 bg-[#fbf9f4] dark:bg-forest-900/10 border-r border-slate-200 dark:border-forest-900 flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-[#a48243] uppercase tracking-widest block">REQUISITIONED FOR</span>
            <p className="font-bold text-base text-[#0b3121] dark:text-brand-400">{customer.name}</p>
            {customer.contact_person && (
              <p className="text-xs text-slate-700 dark:text-forest-300 font-semibold">Attn: {customer.contact_person}</p>
            )}
            {customer.phone && <p className="text-xs text-slate-500 dark:text-forest-400">Phone: {customer.phone}</p>}
            {customer.email && <p className="text-xs text-slate-500 dark:text-forest-400">Email: {customer.email}</p>}
            {customer.address && (
              <p className="text-xs text-slate-500 dark:text-forest-400 mt-2 font-medium max-w-sm">
                Project Address:<br />{customer.address}
              </p>
            )}
          </div>

          {/* Company info */}
          <div className="p-6 bg-[#fbf9f4] dark:bg-forest-900/10 flex flex-col space-y-1 md:text-right md:items-end">
            <span className="text-[10px] font-bold text-[#a48243] uppercase tracking-widest block">ISSUED FROM</span>
            <p className="font-bold text-[#0b3121] dark:text-brand-400">Vudfit Central Warehouse</p>
            <p className="text-xs text-slate-500 dark:text-forest-400">133/1/1, Patel Farm</p>
            <p className="text-xs text-slate-500 dark:text-forest-400">Popatpura, Gujarat</p>
            <p className="text-xs text-slate-500 dark:text-forest-400">PIN: 389340</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Net Consumed Summary Table */}
          <div>
            <div className="border-b-[3px] border-[#c5a059] pb-1.5 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0b3121] dark:text-white">NET CONSUMED SUMMARY</h3>
            </div>

            <div className="border border-slate-200 dark:border-forest-900 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse bg-white dark:bg-forest-950">
                <thead>
                  <tr className="bg-[#0b3121] text-white text-[10px] md:text-xs uppercase tracking-wider font-bold print:bg-[#0b3121] print:text-white">
                    <th className="px-4 py-3 w-12 text-center border-r border-[#0b3121]">#</th>
                    <th className="px-4 py-3">Product details</th>
                    <th className="px-4 py-3 text-right w-28">Issued</th>
                    <th className="px-4 py-3 text-right w-28">Returned</th>
                    <th className="px-4 py-3 text-right w-36">Net Consumed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-forest-900 font-medium">
                  {data.summary && data.summary.length > 0 ? (
                    data.summary.map((item, idx) => (
                      <tr key={item.product_sku} className="hover:bg-slate-50 dark:hover:bg-forest-900/10 transition-colors">
                        <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono border-r border-slate-200 dark:border-forest-900">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#0b3121] dark:text-white">{item.product_name}</p>
                          <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">
                            SKU: {item.product_sku}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-650 dark:text-forest-300">
                          {item.total_issued} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-500 dark:text-blue-400">
                          {item.total_returned} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-[#0b3121] dark:text-white">
                          {item.net_consumed} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-400 dark:text-forest-500">
                        No consumption data registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Detailed Log Table */}
          <div>
            <div className="border-b-[3px] border-[#c5a059] pb-1.5 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0b3121] dark:text-white">TRANSACTION HISTORY LOG</h3>
            </div>

            <div className="border border-slate-200 dark:border-forest-900 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse bg-white dark:bg-forest-950">
                <thead>
                  <tr className="bg-[#485c50] text-white text-[10px] md:text-xs uppercase tracking-wider font-bold print:bg-[#485c50] print:text-white">
                    <th className="px-4 py-3 w-12 text-center border-r border-[#485c50]">#</th>
                    <th className="px-4 py-3">Product details</th>
                    <th className="px-4 py-3 w-36">Date & Time</th>
                    <th className="px-4 py-3 w-24">Type</th>
                    <th className="px-4 py-3">Remarks / Notes</th>
                    <th className="px-4 py-3 text-right w-32">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-forest-900 font-medium">
                  {items.length > 0 ? (
                    items.map((item, idx) => {
                      const formattedDate = formatISTDateTime(item.timestamp).dateTime;
                      const isReturn = item.type === 'return';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-forest-900/10 transition-colors">
                          <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono border-r border-slate-200 dark:border-forest-900">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#0b3121] dark:text-white">{item.product_name}</p>
                            <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">
                              SKU: {item.product_sku}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-550 dark:text-forest-400 font-semibold">{formattedDate}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              isReturn
                                ? 'bg-blue-500/10 text-blue-650 dark:text-blue-400 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-forest-400 italic font-normal">{item.remarks || <span className="text-slate-350 dark:text-forest-700">N/A</span>}</td>
                          <td className={`px-4 py-3 text-right font-extrabold ${
                            isReturn ? 'text-blue-500' : 'text-[#0b3121] dark:text-white'
                          }`}>
                            {isReturn ? '-' : '+'}{item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400 dark:text-forest-500">
                        No material consumption log entries registered for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Requisition Note Signatures Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-forest-900 grid grid-cols-2 gap-8 text-[11px] font-bold text-[#a48243]">
            <div className="space-y-12">
              <p className="uppercase tracking-wider">Prepared By (Warehouse Manager)</p>
              <div className="w-48 border-b border-[#a48243]"></div>
              <p className="text-slate-400 dark:text-forest-500 font-normal">Name & Designation</p>
            </div>

            <div className="space-y-12 text-right flex flex-col items-end">
              <p className="uppercase tracking-wider">Received By (Customer / Site Rep)</p>
              <div className="w-48 border-b border-[#a48243] mt-12"></div>
              <p className="text-slate-400 dark:text-forest-500 font-normal">Authorized Signature & Seal</p>
            </div>
          </div>

          {/* Bottom Meta Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-forest-900 flex justify-between text-[10px] text-slate-400 print:hidden">
            <span>Vudfit — a brand of Stoichem Interio Pvt. Ltd.</span>
            <span>Generated via KitchenFlow · stoicheminterio.com</span>
          </div>
        </div>

      </div>

      {/* Print CSS Injection */}
      <style>{`
        @page {
          margin: 0;
        }
        @media print {
          /* Hide non-printable items */
          .no-print,
          aside,
          header,
          nav,
          button {
            display: none !important;
          }
          
          /* Full page layouts */
          body, .flex-1, main, .print-area {
            background: white !important;
            color: black !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print-area {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 1.6cm !important;
          }
          
          /* Force columns side-by-side in print */
          .print-area .grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          
          /* Ensure headers print correctly */
          .print-area bg-[#0b3121] {
            background-color: #0b3121 !important;
          }
          .print-area bg-[#485c50] {
            background-color: #485c50 !important;
          }
          .print-area bg-[#fbf9f4] {
            background-color: #fbf9f4 !important;
          }
          
          table, th, td {
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Invoice;
