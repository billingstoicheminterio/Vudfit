"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, Target, DollarSign, Building } from "lucide-react";
import { CRMStage } from "@/lib/types";

export const CreateDealModal = () => {
  const {
    isCreateDealOpen,
    setCreateDealOpen,
    activeWorkspaceId,
    addDeal,
    users,
  } = useAppStore();

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [value, setValue] = useState<number>(25000);
  const [stage, setStage] = useState<CRMStage>("lead");
  const [probability, setProbability] = useState<number>(50);
  const [assignedTo, setAssignedTo] = useState(users[0]?.id || "");

  if (!isCreateDealOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    addDeal({
      workspaceId: activeWorkspaceId,
      title: title.trim(),
      customerName: customerName.trim() || contactName.trim() || title.trim(),
      company: company.trim(),
      companyAddress: companyAddress.trim() || "GIDC Commercial Park, Ahmedabad",
      contactName: contactName.trim() || "Lead Contact",
      contactPhone: contactPhone.trim() || "+91 98250 12345",
      contactEmail: contactEmail.trim() || "contact@company.com",
      value: Number(value) || 0,
      stage,
      probability: Number(probability) || 50,
      expectedCloseDate: "2026-09-30",
      assignedTo: assignedTo || users[0]?.id,
    });

    setTitle("");
    setCustomerName("");
    setCompany("");
    setCompanyAddress("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setCreateDealOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Add New CRM Deal</h2>
          </div>
          <button
            onClick={() => setCreateDealOpen(false)}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rajeshbhai Patel"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Deal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Italian Kitchen & Wardrobes"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Enterprise Corp"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                Site / Company Address
              </label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="e.g. Satellite, Ahmedabad"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jonathan"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98250 12345"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Deal Value (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="sarah@company.com"
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Assigned Team Member
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Sales Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CRMStage)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground capitalize"
              >
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Win Probability ({probability}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateDealOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md transition-all"
            >
              Add Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
