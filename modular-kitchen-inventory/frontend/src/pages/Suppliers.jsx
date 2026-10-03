import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
  Search,
  User as UserIcon,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react';

const Suppliers = () => {
  const { user } = useAuth();
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editName, setEditName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Bulk import states
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [excelError, setExcelError] = useState('');
  const [excelSuccess, setExcelSuccess] = useState('');
  const [excelSubmitLoading, setExcelSubmitLoading] = useState(false);

  // Fetch suppliers
  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (e) {
      console.error(e);
      setError('Failed to load suppliers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'master' || user?.role === 'admin') {
      loadSuppliers();
    }
  }, [user]);

  // Guard clause for Staff
  if (user?.role !== 'master' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-forest-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-forest-400">Only Admin and Master users are permitted to manage suppliers.</p>
      </div>
    );
  }

  const parseCSV = (text, separator = ',') => {
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setExcelError('');
    setExcelSuccess('');
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

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (excelData.length === 0) return;
    
    setExcelSubmitLoading(true);
    setExcelError('');
    setExcelSuccess('');
    
    const payload = excelData.map(row => {
      const findVal = (keys) => {
        const match = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
        return match ? row[match] : undefined;
      };
      
      const nameVal = findVal(['supplier name', 'name', 'supplier', 'company']);
      const contactVal = findVal(['contact person', 'contact', 'contact_person', 'person']);
      const emailVal = findVal(['email', 'mail', 'email address']);
      const phoneVal = findVal(['phone', 'mobile', 'tel', 'phone number']);
      const addressVal = findVal(['address', 'location', 'street']);
      
      return {
        name: nameVal ? nameVal.trim() : undefined,
        contact_person: contactVal ? contactVal.trim() : null,
        email: emailVal ? emailVal.trim() : null,
        phone: phoneVal ? phoneVal.trim() : null,
        address: addressVal ? addressVal.trim() : null
      };
    }).filter(s => s.name);
    
    if (payload.length === 0) {
      setExcelError("No valid suppliers found in the CSV. Make sure you have a 'Name' or 'Supplier Name' column.");
      setExcelSubmitLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/suppliers/bulk', payload);
      setExcelSuccess(`Successfully imported ${response.data.length} suppliers!`);
      setExcelData([]);
      setExcelFile(null);
      setExcelFileName('');
      loadSuppliers();
    } catch (err) {
      console.error(err);
      setExcelError(err.response?.data?.detail || "Failed to bulk import suppliers.");
    } finally {
      setExcelSubmitLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Supplier Name,Contact Person,Email,Phone,Address\nHafele India,Rajesh Kumar,orders@hafele.in,+91 98765 43210,Okhla Phase 3 New Delhi\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vudfit_suppliers_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name.trim()) {
      setError('Supplier Name is required.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/suppliers', {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null
      });

      setSuccess(`Supplier "${name}" successfully added to directory!`);
      // Reset Form
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      
      // Reload suppliers
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add supplier. Please check the fields.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (supp) => {
    setEditingSupplier(supp);
    setEditName(supp.name);
    setEditContactPerson(supp.contact_person || '');
    setEditEmail(supp.email || '');
    setEditPhone(supp.phone || '');
    setEditAddress(supp.address || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!editName.trim()) {
      setError('Supplier Name is required.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.put(`/suppliers/${editingSupplier.id}`, {
        name: editName.trim(),
        contact_person: editContactPerson.trim() || null,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null
      });

      setSuccess(`Supplier "${editName}" successfully updated!`);
      setIsEditModalOpen(false);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update supplier.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSupplier = async (id, suppName) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${suppName}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/suppliers/${id}`);
      setSuccess(`Supplier "${suppName}" successfully deleted.`);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete supplier.');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-900 dark:text-white font-luxury-title tracking-wide">Supplier Directory</h1>
        <p className="text-sm text-slate-500 dark:text-forest-300">Manage supply partners, contact info, and component manufacturing partners</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Register & Bulk Import */}
        <div className="space-y-6 h-fit">
          {/* Supplier Creation Form */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 shadow-premium dark:shadow-premium-dark">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center space-x-2">
              <Truck className="w-4.5 h-4.5 text-brand-500" />
              <span>Add New Supplier</span>
            </h3>

            {success && !isEditModalOpen && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-200/20 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs flex items-center space-x-2.5">
                <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-green-500" />
                <span>{success}</span>
              </div>
            )}

            {error && !isEditModalOpen && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-200/20 dark:border-red-900/50 text-red-500 dark:text-red-400 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              {/* Supplier Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-forest-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hafele India Pvt Ltd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                  Contact Person
                </label>
                <div className="relative">
                  <UserIcon className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-forest-400" />
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-forest-400" />
                  <input
                    type="email"
                    placeholder="e.g. orders@hafele.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-forest-400" />
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="w-4.5 h-4.5 absolute left-3 top-3.5 text-slate-400 dark:text-forest-400" />
                  <textarea
                    placeholder="e.g. Okhla Phase 3, New Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/60 text-forest-950 font-bold text-sm shadow-md shadow-brand-500/10 cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <Loader className="w-4.5 h-4.5 animate-spin text-forest-950" />
                    <span>Adding Supplier...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4.5 h-4.5 text-forest-950" />
                    <span>Register Supplier</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bulk Import Form */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 shadow-premium dark:shadow-premium-dark">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-brand-500" />
                <span>Bulk Import CSV</span>
              </span>
              <button 
                type="button" 
                onClick={downloadTemplate}
                className="text-[10px] text-brand-600 hover:text-brand-500 font-bold bg-brand-500/10 hover:bg-brand-500/20 px-2 py-0.5 rounded-full transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-brand-500" />
                <span>Template</span>
              </button>
            </h3>

            {excelSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-200/20 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs flex items-center space-x-2.5">
                <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-green-500" />
                <span>{excelSuccess}</span>
              </div>
            )}

            {excelError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-200/20 dark:border-red-900/50 text-red-500 dark:text-red-400 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
                <span>{excelError}</span>
              </div>
            )}

            <form onSubmit={handleBulkImportSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-forest-200 dark:border-forest-800 rounded-2xl p-4 text-center hover:border-brand-500/55 transition-all relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-75" />
                <p className="text-xs font-bold text-forest-900 dark:text-white">
                  {excelFileName ? excelFileName : "Click to select CSV File"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-forest-400 mt-1">
                  Upload standard comma-separated CSV sheet
                </p>
              </div>

              {excelData.length > 0 && (
                <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/10 text-center">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    Ready to import {excelData.length} suppliers
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={excelSubmitLoading || excelData.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/30 disabled:text-slate-400 dark:disabled:text-forest-600 disabled:cursor-not-allowed text-forest-950 font-bold text-sm shadow-md shadow-brand-500/10 cursor-pointer"
              >
                {excelSubmitLoading ? (
                  <>
                    <Loader className="w-4.5 h-4.5 animate-spin text-forest-950" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4.5 h-4.5 text-forest-950" />
                    <span>Upload CSV Sheet</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Supplier Directory List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search bar */}
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-brand-500/10 dark:border-brand-500/15">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-forest-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search suppliers by name, contact, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm placeholder-slate-400 dark:placeholder-forest-500 dark:text-white"
              />
            </div>
          </div>

          {/* Suppliers List */}
          {loading ? (
            <div className="h-[40vh] flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            filteredSuppliers.length > 0 ? (
              <div className="space-y-3">
                {/* Header Row (Hidden on mobile) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-forest-400 select-none">
                  <div className="col-span-3">Supplier Details</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-3">Address</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {filteredSuppliers.map((supp) => (
                  <div key={supp.id} className="glass-panel p-4.5 rounded-2xl border border-brand-500/10 dark:border-brand-500/15 grid grid-cols-12 gap-4 items-center card-hover">
                    
                    {/* Left: Supplier Details */}
                    <div className="col-span-12 md:col-span-3 flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner select-none">
                        {supp.name ? supp.name.substring(0, 2).toUpperCase() : 'S'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-forest-900 dark:text-white truncate" title={supp.name}>
                          {supp.name}
                        </h4>
                        {supp.contact_person && (
                          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold block mt-0.5">
                            Contact: {supp.contact_person}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Email */}
                    <div className="col-span-12 md:col-span-3 min-w-0 text-xs font-semibold text-slate-500 dark:text-forest-300">
                      {supp.email ? (
                        <a href={`mailto:${supp.email}`} className="flex items-center space-x-2 hover:text-brand-500 transition-colors font-medium">
                          <Mail className="w-4 h-4 text-brand-500 flex-shrink-0" />
                          <span className="truncate break-all" title={supp.email}>{supp.email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-400 dark:text-forest-800 italic font-normal">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>No email</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Phone */}
                    <div className="col-span-12 md:col-span-2 min-w-0 text-xs font-semibold text-slate-500 dark:text-forest-300">
                      {supp.phone ? (
                        <a href={`tel:${supp.phone}`} className="flex items-center space-x-2 hover:text-brand-500 transition-colors font-medium">
                          <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                          <span className="truncate">{supp.phone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-400 dark:text-forest-800 italic font-normal">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>No phone</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Address */}
                    <div className="col-span-12 md:col-span-3 min-w-0 text-xs font-semibold text-slate-500 dark:text-forest-300">
                      {supp.address ? (
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(supp.address)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-start space-x-2 hover:text-brand-500 transition-colors font-semibold"
                        >
                          <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-xs" title={supp.address}>{supp.address}</span>
                        </a>
                      ) : (
                        <div className="flex items-start space-x-2 text-slate-400 dark:text-forest-800 italic font-normal">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>No address</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="col-span-12 md:col-span-1 flex items-center justify-end space-x-1 border-t md:border-t-0 pt-3 md:pt-0 border-forest-100 dark:border-forest-900/40">
                      <button
                        onClick={() => openEditModal(supp)}
                        className="p-2 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supp.id, supp.name)}
                        className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-950 rounded-lg transition-colors cursor-pointer"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 dark:text-forest-500 border border-brand-500/10 rounded-3xl">
                <UserIcon className="w-12 h-12 text-slate-350 dark:text-forest-850 mx-auto mb-3 opacity-55" />
                <p className="text-sm font-bold">No suppliers registered in directory.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Edit Glassmorphism Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm z-50 px-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-brand-500/10 dark:border-brand-500/20 shadow-2xl animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-forest-50/50 dark:bg-forest-950/50 border-b border-forest-100 dark:border-forest-900 flex items-center justify-between">
              <h3 className="font-bold text-lg text-forest-900 dark:text-white">
                Edit Supplier: {editingSupplier?.name}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-950 text-slate-404 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateSupplier} className="p-6 space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-200/20 text-red-500 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Supplier Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-1">
                  Address
                </label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-forest-200 dark:border-forest-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
