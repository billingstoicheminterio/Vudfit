import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { formatISTDateTime } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ScanLine,
  PlusCircle,
  Truck,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Layers,
  Camera,
  Trash2
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

const Inward = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  // Search & Match state for the scanner input
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Batch list items state
  const [batchItems, setBatchItems] = useState([]);

  // Shipment / Invoice common details
  const [suppliers, setSuppliers] = useState([]);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [batchRemarks, setBatchRemarks] = useState('');

  // Shipment Photo State
  const [shipmentImageFile, setShipmentImageFile] = useState(null);
  const [shipmentImagePreview, setShipmentImagePreview] = useState('');
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  // Camera Stream references
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraTarget, setCameraTarget] = useState('shipment'); // 'shipment' or product.id (for catalog photo upload)
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Helper to resolve backend uploads URL
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendBase = api.defaults.baseURL.replace('/api', '');
    return `${backendBase}${url}`;
  };

  const startCamera = async (target = 'shipment') => {
    setCameraError('');
    setCameraTarget(target);
    setIsCameraActive(true);
    
    if (target === 'shipment') {
      setShipmentImagePreview('');
      setShipmentImageFile(null);
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError("Failed to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = Date.now();
            if (cameraTarget === 'shipment') {
              const fileName = `shipment_${timestamp}.jpg`;
              const file = new File([blob], fileName, { type: 'image/jpeg' });
              setShipmentImageFile(file);
              setShipmentImagePreview(URL.createObjectURL(blob));
            } else {
              const targetProductId = cameraTarget;
              const fileName = `catalog_${targetProductId}_${timestamp}.jpg`;
              const file = new File([blob], fileName, { type: 'image/jpeg' });
              
              setBatchItems(prev => prev.map(item => {
                if (item.product.id === targetProductId) {
                  return {
                    ...item,
                    imageFile: file,
                    imagePreview: URL.createObjectURL(blob)
                  };
                }
                return item;
              }));
            }
            stopCamera();
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const handleClearShipmentImage = () => {
    setShipmentImageFile(null);
    setShipmentImagePreview('');
    stopCamera();
  };

  const handleRemoveItemImage = (productId) => {
    setBatchItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          imageFile: null,
          imagePreview: ''
        };
      }
      return item;
    }));
  };

  // Status & lists
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [recentInwards, setRecentInwards] = useState([]);
  
  // Element references for auto-focus control
  const searchInputRef = useRef(null);

  // Load recent inwards
  const loadRecentInwards = async () => {
    try {
      const res = await api.get('/transactions?type=inward');
      setRecentInwards(res.data.slice(0, 5)); // Keep last 5
    } catch (e) {
      console.error(e);
    }
  };

  const loadSuppliersList = async () => {
    try {
      const res = await api.get('/suppliers');
      const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(sorted);
    } catch (e) {
      console.error("Failed to load suppliers list", e);
    }
  };

  useEffect(() => {
    loadRecentInwards();
    loadSuppliersList();
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 200);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Listen for Enter or Tab key on search (Mimics USB Scanner)
  const handleQueryKeyDown = async (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      let code = e.target.value.trim();
      if (!code) return;
      
      // If the scanned code is a URL, parse out the last path segment (ID or SKU)
      if (code.includes('/')) {
        const parts = code.split('/').filter(p => p.trim());
        if (parts.length > 0) {
          code = parts[parts.length - 1];
        }
      }
      
      // Clear the input box immediately to keep it ready for the next scan
      e.target.value = '';
      
      // Delay the lookup by 50ms to allow the browser to complete the keyup cycle natively
      setTimeout(() => {
        triggerProductLookup(code);
      }, 50);
    }
  };

  const playScanBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (err) {
      // Audio context not available or user blocked audio
    }
  };

  const triggerProductLookup = async (code) => {
    setSearching(true);
    setSearchError('');
    setSubmitSuccess('');
    
    try {
      const response = await api.get(`/products/${code}`);
      const foundProduct = response.data;
      playScanBeep();
      
      setBatchItems(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === foundProduct.id);
        if (existingIndex > -1) {
          const copy = [...prev];
          const currentQty = parseFloat(copy[existingIndex].quantity) || 0;
          copy[existingIndex].quantity = currentQty + 1;
          return copy;
        } else {
          return [
            ...prev,
            {
              id: foundProduct.id,
              product: foundProduct,
              quantity: 1,
              remarks: '',
              imageFile: null,
              imagePreview: ''
            }
          ];
        }
      });
      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
    } catch (error) {
      setSearchError('No matching product found. Try typing SKU or scan barcode again.');
    } finally {
      setSearching(false);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
  };

  const handleUpdateBatchQty = (productId, newQtyStr) => {
    const qty = parseFloat(newQtyStr);
    setBatchItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: isNaN(qty) ? '' : qty
        };
      }
      return item;
    }));
  };

  const handleUpdateBatchRemarks = (productId, newRemarks) => {
    setBatchItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          remarks: newRemarks
        };
      }
      return item;
    }));
  };

  const handleRemoveFromBatch = (productId) => {
    setBatchItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (batchItems.length === 0) {
      setSubmitError('Please add at least one product to the batch.');
      return;
    }

    // Verify all batch items have valid quantities
    for (const item of batchItems) {
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        setSubmitError(`Invalid quantity for product "${item.product.name}". Must be greater than zero.`);
        return;
      }
    }

    if (!shipmentImageFile) {
      setSubmitError('Shipment/Invoice photo is compulsory. Please capture a live photo.');
      return;
    }
    setSubmitLoading(true);
    try {
      // 1. Upload catalog images for products that don't have them yet and had a photo captured in the list
      for (const item of batchItems) {
        if (!item.product.image_url && item.imageFile) {
          const formData = new FormData();
          formData.append('file', item.imageFile);
          await api.post(`/products/${item.product.id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      // 2. Upload overall shipment image
      const imageFormData = new FormData();
      imageFormData.append('file', shipmentImageFile);
      const imageRes = await api.post('/transactions/upload-image', imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const txImageUrl = imageRes.data.image_url;

      // 3. Post bulk transaction
      const payload = {
        supplier_name: supplierName.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        remarks: batchRemarks.trim() || null,
        image_url: txImageUrl,
        items: batchItems.map(item => ({
          product_barcode_or_sku: item.product.sku,
          quantity: item.quantity,
          remarks: item.remarks || null
        }))
      };

      await api.post('/transactions/inward/bulk', payload);
      
      setSubmitSuccess(`Stock added successfully! Batch of ${batchItems.length} items recorded.`);
      
      // Reset Page
      setBatchItems([]);
      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
      setSupplierName('');
      setInvoiceNumber('');
      setBatchRemarks('');
      setShipmentImageFile(null);
      setShipmentImagePreview('');
      stopCamera();
      
      loadRecentInwards();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (error) {
      setSubmitError(error.response?.data?.detail || "Failed to record bulk inward transaction.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold font-luxury-title tracking-wide text-forest-900 dark:text-white">
          {isStaff ? "📥 Receive Materials (Inward)" : "Material Inward"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-forest-300 font-medium tracking-wide">
          {isStaff 
            ? "Scan new items arriving from suppliers and save them to the warehouse stock." 
            : "Receive and inspect premium materials & furniture hardware into central warehouse stock"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Scanner, Matched Card, Batch List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Scan Barcode / Lookup */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 wood-accent-top shadow-premium dark:shadow-premium-dark">
            {isStaff && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm font-black flex items-center space-x-2.5 animate-pulse shadow-md">
                <span className="text-lg">👉</span>
                <span>STEP 1: CLICK IN THE BOX BELOW AND SCAN THE BARCODE ON THE BOX</span>
              </div>
            )}
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center space-x-2">
              <ScanLine className="w-4 h-4 text-brand-500" />
              <span>{isStaff ? "Step 1: Scan / Search Box" : "Step 1: Scan Barcode or Lookup"}</span>
            </h3>

            <div className="space-y-4">
              <div className="relative rounded-xl focus-within:ring-2 focus-within:ring-brand-500/30 transition-all scanner-focus-ring">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 dark:text-forest-400 pointer-events-none" />
                <input
                  type="text"
                  ref={searchInputRef}
                  onKeyDown={handleQueryKeyDown}
                  placeholder={isStaff ? "Scan box sticker or type item name here..." : "Scan product barcode or type SKU and press Enter..."}
                  className={`w-full pl-11 pr-24 py-3.5 bg-white/50 dark:bg-forest-900/30 border rounded-xl focus:outline-none text-sm dark:text-white ${
                    isStaff ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base py-4" : "border-forest-200 dark:border-forest-800"
                  }`}
                />
                <div className="absolute right-3.5 top-3.5 flex items-center space-x-2 text-slate-400 dark:text-forest-400">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                  <span className="font-mono text-[9px] font-bold tracking-wider hidden sm:inline">[SCAN READY]</span>
                </div>
              </div>

              {isStaff && (
                <p className="text-[11px] text-slate-500 dark:text-forest-400 font-bold italic mt-1">
                  💡 Hint: If the barcode scanner is not working, you can type the item name or SKU code inside the box and press Enter on your keyboard.
                </p>
              )}

              {searching && (
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-forest-300">
                  <Loader className="w-4 h-4 animate-spin text-brand-500" />
                  <span>Searching material database...</span>
                </div>
              )}

              {searchError && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-200/20 dark:border-amber-900/50 text-amber-500 dark:text-amber-400 text-xs flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}


            </div>
          </div>

          {/* Batch List Section */}
          {batchItems.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 shadow-premium dark:shadow-premium-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Items in Current Batch ({batchItems.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setBatchItems([])}
                  className="text-xs text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer"
                >
                  Clear Batch
                </button>
                           {/* Desktop view table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-forest-100 dark:border-forest-900/60 text-slate-500 dark:text-forest-400">
                      <th className="py-2.5 font-semibold">Product Details</th>
                      <th className="py-2.5 font-semibold w-24">Qty</th>
                      <th className="py-2.5 font-semibold">Remarks</th>
                      <th className="py-2.5 font-semibold w-28">Catalog Photo</th>
                      <th className="py-2.5 font-semibold w-12 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100 dark:divide-forest-900/40">
                    {batchItems.map((item) => (
                      <tr key={item.product.id} className="align-middle animate-row-fade">
                        {/* Name & SKU */}
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded bg-brand-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product.image_url ? (
                                <img src={getProductImageUrl(item.product.image_url)} alt="p" className="w-full h-full object-cover" />
                              ) : item.imagePreview ? (
                                <img src={item.imagePreview} alt="p" className="w-full h-full object-cover" />
                              ) : (
                                <Layers className="w-4 h-4 text-brand-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-forest-900 dark:text-white leading-tight">{item.product.name}</p>
                              <span className="font-mono text-[9px] text-slate-400 dark:text-forest-400">{item.product.sku}</span>
                            </div>
                          </div>
                        </td>
                        {/* Quantity Inline Input */}
                        <td className="py-3">
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateBatchQty(item.product.id, e.target.value)}
                              className="w-16 px-1.5 py-1 bg-white/70 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded font-bold text-center focus:outline-none focus:border-brand-500"
                            />
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.product.unit}</span>
                          </div>
                        </td>
                        {/* Remarks Inline Input */}
                        <td className="py-3 pr-2">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={item.remarks}
                            onChange={(e) => handleUpdateBatchRemarks(item.product.id, e.target.value)}
                            className="w-full px-2 py-1 bg-transparent border-b border-transparent hover:border-forest-200 dark:hover:border-forest-850 focus:border-brand-500 focus:outline-none focus:bg-white/40 dark:focus:bg-forest-950/40 rounded transition-all"
                          />
                        </td>
                        {/* Product Catalog Image Capture (Only shown if missing in DB) */}
                        <td className="py-3">
                          {item.product.image_url ? (
                            <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">In Catalog</span>
                          ) : item.imagePreview ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] text-slate-500 truncate max-w-16 font-semibold">Captured</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItemImage(item.product.id)}
                                className="text-[10px] text-red-500 font-bold hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startCamera(item.product.id)}
                              className="px-2 py-1 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded text-[10px] font-bold hover:border-brand-500/50 flex items-center space-x-1"
                            >
                              <Camera className="w-3 h-3 text-brand-500" />
                              <span>Take Photo</span>
                            </button>
                          )}
                        </td>
                        {/* Delete Row */}
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromBatch(item.product.id)}
                            className="text-slate-400 hover:text-red-500 transition-all cursor-pointer p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view cards */}
              <div className="block md:hidden space-y-4">
                {batchItems.map((item) => (
                  <div key={item.product.id} className="p-4 rounded-2xl bg-white/40 dark:bg-forest-950/20 border border-forest-100 dark:border-forest-900/60 space-y-3.5 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-brand-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <img src={getProductImageUrl(item.product.image_url)} alt="p" className="w-full h-full object-cover" />
                        ) : item.imagePreview ? (
                          <img src={item.imagePreview} alt="p" className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-5 h-5 text-brand-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-forest-900 dark:text-white leading-tight truncate">{item.product.name}</p>
                        <span className="font-mono text-[10px] text-slate-405 dark:text-forest-400">{item.product.sku}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromBatch(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-forest-400 mb-1">Inward Qty ({item.product.unit})</label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateBatchQty(item.product.id, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white/70 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded font-bold focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-forest-400 mb-1">Catalog Image</label>
                        {item.product.image_url ? (
                          <span className="inline-block px-2.5 py-1.5 text-[10px] text-green-500 bg-green-500/10 rounded-lg font-bold border border-green-500/20 w-full text-center">In Catalog</span>
                        ) : item.imagePreview ? (
                          <div className="flex items-center justify-between bg-forest-50/50 dark:bg-forest-950/50 border border-brand-500/25 px-2 py-1 rounded-lg">
                            <span className="text-[9px] text-slate-500 truncate font-semibold">Captured</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemImage(item.product.id)}
                              className="text-[10px] text-red-500 font-bold hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startCamera(item.product.id)}
                            className="w-full py-1.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded text-[10px] font-bold hover:border-brand-500/50 flex items-center justify-center space-x-1.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-brand-500" />
                            <span>Take Photo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-forest-400 mb-1">Item Remarks</label>
                      <input
                        type="text"
                        placeholder="Add item remarks..."
                        value={item.remarks}
                        onChange={(e) => handleUpdateBatchRemarks(item.product.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/70 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}
              </div>   </div>
            </div>
          )}
        </div>

        {/* Right Section: Batch Details Submit Form & Today's Logs */}
        <div className="space-y-6">
          
          {/* Step 2: Submit Batch Card */}
          <div className={`glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 shadow-premium dark:shadow-premium-dark transition-all duration-350 ${
            batchItems.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-brand-500" />
              <span>{isStaff ? "Step 2: Supplier & Bill Details" : "Step 2: Dispatch / Invoice Details"}</span>
            </h3>

            {submitSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-200/20 dark:border-green-900/50 text-green-600 dark:text-green-400 text-sm flex items-center space-x-2.5">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-200/20 dark:border-red-900/50 text-red-500 dark:text-red-400 text-sm flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  {isStaff ? "Supplier Name (Who sent these materials?)" : "Supplier Name"}
                </label>
                <SearchableSelect
                  value={supplierName}
                  onChange={(val) => setSupplierName(val)}
                  placeholder={isStaff ? "Tap to choose supplier..." : "Search or select supplier..."}
                  options={suppliers.map((s) => ({ value: s.name, label: s.name }))}
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  {isStaff ? "Bill / Invoice Number (Write if on paper, or leave empty)" : "Invoice Number"}
                </label>
                <input
                  type="text"
                  placeholder={isStaff ? "e.g. Bill Number 123" : "e.g. INV-2026-904"}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-mono"
                />
              </div>

              {/* Batch Remarks */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  {isStaff ? "Any Comments / Notes (Optional)" : "Common Batch Remarks"}
                </label>
                <textarea
                  placeholder={isStaff ? "Write any notes about the box or transport here..." : "e.g. Bulk monthly replenishment cargo received"}
                  value={batchRemarks}
                  rows={2}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Compulsory Camera Photo block */}
              <div className="border-t border-forest-100 dark:border-forest-900/60 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-2">
                  Shipment Photo (Invoice/Cargo) <span className="text-red-500 font-bold">*</span>
                </label>

                {cameraError && (
                  <div className="mb-3 p-3.5 rounded-xl bg-red-500/10 border border-red-200/20 text-red-500 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="w-full h-44 rounded-xl bg-forest-50/50 dark:bg-forest-950/50 border border-brand-500/15 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {isCameraActive && cameraTarget === 'shipment' ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : shipmentImagePreview ? (
                      <img src={shipmentImagePreview} alt="Captured shipment" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Layers className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] text-slate-405 font-bold block uppercase tracking-wider">No Photo Captured</span>
                        <span className="text-[9px] text-red-500 block mt-0.5 font-semibold">* Compulsory shipment audit</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {isCameraActive && cameraTarget === 'shipment' ? (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-forest-950 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3.5 py-2 bg-forest-200 dark:bg-forest-900 border border-forest-300 dark:border-forest-800 text-forest-800 dark:text-forest-300 rounded-lg text-xs font-bold hover:bg-forest-300 dark:hover:bg-forest-805 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startCamera('shipment')}
                          className="px-3 py-2 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-850 rounded-lg text-xs font-bold hover:border-brand-500/50 text-forest-800 dark:text-forest-300 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-brand-500" />
                          <span>{shipmentImagePreview ? 'Retake Photo' : 'Capture Cargo Photo'}</span>
                        </button>
                        {shipmentImagePreview && (
                          <button
                            type="button"
                            onClick={handleClearShipmentImage}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Camera Modal Overlay for product item capture (if camera target is a product ID) */}
              {isCameraActive && cameraTarget !== 'shipment' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-forest-950 border border-brand-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                    <h4 className="font-bold text-forest-900 dark:text-white text-sm mb-4">Capture Catalog Photo</h4>
                    <div className="w-full h-64 bg-black rounded-xl overflow-hidden mb-4 border border-brand-500/15">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex space-x-3 justify-end">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-forest-200 dark:bg-forest-900 border border-forest-300 dark:border-forest-800 text-forest-800 dark:text-forest-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-forest-950 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Capture & Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitLoading || batchItems.length === 0}
                className={`w-full flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.01] transition-all cursor-pointer border ${
                  isStaff 
                    ? "bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/40 text-white border-emerald-500/20 text-base py-4"
                    : "bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/40 text-forest-950 border-brand-500/20"
                }`}
              >
                {submitLoading ? (
                  <>
                    <Loader className={`w-4 h-4 animate-spin ${isStaff ? "text-white" : "text-forest-950"}`} />
                    <span>{isStaff ? "Saving Items..." : "Processing Inward Batch..."}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className={`w-4.5 h-4.5 ${isStaff ? "text-white" : "text-forest-950"}`} />
                    <span>{isStaff ? "📥 Save and Put in Warehouse (Receive Items)" : `Post Inward Batch (${batchItems.reduce((acc, it) => acc + (typeof it.quantity === 'number' ? 1 : 0), 0)} Items)`}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Today's Inward Log */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 wood-accent-top shadow-premium dark:shadow-premium-dark">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center space-x-2">
              <Truck className="w-4.5 h-4.5 text-brand-500" />
              <span>Today's Inward Receipts</span>
            </h3>

            <div className="divide-y divide-forest-100 dark:divide-forest-900/60 max-h-[22rem] overflow-y-auto pr-1">
              {recentInwards.length > 0 ? (
                recentInwards.map((item) => (
                  <div key={item.id} className="py-3.5">
                    <p className="font-bold text-forest-900 dark:text-white text-sm">{item.product_name}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-forest-400 mt-1">
                      <span>Qty: <strong className="text-forest-900 dark:text-white">{item.quantity} {item.unit || 'pcs'}</strong></span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-405 bg-forest-100 dark:bg-forest-950 px-1 py-0.5 rounded text-[10px]">{item.product_sku}</span>
                    </div>
                    {item.supplier_name && (
                      <p className="text-[10px] text-slate-400 dark:text-forest-400 mt-1 font-semibold truncate">Supplier: {item.supplier_name}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-400 dark:text-forest-500 font-semibold">
                        {formatISTDateTime(item.timestamp).time}
                      </span>
                      {item.image_url && (
                        <button
                          type="button"
                          onClick={() => setActivePhotoUrl(getProductImageUrl(item.image_url))}
                          className="inline-flex items-center space-x-1 text-[10px] text-brand-600 hover:text-brand-500 dark:text-brand-405 dark:hover:text-brand-305 font-bold bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-brand-500" />
                          <span>View Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 dark:text-forest-400 text-xs">
                  No material received today yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/80 backdrop-blur-md fade-in p-4">
          <div className="relative max-w-3xl w-full bg-white dark:bg-forest-900 rounded-3xl overflow-hidden shadow-2xl border border-brand-500/20">
            <div className="p-4 border-b border-forest-100 dark:border-forest-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-forest-900 dark:text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-brand-500" />
                <span>Inward Cargo / Invoice Proof Photo</span>
              </h4>
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/90 max-h-[70vh] overflow-hidden">
              <img
                src={activePhotoUrl}
                alt="Inward Proof Photo"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-forest-50 dark:bg-forest-950 flex justify-end">
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-forest-950 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inward;
