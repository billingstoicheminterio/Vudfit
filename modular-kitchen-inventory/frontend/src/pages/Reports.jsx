import React, { useState } from 'react';
import api from '../utils/api';
import {
  Download,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Loader,
  CheckCircle,
  FileText
} from 'lucide-react';

const Reports = () => {
  const [downloadingReport, setDownloadingReport] = useState(null);

  const handleExport = async (endpoint, reportName) => {
    setDownloadingReport(reportName);
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      // Create local URL for download blob
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Build filename
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `${reportName}_report_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to compile and export report. Please try again.");
    } finally {
      setDownloadingReport(null);
    }
  };

  const reportsList = [
    {
      id: 'stock',
      name: 'Stock Status Valuation',
      description: 'Complete stock inventory listing including active SKU codes, current quantities, unit cost, and overall warehouse valuation indicators.',
      icon: Layers,
      iconColor: 'text-brand-500',
      iconBg: 'bg-brand-500/10 dark:bg-brand-500/15',
      endpoint: '/reports/stock/export',
      columns: ['SKU', 'Product Name', 'Brand', 'Category', 'Unit', 'Barcode', 'Min Stock', 'Unit Cost', 'Current Stock', 'Inventory Value', 'Status']
    },
    {
      id: 'inward',
      name: 'Inward Materials Receipts',
      description: 'Historical listing of all incoming shipments, purchase receipts, supplier names, invoice numbers, receipt times, and operator remarks.',
      icon: ArrowDownLeft,
      iconColor: 'text-brand-500',
      iconBg: 'bg-brand-500/10 dark:bg-brand-500/15',
      endpoint: '/reports/inward/export',
      columns: ['Transaction ID', 'Date/Time', 'SKU', 'Product Name', 'Quantity', 'Unit', 'User', 'Supplier', 'Invoice Number', 'Remarks']
    },
    {
      id: 'outward',
      name: 'Outward Production Withdrawals',
      description: 'Chronological log of stock consumption by manufacturing departments, detailing requisitioning shops, quantities issued, and job order descriptions.',
      icon: ArrowUpRight,
      iconColor: 'text-forest-500 dark:text-brand-400',
      iconBg: 'bg-forest-500/10 dark:bg-forest-900/40',
      endpoint: '/reports/outward/export',
      columns: ['Transaction ID', 'Date/Time', 'SKU', 'Product Name', 'Quantity', 'Unit', 'User', 'Department', 'Remarks']
    },
    {
      id: 'lowstock',
      name: 'Low Stock & Reorder Trigger',
      description: 'Filter report containing items currently running below their minimum warehouse threshold. Ideal for logistics purchasing cycles.',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      endpoint: '/reports/lowstock/export',
      columns: ['SKU', 'Product Name', 'Brand', 'Category', 'Unit', 'Min Stock', 'Current Stock', 'Status']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-900 dark:text-white">Reports Center</h1>
        <p className="text-sm text-slate-500 text-slate-500 dark:text-forest-300">Export inventory spreadsheets for audits and replenishment cycles</p>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsList.map((report) => {
          const Icon = report.icon;
          const isCurrentDownloading = downloadingReport === report.id;
          
          return (
            <div key={report.id} className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-250">
              <div>
                <div className="flex items-center space-x-3.5 mb-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${report.iconBg} ${report.iconColor}`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-900 dark:text-white text-base">{report.name}</h3>
                    <span className="text-[10px] bg-forest-100 dark:bg-forest-950 text-forest-750 dark:text-brand-405 border border-brand-500/10 font-bold px-2.5 py-0.5 rounded-full block w-fit mt-0.5">
                      CSV Format (Excel Compatible)
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-500 text-slate-500 dark:text-forest-300 text-sm leading-relaxed mb-6">
                  {report.description}
                </p>

                {/* Show column schema block */}
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-forest-400 uppercase tracking-wider block mb-2">
                    Report Headers Include
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {report.columns.slice(0, 6).map((col, idx) => (
                      <span key={idx} className="bg-forest-50/50 dark:bg-forest-950 border border-brand-500/5 dark:border-forest-850 text-forest-800 dark:text-forest-300 text-[9px] font-semibold px-2 py-0.5 rounded">
                        {col}
                      </span>
                    ))}
                    {report.columns.length > 6 && (
                      <span className="text-[9px] text-slate-400 dark:text-forest-400 font-bold px-2 py-0.5">
                        +{report.columns.length - 6} more columns
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Trigger */}
              <button
                onClick={() => handleExport(report.endpoint, report.id)}
                disabled={downloadingReport !== null}
                className="w-full py-3 rounded-2xl border border-forest-200 dark:border-forest-850 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 text-forest-900 dark:text-forest-300 hover:text-brand-600 dark:hover:text-brand-400 font-bold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isCurrentDownloading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin text-brand-500" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Spreadsheet</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Audit note info block */}
      <div className="glass-panel p-5 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 bg-forest-50/20 dark:bg-forest-950/20 flex items-start space-x-3.5">
        <CheckCircle className="w-6 h-6 text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-forest-900 dark:text-white text-sm">Automated Inventory Logs Verification</h4>
          <p className="text-slate-500 text-slate-500 dark:text-forest-350 text-xs mt-1 leading-relaxed">
            All spreadsheet exports query direct transactional logs from the SQLite database. Valuation is compiled based on active SKU stock equations. Excel handles the CSV file standard seamlessly upon double-clicking.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Reports;
