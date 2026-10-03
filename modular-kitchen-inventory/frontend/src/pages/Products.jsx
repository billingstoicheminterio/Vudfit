import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Printer,
  X,
  AlertTriangle,
  Loader,
  Package,
  Settings,
  Grid,
  List,
  Download,
  Table,
  FileText,
  Camera,
  Ruler
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import Barcode from 'react-barcode';

const parseCSV = (text) => {
  let cleanText = text;
  if (text.startsWith('\ufeff')) {
    cleanText = text.substring(1);
  }
  const lines = cleanText.split('\n');
  if (lines.length === 0) return [];

  // Detect separator: comma, semicolon, or tab
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let separator = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    separator = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    separator = '\t';
  }

  // Extract headers
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by separator, handling potential quotes
    const values = [];
    let currentVal = '';
    let inQuotes = false;
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    // Map headers to values
    const row = {};
    headers.forEach((header, index) => {
      if (header) {
        row[header] = values[index] || '';
      }
    });
    results.push(row);
  }
  return results;
};

const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role permissions
  const canEdit = user?.role === 'admin' || user?.role === 'master';
  const canDelete = user?.role === 'master';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Helper to resolve backend uploads URL
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendBase = api.defaults.baseURL.replace('/api', '');
    return `${backendBase}${url}`;
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Batch Print Selection State
  const [selectedSkus, setSelectedSkus] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Excel Actions States
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelMode, setExcelMode] = useState('add'); // 'add' or 'delete'
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [excelError, setExcelError] = useState('');
  const [excelSuccess, setExcelSuccess] = useState('');
  const [excelSubmitLoading, setExcelSubmitLoading] = useState(false);

  // Purchase Order (PO) Generator States
  const [suppliers, setSuppliers] = useState([]);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNumber, setPoNumber] = useState(`PO-0185/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}`);
  const [poTaxRate, setPoTaxRate] = useState(18); // 18% GST
  const [poOtherCharges, setPoOtherCharges] = useState(0);
  const [poItems, setPoItems] = useState([]);

  // Manage Units Modal States
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [customUnits, setCustomUnits] = useState([]);
  const [newUnitInput, setNewUnitInput] = useState('');

  const standardUnitsList = ['box', 'drum', 'feet', 'kgs', 'mtr', 'nos', 'pair', 'pcs', 'pkt', 'rft', 'set', 'sheet', 'sqf', 'sqm'];

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vudfit_custom_units') || '[]');
      setCustomUnits(stored);
    } catch (e) {
      setCustomUnits([]);
    }
  }, [isUnitsModalOpen]);

  const handleAddCustomUnitInProducts = (e) => {
    e.preventDefault();
    const trimmed = newUnitInput.trim().toLowerCase();
    if (!trimmed) return;

    if (standardUnitsList.includes(trimmed) || customUnits.includes(trimmed)) {
      alert(`Unit '${trimmed}' already exists.`);
      return;
    }

    const updated = [...customUnits, trimmed];
    setCustomUnits(updated);
    localStorage.setItem('vudfit_custom_units', JSON.stringify(updated));
    setNewUnitInput('');
  };

  const handleRemoveCustomUnitInProducts = (unitToRemove) => {
    const updated = customUnits.filter(u => u !== unitToRemove);
    setCustomUnits(updated);
    localStorage.setItem('vudfit_custom_units', JSON.stringify(updated));
  };

  const openPOModal = (itemsToPO = null) => {
    let source = itemsToPO;
    if (!source || !Array.isArray(source) || source.length === 0) {
      const lowStock = (Array.isArray(products) ? products : []).filter(p => p && p.min_stock > 0 && (p.current_stock !== undefined ? p.current_stock : 0) < p.min_stock);
      source = lowStock.length > 0 ? lowStock : (Array.isArray(products) ? products.slice(0, 10) : []);
    }
    
    setPoItems((Array.isArray(source) ? source : []).filter(Boolean).map(p => ({
      product: p,
      reorderQty: Math.max(1, Math.ceil((p.min_stock || 0) - (p.current_stock || 0))),
      unitCost: p.unit_cost || 0
    })));
    setIsPOModalOpen(true);
  };

  const printPurchaseOrderDocument = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the Purchase Order.");
      return;
    }

    const selectedSupplier = suppliers.find(s => String(s.id) === String(poSupplierId)) || {
      name: "M P ASSOCIATES",
      address: "AHMEDABAD",
      contact_person: "—",
      phone: "—",
      email: "—"
    };

    const itemsHtml = poItems.map((item, idx) => {
      const spec = item.product.colour || item.product.color_name || 'Not Applicable';
      const totalVal = (item.reorderQty * item.unitCost) || 0;
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; font-family: monospace; font-weight: bold;">${item.product.sku}</td>
          <td style="padding: 8px; font-weight: 500;">${item.product.name} ${item.product.description ? '- ' + item.product.description : ''}</td>
          <td style="padding: 8px; color: #4b5563;">${spec}</td>
          <td style="padding: 8px; text-align: center;">${item.product.unit || 'pcs'}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${parseFloat(item.reorderQty).toFixed(2)}</td>
          <td style="padding: 8px; text-align: right;">${item.unitCost > 0 ? '₹' + parseFloat(item.unitCost).toFixed(2) : '—'}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${totalVal > 0 ? '₹' + parseFloat(totalVal).toFixed(2) : '—'}</td>
        </tr>
      `;
    }).join('');

    const subtotal = poItems.reduce((sum, item) => sum + (item.reorderQty * item.unitCost), 0);
    const taxAmount = (subtotal * (poTaxRate / 100)) || 0;
    const grandTotal = subtotal + taxAmount + (parseFloat(poOtherCharges) || 0);
    const dateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PURCHASE ORDER - ${poNumber}</title>
          <style>
            @page { size: A4; margin: 0.8cm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
            .top-banner { background-color: #14532D; color: #ffffff; padding: 12px 20px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; border-radius: 4px; }
            .po-title { color: #14532D; font-size: 26px; font-weight: 800; margin: 15px 0 5px 0; letter-spacing: 0.5px; }
            .gold-divider { height: 2px; background-color: #b38e47; margin: 15px 0; }
            .grid-2 { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
            .info-box { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
            .box-title { color: #14532D; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th { background-color: #14532D; color: #ffffff; padding: 8px; font-weight: bold; text-align: left; }
            th.num { text-align: right; }
            .totals-table { width: 280px; margin-left: auto; margin-top: 15px; font-size: 11px; }
            .totals-table td { padding: 4px 8px; }
            .grand-total-row { background-color: #14532D; color: white; font-weight: bold; font-size: 12px; }
            .terms-box { margin-top: 30px; font-size: 10px; color: #4b5563; line-height: 1.5; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sig-line { width: 42%; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="top-banner">STOICHEM INTERIO PRIVATE LIMITED</div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px;">
            <div>
              <div class="po-title">PURCHASE ORDER</div>
              <div style="color: #4b5563; font-size: 11px; line-height: 1.4;">
                Ground Floor, Plot No. 133/1/1, Patel Farm<br/>
                Godhra-Vadodara Road, Popatpura<br/>
                Panchmahals, Gujarat - 389340<br/>
                Tel: +91 9274001800 | billing.stoicheminterio@gmail.com
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; line-height: 1.6;">
              <div><strong>PO Number:</strong> ${poNumber}</div>
              <div><strong>Date Issued:</strong> ${dateFormatted}</div>
              <div><strong>Required By:</strong> —</div>
              <div><strong>Payment Terms:</strong> —</div>
              <div><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Open</span></div>
            </div>
          </div>

          <div class="gold-divider"></div>

          <div class="grid-2">
            <div class="info-box">
              <div class="box-title">VENDOR / SUPPLIER</div>
              <div><strong>Name:</strong> ${selectedSupplier.name || 'M P ASSOCIATES'}</div>
              <div><strong>Contact:</strong> ${selectedSupplier.contact_person || '—'}</div>
              <div><strong>Address:</strong> ${selectedSupplier.address || 'AHMEDABAD'}</div>
              <div><strong>Phone:</strong> ${selectedSupplier.phone || '—'}</div>
              <div><strong>Email:</strong> ${selectedSupplier.email || '—'}</div>
            </div>
            <div class="info-box">
              <div class="box-title">SHIP TO</div>
              <div><strong>Company:</strong> Stoichem Interio Pvt. Ltd.</div>
              <div><strong>Address:</strong> Ground Floor, Plot No. 133/1/1, Patel Farm, Godhra-Vadodara Road, Popatpura, Panchmahals, Gujarat – 389340</div>
              <div><strong>Phone:</strong> +91 9274001800</div>
              <div><strong>Project:</strong> —</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 15%;">Item Code</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 15%;">Specification</th>
                <th style="width: 8%; text-align: center;">UOM</th>
                <th class="num" style="width: 8%;">Qty</th>
                <th class="num" style="width: 7%;">Price</th>
                <th class="num" style="width: 7%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">${subtotal > 0 ? '₹' + subtotal.toFixed(2) : '0.00'}</td>
            </tr>
            <tr>
              <td>Tax Amount (${poTaxRate}%):</td>
              <td style="text-align: right;">${taxAmount > 0 ? '₹' + taxAmount.toFixed(2) : '0.00'}</td>
            </tr>
            <tr>
              <td>Other Charges:</td>
              <td style="text-align: right;">${parseFloat(poOtherCharges || 0).toFixed(2)}</td>
            </tr>
            <tr class="grand-total-row">
              <td>GRAND TOTAL:</td>
              <td style="text-align: right;">${grandTotal > 0 ? '₹' + grandTotal.toFixed(2) : '0.00'}</td>
            </tr>
            <tr>
              <td>Value Received:</td>
              <td style="text-align: right;">0.00</td>
            </tr>
            <tr style="font-weight: bold;">
              <td>Outstanding Value:</td>
              <td style="text-align: right;">${grandTotal > 0 ? '₹' + grandTotal.toFixed(2) : '0.00'}</td>
            </tr>
          </table>

          <div class="terms-box">
            <strong>Terms & Conditions:</strong><br/>
            1. All materials must conform to specifications. Substitutions require written approval.<br/>
            2. Delivery to address specified. Vendor responsible for safe packaging and transit.<br/>
            3. Invoice must reference this PO number. Payment not processed without valid PO reference.
          </div>

          <div class="signatures">
            <div class="sig-line">
              Authorised By — Stoichem Interio<br/>
              Signature & Date: ___________________
            </div>
            <div class="sig-line">
              Vendor Acknowledgement<br/>
              Signature & Date: ___________________
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadPOCSV = () => {
    const headers = ['#', 'Item Code', 'Description', 'Specification', 'UOM', 'Qty', 'Price', 'Total'];
    const rows = poItems.map((item, idx) => {
      const spec = item.product.colour || item.product.color_name || 'Not Applicable';
      const totalVal = (item.reorderQty * item.unitCost) || 0;
      return [
        idx + 1,
        item.product.sku || '',
        item.product.name || '',
        spec,
        item.product.unit || 'pcs',
        item.reorderQty,
        item.unitCost,
        totalVal
      ];
    });

    const escapeCSV = (val) => {
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${poNumber.replace(/\//g, '_')}_PO.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMasterFullBackup = async () => {
    try {
      const response = await api.get('/backup/download', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VUDFIT_Master_Full_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to download master system backup.");
    }
  };

  // Quick photo upload state
  const quickUploadInputRef = React.useRef(null);
  const [quickUploadProductId, setQuickUploadProductId] = useState(null);

  const handleQuickImageUploadTrigger = (productId) => {
    setQuickUploadProductId(productId);
    setTimeout(() => {
      if (quickUploadInputRef.current) {
        quickUploadInputRef.current.click();
      }
    }, 50);
  };

  const handleQuickImageUploadSubmit = async (e) => {
    const file = e.target.files[0];
    if (!file || !quickUploadProductId) return;

    try {
      setLoading(true);
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);

      await api.post(`/products/${quickUploadProductId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Product photograph uploaded successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to upload image.");
    } finally {
      setLoading(false);
      setQuickUploadProductId(null);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleExcelFileChange = (e) => {
    setExcelError('');
    setExcelSuccess('');
    setExcelData([]);

    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setExcelError("Please upload an Excel-compatible CSV file.");
      return;
    }

    setExcelFile(file);
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setExcelError("The uploaded CSV file is empty or formatted incorrectly.");
          return;
        }
        setExcelData(parsed);
      } catch (err) {
        console.error("CSV parse error", err);
        setExcelError("Failed to parse CSV file. Ensure it uses standard comma separation.");
      }
    };
    reader.readAsText(file);
  };

  const handleBulkAddSubmit = async () => {
    if (excelData.length === 0) return;
    setExcelSubmitLoading(true);
    setExcelError('');
    setExcelSuccess('');

    const payload = excelData.map(row => {
      const findVal = (keys) => {
        const match = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
        return match ? row[match] : undefined;
      };

      const name = findVal(['product name', 'name', 'item name', 'product']);
      const brand = findVal(['brand', 'company', 'make']);
      const cat = findVal(['category', 'category name', 'cat', 'category id']);
      const unit = findVal(['unit', 'unit of measure', 'uom']) || 'pcs';
      const currentStock = parseFloat(findVal(['current stock', 'current_stock', 'initial stock', 'opening stock', 'stock', 'qty', 'quantity'])) || 0;
      const minStock = parseFloat(findVal(['min stock', 'minimum stock', 'min_stock'])) || 0;
      const unitCost = parseFloat(findVal(['unit cost', 'cost', 'price', 'unit_cost'])) || 0;
      const colour = findVal(['colour', 'color']) || 'Not Applicable';
      const desc = findVal(['description', 'desc', 'remarks']);
      const sku = findVal(['sku', 'our code (sku)', 'item code', 'code', 'product code']);

      return {
        name: name || 'Unnamed Material',
        brand: brand || 'Generic',
        category_name: cat || 'Others',
        unit: unit,
        current_stock: currentStock,
        initial_stock: currentStock,
        min_stock: minStock,
        unit_cost: unitCost,
        colour: colour,
        description: desc,
        sku: sku && sku.trim() !== '' ? sku.trim() : undefined
      };
    });

    try {
      const response = await api.post('/products/bulk', payload);
      setExcelSuccess(`Successfully processed ${response.data.length} products! Existing items were updated without duplicates.`);
      setExcelData([]);
      setExcelFile(null);
      setExcelFileName('');
      loadData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || err.toString() || "Failed to bulk import products.";
      setExcelError(errMsg);
    } finally {
      setExcelSubmitLoading(false);
    }
  };

  const downloadInventoryCSV = () => {
    const headers = ['SKU', 'Product Name', 'Brand', 'Category', 'Unit', 'Current Stock', 'Min Stock', 'Unit Cost (₹)', 'Total Stock Value (₹)', 'Colour', 'Description', 'Barcode'];
    let grandTotalStockQty = 0;
    let grandTotalStockValue = 0;

    const rows = products.map(p => {
      const barcodeVal = p.barcode && p.barcode.startsWith('VF-')
        ? p.barcode
        : (p.brand_code && p.category_code && p.color_code && p.global_serial
          ? `VF-${p.brand_code}-${p.category_code}-${p.color_code}-${String(p.global_serial).padStart(6, '0')}`
          : p.barcode || p.sku);

      const currentStock = p.current_stock !== undefined ? p.current_stock : 0;
      const unitCost = p.unit_cost !== undefined ? p.unit_cost : 0;
      const totalVal = currentStock * unitCost;

      grandTotalStockQty += currentStock;
      grandTotalStockValue += totalVal;

      return [
        p.sku || '',
        p.name || '',
        p.brand || '',
        p.category_name || '',
        p.unit || 'pcs',
        currentStock,
        p.min_stock !== undefined ? p.min_stock : 0,
        unitCost,
        totalVal.toFixed(2),
        p.colour || 'Not Applicable',
        p.description || '',
        barcodeVal || ''
      ];
    });

    const summaryRow = ['TOTAL SUMMARY', `${products.length} Products`, '', '', '', grandTotalStockQty, '', 'GRAND TOTAL VALUE:', grandTotalStockValue.toFixed(2), '', '', ''];

    const escapeCSV = (val) => {
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(',')),
      '',
      summaryRow.map(escapeCSV).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vudfit_Current_Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDeleteSubmit = async () => {
    if (excelData.length === 0) return;

    const skus = excelData.map(row => {
      const match = Object.keys(row).find(k => k.toLowerCase().trim() === 'sku');
      return match ? row[match].trim() : undefined;
    }).filter(sku => !!sku);

    if (skus.length === 0) {
      setExcelError("No 'SKU' column found in the CSV file.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete these ${skus.length} products? This action is permanent and deletes all associated transaction histories.`)) {
      return;
    }

    setExcelSubmitLoading(true);
    setExcelError('');
    setExcelSuccess('');

    try {
      const response = await api.post('/products/bulk-delete', { skus });
      setExcelSuccess(`Bulk delete successful! ${response.data.deleted_skus.length} products removed.`);
      setExcelData([]);
      setExcelFile(null);
      setExcelFileName('');
      loadData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || err.toString() || "Failed to bulk delete products.";
      setExcelError(errMsg);
    } finally {
      setExcelSubmitLoading(false);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedSkus.length} selected products? This will also remove all their historical inventory transaction logs!`)) {
      return;
    }

    try {
      const response = await api.post('/products/bulk-delete', { skus: selectedSkus });
      alert(response.data.message || `Successfully deleted ${selectedSkus.length} products!`);
      setSelectedSkus([]);
      loadData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to bulk delete products.");
    }
  };

  const downloadMasterCodeCSV = () => {
    // Generate CSV content for master codes
    const headers = ['Our Code (SKU)', 'Product Name', 'Brand', 'Category', 'Colour', 'Barcode', 'Description / Actual Codes'];
    const rows = products.map(p => {
      // Generate VF- barcode on-the-fly if not already stored as such (fallback for unmigrated live database items)
      const barcodeVal = p.barcode && p.barcode.startsWith('VF-')
        ? p.barcode
        : (p.brand_code && p.category_code && p.color_code && p.global_serial
          ? `VF-${p.brand_code}-${p.category_code}-${p.color_code}-${String(p.global_serial).padStart(6, '0')}`
          : p.barcode || p.sku);

      return [
        p.sku || '',
        p.name || '',
        p.brand || '',
        p.category_name || '',
        p.colour || '',
        barcodeVal || '',
        p.description || ''
      ];
    });

    const escapeCSV = (val) => {
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vudfit_Master_Code_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printMasterCodeSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the master code sheet.");
      return;
    }

    const rowsHtml = products.map((p, idx) => {
      // Generate VF- barcode on-the-fly if not already stored as such
      const barcodeVal = p.barcode && p.barcode.startsWith('VF-')
        ? p.barcode
        : (p.brand_code && p.category_code && p.color_code && p.global_serial
          ? `VF-${p.brand_code}-${p.category_code}-${p.color_code}-${String(p.global_serial).padStart(6, '0')}`
          : p.barcode || p.sku);

      return `
        <tr style="border-bottom: 1px solid #ddd; page-break-inside: avoid;">
          <td style="padding: 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 6px; font-family: monospace; font-weight: bold; color: #b38e47;">${p.sku || ''}</td>
          <td style="padding: 6px; text-align: center; overflow: visible;">
            <svg class="row-barcode" data-value="${p.id}" data-text="${p.sku || ''}" style="display: block; margin: 0 auto;"></svg>
          </td>
          <td style="padding: 6px; font-weight: bold;">${p.name || ''}</td>
          <td style="padding: 6px;">${p.brand || ''}</td>
          <td style="padding: 6px;">${p.category_name || ''}</td>
          <td style="padding: 6px;">${p.colour || ''}</td>
          <td style="padding: 6px; font-size: 11px; color: #555;">${p.description || ''}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>VUDFIT - Master Code Reference Directory</title>
          <style>
            body { font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 20px; }
            h1 { text-align: center; margin-bottom: 5px; color: #0b2316; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; table-layout: fixed; }
            th { background-color: #f1f6f3; color: #2e6246; font-weight: bold; padding: 10px 6px; border-bottom: 2px solid #b38e47; }
            td { word-wrap: break-word; overflow: visible; }
            @media print {
              button { display: none; }
              @page { size: A4; margin: 1.2cm; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0b2316; padding-bottom: 10px;">
            <div>
              <h2 style="margin: 0; color: #0b2316;">VUDFIT</h2>
              <span style="font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Modular Kitchen Catalog</span>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; color: #b38e47;">Master Code Reference Directory</h3>
              <span style="font-size: 11px; color: #888;">Generated on: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <p style="margin-top: 15px; text-align: left; font-size: 11px; font-style: italic; color: #555;">
            Scan the barcodes below using your physical hand scanner to automatically reference and look up items.
          </p>
          <table>
            <thead>
              <tr>
                <th style="width: 4%;">S.No</th>
                <th style="width: 12%; text-align: left;">Our Code (SKU)</th>
                <th style="width: 28%; text-align: center;">Scannable Barcode</th>
                <th style="width: 22%; text-align: left;">Product Name</th>
                <th style="width: 8%; text-align: left;">Brand</th>
                <th style="width: 8%; text-align: left;">Category</th>
                <th style="width: 6%; text-align: left;">Colour</th>
                <th style="width: 12%; text-align: left;">Remarks / Actual Codes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              try {
                var elements = document.querySelectorAll(".row-barcode");
                for (var i = 0; i < elements.length; i++) {
                  var el = elements[i];
                  var val = el.getAttribute("data-value");
                  var txt = el.getAttribute("data-text");
                  JsBarcode(el, val, {
                    format: "CODE128",
                    width: 2.2,
                    height: 50,
                    text: txt,
                    displayValue: true,
                    fontSize: 11,
                    margin: 10
                  });
                }
              } catch(e) {
                console.error("Barcode initialization failed", e);
              }
              
              setTimeout(function() {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadBulkAddTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Product Name,Brand,Category,Unit,Current Stock,Min Stock,Unit Cost,Colour,Description\nPremium Soft Close Hinge,Hafele,Hardware,pcs,50,10,250,Silver,Premium 110 degree soft close hinge\nCommercial Plywood 18mm,Greenply,Plywood,sqft,100,20,95,Natural,18mm commercial grade MR plywood";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vudfit_bulk_add_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBulkDeleteTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,SKU\nVF-HA-HG-SV-000001\nVF-PW-PL-NT-000002";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vudfit_bulk_delete_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Brands Manager Modal State
  const [isBrandsModalOpen, setIsBrandsModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCode, setNewBrandCode] = useState('');
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  const [editingBrandCode, setEditingBrandCode] = useState('');
  const [brandsError, setBrandsError] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formUnitCost, setFormUnitCost] = useState('0');
  const [formColour, setFormColour] = useState('no');
  const [formDescription, setFormDescription] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Color selection state
  const [colorPreset, setColorPreset] = useState('NA');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('');

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(null);

  const openDetailModal = (product) => {
    setDetailedProduct(product);
    setIsDetailModalOpen(true);
  };

  const downloadSVG = (sku) => {
    const svgElement = document.getElementById(`barcode-${sku}`);
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `barcode_${sku}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load products, categories and brands on mount
  const loadData = async () => {
    try {
      const [prodRes, catRes, brandRes, suppRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/suppliers').catch(() => ({ data: [] }))
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : []);
    } catch (error) {
      console.error("Failed to load catalog data", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data);
    } catch (error) {
      console.error("Failed to reload brands list", error);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefreshEvent = () => {
      console.log("Auto-refreshing catalog due to WebSocket event...");
      loadData();
    };

    window.addEventListener('vudfit-refresh-data', handleRefreshEvent);
    return () => {
      window.removeEventListener('vudfit-refresh-data', handleRefreshEvent);
    };
  }, []);

  // Filter products locally with null-safety
  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    if (!p) return false;
    const sTerm = (searchTerm || '').toLowerCase();
    const pName = String(p.name || '').toLowerCase();
    const pSku = String(p.sku || '').toLowerCase();
    const pBarcode = String(p.barcode || '').toLowerCase();
    const pColour = String(p.colour || p.color_name || '').toLowerCase();
    const pBrand = String(p.brand || '').toLowerCase();

    const matchesSearch =
      pName.includes(sTerm) ||
      pSku.includes(sTerm) ||
      pBarcode.includes(sTerm) ||
      pColour.includes(sTerm) ||
      pBrand.includes(sTerm);

    const matchesCategory =
      selectedCategory === '' || (p.category_id && p.category_id === parseInt(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = React.useMemo(() => {
    return (Array.isArray(products) ? products : []).filter(p => p && p.min_stock > 0 && (p.current_stock !== undefined ? p.current_stock : 0) < p.min_stock);
  }, [products]);

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedSkus.includes(p.sku));

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = itemsPerPage === 'all'
    ? filteredProducts
    : filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-forest-100 dark:border-forest-900/40 w-full select-none">
        <div className="text-xs text-slate-400 dark:text-forest-400 font-bold">
          Showing {displayedProducts.length} of {filteredProducts.length} products
        </div>

        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 bg-white/50 dark:bg-forest-900/30 text-forest-750 dark:text-forest-300 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-50 dark:hover:bg-forest-900/50 transition-colors cursor-pointer"
            >
              Previous
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === 1
                    ? 'bg-brand-500 text-forest-950 shadow-sm'
                    : 'border border-forest-200 dark:border-forest-800 text-forest-750 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-900/50'
                    }`}
                >
                  1
                </button>
                {startPage > 2 && <span className="text-slate-400 px-1 text-xs">...</span>}
              </>
            )}

            {pages.map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === p
                  ? 'bg-brand-500 text-forest-950 shadow-sm'
                  : 'border border-forest-200 dark:border-forest-800 text-forest-750 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-900/50'
                  }`}
              >
                {p}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="text-slate-400 px-1 text-xs">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === totalPages
                    ? 'bg-brand-500 text-forest-950 shadow-sm'
                    : 'border border-forest-200 dark:border-forest-800 text-forest-750 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-900/50'
                    }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 bg-white/50 dark:bg-forest-900/30 text-forest-750 dark:text-forest-300 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-50 dark:hover:bg-forest-900/50 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-forest-400">
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              setItemsPerPage(val === 'all' ? 'all' : parseInt(val));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-white/80 dark:bg-forest-900/40 border border-forest-250 dark:border-forest-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 text-xs dark:text-white cursor-pointer"
          >
            <option value={24}>24 items</option>
            <option value={48}>48 items</option>
            <option value={100}>100 items</option>
            <option value="all">All items</option>
          </select>
        </div>
      </div>
    );
  };

  const openAddModal = () => {
    if (!canEdit) return;
    setModalMode('add');
    setFormName('');
    setFormBrand(brands[0]?.name || '');
    setFormCategoryId(categories[0]?.id || '');
    setFormUnit('pcs');
    setFormMinStock('20');
    setFormUnitCost('0');
    setFormColour('no');
    setFormDescription('');
    setFormSku('');
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setColorPreset('NA');
    setCustomColorName('');
    setCustomColorCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    if (!canEdit) return;
    setModalMode('edit');
    setSelectedProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormCategoryId(p.category_id);
    setFormUnit(p.unit);
    setFormMinStock(String(p.min_stock));
    setFormUnitCost(String(p.unit_cost !== undefined ? p.unit_cost : 0));
    setFormColour(p.colour || 'no');
    setFormDescription(p.description || '');
    setFormSku(p.sku);
    setImageFile(null);
    setImagePreview(p.image_url ? getProductImageUrl(p.image_url) : '');
    setFormError('');

    const PRESETS = {
      'BK': 'Black', 'WH': 'White', 'SV': 'Silver', 'GY': 'Grey',
      'GD': 'Gold', 'BR': 'Brown', 'NT': 'Natural', 'NA': 'Not Applicable'
    };
    if (p.color_code && PRESETS[p.color_code]) {
      setColorPreset(p.color_code);
      setCustomColorName('');
      setCustomColorCode('');
    } else if (p.color_code || p.color_name) {
      setColorPreset('custom');
      setCustomColorName(p.color_name || p.colour || '');
      setCustomColorCode(p.color_code || '');
    } else {
      setColorPreset('NA');
      setCustomColorName('');
      setCustomColorCode('');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formBrand.trim() || !formCategoryId || !formUnit.trim()) {
      setFormError('Please fill in all required fields (Name, Brand, Category, Unit).');
      return;
    }

    let payloadColorName = '';
    let payloadColorCode = '';

    if (colorPreset === 'custom') {
      if (!customColorName.trim() || !customColorCode.trim()) {
        setFormError('Please specify both Custom Color Name and 2-Letter Code.');
        return;
      }
      if (customColorCode.trim().length !== 2) {
        setFormError('Custom Color Code must be exactly 2 letters.');
        return;
      }
      payloadColorName = customColorName.trim();
      payloadColorCode = customColorCode.trim().toUpperCase();
    } else {
      const PRESET_NAMES = {
        'BK': 'Black', 'WH': 'White', 'SV': 'Silver', 'GY': 'Grey',
        'GD': 'Gold', 'BR': 'Brown', 'NT': 'Natural', 'NA': 'Not Applicable'
      };
      payloadColorCode = colorPreset;
      payloadColorName = PRESET_NAMES[colorPreset];
    }

    const payload = {
      name: formName.trim(),
      brand: formBrand.trim(),
      category_id: parseInt(formCategoryId),
      unit: formUnit.trim(),
      min_stock: parseFloat(formMinStock) || 0,
      unit_cost: parseFloat(formUnitCost) || 0,
      colour: payloadColorName,
      color_code: payloadColorCode,
      color_name: payloadColorName,
      description: formDescription.trim()
    };

    if (modalMode === 'add') {
      if (formSku.trim()) payload.sku = formSku.trim();
    }

    setSubmitLoading(true);
    try {
      let savedProduct = null;
      if (modalMode === 'add') {
        const res = await api.post('/products', payload);
        savedProduct = res.data;
      } else {
        const res = await api.put(`/products/${selectedProduct.id}`, payload);
        savedProduct = res.data;
      }

      if (imageFile && savedProduct) {
        const formData = new FormData();
        formData.append('file', imageFile);
        await api.post(`/products/${savedProduct.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.detail || "An error occurred while saving.";
      setFormError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!canDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will clear all its transaction history.`)) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || "Delete failed.");
    }
  };

  const handleAddBrandSubmit = async (e) => {
    e.preventDefault();
    setBrandsError('');
    if (!newBrandName.trim()) return;

    try {
      await api.post('/brands', {
        name: newBrandName.trim(),
        code: newBrandCode.trim().toUpperCase() || undefined
      });
      setNewBrandName('');
      setNewBrandCode('');
      loadBrands();
    } catch (error) {
      setBrandsError(error.response?.data?.detail || "Failed to add brand.");
    }
  };

  const handleStartEditBrand = (b) => {
    setEditingBrandId(b.id);
    setEditingBrandName(b.name);
    setEditingBrandCode(b.code || '');
  };

  const handleSaveBrand = async (id) => {
    setBrandsError('');
    if (!editingBrandName.trim()) return;

    try {
      await api.put(`/brands/${id}`, {
        name: editingBrandName.trim(),
        code: editingBrandCode.trim().toUpperCase()
      });
      setEditingBrandId(null);
      loadBrands();
    } catch (error) {
      setBrandsError(error.response?.data?.detail || "Failed to update brand.");
    }
  };

  const handleDeleteBrand = async (id) => {
    setBrandsError('');
    if (!window.confirm("Are you sure you want to delete this brand?")) return;

    try {
      await api.delete(`/brands/${id}`);
      loadBrands();
    } catch (error) {
      setBrandsError(error.response?.data?.detail || "Failed to delete brand.");
    }
  };

  const handleCheckboxChange = (sku, isChecked) => {
    if (isChecked) {
      setSelectedSkus((prev) => [...prev, sku]);
    } else {
      setSelectedSkus((prev) => prev.filter((s) => s !== sku));
    }
  };

  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedSkus((prev) => {
        const newSkus = filteredProducts.map((p) => p.sku);
        return [...new Set([...prev, ...newSkus])];
      });
    } else {
      setSelectedSkus((prev) => {
        const filteredSkusSet = new Set(filteredProducts.map((p) => p.sku));
        return prev.filter((sku) => !filteredSkusSet.has(sku));
      });
    }
  };

  const [viewMode, setViewMode] = useState('grid');

  const getCategoryBadgeClass = (name) => {
    const cat = (name || '').toLowerCase();
    if (cat.includes('adhesive')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
    } else if (cat.includes('hinge') || cat.includes('fitting')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25';
    } else if (cat.includes('sheet') || cat.includes('plywood') || cat.includes('board') || cat.includes('laminate')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
    } else if (cat.includes('handle') || cat.includes('profile') || cat.includes('knob')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25';
    }
    return 'bg-forest-100 dark:bg-forest-950 text-forest-800 dark:text-brand-400 border border-brand-500/10';
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold font-luxury-title tracking-wide text-forest-900 dark:text-white">Product Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-forest-300 font-medium tracking-wide">Manage, inspect, and barcode central materials & fixtures for kitchen sets</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <div className="flex p-1 bg-forest-50 dark:bg-forest-950/60 border border-forest-200 dark:border-forest-800 rounded-xl space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-brand-500 text-forest-950 shadow-sm font-bold'
                : 'text-forest-750 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/40'
                }`}
              title="Card Grid View"
            >
              <Grid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-brand-500 text-forest-950 shadow-sm font-bold'
                : 'text-forest-750 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/40'
                }`}
              title="Detailed List View"
            >
              <List className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'table'
                ? 'bg-brand-500 text-forest-950 shadow-sm font-bold'
                : 'text-forest-750 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/40'
                }`}
              title="Compact Table View"
            >
              <Table className="w-4.5 h-4.5" />
            </button>
          </div>
          <button
            onClick={() => handleSelectAllChange(!allFilteredSelected)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 font-bold text-sm transition-all cursor-pointer"
            title="Select or deselect all items matching current filters"
          >
            <input
              type="checkbox"
              checked={allFilteredSelected}
              readOnly
              className="w-4 h-4 rounded border-forest-350 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white dark:bg-forest-950 cursor-pointer pointer-events-none"
            />
            <span className="hidden sm:inline">Select All</span>
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => openPOModal()}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm transition-all cursor-pointer shadow-sm"
                title="Generate Purchase Order (PO) matching Stoichem Interio template"
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Create Purchase Order (PO)</span>
              </button>
              <button
                onClick={() => setIsBrandsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 font-bold text-sm transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-brand-500" />
                <span>Manage Brands</span>
              </button>
              <button
                onClick={() => setIsUnitsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 hover:bg-forest-50 dark:hover:bg-forest-900/40 text-forest-750 dark:text-forest-300 font-bold text-sm transition-all cursor-pointer"
              >
                <Ruler className="w-4 h-4 text-brand-500" />
                <span>Manage Units</span>
              </button>
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-sm transition-all cursor-pointer"
              >
                <span>Import / Export Excel</span>
              </button>
              <button
                onClick={downloadInventoryCSV}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-sm transition-all cursor-pointer"
                title="Export full product catalog with live stock quantities to CSV"
              >
                <Download className="w-4 h-4 text-brand-500" />
                <span>Export Stock CSV</span>
              </button>
              {canDelete && (
                <>
                  <button
                    onClick={downloadMasterFullBackup}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-sm transition-all cursor-pointer shadow-sm"
                    title="Download complete system backup ZIP containing all database CSVs and uploaded photos"
                  >
                    <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Master Full Backup (.zip)</span>
                  </button>
                  <button
                    onClick={downloadMasterCodeCSV}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-sm transition-all cursor-pointer"
                    title="Download Master Code Mapping Sheet (CSV)"
                  >
                    <Download className="w-4 h-4 text-brand-500" />
                    <span>Download Master Codes</span>
                  </button>
                  <button
                    onClick={printMasterCodeSheet}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-sm transition-all cursor-pointer"
                    title="Print Master Code Reference Directory"
                  >
                    <Printer className="w-4 h-4 text-brand-500" />
                    <span>Print Codes</span>
                  </button>
                </>
              )}
              <button
                onClick={openAddModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold text-sm shadow-lg shadow-brand-500/10 hover:scale-[1.01] transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-forest-950" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 border border-brand-500/10 dark:border-brand-500/15">

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-forest-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Name, SKU, Brand, Colour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm placeholder-slate-400 dark:placeholder-forest-500 dark:text-white"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-56 flex items-center space-x-2.5">
          <SlidersHorizontal className="w-4.5 h-4.5 text-slate-400 dark:text-forest-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Catalog Content */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : viewMode === 'grid' ? (
        filteredProducts.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 fade-in">
              {displayedProducts.map((p) => {
                const isLowStock = p.current_stock <= p.min_stock;
                const isCritical = p.current_stock <= p.min_stock * 0.25 || p.current_stock <= 0;
                const isChecked = selectedSkus.includes(p.sku);

                return (
                  <div key={p.id} className={`glass-panel rounded-3xl overflow-hidden card-hover flex flex-col h-full border ${isChecked ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/5' : 'border-brand-500/10 dark:border-brand-500/15'} relative`}>
                    {/* Top Image area */}
                    <div
                      onClick={() => openDetailModal(p)}
                      className="w-full h-44 bg-forest-50/50 dark:bg-forest-950/45 flex items-center justify-center relative overflow-hidden group border-b border-forest-100 dark:border-forest-900/60 cursor-pointer"
                    >
                      {p.image_url ? (
                        <img src={getProductImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="w-12 h-12 text-slate-400 dark:text-forest-800 opacity-40" />
                          {user?.role === 'master' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickImageUploadTrigger(p.id);
                              }}
                              className="bg-brand-500 hover:bg-brand-600 text-forest-950 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-all hover:scale-105 flex items-center space-x-1"
                            >
                              <Camera className="w-3.5 h-3.5 text-forest-950" />
                              <span>Add Photo</span>
                            </button>
                          )}
                        </div>
                      )}
                      {/* Floating SKU */}
                      <span className="absolute top-3 left-3 bg-forest-900/85 text-brand-400 border border-brand-500/25 px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold tracking-wider">{p.sku}</span>

                      {/* Floating Print Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(p.sku, e.target.checked);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-lg border-forest-350 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white/95 dark:bg-forest-950/95 cursor-pointer shadow"
                      />
                    </div>

                    {/* Content Area */}
                    <div
                      onClick={() => openDetailModal(p)}
                      className="p-5 flex-grow flex flex-col justify-between space-y-4 cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getCategoryBadgeClass(p.category_name)}`}>
                            {p.category_name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 dark:text-forest-400">{p.brand}</span>
                        </div>

                        <h4 className="font-bold text-base text-forest-900 dark:text-white line-clamp-1" title={p.name}>{p.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-forest-400 line-clamp-2 min-h-[2rem]" title={p.description}>{p.description || 'No description provided.'}</p>
                      </div>

                      <div className="pt-4 border-t border-forest-100 dark:border-forest-900/40 space-y-3">
                        {/* Color Details */}
                        {p.colour && p.colour !== 'no' && (
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Colour:</span>
                            <span className="capitalize dark:text-white bg-forest-50 dark:bg-forest-900 px-2 py-0.5 rounded border border-forest-100 dark:border-forest-800">{p.colour}</span>
                          </div>
                        )}

                        {/* Stock Levels progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">Stock Status:</span>
                            <span className={`${isCritical ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-green-500'}`}>
                              {p.current_stock} / {p.min_stock} {p.unit}
                            </span>
                          </div>
                          <div className="w-full bg-forest-100 dark:bg-forest-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, (p.current_stock / Math.max(1, p.min_stock)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Actions button group */}
                        <div className="flex items-center justify-end space-x-1.5 pt-2">
                          <button
                            onClick={() => navigate(`/print-labels?sku=${p.sku}`)}
                            title="Print Barcode Label"
                            className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit Product"
                              className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Delete Product"
                              className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {renderPagination()}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center text-slate-400 dark:text-forest-500 border border-brand-500/10 rounded-3xl">
            <Package className="w-12 h-12 text-slate-350 dark:text-forest-850 mx-auto mb-3 opacity-55" />
            <p className="text-sm font-bold">No products found matching filters.</p>
          </div>
        )
      ) : viewMode === 'list' ? (
        filteredProducts.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col space-y-4 fade-in">
              {displayedProducts.map((p) => {
                const isLowStock = p.current_stock <= p.min_stock;
                const isCritical = p.current_stock <= p.min_stock * 0.25 || p.current_stock <= 0;
                const isChecked = selectedSkus.includes(p.sku);

                return (
                  <div key={p.id} className={`glass-panel rounded-2xl overflow-hidden card-hover flex items-center p-4 border ${isChecked ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/5' : 'border-brand-500/10 dark:border-brand-500/15'} relative gap-6`}>
                    {/* Left Thumbnail area */}
                    <div
                      onClick={() => openDetailModal(p)}
                      className="w-20 h-20 bg-forest-50/50 dark:bg-forest-950/45 flex items-center justify-center relative overflow-hidden group border border-forest-100 dark:border-forest-900/60 cursor-pointer rounded-xl flex-shrink-0"
                    >
                      {p.image_url ? (
                        <img src={getProductImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400 dark:text-forest-800 opacity-40" />
                      )}
                    </div>

                    {/* Middle Info Area */}
                    <div
                      onClick={() => openDetailModal(p)}
                      className="flex-grow min-w-0 cursor-pointer py-1"
                    >
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                        <span className="bg-forest-900/85 text-brand-400 border border-brand-500/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">{p.sku}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${getCategoryBadgeClass(p.category_name)}`}>
                          {p.category_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-forest-400">{p.brand}</span>
                      </div>

                      <h4 className="font-bold text-base text-forest-900 dark:text-white line-clamp-1" title={p.name}>{p.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-forest-400 line-clamp-1 mt-0.5" title={p.description}>{p.description || 'No description provided.'}</p>

                      {p.colour && p.colour !== 'no' && (
                        <div className="flex items-center mt-1.5 text-[10px] font-bold text-slate-400">
                          <span>Colour:</span>
                          <span className="capitalize dark:text-white bg-forest-50 dark:bg-forest-900 px-1.5 py-0.5 rounded border border-forest-100 dark:border-forest-800 ml-1.5">{p.colour}</span>
                        </div>
                      )}
                    </div>

                    {/* Stock Level (Right-Center) */}
                    <div className="flex-shrink-0 text-center px-4 min-w-[120px] hidden md:block">
                      <span className={`text-sm font-extrabold ${isCritical ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-green-500'}`}>
                        {p.current_stock} / {p.min_stock} {p.unit}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Stock Level</p>
                      <div className="w-24 bg-forest-100 dark:bg-forest-950 rounded-full h-1.5 overflow-hidden mt-1 mx-auto">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (p.current_stock / Math.max(1, p.min_stock)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Selection Checkbox & Actions (Right) */}
                    <div className="flex items-center space-x-4 flex-shrink-0 pr-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/print-labels?sku=${p.sku}`); }}
                          title="Print Barcode Label"
                          className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                            className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.name); }}
                            className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(p.sku, e.target.checked);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="w-6 h-6 rounded-lg border-forest-350 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white/95 dark:bg-forest-950/95 cursor-pointer shadow"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {renderPagination()}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center text-slate-400 dark:text-forest-500 border border-brand-500/10 rounded-3xl">
            <Package className="w-12 h-12 text-slate-350 dark:text-forest-850 mx-auto mb-3 opacity-55" />
            <p className="text-sm font-bold">No products found matching filters.</p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="glass-panel border border-brand-500/10 dark:border-brand-500/15 rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark wood-accent-top fade-in">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-forest-50/50 dark:bg-forest-950/60 border-b border-forest-100 dark:border-forest-900 text-forest-600 dark:text-forest-300 font-bold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        className="w-6 h-6 rounded-lg border-forest-350 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white dark:bg-forest-950 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Colour</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Min Stock</th>
                    <th className="px-6 py-4 text-center">Current Stock</th>
                    {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-100 dark:divide-forest-900/60">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map((p) => {
                      const isLowStock = p.current_stock <= p.min_stock;
                      const isCritical = p.current_stock <= p.min_stock * 0.25 || p.current_stock <= 0;
                      const isChecked = selectedSkus.includes(p.sku);

                      return (
                        <tr key={p.id} className={`hover:bg-forest-100/30 dark:hover:bg-forest-900/20 transition-colors ${isChecked ? 'bg-brand-500/5 dark:bg-brand-500/5' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(p.sku, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-6 h-6 rounded-lg border-forest-350 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white dark:bg-forest-950 cursor-pointer"
                            />
                          </td>
                          <td onClick={() => openDetailModal(p)} className="px-6 py-4 font-mono font-bold text-xs text-brand-600 dark:text-brand-400 select-all cursor-pointer">{p.sku}</td>
                          <td onClick={() => openDetailModal(p)} className="px-6 py-4 cursor-pointer">
                            <div className="flex items-center space-x-3.5">
                              <div
                                onClick={(e) => {
                                  if (!p.image_url && user?.role === 'master') {
                                    e.stopPropagation();
                                    handleQuickImageUploadTrigger(p.id);
                                  }
                                }}
                                title={!p.image_url && user?.role === 'master' ? "Click to upload photograph" : undefined}
                                className={`w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950 border border-brand-500/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative ${!p.image_url && user?.role === 'master' ? 'cursor-pointer hover:border-brand-500 hover:bg-brand-500/10' : ''
                                  }`}
                              >
                                {p.image_url ? (
                                  <img src={getProductImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                                ) : user?.role === 'master' ? (
                                  <Camera className="w-4 h-4 text-brand-500 animate-pulse" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-forest-900 dark:text-white truncate max-w-[200px]">{p.name}</p>
                                <p className="text-slate-400 dark:text-forest-400 text-xs mt-0.5 truncate max-w-[200px]">{p.description || 'No description'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 dark:bg-forest-900 border border-forest-200 dark:border-forest-800 px-2 py-0.5 rounded font-bold capitalize text-xs">
                              {p.colour || 'no'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{p.brand}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getCategoryBadgeClass(p.category_name)}`}>
                              {p.category_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium">{p.min_stock} <span className="text-[10px] text-slate-400">{p.unit}</span></td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${isCritical
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : isLowStock
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-green-500/10 text-green-500 border-green-500/20'
                              }`}>
                              {p.current_stock} {p.unit}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => navigate(`/print-labels?sku=${p.sku}`)}
                                  title="Print Barcode Label"
                                  className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Printer className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => openEditModal(p)}
                                  title="Edit Product"
                                  className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4.5 h-4.5" />
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    title="Delete Product"
                                    className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={canEdit ? 9 : 8} className="px-6 py-12 text-center text-slate-405 dark:text-forest-500">
                        No matching products found in catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {renderPagination()}
        </div>
      )}

      {/* Floating Printing Action Sheet */}
      {selectedSkus.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-forest-900/95 dark:bg-forest-950/95 border border-brand-500/30 text-white rounded-2xl px-6 py-4 shadow-xl flex items-center space-x-6 backdrop-blur-md animate-zoom-in">
          <span className="text-sm font-bold">
            Selected <span className="text-brand-400 font-extrabold">{selectedSkus.length}</span> items
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/print-labels?skus=${selectedSkus.join(',')}`)}
              className="bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-forest-950" />
              <span>Print Selected Barcodes</span>
            </button>
            {canDelete && (
              <button
                onClick={handleBulkDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              onClick={() => setSelectedSkus([])}
              className="bg-forest-800 hover:bg-forest-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Glassmorphism Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm z-50 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden border border-brand-500/10 dark:border-brand-500/20 shadow-2xl animate-zoom-in h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-forest-50/50 dark:bg-forest-950/50 border-b border-forest-100 dark:border-forest-900 flex items-center justify-between">
              <h3 className="font-bold text-lg text-forest-900 dark:text-white">
                {modalMode === 'add' ? 'Add Material to Catalog' : `Edit: ${formName}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-950 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-4 rounded-xl bg-red-55/10 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-500 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Soft Close Cabinet Hinge 110deg"
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>

                {/* Brand Dropdown selection */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={formBrand}
                    onChange={(val) => setFormBrand(val)}
                    placeholder="Search or select brand..."
                    options={brands.map((b) => ({ value: b.name, label: b.code ? `${b.name} (${b.code})` : b.name }))}
                  />
                </div>

                {/* Category */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={formCategoryId}
                    onChange={(val) => setFormCategoryId(val)}
                    placeholder="Search or select category..."
                    options={categories.map((c) => ({ value: c.id, label: c.code ? `${c.name} (${c.code})` : c.name }))}
                  />
                </div>

                {/* Unit selection */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={formUnit}
                    onChange={(val) => setFormUnit(val)}
                    placeholder="Select unit..."
                    options={(() => {
                      const standardUnits = ['box', 'drum', 'feet', 'kgs', 'mtr', 'nos', 'pair', 'pcs', 'pkt', 'rft', 'set', 'sheet', 'sqf', 'sqm'];
                      let storedCustom = [];
                      try {
                        storedCustom = JSON.parse(localStorage.getItem('vudfit_custom_units') || '[]');
                      } catch (e) {
                        storedCustom = [];
                      }
                      const dbUnits = (products || []).map(p => p.unit).filter(Boolean);
                      const combined = Array.from(new Set([...standardUnits, ...storedCustom, ...dbUnits]));
                      if (formUnit && !combined.includes(formUnit)) {
                        combined.push(formUnit);
                      }
                      combined.sort();
                      return combined.map((u) => ({ value: u, label: u }));
                    })()}
                  />
                </div>

                {/* Minimum Stock */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>

                {/* Unit Cost / Price */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Unit Cost / Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>

                {/* SKU (Optional - Add Mode Only) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    SKU {modalMode === 'add' ? '(Auto if empty)' : '(Read only)'}
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'edit'}
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. MK-HIN-001"
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm disabled:opacity-60 dark:text-white"
                  />
                </div>

                {/* Colour Preset */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Colour Preset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={colorPreset}
                    onChange={(e) => setColorPreset(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-bold"
                  >
                    <option value="NA">Not Applicable (NA)</option>
                    <option value="BK">Black (BK)</option>
                    <option value="WH">White (WH)</option>
                    <option value="SV">Silver (SV)</option>
                    <option value="GY">Grey (GY)</option>
                    <option value="GD">Gold (GD)</option>
                    <option value="BR">Brown (BR)</option>
                    <option value="NT">Natural (NT)</option>
                    <option value="custom">Other (Custom)</option>
                  </select>
                </div>

                {/* Custom Color options */}
                {colorPreset === 'custom' && (
                  <div className="col-span-2 grid grid-cols-2 gap-2.5 animate-zoom-in bg-forest-50/40 dark:bg-forest-950/20 p-3 rounded-2xl border border-forest-150 dark:border-forest-900/60">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                        Color Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        placeholder="e.g. Copper"
                        className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                        Code (2 chars) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={customColorCode}
                        onChange={(e) => setCustomColorCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CP"
                        className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                    Description / Remarks
                  </label>
                  <textarea
                    rows="2"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Add details about product, dimensions, sizes..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>

                {/* Product Catalog Image Upload Block */}
                <div className="col-span-2 border-t border-forest-100 dark:border-forest-900 pt-4 mt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-2">
                    Product Catalog Image
                  </label>
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-2xl bg-forest-50/50 dark:bg-forest-950/50 border border-brand-500/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const compressed = await compressImage(file);
                            setImageFile(compressed);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagePreview(reader.result);
                            };
                            reader.readAsDataURL(compressed);
                          }
                        }}
                        className="text-xs text-forest-800 dark:text-forest-300"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Recommended: Square format ratio image</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-forest-200 dark:border-forest-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 text-slate-500 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-950/50 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/80 text-forest-950 font-bold text-sm shadow-md shadow-brand-500/15 flex items-center space-x-2 cursor-pointer"
                >
                  {submitLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-forest-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Material</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brands Manager Glassmorphism Modal */}
      {isBrandsModalOpen && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm z-50 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-brand-500/10 dark:border-brand-500/20 shadow-2xl animate-zoom-in h-[80vh] sm:h-auto sm:max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-forest-50/50 dark:bg-forest-950/50 border-b border-forest-100 dark:border-forest-900 flex items-center justify-between">
              <h3 className="font-bold text-lg text-forest-900 dark:text-white">Brand Directory Manager</h3>
              <button
                onClick={() => setIsBrandsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-950 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {brandsError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-200/20 dark:border-red-900/50 text-red-500 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{brandsError}</span>
                </div>
              )}

              {/* Add Brand Form inline */}
              <form onSubmit={handleAddBrandSubmit} className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Brand Name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/70 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:border-brand-500 text-sm dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Code (2-3 chars)..."
                    value={newBrandCode}
                    onChange={(e) => setNewBrandCode(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="w-32 px-3 py-2 bg-white/70 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:border-brand-500 text-sm dark:text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold rounded-xl text-sm transition-all"
                >
                  Add Brand
                </button>
              </form>

              {/* Brands list */}
              <div className="border border-forest-100 dark:border-forest-900/60 rounded-2xl divide-y divide-forest-100 dark:divide-forest-900/40 overflow-hidden bg-white/30 dark:bg-forest-900/10 max-h-60 overflow-y-auto">
                {brands.map((b) => (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    {editingBrandId === b.id ? (
                      <div className="flex flex-1 space-x-2 mr-2">
                        <input
                          type="text"
                          value={editingBrandName}
                          onChange={(e) => setEditingBrandName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-forest-950 border border-brand-500 rounded focus:outline-none text-xs dark:text-white"
                        />
                        <input
                          type="text"
                          value={editingBrandCode}
                          onChange={(e) => setEditingBrandCode(e.target.value.toUpperCase())}
                          maxLength={3}
                          className="w-16 px-2 py-1 bg-white dark:bg-forest-950 border border-brand-500 rounded focus:outline-none text-xs dark:text-white font-mono"
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-forest-800 dark:text-forest-200">
                        {b.name} <span className="text-xs font-mono text-slate-400 dark:text-forest-400 ml-1">({b.code || '??'})</span>
                      </span>
                    )}

                    <div className="flex space-x-1.5 flex-shrink-0">
                      {editingBrandId === b.id ? (
                        <>
                          <button
                            onClick={() => handleSaveBrand(b.id)}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-[10px] transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingBrandId(null)}
                            className="px-2 py-1 bg-forest-200 dark:bg-forest-800 text-slate-500 dark:text-slate-400 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEditBrand(b)}
                            className="p-1.5 text-slate-400 hover:text-brand-500 transition-all"
                            title="Edit Brand"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-all"
                            title="Delete Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {isDetailModalOpen && detailedProduct && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm z-50 p-0 sm:p-4">
          <div className="glass-panel w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden border border-brand-500/10 dark:border-brand-500/20 shadow-2xl animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-forest-50/50 dark:bg-forest-950/50 border-b border-forest-100 dark:border-forest-900 flex items-center justify-between">
              <h3 className="font-bold text-lg text-forest-900 dark:text-white">Material Details</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setDetailedProduct(null);
                }}
                className="p-1 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-950 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Info displaying Image, Name, Category and Brand */}
              <div className="flex space-x-4">
                <div className="w-24 h-24 rounded-2xl bg-forest-50 dark:bg-forest-950 border border-brand-500/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {detailedProduct.image_url ? (
                    <img src={getProductImageUrl(detailedProduct.image_url)} alt={detailedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400 opacity-40" />
                  )}
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getCategoryBadgeClass(detailedProduct.category_name)}`}>
                    {detailedProduct.category_name}
                  </span>
                  <h4 className="font-bold text-lg text-forest-900 dark:text-white truncate">{detailedProduct.name}</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-forest-400">Brand: {detailedProduct.brand}</p>
                </div>
              </div>

              {/* Description */}
              {detailedProduct.description && (
                <div className="bg-forest-50/50 dark:bg-forest-950/30 p-3 rounded-xl border border-forest-100 dark:border-forest-900/60">
                  <p className="text-xs text-slate-500 dark:text-forest-300 font-medium leading-relaxed">{detailedProduct.description}</p>
                </div>
              )}

              {/* SKU Components display */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-forest-400">SKU Component Breakdown</h5>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-forest-50 dark:bg-forest-950/60 p-2 rounded-lg border border-forest-100 dark:border-forest-800">
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">Prefix</span>
                    <span className="font-mono text-sm font-bold text-forest-900 dark:text-white">VF</span>
                  </div>
                  <div className="bg-forest-50 dark:bg-forest-950/60 p-2 rounded-lg border border-forest-100 dark:border-forest-800">
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">Brand</span>
                    <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400" title={detailedProduct.brand_name || detailedProduct.brand}>{detailedProduct.brand_code || '??'}</span>
                  </div>
                  <div className="bg-forest-50 dark:bg-forest-950/60 p-2 rounded-lg border border-forest-100 dark:border-forest-800">
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">Category</span>
                    <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400" title={detailedProduct.category_name}>{detailedProduct.category_code || '??'}</span>
                  </div>
                  <div className="bg-forest-50 dark:bg-forest-950/60 p-2 rounded-lg border border-forest-100 dark:border-forest-800">
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">Color</span>
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400" title={detailedProduct.color_name || detailedProduct.colour}>{detailedProduct.color_code || '??'}</span>
                  </div>
                  <div className="bg-forest-50 dark:bg-forest-950/60 p-2 rounded-lg border border-forest-100 dark:border-forest-800">
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase">Serial</span>
                    <span className="font-mono text-sm font-bold text-forest-900 dark:text-white">{detailedProduct.global_serial !== null && detailedProduct.global_serial !== undefined ? String(detailedProduct.global_serial).padStart(6, '0') : '??????'}</span>
                  </div>
                </div>
                <div className="text-center pt-1">
                  <span className="text-[10px] text-slate-400">Full Unique SKU: </span>
                  <span className="font-mono font-bold text-xs bg-forest-100 dark:bg-forest-900/80 px-2 py-0.5 rounded border border-forest-200 dark:border-forest-800 text-forest-900 dark:text-white select-all">{detailedProduct.sku}</span>
                </div>
              </div>

              {/* Barcode & Download/Print actions */}
              <div className="bg-white p-4 rounded-2xl border border-slate-250 flex flex-col items-center justify-center space-y-3">
                <div className="bg-white p-2 rounded border border-slate-100 shadow-sm [&_svg]:[shape-rendering:crispEdges]">
                  <Barcode
                    id={`barcode-${detailedProduct.sku}`}
                    value={String(detailedProduct.id)}
                    text={detailedProduct.sku}
                    format="CODE128"
                    width={2.5}
                    height={60}
                    fontSize={11}
                    margin={10}
                    background="#ffffff"
                  />
                </div>
                <div className="flex space-x-2.5 w-full">
                  <button
                    onClick={() => downloadSVG(detailedProduct.sku)}
                    className="flex-1 py-2.5 px-3 bg-forest-900 hover:bg-forest-850 text-brand-400 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Download SVG</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setDetailedProduct(null);
                      navigate(`/print-labels?sku=${detailedProduct.sku}&autoprint=true`);
                    }}
                    className="flex-1 py-2.5 px-3 bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-forest-950" />
                    <span>Print Label</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Quick Photograph Upload */}
      <input
        type="file"
        ref={quickUploadInputRef}
        onChange={handleQuickImageUploadSubmit}
        accept="image/*"
        className="hidden"
      />

      {/* Excel Actions Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#faf8f5] dark:bg-forest-950 border border-brand-500/20 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden wood-accent-top">

            {/* Header */}
            <div className="px-6 py-4 border-b border-forest-100 dark:border-forest-900/60 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-luxury-title tracking-wide text-forest-900 dark:text-white">Excel Spreadsheet Operations</h3>
                <p className="text-[11px] text-slate-550 dark:text-forest-400 mt-0.5 font-semibold">Bulk manage product catalog records using CSV sheets</p>
              </div>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelError('');
                  setExcelSuccess('');
                  setExcelData([]);
                  setExcelFile(null);
                  setExcelFileName('');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Tab selector */}
              {canDelete && (
                <div className="flex space-x-1 p-1 bg-forest-50 dark:bg-forest-900/50 rounded-xl border border-forest-100 dark:border-forest-900/50">
                  <button
                    type="button"
                    onClick={() => {
                      setExcelMode('add');
                      setExcelError('');
                      setExcelSuccess('');
                      setExcelData([]);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${excelMode === 'add'
                      ? 'bg-brand-500 text-forest-950 shadow-sm'
                      : 'text-slate-500 dark:text-forest-300 hover:text-forest-900'
                      }`}
                  >
                    📥 Bulk Import (Add Products)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExcelMode('delete');
                      setExcelError('');
                      setExcelSuccess('');
                      setExcelData([]);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${excelMode === 'delete'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-forest-300 hover:text-forest-900'
                      }`}
                  >
                    🗑️ Bulk Remove (Delete by SKU)
                  </button>
                </div>
              )}

              {/* Status alerts */}
              {excelSuccess && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-200/20 text-green-600 dark:text-green-400 text-xs flex items-center space-x-2 animate-zoom-in">
                  <span className="text-base font-bold">✓</span>
                  <span>{excelSuccess}</span>
                </div>
              )}

              {excelError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-200/20 text-red-550 dark:text-red-400 text-xs flex items-center space-x-2 animate-shake">
                  <span className="text-base font-bold">⚠️</span>
                  <span>{excelError}</span>
                </div>
              )}

              {/* Action layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* File Upload Box & Templates */}
                <div className="md:col-span-1 space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-forest-905 border border-forest-150 dark:border-forest-900 space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-forest-300">1. Download Template / Export</h4>
                    <p className="text-[10px] text-slate-400 dark:text-forest-450 leading-relaxed font-semibold">Download our formatted spreadsheet template or export live stock to CSV.</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={excelMode === 'add' ? downloadBulkAddTemplate : downloadBulkDeleteTemplate}
                        className="w-full py-2 bg-forest-100 dark:bg-forest-900 hover:bg-forest-200 text-forest-900 dark:text-brand-400 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Download Blank CSV Template
                      </button>
                      <button
                        type="button"
                        onClick={downloadInventoryCSV}
                        className="w-full py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold rounded-lg text-[10px] transition-colors cursor-pointer border border-brand-500/25 flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Current Live Stock CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-forest-905 border border-forest-150 dark:border-forest-900 space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-forest-300">2. Upload File</h4>
                    <div className="relative border-2 border-dashed border-forest-200 dark:border-forest-800 rounded-xl p-4 text-center hover:border-brand-500/40 transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleExcelFileChange}
                        accept=".csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-405 block">Choose CSV File</span>
                      <span className="text-[9px] text-slate-400 block mt-1">Excel-compatible CSV format</span>
                    </div>
                    {excelFileName && (
                      <p className="text-[10px] font-semibold text-forest-800 dark:text-forest-300 truncate text-center">📄 {excelFileName}</p>
                    )}
                  </div>
                </div>

                {/* Preview Grid */}
                <div className="md:col-span-2 flex flex-col h-64 border border-forest-100 dark:border-forest-900/70 rounded-2xl bg-white/40 dark:bg-forest-950/20 overflow-hidden">
                  <div className="px-4 py-2 border-b border-forest-100 dark:border-forest-900 bg-forest-50/50 dark:bg-forest-900/30 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spreadsheet Data Preview</span>
                    <span className="text-[10px] font-mono bg-forest-100 dark:bg-forest-900 px-2 py-0.5 rounded text-forest-900 dark:text-white font-bold">{excelData.length} rows</span>
                  </div>
                  <div className="flex-1 overflow-auto p-3 text-[11px]">
                    {excelData.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-forest-100 dark:border-forest-900 text-slate-500 dark:text-forest-450 font-bold">
                            {Object.keys(excelData[0]).slice(0, 3).map(k => (
                              <th key={k} className="pb-1.5 pr-2 font-bold">{k}</th>
                            ))}
                            {Object.keys(excelData[0]).length > 3 && <th className="pb-1.5 font-bold">...</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-forest-50 dark:divide-forest-900/40 text-slate-705 dark:text-forest-300">
                          {excelData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-forest-50/20 py-1">
                              {Object.values(row).slice(0, 3).map((val, vIdx) => (
                                <td key={vIdx} className="py-1 pr-2 truncate max-w-28 font-mono">{String(val)}</td>
                              ))}
                              {Object.keys(row).length > 3 && <td className="py-1 text-slate-400">...</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-405 dark:text-forest-500 font-semibold text-center p-4">
                        Upload an Excel CSV file to inspect rows before executing action.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-forest-100 dark:border-forest-900/60 bg-forest-50/50 dark:bg-forest-900/30 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelError('');
                  setExcelSuccess('');
                  setExcelData([]);
                  setExcelFile(null);
                  setExcelFileName('');
                }}
                className="px-4 py-2 bg-forest-200 dark:bg-forest-900 border border-forest-300 dark:border-forest-800 text-forest-800 dark:text-forest-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={excelMode === 'add' ? handleBulkAddSubmit : handleBulkDeleteSubmit}
                disabled={excelSubmitLoading || excelData.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer ${excelMode === 'add'
                  ? 'bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/40 text-forest-950'
                  : 'bg-red-650 hover:bg-red-700 disabled:bg-red-650/40 text-white'
                  }`}
              >
                {excelSubmitLoading ? (
                  <span>Executing operation...</span>
                ) : excelMode === 'add' ? (
                  <span>Import {excelData.length} Products</span>
                ) : (
                  <span>Bulk Delete {excelData.length} Products</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Purchase Order (PO) Generator Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#faf8f5] dark:bg-forest-950 border border-brand-500/20 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden wood-accent-top flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-4 border-b border-forest-100 dark:border-forest-900/60 flex items-center justify-between bg-emerald-950/10">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-xl font-bold font-luxury-title tracking-wide text-forest-900 dark:text-white">STOICHEM INTERIO — Purchase Order (PO)</h3>
                  <p className="text-[11px] text-slate-550 dark:text-forest-400 mt-0.5 font-semibold">Generate official PO matching Stoichem Interio Private Limited format</p>
                </div>
              </div>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

              {/* Top controls: Supplier, PO Number, Tax & Charges */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-forest-900/50 p-4 rounded-2xl border border-forest-150 dark:border-forest-800">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-forest-300 uppercase text-[10px] mb-1">Select Supplier / Vendor</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl text-xs font-semibold text-forest-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">M P ASSOCIATES (Default)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-forest-300 uppercase text-[10px] mb-1">PO Number</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl text-xs font-mono font-bold text-forest-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-forest-300 uppercase text-[10px] mb-1">Tax Rate (% GST)</label>
                  <input
                    type="number"
                    value={poTaxRate}
                    onChange={(e) => setPoTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl text-xs font-bold text-forest-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-forest-300 uppercase text-[10px] mb-1">Other Charges (₹)</label>
                  <input
                    type="number"
                    value={poOtherCharges}
                    onChange={(e) => setPoOtherCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl text-xs font-bold text-forest-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-forest-150 dark:border-forest-800 rounded-2xl overflow-hidden bg-white dark:bg-forest-900/40">
                <div className="px-4 py-2.5 bg-emerald-950 text-white flex items-center justify-between font-bold text-xs">
                  <span>PO Line Items ({poItems.length} Products)</span>
                  <span>Stoichem Format Header: # | Item Code | Description | Specification | UOM | Qty | Price | Total</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-forest-100 dark:border-forest-800 bg-forest-50/50 dark:bg-forest-950/60 text-slate-500 dark:text-forest-300 text-[10px] uppercase font-bold">
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">Item Code (SKU)</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Specification</th>
                        <th className="p-2.5 text-center w-16">UOM</th>
                        <th className="p-2.5 text-right w-24">Qty</th>
                        <th className="p-2.5 text-right w-24">Unit Price (₹)</th>
                        <th className="p-2.5 text-right w-24">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-100 dark:divide-forest-900/40 text-slate-700 dark:text-forest-200">
                      {poItems.map((item, idx) => {
                        const total = (item.reorderQty * item.unitCost) || 0;
                        return (
                          <tr key={idx} className="hover:bg-forest-50/30">
                            <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-brand-600 dark:text-brand-400">{item.product.sku}</td>
                            <td className="p-2.5 font-medium">{item.product.name}</td>
                            <td className="p-2.5 text-slate-500 dark:text-forest-400">{item.product.colour || 'Not Applicable'}</td>
                            <td className="p-2.5 text-center uppercase font-semibold">{item.product.unit || 'pcs'}</td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                value={item.reorderQty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, reorderQty: val } : it));
                                }}
                                className="w-16 px-1.5 py-1 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded text-right font-bold text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, unitCost: val } : it));
                                }}
                                className="w-20 px-1.5 py-1 bg-forest-50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded text-right font-semibold text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              ₹{total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-forest-100 dark:border-forest-900/60 bg-forest-50/50 dark:bg-forest-900/30 flex items-center justify-between">
              <div className="text-xs font-bold text-forest-900 dark:text-white">
                Grand Total: <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-extrabold ml-1">
                  ₹{(
                    poItems.reduce((sum, item) => sum + (item.reorderQty * item.unitCost), 0) * (1 + (poTaxRate / 100)) + parseFloat(poOtherCharges || 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={downloadPOCSV}
                  className="px-4 py-2.5 bg-forest-100 dark:bg-forest-900 border border-forest-300 dark:border-forest-800 text-forest-900 dark:text-forest-200 rounded-xl text-xs font-bold hover:bg-forest-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-brand-500" />
                  <span>Download PO CSV</span>
                </button>
                <button
                  type="button"
                  onClick={printPurchaseOrderDocument}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Print Official Stoichem PO (PDF)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Modal - Manage Measurement Units */}
      {isUnitsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-brand-500/15 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-zoom-in">
            <h4 className="text-xl font-bold text-forest-900 dark:text-white flex items-center space-x-2.5 mb-2">
              <Ruler className="w-5.5 h-5.5 text-brand-500" />
              <span>Manage Product Measurement Units</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-forest-400 mb-6 font-medium">
              Create, view, or remove custom units used across Product Catalogue, Inward, Outward, and POs.
            </p>

            {/* Quick Add Form */}
            <form onSubmit={handleAddCustomUnitInProducts} className="mb-6 flex space-x-2">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Type new unit name (e.g. bundle, carton, roll)..."
                className="flex-1 px-4 py-2.5 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit</span>
              </button>
            </form>

            {/* Unit Lists */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-forest-400 mb-2">
                  System Standard Units ({standardUnitsList.length})
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {standardUnitsList.map((unit) => (
                    <span
                      key={unit}
                      className="px-2.5 py-1 bg-forest-100 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 text-forest-800 dark:text-forest-300 font-mono text-xs rounded-lg font-bold"
                    >
                      {unit}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
                  Custom User Units ({customUnits.length})
                </h5>
                {customUnits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customUnits.map((unit) => (
                      <span
                        key={unit}
                        className="px-3 py-1 bg-brand-500/10 dark:bg-brand-950/40 border border-brand-500/30 text-brand-700 dark:text-brand-300 font-mono text-xs rounded-lg font-bold flex items-center space-x-1.5"
                      >
                        <span>{unit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomUnitInProducts(unit)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title={`Delete unit ${unit}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom units added yet. Type a unit name above to create one.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-forest-100 dark:border-forest-900/60 mt-6">
              <button
                type="button"
                onClick={() => setIsUnitsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-forest-200 dark:bg-forest-800 text-forest-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

