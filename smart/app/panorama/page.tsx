"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import {
  Compass,
  Plus,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Building,
  Upload,
  Eye,
  Trash2,
  Layers,
  Info,
  X,
  Sparkles,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Search,
  Filter,
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  Share,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PanoramaItem {
  id: string;
  title: string;
  roomType: string;
  imageUrl: string;
  projectId?: string;
  projectName?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

const INITIAL_PANORAMAS: PanoramaItem[] = [
  {
    id: "pano-1",
    title: "Rajeshbhai Patel - Italian Acrylic Modular Kitchen 360° Site View",
    roomType: "Kitchen & Dining",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/63/Interior_360_panorama_in_a_living_room.jpg",
    projectName: "Sales",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2026-08-25T10:00:00Z",
    notes: "Site measurement verified. L-shaped modular kitchen layout with tandem drawers.",
  },
  {
    id: "pano-2",
    title: "Kiritbhai Shah - 3BHK Designer Living Room & TV Unit 360° Site View",
    roomType: "Living Room",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/360-degree_panorama_of_living_room.jpg",
    projectName: "Sales",
    uploadedBy: "Alex Morgan",
    uploadedAt: "2026-08-24T14:30:00Z",
    notes: "Panelled veneer accent wall with hidden LED profile lighting.",
  },
  {
    id: "pano-3",
    title: "Anand Synthetics Office - Executive Workstation 360° Site View",
    roomType: "Corporate Office",
    imageUrl: "https://images.unsplash.com/photo-1558442074-3c19857bc1dc?w=2000&auto=format&fit=crop&q=80",
    projectName: "Back office",
    uploadedBy: "Robert Vance",
    uploadedAt: "2026-08-22T09:15:00Z",
    notes: "Glass partition & acoustic ceiling paneling installation completed.",
  },
  {
    id: "pano-4",
    title: "Ghansyambhai - Master Bedroom Sliding Wardrobe 360° Site View",
    roomType: "Master Bedroom",
    imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=2000&auto=format&fit=crop&q=80",
    projectName: "Production",
    uploadedBy: "David Miller",
    uploadedAt: "2026-08-21T16:00:00Z",
    notes: "Soft-close lacquered glass sliding doors with interior sensor lights.",
  },
];

export default function PanoramaPage() {
  const { projects, currentUser, brandSettings } = useAppStore();
  const [panoramas, setPanoramas] = useState<PanoramaItem[]>(INITIAL_PANORAMAS);
  const [activePanoId, setActivePanoId] = useState<string>(INITIAL_PANORAMAS[0].id);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Share Modal & Client Presentation Mode State
  const [shareModalPano, setShareModalPano] = useState<PanoramaItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isClientMode, setIsClientMode] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRoomType, setNewRoomType] = useState("Kitchen & Dining");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newProjectName, setNewProjectName] = useState(projects[0]?.name || "Sales");
  const [newNotes, setNewNotes] = useState("");

  const activePano = panoramas.find((p) => p.id === activePanoId) || panoramas[0];

  // Search & Filter Logic
  const filteredPanoramas = panoramas.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.projectName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoom = roomFilter === "all" || p.roomType === roomFilter;
    const matchesDept = deptFilter === "all" || p.projectName === deptFilter;
    return matchesSearch && matchesRoom && matchesDept;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setNewImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePanorama = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) return;

    const newItem: PanoramaItem = {
      id: `pano-${Date.now()}`,
      title: newTitle.trim(),
      roomType: newRoomType,
      imageUrl: newImageUrl,
      projectName: newProjectName,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      notes: newNotes.trim() || "Uploaded 360° site photo.",
    };

    setPanoramas([newItem, ...panoramas]);
    setActivePanoId(newItem.id);

    // Reset Form
    setNewTitle("");
    setNewImageUrl("");
    setNewNotes("");
    setIsUploadModalOpen(false);
  };

  const handleDeletePano = (id: string) => {
    const filtered = panoramas.filter((p) => p.id !== id);
    setPanoramas(filtered);
    if (activePanoId === id && filtered.length > 0) {
      setActivePanoId(filtered[0].id);
    }
  };

  const getShareableUrl = (panoId: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/panorama?shareId=${panoId}&clientMode=true`;
  };

  const handleCopyShareLink = (panoId: string) => {
    const url = getShareableUrl(panoId);
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleShareWhatsApp = (pano: PanoramaItem) => {
    const url = getShareableUrl(pano.id);
    const text = encodeURIComponent(
      `Hello! Please view your 360° Virtual Site Experience for "${pano.title}" here:\n\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // CLIENT PRESENTATION MODE VIEW (Only 360° Image for Customer)
  if (isClientMode && activePano) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen text-white select-none">
        {/* Customer View Header */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <img
              src={brandSettings.logoImageUrl || "/vudfit-logo.png"}
              alt="VUDFIT"
              className="h-9 w-auto object-contain"
            />
            <div className="h-5 w-px bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="font-bold text-sm text-white">{activePano.title}</h2>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Customer 360° Virtual Site Experience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleShareWhatsApp(activePano)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Share to WhatsApp</span>
            </button>
            <button
              onClick={() => setIsClientMode(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Full View 3D Spherical Player */}
        <div className="flex-1 relative">
          <PanoramaThreeViewer key={activePano.id} imageUrl={activePano.imageUrl} title={activePano.title} />
        </div>

        {/* Customer Room Carousel Selector Footer */}
        <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto">
          {panoramas.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanoId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                activePanoId === p.id
                  ? "bg-brand-600 text-white border-brand-500 shadow-md scale-105"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{p.roomType}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xl shadow-md">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              360° VR Site Views & Panoramas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Panoraven-style 3D virtual site tour viewer & client shareable links.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePano && (
            <button
              onClick={() => setIsClientMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-brand-500/30 text-brand-500 hover:bg-brand-500/10 font-semibold text-xs transition-all shadow-sm"
              title="Open Clean Customer Presentation Mode"
            >
              <Eye className="w-4 h-4" />
              <span>Customer View</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Upload 360° Photo</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="p-3 bg-card/60 border border-border/80 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search 360° site photo, client, room..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Room Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-transparent text-foreground font-medium focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Room Types</option>
              <option value="Kitchen & Dining">Kitchen & Dining</option>
              <option value="Living Room">Living Room</option>
              <option value="Master Bedroom">Master Bedroom</option>
              <option value="Corporate Office">Corporate Office</option>
              <option value="Showroom">Showroom</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground">
            <Building className="w-3.5 h-3.5" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-foreground font-medium focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Departments</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 3D Spherical Panorama Viewer Section */}
      {activePano && (
        <div className="space-y-4">
          <PanoramaThreeViewer key={activePano.id} imageUrl={activePano.imageUrl} title={activePano.title} />

          {/* Active Panorama Info & Action Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-bold text-[10px] border border-brand-500/20">
                  {activePano.roomType}
                </span>
                {activePano.projectName && (
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold text-[10px] border border-border flex items-center gap-1">
                    <Building className="w-3 h-3 text-brand-500" />
                    {activePano.projectName} Department
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  Uploaded by <strong className="text-foreground">{activePano.uploadedBy}</strong> on {formatDate(activePano.uploadedAt)}
                </span>
              </div>
              {activePano.notes && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>{activePano.notes}</span>
                </p>
              )}
            </div>

            {/* Actions: Share & Delete */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShareModalPano(activePano)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share 360 View to Customer</span>
              </button>

              <button
                onClick={() => handleDeletePano(activePano.id)}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panorama Gallery Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Site Panoramas Library ({filteredPanoramas.length})</span>
          </h2>
          <span className="text-xs text-muted-foreground">Select any photo to view in 360° VR player</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPanoramas.map((pano) => (
            <div
              key={pano.id}
              onClick={() => setActivePanoId(pano.id)}
              className={`group p-3 rounded-2xl bg-card border transition-all cursor-pointer space-y-3 relative ${
                activePanoId === pano.id
                  ? "border-brand-500 ring-2 ring-brand-500/20 shadow-xl"
                  : "border-border/80 hover:border-brand-500/50 shadow-md"
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-border">
                <img
                  src={pano.imageUrl}
                  alt={pano.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-400" /> 360° VR View
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareModalPano(pano);
                    }}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-brand-600 text-white backdrop-blur-sm border border-white/10 transition-colors"
                    title="Share Link to Customer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {activePanoId === pano.id && (
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Card Meta */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-brand-500 transition-colors">
                  {pano.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{pano.roomType}</span>
                  <span>{formatDate(pano.uploadedAt)}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredPanoramas.length === 0 && (
            <div className="col-span-full p-8 text-center bg-card border border-dashed border-border rounded-2xl text-muted-foreground space-y-2">
              <Compass className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold">No 360° site photos match your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Share 360 View to Customer Modal */}
      {shareModalPano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Share 360° View to Customer</h2>
              </div>
              <button
                onClick={() => setShareModalPano(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center gap-3">
                <img
                  src={shareModalPano.imageUrl}
                  alt={shareModalPano.title}
                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-foreground truncate">{shareModalPano.title}</h4>
                  <span className="text-[11px] text-muted-foreground">{shareModalPano.roomType}</span>
                </div>
              </div>

              {/* Direct Share Link Box */}
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Customer VR View Direct Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl(shareModalPano.id)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs font-mono text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyShareLink(shareModalPano.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shrink-0 ${
                      isCopied
                        ? "bg-emerald-500 text-white"
                        : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                    }`}
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleShareWhatsApp(shareModalPano)}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    setActivePanoId(shareModalPano.id);
                    setIsClientMode(true);
                    setShareModalPano(null);
                  }}
                  className="p-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Customer View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Upload 360° Panorama Photo</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePanorama} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Site View Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Bedroom 360° Site Measurement"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  360° Equirectangular Photo *
                </label>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="pano-file-upload"
                    className="w-full p-4 rounded-xl border-2 border-dashed border-brand-500/40 hover:border-brand-500 bg-brand-500/5 hover:bg-brand-500/10 text-brand-500 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-center"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-semibold">Click to upload 360° Photo file from device</span>
                    <span className="text-[10px] text-muted-foreground">Supports JPG, PNG equirectangular 360° images</span>
                    <input
                      id="pano-file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <div className="relative">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste 360° Image URL (https://...)"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Room / Area Type
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                  >
                    <option value="Kitchen & Dining">Kitchen & Dining</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Master Bedroom">Master Bedroom</option>
                    <option value="Corporate Office">Corporate Office</option>
                    <option value="Showroom">Showroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Project Department
                  </label>
                  <select
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Site Notes / Description
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Verified electrical points & plumbing points..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newImageUrl}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Add 360° Panorama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// True 3D Spherical Three.js Panorama Viewer Component
function PanoramaThreeViewer({ imageUrl, title }: { imageUrl: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Three.js Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 3. Spherical Geometry (Inverted inside faces)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setIsLoading(false);
      },
      undefined,
      () => {
        setIsLoading(false);
      }
    );

    // 4. Drag & Look Rotation Handlers
    let isUserInteracting = false;
    let lon = 0;
    let lat = 0;
    let phi = 0;
    let theta = 0;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;
    const target = new THREE.Vector3(0, 0, 0);

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      isUserInteracting = true;
      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
      onPointerDownPointerX = clientX;
      onPointerDownPointerY = clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
      if (!isUserInteracting) return;
      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
      lon = (onPointerDownPointerX - clientX) * 0.18 + onPointerDownLon;
      lat = (clientY - onPointerDownPointerY) * 0.18 + onPointerDownLat;
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = Math.max(30, Math.min(100, camera.fov + event.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onPointerDown);
    domElement.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    domElement.addEventListener("touchstart", onPointerDown, { passive: true });
    domElement.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);
    domElement.addEventListener("wheel", onWheel, { passive: false });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 5. Animation Render Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isUserInteracting) {
        lon += 0.12;
      }

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      target.x = 500 * Math.sin(phi) * Math.cos(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(target);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", onPointerDown);
      domElement.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      domElement.removeEventListener("touchstart", onPointerDown);
      domElement.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      domElement.removeEventListener("wheel", onWheel);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      renderer.dispose();
    };
  }, [imageUrl]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = Math.max(30, cameraRef.current.fov - 10);
    cameraRef.current.updateProjectionMatrix();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = Math.min(100, cameraRef.current.fov + 10);
    cameraRef.current.updateProjectionMatrix();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-2xl group bg-slate-950 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none h-screen" : "h-[520px]"
      }`}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 pointer-events-none">
          <Compass className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-xs font-semibold">Loading 3D Spherical VR Panorama...</span>
        </div>
      )}

      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white shadow-lg pointer-events-auto max-w-lg">
          <h3 className="font-bold text-sm truncate flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            {title}
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
            Click & Drag mouse inside to look around 360° spherical room
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto text-white">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg transition-colors ${
              autoRotate ? "bg-brand-500 text-white" : "hover:bg-white/10 text-white/80"
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Full Screen View"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
