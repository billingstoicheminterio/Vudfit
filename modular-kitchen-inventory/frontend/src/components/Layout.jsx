import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  ClipboardList,
  History,
  FileText,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Bot,
  Send,
  User as UserIcon,
  Shield,
  Loader,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setCurrentTime(`${dateStr} | ${timeStr}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // WebSocket logic
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = window.location.host;
    if (api.defaults.baseURL) {
      try {
        const url = new URL(api.defaults.baseURL);
        wsHost = url.host;
      } catch (err) {
        console.error("Failed to parse api base URL for WebSocket", err);
      }
    }

    const wsUrl = `${protocol}//${wsHost}/api/ws`;
    let socket;
    let reconnectTimeout;

    const connectWS = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'REFRESH_DASHBOARD') {
            console.log("Received refresh signal via WebSocket");
            window.dispatchEvent(new CustomEvent('vudfit-refresh-data'));
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected. Retrying in 5 seconds...");
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);
  
  // AI Assistant Chat State
  const [aiQuery, setAiQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your Vudfit Assistant. Ask me questions like:\n• 'Show low stock items'\n• 'How many hinges are available?'\n• 'What was consumed today?'",
      timestamp: new Date()
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Dynamic Navigation Items based on user role (Staff get simplified options)
  const isStaff = user?.role === 'staff';
  const navigationItems = isStaff
    ? [
        { name: 'Start Menu', path: '/', icon: LayoutDashboard },
        { name: 'Receive Materials (Inward)', path: '/inward', icon: PlusCircle },
        { name: 'Send Materials (Outward)', path: '/outward', icon: MinusCircle },
        { name: 'Return Materials (Returns)', path: '/returns', icon: RotateCcw },
        { name: 'Check Stock', path: '/inventory', icon: ClipboardList }
      ]
    : [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Product Catalog', path: '/products', icon: Package },
        { name: 'Inventory Inward', path: '/inward', icon: PlusCircle },
        { name: 'Inventory Outward', path: '/outward', icon: MinusCircle },
        { name: 'Return Note', path: '/returns', icon: RotateCcw },
        { name: 'Current Stock', path: '/inventory', icon: ClipboardList },
        { name: 'Transaction History', path: '/transactions', icon: History },
        ...(user?.role === 'master' || user?.role === 'admin'
          ? [
              { name: 'Customer Directory', path: '/customers', icon: UserIcon },
              { name: 'Supplier Directory', path: '/suppliers', icon: Building2 },
              { name: 'Reports', path: '/reports', icon: FileText },
              ...(user?.role === 'master'
                ? [{ name: 'Password Manager', path: '/credentials', icon: Shield }]
                : [])
            ]
          : [])
      ];


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMessage = { sender: 'user', text: aiQuery, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMessage]);
    const currentQuery = aiQuery;
    setAiQuery('');
    setAiLoading(true);

    try {
      const response = await api.post('/ai/query', { query: currentQuery });
      const assistantMessage = {
        sender: 'assistant',
        text: response.data.answer,
        dataType: response.data.data_type,
        data: response.data.data,
        timestamp: new Date()
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        sender: 'assistant',
        text: "Sorry, I had trouble reaching the system. Please verify that the local server is running.",
        timestamp: new Date()
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const suggestions = [
    { label: "Show low stock", query: "Show low stock items" },
    { label: "Consumed today", query: "What was consumed today?" },
    { label: "Check hinges", query: "How many hinges are available?" },
    { label: "Adhesive stock", query: "How many adhesives are available?" }
  ];

  const handleSuggestionClick = async (suggestedQuery) => {
    if (aiLoading) return;
    const userMessage = { sender: 'user', text: suggestedQuery, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMessage]);
    setAiLoading(true);

    try {
      const response = await api.post('/ai/query', { query: suggestedQuery });
      const assistantMessage = {
        sender: 'assistant',
        text: response.data.answer,
        dataType: response.data.data_type,
        data: response.data.data,
        timestamp: new Date()
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        sender: 'assistant',
        text: "Sorry, I had trouble reaching the system. Please verify that the local server is running.",
        timestamp: new Date()
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f5] dark:bg-forest-950 text-forest-900 dark:text-slate-200 transition-colors duration-200">
      
      {/* 1. Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col transition-all duration-350 ${isSidebarCollapsed ? 'w-20' : 'w-64'} glass-panel border-r border-forest-100 dark:border-forest-900/60 sticky top-0 h-screen z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-forest-100 dark:border-forest-900/40">
          <Link to="/" className="flex items-center overflow-hidden hover:opacity-85 transition-opacity cursor-pointer">
            {isSidebarCollapsed ? (
              <div className="flex items-center justify-center w-12 h-16">
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="6">
                  <rect x="5" y="5" width="90" height="90" rx="8" stroke="currentColor" strokeWidth="6" fill="none" />
                  <path d="M 0 15 A 15 15 0 0 1 15 0" stroke="currentColor" />
                  <path d="M 0 30 A 30 30 0 0 1 30 0" stroke="currentColor" />
                  <path d="M 0 45 A 45 45 0 0 1 45 0" stroke="currentColor" />
                  <path d="M 100 85 A 15 15 0 0 1 85 100" stroke="currentColor" />
                  <path d="M 100 70 A 30 30 0 0 1 70 100" stroke="currentColor" />
                  <path d="M 100 55 A 45 45 0 0 1 55 100" stroke="currentColor" />
                  <path d="M 85 0 A 15 15 0 0 0 100 15" stroke="currentColor" />
                  <path d="M 70 0 A 30 30 0 0 0 100 30" stroke="currentColor" />
                  <path d="M 55 0 A 45 45 0 0 0 100 45" stroke="currentColor" />
                  <path d="M 0 85 A 15 15 0 0 0 15 100" stroke="currentColor" />
                  <path d="M 0 70 A 30 30 0 0 0 30 100" stroke="currentColor" />
                  <path d="M 0 55 A 45 45 0 0 0 45 100" stroke="currentColor" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="3" />
                </svg>
              </div>
            ) : (
              <img src="/logo.png" alt="VUDFIT Logo" className="h-10 w-auto object-contain select-none pr-2" />
            )}
          </Link>
          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-900/60 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-wood-500/10 dark:bg-wood-900/20 text-wood-700 dark:text-brand-400 font-bold border-l-4 border-wood-500 active-glow dark:active-glow-dark'
                    : 'text-slate-500 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/40 hover:text-forest-900 dark:hover:text-brand-400'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 hover:scale-110" />
                {!isSidebarCollapsed && (
                  <span className="text-sm tracking-wide truncate transition-opacity duration-200">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info Bottom */}
        <div className="p-4 border-t border-forest-100 dark:border-forest-900/40 bg-forest-50/50 dark:bg-forest-900/30">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center space-x-0' : 'space-x-3'} mb-4`}>
            <div className="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-950 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold shadow-inner flex-shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-bold truncate text-forest-900 dark:text-white">{user?.full_name}</p>
                <div className="flex items-center space-x-1 text-brand-600 dark:text-brand-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-xs capitalize truncate font-semibold">{user?.role}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center justify-center ${isSidebarCollapsed ? 'p-2.5 space-x-0' : 'px-4 py-2.5 space-x-2'} rounded-xl border border-forest-200 dark:border-forest-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold text-sm cursor-pointer`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-forest-950/80 backdrop-blur-md border-b border-forest-100 dark:border-forest-900 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg border border-forest-250 dark:border-forest-800 hover:bg-forest-100 dark:hover:bg-forest-900 text-forest-900 dark:text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center space-x-3 select-none">
              <h2 className="text-xl font-semibold text-forest-900 dark:text-white font-luxury-title tracking-wide">
                {navigationItems.find((n) => n.path === location.pathname)?.name || 'Barcode Sheets'}
              </h2>
              {isStaff && (
                <span className="px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-extrabold tracking-wider animate-pulse">
                  Staff Station
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">

            {/* Live IST Clock */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-forest-50/50 dark:bg-forest-900/30 border border-forest-150 dark:border-forest-900/45 text-xs font-semibold text-slate-500 dark:text-forest-300 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">{currentTime || 'Loading clock...'}</span>
            </div>

            {/* AI Assistant Button - Hidden for Staff */}
            {!isStaff && (
              <button
                onClick={() => setAiDrawerOpen(true)}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-forest-950 font-bold text-sm shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Bot className="w-4.5 h-4.5 animate-pulse text-forest-950" />
                <span className="hidden sm:inline">Vudfit AI</span>
                <span className="inline sm:hidden">AI</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-forest-200 dark:border-forest-900 hover:bg-forest-100 dark:hover:bg-forest-900/50 text-slate-500 dark:text-forest-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-brand-500" /> : <Moon className="w-5 h-5 text-forest-900" />}
            </button>
          </div>
        </header>

        {/* Body content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden flex">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />
          <div className="w-72 bg-white dark:bg-forest-900 h-full flex flex-col p-6 shadow-2xl relative z-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-forest-900 dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 mb-8 hover:opacity-85 transition-opacity cursor-pointer">
              <img src="/logo.png" alt="VUDFIT Logo" className="h-10 w-auto object-contain select-none pr-2" />
            </Link>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-500 text-forest-950 font-bold shadow-md shadow-brand-500/10'
                        : 'text-slate-500 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-950 hover:text-forest-900 dark:hover:text-brand-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Assistant Slide-over Drawer */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex justify-end">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setAiDrawerOpen(false)} />
          
          <div className="w-full max-w-lg bg-white/95 dark:bg-forest-900/90 backdrop-blur-xl h-full shadow-2xl flex flex-col relative z-10 border-l border-brand-500/10 dark:border-brand-500/20 animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-forest-100 dark:border-forest-900 flex items-center justify-between bg-forest-50/50 dark:bg-forest-950/45">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#8c6c2e] flex items-center justify-center text-white shadow-sm border border-[#c5a059]/20 relative">
                  <Bot className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-forest-900"></span>
                </div>
                <div>
                  <h3 className="font-bold text-forest-900 dark:text-white text-sm tracking-wide">Vudfit AI Assistant</h3>
                  <p className="text-[10px] text-emerald-500 font-extrabold flex items-center space-x-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                    Operational
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="p-1.5 rounded-xl border border-forest-200 dark:border-forest-900 hover:bg-[#c5a059]/10 text-forest-750 dark:text-forest-300 hover:text-[#c5a059] hover:border-[#c5a059]/40 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm leading-relaxed animate-message ${
                    chat.sender === 'user'
                      ? 'bg-gradient-to-br from-[#c5a059] to-[#8c6c2e] text-white rounded-tr-none font-medium shadow-md shadow-[#c5a059]/10'
                      : 'bg-white/90 dark:bg-forest-950/65 backdrop-blur-md rounded-tl-none text-forest-900 dark:text-slate-200 border border-forest-150 dark:border-[#c5a059]/15 shadow-sm'
                  }`}>
                    {/* Message text with newline formatting */}
                    <div className="whitespace-pre-line text-sm">{chat.text}</div>
                    
                    {/* Render matching product table if data is returned */}
                    {chat.sender === 'assistant' && chat.dataType === 'products' && chat.data && chat.data.length > 0 && (
                      <div className="mt-3 overflow-hidden border border-forest-200 dark:border-[#c5a059]/20 rounded-xl shadow-inner">
                        <table className="min-w-full text-xs text-left bg-white/50 dark:bg-forest-950/30 backdrop-blur-sm">
                          <thead>
                            <tr className="bg-[#c5a059]/10 dark:bg-[#c5a059]/10 border-b border-[#c5a059]/20">
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059]">SKU</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059]">Name</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059] text-right">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-forest-100 dark:divide-forest-900/60">
                            {chat.data.map((p, i) => (
                              <tr key={i} className="hover:bg-[#c5a059]/5 dark:hover:bg-[#c5a059]/5">
                                <td className="px-3 py-1.5 font-mono text-[10px] font-bold text-[#8c6c2e] dark:text-[#c5a059]">{p.sku}</td>
                                <td className="px-3 py-1.5 font-medium truncate max-w-[120px]">{p.name}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-forest-900 dark:text-white">{p.current_stock} <span className="text-[10px] font-normal text-slate-400">{p.unit}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Render transaction list if data is returned */}
                    {chat.sender === 'assistant' && chat.dataType === 'transactions' && chat.data && chat.data.length > 0 && (
                      <div className="mt-3 overflow-hidden border border-forest-200 dark:border-[#c5a059]/20 rounded-xl shadow-inner">
                        <table className="min-w-full text-xs text-left bg-white/50 dark:bg-forest-950/30 backdrop-blur-sm">
                          <thead>
                            <tr className="bg-[#c5a059]/10 dark:bg-[#c5a059]/10 border-b border-[#c5a059]/20">
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059]">Product</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059] text-right">Qty</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-forest-800 dark:text-[#c5a059]">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-forest-100 dark:divide-forest-900/60">
                            {chat.data.map((tx, i) => (
                              <tr key={i} className="hover:bg-[#c5a059]/5 dark:hover:bg-[#c5a059]/5">
                                <td className="px-3 py-1.5 font-medium truncate max-w-[120px]">{tx.product_name}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-forest-900 dark:text-white">{tx.quantity} <span className="text-[10px] font-normal text-slate-400">{tx.unit}</span></td>
                                <td className="px-3 py-1.5 text-slate-500 dark:text-forest-400 text-[10px]">{tx.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <span className="text-[9px] block text-right mt-1.5 opacity-60">
                      {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Loader */}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/90 dark:bg-forest-950/65 backdrop-blur-md rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-2 text-sm text-slate-500 border border-forest-150 dark:border-[#c5a059]/15 animate-message">
                    <Loader className="w-4 h-4 animate-spin text-[#c5a059]" />
                    <span>Searching database...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-3 border-t border-forest-100 dark:border-forest-900 bg-white/50 dark:bg-forest-950/40 flex flex-wrap gap-2 no-print">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleSuggestionClick(s.query)}
                  className="architect-badge px-3 py-1.5 bg-white dark:bg-forest-950 hover:bg-[#c5a059]/10 dark:hover:bg-[#c5a059]/10 border border-forest-200 dark:border-forest-850 text-forest-800 dark:text-forest-300 rounded-xl transition-all disabled:opacity-50 hover:border-brand-500/50 hover:scale-[1.02] cursor-pointer shadow-sm"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAiSubmit} className="p-4 border-t border-forest-100 dark:border-forest-900 bg-white/70 dark:bg-forest-950/65 backdrop-blur-md flex items-center space-x-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask inventory questions..."
                className="flex-1 bg-white/90 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/15 focus:border-[#c5a059] text-forest-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-500 transition-all"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || aiLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8c6c2e] hover:from-[#d5b069] hover:to-[#9c7c3e] text-white disabled:opacity-50 transition-all hover:scale-[1.03] shadow-md shadow-[#c5a059]/10 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
