"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { CreateDealModal } from "@/components/crm/CreateDealModal";
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  Building,
  User,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Lock,
  List,
  Kanban,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CRMStage } from "@/lib/types";

const STAGES: { id: CRMStage; title: string; color: string }[] = [
  { id: "lead", title: "Leads", color: "bg-slate-500" },
  { id: "contacted", title: "Contacted", color: "bg-amber-500" },
  { id: "proposal", title: "Proposal Sent", color: "bg-blue-500" },
  { id: "negotiation", title: "Negotiation", color: "bg-purple-500" },
  { id: "won", title: "Closed Won", color: "bg-emerald-500" },
  { id: "lost", title: "Closed Lost", color: "bg-rose-500" },
];

export default function CRMPipelinePage() {
  const { deals, updateDealStage, deleteDeal, setCreateDealOpen, users, currentUser } = useAppStore();

  const [viewType, setViewType] = useState<"kanban" | "list">("kanban");
  const [crmSearch, setCrmSearch] = useState("");
  const [crmStageFilter, setCrmStageFilter] = useState<string>("all");

  const canAccessCRM =
    currentUser?.role === "admin" ||
    currentUser?.role === "director" ||
    currentUser?.role === "manager" ||
    currentUser?.department?.toLowerCase().includes("sales") ||
    currentUser?.role === "team_leader" ||
    currentUser?.permissions?.departmentAccess === "all";

  if (!canAccessCRM) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            The CRM & Sales Pipeline is restricted to <strong className="text-foreground">Admin</strong>, <strong className="text-foreground">Director</strong>, and <strong className="text-foreground">Sales Department</strong> team members only.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            Return to Overview Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);
  const winRate = Math.round((deals.filter((d) => d.stage === "won").length / (deals.length || 1)) * 100);

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(crmSearch.toLowerCase()) ||
      d.company.toLowerCase().includes(crmSearch.toLowerCase()) ||
      d.contactName.toLowerCase().includes(crmSearch.toLowerCase());
    const matchesStage = crmStageFilter === "all" || d.stage === crmStageFilter;
    return matchesSearch && matchesStage;
  });

  const getNextStage = (current: CRMStage): CRMStage | null => {
    const order: CRMStage[] = ["lead", "contacted", "proposal", "negotiation", "won"];
    const idx = order.indexOf(current);
    if (idx !== -1 && idx < order.length - 1) {
      return order[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: CRMStage): CRMStage | null => {
    const order: CRMStage[] = ["lead", "contacted", "proposal", "negotiation", "won"];
    const idx = order.indexOf(current);
    if (idx > 0) {
      return order[idx - 1];
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xl shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                CRM & Sales Pipeline
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track leads, proposals, deal sizes, win probabilities, and pipeline conversion stages.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreateDealOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Deal</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border/60 text-xs">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
            <span className="text-muted-foreground font-medium block mb-1">Total Pipeline Value</span>
            <span className="text-xl font-extrabold text-foreground">{formatCurrency(totalValue)}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium block mb-1">Closed Revenue (Won)</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(wonValue)}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
            <span className="text-muted-foreground font-medium block mb-1">Pipeline Win Rate</span>
            <span className="text-xl font-extrabold text-foreground">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Search Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card/60 border border-border/80 rounded-2xl shadow-sm">
        {/* View Toggle Buttons: Board vs List */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => setViewType("kanban")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewType === "kanban"
                ? "bg-card text-brand-500 shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board View</span>
          </button>

          <button
            onClick={() => setViewType("list")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewType === "list"
                ? "bg-card text-brand-500 shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>

        {/* Search & Stage Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              placeholder="Search deals, company..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={crmStageFilter}
              onChange={(e) => setCrmStageFilter(e.target.value)}
              className="bg-transparent text-foreground font-medium focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content View: Board vs List */}
      {viewType === "kanban" ? (
        /* Board (Kanban) View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {STAGES.map((col) => {
            const colDeals = filteredDeals.filter((d) => d.stage === col.id);
            const colTotal = colDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={col.id}
                className="bg-card/70 border border-border/80 rounded-2xl flex flex-col shadow-md max-h-[calc(100vh-250px)]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h3 className="font-bold text-xs text-foreground truncate">{col.title}</h3>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold text-[10px]">
                      {colDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-brand-400 block font-mono">
                    {formatCurrency(colTotal)}
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {colDeals.map((deal) => {
                    const nextStage = getNextStage(deal.stage);
                    const prevStage = getPrevStage(deal.stage);

                    return (
                      <div
                        key={deal.id}
                        className="p-3.5 rounded-xl bg-card border border-border/90 shadow-sm hover:border-brand-500/40 transition-all space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs text-foreground line-clamp-2">
                            {deal.title}
                          </span>
                          <button
                            onClick={() => deleteDeal(deal.id)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-foreground">
                            <Building className="w-3 h-3 text-brand-500" />
                            <span>{deal.company}</span>
                          </div>
                          <p className="truncate">{deal.contactName} ({deal.contactEmail})</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                          <span className="font-extrabold text-emerald-500">
                            {formatCurrency(deal.value)}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {deal.probability}% Win
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                          {prevStage ? (
                            <button
                              onClick={() => updateDealStage(deal.id, prevStage)}
                              className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground font-semibold"
                            >
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                          ) : (
                            <span />
                          )}

                          {nextStage && (
                            <button
                              onClick={() => updateDealStage(deal.id, nextStage)}
                              className="flex items-center gap-0.5 text-brand-500 hover:text-brand-400 font-bold ml-auto"
                            >
                              Advance <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colDeals.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List (Table) View */
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-md overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-[11px] text-muted-foreground font-semibold uppercase">
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Company Address</th>
                <th className="py-3 px-3">Contact Number</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Deal Value</th>
                <th className="py-3 px-3">Win Probability</th>
                <th className="py-3 px-3">Assigned User</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {filteredDeals.map((deal) => {
                const assignedUser = users.find((u) => u.id === deal.assignedTo);
                const nextStage = getNextStage(deal.stage);
                const prevStage = getPrevStage(deal.stage);

                return (
                  <tr key={deal.id} className="hover:bg-secondary/40 transition-colors group">
                    {/* Column 1: Customer Name & Title */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-xs truncate">
                          {deal.customerName || deal.contactName}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate" title={deal.title}>
                          {deal.title}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Company Name & Address */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Building className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="truncate">{deal.company}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate" title={deal.companyAddress}>
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{deal.companyAddress || "GIDC Tech Park, Ahmedabad"}</span>
                        </p>
                      </div>
                    </td>

                    {/* Column 3: Contact Name, Phone Number & Email */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-semibold text-foreground truncate">{deal.contactName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                          <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{deal.contactPhone || "+91 98250 12345"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 truncate">{deal.contactEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={deal.stage}
                        onChange={(e) => updateDealStage(deal.id, e.target.value as CRMStage)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-[11px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-500 text-sm">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-secondary border border-border font-semibold text-[10px]">
                        {deal.probability}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={assignedUser.avatar}
                            alt={assignedUser.name}
                            className="w-5 h-5 rounded-full object-cover border border-border"
                          />
                          <span className="truncate">{assignedUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {prevStage && (
                          <button
                            onClick={() => updateDealStage(deal.id, prevStage)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold text-[10px]"
                            title="Move to previous stage"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {nextStage && (
                          <button
                            onClick={() => updateDealStage(deal.id, nextStage)}
                            className="p-1 rounded hover:bg-brand-500/10 text-brand-500 hover:text-brand-400 font-semibold text-[10px]"
                            title="Advance to next stage"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDeal(deal.id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors ml-1"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No sales deals match the current search or stage filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <CreateDealModal />
    </div>
  );
}
