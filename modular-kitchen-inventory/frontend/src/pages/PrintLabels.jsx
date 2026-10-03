import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer, Copy, Grid, Loader, AlertCircle } from 'lucide-react';

const PrintLabels = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Print customization state
  const [copies, setCopies] = useState(1);
  const [layoutCols, setLayoutCols] = useState(3); // 1, 2, 3, 4 columns

  useEffect(() => {
    const fetchProducts = async () => {
      const skusParam = searchParams.get('skus');
      const skuParam = searchParams.get('sku');
      
      let skus = [];
      if (skusParam) {
        skus = skusParam.split(',').map(s => s.trim()).filter(Boolean);
      } else if (skuParam) {
        skus = [skuParam.trim()];
      }

      if (skus.length === 0) {
        setError('No product SKUs provided for label generation.');
        setLoading(false);
        return;
      }

      try {
        const promises = skus.map(sku => api.get(`/products/${sku}`));
        const responses = await Promise.all(promises);
        setProductsList(responses.map(res => res.data));
      } catch (err) {
        setError('Failed to fetch details for some products. Verify that the SKUs exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    if (!loading && productsList.length > 0) {
      const auto = searchParams.get('autoprint');
      if (auto === 'true') {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, productsList, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || productsList.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 glass-panel border-red-500/25 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg text-forest-900 dark:text-white">Label Generator Error</h3>
        <p className="text-slate-500 text-slate-500 dark:text-forest-300 text-sm">{error}</p>
        <button
          onClick={() => navigate(isStaff ? '/inventory' : '/products')}
          className="px-4 py-2 bg-brand-500 text-forest-950 rounded-xl text-sm font-bold cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Control Block (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest-100 dark:border-forest-900 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(isStaff ? '/inventory' : '/products')}
            className="p-2.5 rounded-xl border border-forest-200 dark:border-forest-900 hover:bg-forest-100 dark:hover:bg-forest-900/50 text-slate-500 dark:text-forest-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-forest-900 dark:text-white font-sans">Barcode Label Sheets</h1>
            <p className="text-sm text-slate-500 text-slate-500 dark:text-forest-300 dark:text-forest-300">Generate and print Code128 sheets for selected Vudfit catalog items</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold text-sm shadow-lg shadow-brand-500/10 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Printer className="w-5 h-5 text-forest-950" />
          <span>Print Labels Sheet</span>
        </button>
      </div>

      {/* 2. Customization Options Grid (Hidden during print) */}
      <div className="no-print glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Selection details */}
        <div className="border-r border-forest-100 dark:border-forest-900 pr-6 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider">Active Batch Selection</span>
          <h4 className="font-bold text-forest-900 dark:text-white mt-1">{productsList.length} unique material(s) loaded</h4>
          <p className="text-xs text-slate-500 dark:text-forest-300 mt-1 max-h-12 overflow-y-auto font-mono">
            {productsList.map(p => p.sku).join(', ')}
          </p>
        </div>

        {/* Copies selector */}
        <div className="flex flex-col justify-center">
          <label className="text-xs font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Copy className="w-3.5 h-3.5" />
            <span>Copies per Material</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold dark:text-white"
            />
            <span className="text-xs text-slate-400 dark:text-forest-400">labels each</span>
          </div>
        </div>

        {/* Columns Grid Layout selector */}
        <div className="flex flex-col justify-center">
          <label className="text-xs font-semibold text-slate-400 dark:text-forest-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Grid className="w-3.5 h-3.5" />
            <span>Sheet Columns Layout</span>
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4].map((colNum) => (
              <button
                key={colNum}
                onClick={() => setLayoutCols(colNum)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  layoutCols === colNum
                    ? 'bg-brand-500 border-brand-500 text-forest-950 shadow-sm'
                    : 'border-forest-200 dark:border-forest-800 text-slate-500 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-950'
                }`}
              >
                {colNum} {colNum === 1 ? 'Col' : 'Cols'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. PRINT AREA (Renders grid of barcodes) */}
      <div className="print-area bg-white p-4 dark:bg-slate-900/10 rounded-3xl border border-dashed border-forest-200 dark:border-forest-900 shadow-inner">
        
        <div className="no-print text-center py-2 mb-4 bg-forest-50/50 dark:bg-forest-950/20 rounded-xl border border-brand-500/5">
          <span className="text-xs text-slate-500 dark:text-forest-400 italic">Print Preview (Selected items will repeat to fit dynamically on label sheets)</span>
        </div>

        <div className="preview-barcode-grid">
          {productsList.flatMap((product) => 
            Array.from({ length: copies }).map((_, index) => (
              <div
                key={`${product.sku}-${index}`}
                className="bg-white text-slate-900 border border-slate-350 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-xs page-break-avoid w-full max-w-[280px] mx-auto min-h-[160px]"
              >
                {/* Card Label Header */}
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2.5">
                  <span className="text-[9px] font-extrabold tracking-widest text-brand-600 uppercase font-sans">VUDFIT</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">{product.category_name}</span>
                </div>
                
                {/* Product Details */}
                <h5 className="text-[11px] font-bold tracking-tight text-slate-850 truncate w-full mb-0.5">{product.name}</h5>
                <p className="text-[9px] text-slate-500 font-semibold mb-0.5">Brand: {product.brand}</p>
                {product.description && (
                  <p className="text-[8.5px] text-slate-550 italic w-full text-center px-1 mb-0.5 line-clamp-1" title={product.description}>
                    {product.description}
                  </p>
                )}
                
                {/* Alphanumeric Barcode CODE128 */}
                <div className="my-1.5 flex items-center justify-center">
                  <Barcode
                    value={String(product.id)}
                    text={product.sku}
                    format="CODE128"
                    width={2.2}
                    height={60}
                    fontSize={11}
                    margin={10}
                    background="#ffffff"
                  />
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Embedded CSS rules for print formatting */}
      <style>{`
        .preview-barcode-grid svg {
          display: block;
          margin: 0 auto;
          max-width: 100% !important;
          height: auto !important;
          shape-rendering: crispEdges !important;
        }
        @media screen {
          .preview-barcode-grid {
            display: grid !important;
            grid-template-columns: repeat(${layoutCols}, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
        }
        
        @media screen and (max-width: 640px) {
          .preview-barcode-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
        
        @media screen and (min-width: 641px) and (max-width: 1024px) {
          .preview-barcode-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media print {
          /* Hide sidebar, header and customization boxes completely */
          .no-print, 
          aside, 
          header, 
          nav, 
          button { 
            display: none !important; 
          }
          
          /* Force print area to take full screen width and remove padding */
          body, .flex-1, main, .print-area {
            background: white !important;
            color: black !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          .print-area {
            display: block !important;
          }
          
          /* Set custom grid cols for label layouts matching preview */
          .print-area > .preview-barcode-grid {
            display: grid !important;
            grid-template-columns: repeat(${layoutCols}, minmax(0, 1fr)) !important;
            gap: 12px !important;
            background: white !important;
          }

          /* Ensure labels are clean and keep margins constant */
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

    </div>
  );
};

export default PrintLabels;
