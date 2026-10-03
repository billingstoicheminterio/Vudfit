import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
  Search,
  User as UserIcon,
  ClipboardList
} from 'lucide-react';

const Customers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Customers list & state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch customers
  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (e) {
      console.error(e);
      setError('Failed to load customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'master' || user?.role === 'admin') {
      loadCustomers();
    }
  }, [user]);

  // Guard clause for Staff
  if (user?.role !== 'master' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-forest-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-forest-400">Only Admin and Master users are permitted to manage customers.</p>
      </div>
    );
  }

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name.trim()) {
      setError('Customer Name is required.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/customers', {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null
      });

      setSuccess(`Customer "${name}" successfully added to directory!`);
      // Reset Form
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      
      // Reload customers list
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add customer. Please check the fields.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contact_person && c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-900 dark:text-white">Customer Directory</h1>
        <p className="text-sm text-slate-500 dark:text-forest-300">Manage clients, design showrooms, and work order allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Creation Form */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 h-fit">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-forest-300 mb-4 flex items-center space-x-2">
            <UserPlus className="w-4.5 h-4.5 text-brand-500" />
            <span>Add New Customer</span>
          </h3>

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-200/20 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs flex items-center space-x-2.5">
              <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-200/20 dark:border-red-900/50 text-red-500 dark:text-red-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateCustomer} className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-350 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-forest-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Vudfit Showroom Delhi"
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
                  placeholder="e.g. Vikram Malhotra"
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
                  placeholder="e.g. contact@showroom.com"
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
                  placeholder="e.g. +91 99991 11100"
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
                  placeholder="e.g. Kirti Nagar, New Delhi"
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
                  <span>Adding Customer...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4.5 h-4.5 text-forest-950" />
                  <span>Register Customer</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Customer Directory List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search bar */}
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-brand-500/10 dark:border-brand-500/15">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-forest-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search customers by name, contact, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm placeholder-slate-400 dark:placeholder-forest-500 dark:text-white"
              />
            </div>
          </div>

          {/* Customers List */}
          {loading ? (
            <div className="h-[40vh] flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            filteredCustomers.length > 0 ? (
              <div className="space-y-3">
                {/* Header Row (Hidden on mobile) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-forest-400 select-none">
                  <div className="col-span-3">Customer Details</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-2">Address</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>

                {filteredCustomers.map((cust) => (
                  <div key={cust.id} className="glass-panel p-4.5 rounded-2xl border border-brand-500/10 dark:border-brand-500/15 grid grid-cols-12 gap-4 items-center card-hover">
                    
                    {/* Left: Customer Details */}
                    <div className="col-span-12 md:col-span-3 flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner select-none">
                        {cust.name ? cust.name.substring(0, 2).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-forest-900 dark:text-white truncate" title={cust.name}>
                          {cust.name}
                        </h4>
                        {cust.contact_person && (
                          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold block mt-0.5">
                            Contact: {cust.contact_person}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Email */}
                    <div className="col-span-12 md:col-span-3 min-w-0 text-xs font-semibold text-slate-500 dark:text-forest-300">
                      {cust.email ? (
                        <a href={`mailto:${cust.email}`} className="flex items-center space-x-2 hover:text-brand-500 transition-colors font-medium">
                          <Mail className="w-4 h-4 text-brand-500 flex-shrink-0" />
                          <span className="truncate break-all" title={cust.email}>{cust.email}</span>
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
                      {cust.phone ? (
                        <a href={`tel:${cust.phone}`} className="flex items-center space-x-2 hover:text-brand-500 transition-colors font-medium">
                          <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                          <span className="truncate">{cust.phone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-400 dark:text-forest-800 italic font-normal">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>No phone</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Address */}
                    <div className="col-span-12 md:col-span-2 min-w-0 text-xs font-semibold text-slate-500 dark:text-forest-300">
                      {cust.address ? (
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(cust.address)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-start space-x-2 hover:text-brand-500 transition-colors font-semibold"
                        >
                          <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-xs" title={cust.address}>{cust.address}</span>
                        </a>
                      ) : (
                        <div className="flex items-start space-x-2 text-slate-400 dark:text-forest-800 italic font-normal">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>No address</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions (Usage Statement) */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-center border-t md:border-t-0 pt-3 md:pt-0 border-forest-100 dark:border-forest-900/40">
                      <button
                        onClick={() => navigate(`/customers/${cust.id}/invoice`)}
                        className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/25 border border-brand-500/20 text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap"
                      >
                        <ClipboardList className="w-4 h-4 text-brand-500" />
                        <span>Usage Statement</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 dark:text-forest-500 border border-brand-500/10 rounded-3xl">
                <UserIcon className="w-12 h-12 text-slate-350 dark:text-forest-850 mx-auto mb-3 opacity-55" />
                <p className="text-sm font-bold">No customers registered in directory.</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default Customers;
