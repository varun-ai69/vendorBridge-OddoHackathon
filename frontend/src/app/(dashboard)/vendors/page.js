"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoStorefront, IoAdd, IoSearch, IoGrid, IoList, IoFilter,
  IoBookmark, IoBookmarkOutline, IoBriefcase, IoPersonAdd,
  IoCheckmarkCircle, IoTime, IoEllipsisVertical, IoClose, IoChatboxEllipses,
  IoChevronForward, IoChevronBack, IoCreate, IoFlame, IoSend, IoDocumentText
} from "react-icons/io5";
import {
  getMarketplaceVendors,
  assignVendor,
  getEmployeeVendors,
  getUsers,
  getRfqs,
  assignVendorsToRfq,
  createVendor,
  updateVendorStatus,
  getCategories,
  createCategory,
  deleteCategory
} from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card, { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function VendorsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Navigation tabs: 'directory', 'my-vendors', 'assignment'
  const [activeTab, setActiveTab] = useState("directory");

  // State for Marketplace Directory
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // Categories states
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Modals & Forms
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [msgModalOpen, setMsgModalOpen] = useState(false);

  // Focus entity states
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]); // for bulk
  const [employees, setEmployees] = useState([]);
  const [rfqs, setRfqs] = useState([]);

  // Input states for actions
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [assignmentStatus, setAssignmentStatus] = useState("assigned");

  // Add Vendor Form
  const [form, setForm] = useState({
    company_name: "", tagline: "", contact_person: "", email: "", phone: "",
    address: "", city: "", state: "", gst_number: "", pan_number: "",
    category: [], industry: "Manufacturing", website: "", about: "",
    generated_password: "Password@123", premium: false
  });
  const [saving, setSaving] = useState(false);

  // My Vendors States
  const [myVendors, setMyVendors] = useState([]);
  const [myVendorsLoading, setMyVendorsLoading] = useState(false);

  // Kanban Assignments Status Columns
  const kanbanColumns = [
    { id: "assigned", label: "Assigned", color: "slate" },
    { id: "active", label: "Active", color: "blue" },
    { id: "pending", label: "Pending RFQ", color: "cyan" },
    { id: "negotiation", label: "In Negotiation", color: "amber" },
    { id: "converted", label: "Converted", color: "emerald" },
    { id: "closed", label: "Closed", color: "red" }
  ];

  const isAdminOrProcurement = ["admin", "procurement_officer"].includes(user?.role);

  useEffect(() => {
    if (!user) return;
    loadMarketplace();
    loadMyVendors();
    loadEmployees();
    loadRfqs();
    loadCategories();

    // Read bookmarks from localStorage
    const saved = localStorage.getItem("vb_bookmarked_vendors");
    if (saved) {
      try { setBookmarks(JSON.parse(saved)); } catch (e) {}
    }
  }, [user, search, industry, categoryFilter, city, ratingFilter, gstVerified, premiumOnly]);

  const loadCategories = () => {
    getCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  };

  const loadMarketplace = () => {
    setLoading(true);
    getMarketplaceVendors({
      search,
      industry,
      category: categoryFilter,
      city,
      rating: ratingFilter,
      gst_verified: gstVerified ? "true" : "",
      premium: premiumOnly ? "true" : "",
      limit: 100
    })
      .then((res) => {
        setVendors(res.vendors || []);
      })
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  const loadMyVendors = () => {
    if (!user) return;
    setMyVendorsLoading(true);
    // Use user role suffix or admin
    const empId = user.role === "admin" ? "user-admin" : "user-procurement_officer";
    getEmployeeVendors(empId)
      .then((res) => {
        setMyVendors(res.vendors || []);
      })
      .catch(() => setMyVendors([]))
      .finally(() => setMyVendorsLoading(false));
  };

  const loadEmployees = () => {
    getUsers({ limit: 100 })
      .then((res) => {
        // filter out vendors from list of employees
        const list = (res.users || []).filter(u => u.role !== "vendor");
        setEmployees(list);
      })
      .catch(() => {});
  };

  const loadRfqs = () => {
    getRfqs()
      .then((res) => {
        setRfqs(res.rfqs || []);
      })
      .catch(() => {});
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: form.category.length > 0 ? form.category : ["General"],
        rating: 4.0,
        rfqs_completed: 0,
        response_rate: 100,
        created_at: new Date().toISOString()
      };
      await createVendor(payload);
      setAddModalOpen(false);
      loadMarketplace();
      // reset form
      setForm({
        company_name: "", tagline: "", contact_person: "", email: "", phone: "",
        address: "", city: "", state: "", gst_number: "", pan_number: "",
        category: [], industry: "Manufacturing", website: "", about: "",
        generated_password: "Password@123", premium: false
      });
    } catch (err) {
      alert(err.message || "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  };

  // Bookmark Toggle
  const toggleBookmark = (id) => {
    let updated;
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter(b => b !== id);
    } else {
      updated = [...bookmarks, id];
    }
    setBookmarks(updated);
    localStorage.setItem("vb_bookmarked_vendors", JSON.stringify(updated));
  };

  // Assign Vendor API Action
  const handleAssign = async () => {
    if (!selectedVendor || !selectedEmployeeId) return;
    try {
      await assignVendor({
        vendorId: selectedVendor.id,
        employeeId: selectedEmployeeId,
        status: assignmentStatus
      });
      setAssignModalOpen(false);
      loadMarketplace();
      loadMyVendors();
    } catch (err) {
      alert("Failed to assign vendor");
    }
  };

  // Move Kanban column
  const moveKanban = async (vendorId, status) => {
    const empId = user.role === "admin" ? "user-admin" : "user-procurement_officer";
    try {
      await assignVendor({
        vendorId,
        employeeId: empId,
        status
      });
      loadMarketplace();
      loadMyVendors();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Invite Vendor to RFQ Action
  const handleInviteToRfq = async () => {
    if (!selectedVendor || !selectedRfqId) return;
    try {
      await assignVendorsToRfq(selectedRfqId, [selectedVendor.id]);
      setRfqModalOpen(false);
      alert("Vendor successfully invited to RFQ");
    } catch (err) {
      alert("Failed to invite to RFQ");
    }
  };

  // Bulk assignment action
  const handleBulkAssign = async () => {
    if (!selectedEmployeeId || selectedVendors.length === 0) return;
    try {
      await Promise.all(
        selectedVendors.map(vid =>
          assignVendor({
            vendorId: vid,
            employeeId: selectedEmployeeId,
            status: "assigned"
          })
        )
      );
      setBulkModalOpen(false);
      setSelectedVendors([]);
      loadMarketplace();
      loadMyVendors();
      alert(`Assigned ${selectedVendors.length} vendors to employee`);
    } catch (e) {
      alert("Bulk assignment failed");
    }
  };

  const toggleSelectVendorForBulk = (vid) => {
    if (selectedVendors.includes(vid)) {
      setSelectedVendors(selectedVendors.filter(id => id !== vid));
    } else {
      setSelectedVendors([...selectedVendors, vid]);
    }
  };

  // Chat window simulator
  const startChat = (vendor) => {
    setSelectedVendor(vendor);
    setMessageText("");
    setChatHistory([
      { sender: "vendor", text: `Hello! Thanks for reaching out. This is ${vendor.contact_person} from ${vendor.company_name}. How can we support your procurement requirements today?`, time: "10:30 AM" }
    ]);
    setMsgModalOpen(true);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const userMsg = { sender: "user", text: messageText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory(prev => [...prev, userMsg]);
    const inputMsg = messageText;
    setMessageText("");

    setTimeout(() => {
      let replyText = "Understood. I will check with our logistics team and share a formal response.";
      if (inputMsg.toLowerCase().includes("rfq") || inputMsg.toLowerCase().includes("quote")) {
        replyText = "Sure, please send us the RFQ details through the platform. We will review the bill of materials and submit our best quotation within 24 hours.";
      } else if (inputMsg.toLowerCase().includes("price") || inputMsg.toLowerCase().includes("discount")) {
        replyText = "We offer volume-based discounts for TMT rebars. For orders above 50 metric tons, we can offer an additional 3% discount.";
      }
      setChatHistory(prev => [...prev, { sender: "vendor", text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1000);
  };

  return (
    <PageTransition>
      {/* Upper Navigation Tabs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-sm text-muted">Discover suppliers, assign pipelines, and collaborate on RFQs</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-surface-elevated p-1 rounded-xl border border-[var(--border)] self-start md:self-auto">
          {[
            { id: "directory", label: "Vendor Directory", icon: IoStorefront },
            { id: "my-vendors", label: "My Vendors", icon: IoBriefcase },
            ...(isAdminOrProcurement ? [{ id: "assignment", label: "Assignment Kanban", icon: IoPersonAdd }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                activeTab === tab.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-accent-muted/40"
              )}
            >
              <tab.icon className="text-base" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: DIRECTORY / MARKETPLACE ─── */}
      {activeTab === "directory" && (
        <div>
          {/* Advanced Filter Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6 bg-surface-elevated/40 p-4 rounded-xl border border-[var(--border)] backdrop-blur-sm">
            {/* Search */}
            <div className="lg:col-span-3">
              <Input
                icon={IoSearch}
                placeholder="Search vendor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!py-2 bg-surface"
                containerClassName="!gap-0"
              />
            </div>
            
            {/* Category */}
            <div className="lg:col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-[41px] rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="lg:col-span-2">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-[41px] rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">All Locations</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>

            {/* Rating */}
            <div className="lg:col-span-2">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full h-[41px] rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Any Rating</option>
                <option value="4.0">★ 4.0+ Stars</option>
                <option value="4.5">★ 4.5+ Stars</option>
              </select>
            </div>

            {/* View Toggle and Controls */}
            <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-2">
              <Button
                variant="secondary"
                className="!p-2.5 h-[41px]"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
              >
                {viewMode === "grid" ? <IoList className="text-lg" /> : <IoGrid className="text-lg" />}
              </Button>
              {user?.role === "admin" && (
                <Button
                  variant="secondary"
                  className="h-[41px] text-xs font-semibold px-2.5"
                  onClick={() => setCatModalOpen(true)}
                >
                  Manage Categories
                </Button>
              )}
              {isAdminOrProcurement && (
                <Button
                  icon={IoAdd}
                  className="h-[41px]"
                  onClick={() => setAddModalOpen(true)}
                >
                  Create Vendor
                </Button>
              )}
            </div>

            {/* Extra checkboxes */}
            <div className="lg:col-span-12 flex flex-wrap gap-4 mt-2 pt-2 border-t border-[var(--border)]/40 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={gstVerified}
                  onChange={(e) => setGstVerified(e.target.checked)}
                  className="rounded border-[var(--border-strong)] text-accent focus:ring-accent/20 h-4 w-4"
                />
                <span>GST Verified Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={premiumOnly}
                  onChange={(e) => setPremiumOnly(e.target.checked)}
                  className="rounded border-[var(--border-strong)] text-accent focus:ring-accent/20 h-4 w-4"
                />
                <span>Premium Badged Vendors</span>
              </label>
              {selectedVendors.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-semibold text-accent">{selectedVendors.length} selected</span>
                  <Button size="sm" onClick={() => setBulkModalOpen(true)}>Bulk Assign</Button>
                </div>
              )}
            </div>
          </div>

          {/* Directory Listings */}
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-[var(--border)] rounded-2xl">
              <IoStorefront className="text-5xl text-muted mx-auto mb-3" />
              <h3 className="font-bold text-lg">No vendors matched your filters</h3>
              <p className="text-sm text-muted mt-1">Try resetting search query or filtering parameters.</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor, idx) => {
                const bookmarked = bookmarks.includes(vendor.id);
                const selectedForBulk = selectedVendors.includes(vendor.id);
                return (
                  <Card
                    key={vendor.id}
                    delay={idx * 0.04}
                    accent={vendor.premium}
                    className="flex flex-col relative overflow-hidden group hover:shadow-md transition-all border-[var(--border)] border"
                  >
                    {/* Header Image Cover */}
                    <div className="h-28 -mx-5 -mt-5 relative overflow-hidden bg-stone-200">
                      {vendor.banner_url ? (
                        <img src={vendor.banner_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-amber-500/20 to-orange-500/20" />
                      )}
                      {vendor.premium && (
                        <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm tracking-wider uppercase">
                          PREMIUM
                        </span>
                      )}
                    </div>

                    {/* Logo & Info Header */}
                    <div className="flex items-end gap-3 -mt-8 mb-3 z-10 px-1">
                      <div className="h-16 w-16 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <IoStorefront className="text-3xl text-accent" />
                        )}
                      </div>
                      <div className="min-w-0 pb-1">
                        <div className="flex items-center gap-1.5">
                          <h3
                            onClick={() => router.push(`/vendors/${vendor.id}`)}
                            className="font-bold text-base hover:text-accent cursor-pointer truncate leading-snug"
                          >
                            {vendor.company_name}
                          </h3>
                          {vendor.is_approved && (
                            <Badge color="emerald" showDot={false} className="!px-1 py-0 text-[9px]">Verified</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted font-medium">{vendor.industry} · {vendor.city}</p>
                      </div>
                    </div>

                    {/* Body tagline & metrics */}
                    <p className="text-xs text-muted line-clamp-2 min-h-[32px] px-1 mb-4 italic">
                      &quot;{vendor.tagline || "Quality industrial supplier & vendor partner."}&quot;
                    </p>

                    {/* Ratings & Completed RFQs info */}
                    <div className="grid grid-cols-3 gap-2 bg-stone-50 dark:bg-stone-900/40 rounded-lg p-2 text-center text-[11px] mb-4">
                      <div>
                        <p className="text-muted font-medium">Rating</p>
                        <p className="font-bold mt-0.5 text-amber-700 dark:text-amber-400">★ {vendor.rating || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted font-medium">Response</p>
                        <p className="font-bold mt-0.5 text-foreground">{vendor.response_rate ? `${vendor.response_rate}%` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted font-medium">RFQs Done</p>
                        <p className="font-bold mt-0.5 text-foreground">{vendor.rfqs_completed || "0"}</p>
                      </div>
                    </div>

                    {/* Top Products tags */}
                    <div className="flex flex-wrap gap-1 mb-5 px-1 mt-auto">
                      {(vendor.top_products || vendor.category || []).slice(0, 3).map((prod) => (
                        <span key={prod} className="bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded font-medium">
                          {prod}
                        </span>
                      ))}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]/40 mt-auto">
                      {isAdminOrProcurement && (
                        <input
                          type="checkbox"
                          checked={selectedForBulk}
                          onChange={() => toggleSelectVendorForBulk(vendor.id)}
                          className="mr-1 rounded border-[var(--border-strong)] text-accent focus:ring-accent/20 h-5 w-5 self-center cursor-pointer"
                          title="Select for Bulk Assignment"
                        />
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-[11px]"
                        onClick={() => router.push(`/vendors/${vendor.id}`)}
                      >
                        Profile
                      </Button>

                      {isAdminOrProcurement && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="!p-2"
                          onClick={() => { setSelectedVendor(vendor); setSelectedEmployeeId(""); setAssignModalOpen(true); }}
                          title="Assign to Agent/Pipeline"
                        >
                          <IoPersonAdd className="text-sm" />
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-[11px]"
                        onClick={() => { setSelectedVendor(vendor); setSelectedRfqId(rfqs[0]?.id || ""); setRfqModalOpen(true); }}
                      >
                        Invite RFQ
                      </Button>

                      <button
                        onClick={() => toggleBookmark(vendor.id)}
                        className="p-2 rounded-lg border border-[var(--border-strong)] hover:bg-accent-muted text-muted hover:text-accent transition-colors"
                      >
                        {bookmarked ? <IoBookmark className="text-accent text-sm" /> : <IoBookmarkOutline className="text-sm" />}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-stone-50 dark:bg-stone-900/20 text-xs font-semibold uppercase text-muted">
                    {isAdminOrProcurement && <th className="px-4 py-3 w-10"></th>}
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Industry</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-center">Response Rate</th>
                    <th className="px-4 py-3 text-center">Completed RFQs</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => {
                    const selectedForBulk = selectedVendors.includes(vendor.id);
                    return (
                      <tr key={vendor.id} className="border-b border-[var(--border)] last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-900/10">
                        {isAdminOrProcurement && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedForBulk}
                              onChange={() => toggleSelectVendorForBulk(vendor.id)}
                              className="rounded border-[var(--border-strong)] text-accent h-4 w-4 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded border border-stone-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                              {vendor.logo_url ? (
                                <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <IoStorefront className="text-lg text-accent" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span onClick={() => router.push(`/vendors/${vendor.id}`)} className="font-bold text-foreground hover:text-accent cursor-pointer">{vendor.company_name}</span>
                                {vendor.premium && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-[8px] px-1.5 py-0.2 rounded">PREMIUM</span>}
                              </div>
                              <span className="text-xs text-muted italic line-clamp-1">{vendor.tagline}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground/80 font-medium">{vendor.industry}</td>
                        <td className="px-4 py-3 text-xs text-muted font-medium">{vendor.city}, {vendor.state}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-700 dark:text-amber-400">★ {vendor.rating || "—"}</td>
                        <td className="px-4 py-3 text-center font-medium">{vendor.response_rate ? `${vendor.response_rate}%` : "—"}</td>
                        <td className="px-4 py-3 text-center font-medium">{vendor.rfqs_completed || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => router.push(`/vendors/${vendor.id}`)}>Profile</Button>
                            {isAdminOrProcurement && (
                              <Button size="sm" variant="secondary" className="!p-1.5" onClick={() => { setSelectedVendor(vendor); setSelectedEmployeeId(""); setAssignModalOpen(true); }} title="Assign Vendor"><IoPersonAdd /></Button>
                            )}
                            <Button size="sm" onClick={() => { setSelectedVendor(vendor); setSelectedRfqId(rfqs[0]?.id || ""); setRfqModalOpen(true); }}>Invite</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: MY VENDORS DASHBOARD ─── */}
      {activeTab === "my-vendors" && (
        <div>
          {myVendorsLoading ? (
            <div className="flex justify-center py-20">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <div>
              {/* Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Assigned Vendors" value={myVendors.length} icon={IoStorefront} delay={0.05} />
                <StatCard title="Active Agreements" value={myVendors.filter(v => v.assignment?.status === 'active').length} icon={IoCheckmarkCircle} delay={0.1} />
                <StatCard title="Negotiations Pending" value={myVendors.filter(v => v.assignment?.status === 'negotiation').length} icon={IoTime} delay={0.15} />
                <StatCard title="Converted Suppliers" value={myVendors.filter(v => v.assignment?.status === 'converted').length} icon={IoFlame} delay={0.2} />
              </div>

              {/* Vendor Relations Grid */}
              <h2 className="text-lg font-bold mb-4">My Relationships ({myVendors.length})</h2>
              {myVendors.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-[var(--border)] rounded-2xl">
                  <IoBriefcase className="text-5xl text-muted mx-auto mb-3" />
                  <h3 className="font-bold text-lg">No assigned vendors</h3>
                  <p className="text-sm text-muted mt-1">Assign vendors from the Vendor Directory tab to track them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myVendors.map((vendor, idx) => (
                    <Card key={vendor.id} delay={idx * 0.05} className="border border-[var(--border)] hover:shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg border border-stone-200 bg-white overflow-hidden flex items-center justify-center">
                            {vendor.logo_url ? (
                              <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <IoStorefront className="text-2xl text-accent" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-base hover:text-accent cursor-pointer" onClick={() => router.push(`/vendors/${vendor.id}`)}>{vendor.company_name}</h3>
                            <p className="text-xs text-muted font-medium">{vendor.city} · GST Verified</p>
                          </div>
                        </div>
                        <Badge color={
                          vendor.assignment?.status === "active" ? "blue" :
                          vendor.assignment?.status === "converted" ? "emerald" :
                          vendor.assignment?.status === "negotiation" ? "amber" : "slate"
                        }>
                          {vendor.assignment?.status?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs border-y border-[var(--border)]/40 py-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted">Contact Person</span>
                          <span className="font-medium text-foreground">{vendor.contact_person}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Assigned On</span>
                          <span className="font-medium text-foreground">{vendor.assignment?.date_assigned || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">GST Number</span>
                          <span className="font-medium text-foreground font-mono">{vendor.gst_number || "Pending"}</span>
                        </div>
                      </div>

                      {/* Relationship actions */}
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1 text-[11px]" onClick={() => router.push(`/vendors/${vendor.id}`)}>View Profile</Button>
                        <Button variant="secondary" size="sm" className="!p-2 text-accent" onClick={() => startChat(vendor)} title="Simulate Messages"><IoChatboxEllipses className="text-sm" /></Button>
                        <Button variant="primary" size="sm" className="flex-1 text-[11px]" onClick={() => router.push(`/rfq/create?vendor=${vendor.id}`)}>Create RFQ</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: KANBAN PIPELINE / ASSIGNMENT CENTER ─── */}
      {activeTab === "assignment" && isAdminOrProcurement && (
        <div>
          {/* Top panel actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">Vendor Procurement Pipeline</h2>
            <div className="flex items-center gap-3">
              {selectedVendors.length > 0 && (
                <Button variant="primary" icon={IoPersonAdd} onClick={() => setBulkModalOpen(true)}>
                  Bulk Assign ({selectedVendors.length})
                </Button>
              )}
            </div>
          </div>

          {/* Kanban Board columns wrapper */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin min-h-[60vh] -mx-4 px-4 lg:-mx-6 lg:px-6">
            {kanbanColumns.map((col) => {
              // Get vendors associated with this status assignment
              const colVendors = vendors.filter((v) => {
                // If a vendor doesn't have an assignment but col is "assigned", maybe it's not showing, 
                // but we map existing assignments from store
                const assignment = myVendors.find(a => a.id === v.id)?.assignment;
                const status = assignment ? assignment.status : "assigned"; // default is assigned
                
                // If the vendor is approved but not assigned, it can show in 'assigned' column or 'none' column.
                // Let's filter by matching status.
                return status === col.id;
              });

              return (
                <div key={col.id} className="w-80 shrink-0 bg-stone-50 dark:bg-stone-900/40 rounded-xl p-3 border border-[var(--border)]/60 flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx("h-2.5 w-2.5 rounded-full", 
                        col.color === "slate" && "bg-stone-400",
                        col.color === "blue" && "bg-blue-500",
                        col.color === "cyan" && "bg-cyan-500",
                        col.color === "amber" && "bg-amber-500",
                        col.color === "emerald" && "bg-emerald-500",
                        col.color === "red" && "bg-red-500"
                      )} />
                      <span className="font-bold text-sm text-foreground">{col.label}</span>
                    </div>
                    <span className="bg-stone-200/60 dark:bg-stone-800 text-[10px] text-muted font-bold px-2 py-0.5 rounded-full">
                      {colVendors.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="flex-1 space-y-3 overflow-y-auto scrollbar-none max-h-[55vh]">
                    {colVendors.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                        Empty column
                      </div>
                    ) : (
                      colVendors.map((vendor) => {
                        const assignDetails = myVendors.find(a => a.id === vendor.id)?.assignment;
                        return (
                          <div
                            key={vendor.id}
                            className="bg-surface rounded-lg p-3 border border-[var(--border)]/70 shadow-sm relative group hover:border-accent/50 transition-colors"
                          >
                            {/* Logo + Company */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 rounded overflow-hidden bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                                {vendor.logo_url ? (
                                  <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <IoStorefront className="text-base text-accent" />
                                )}
                              </div>
                              <span
                                className="font-bold text-xs hover:text-accent cursor-pointer truncate"
                                onClick={() => router.push(`/vendors/${vendor.id}`)}
                              >
                                {vendor.company_name}
                              </span>
                            </div>

                            {/* Tagline & Categories */}
                            <p className="text-[10px] text-muted line-clamp-1 mb-2 italic">&quot;{vendor.tagline || "Supplier"}&quot;</p>
                            
                            {/* Assigned Agent info */}
                            <div className="flex items-center justify-between text-[9px] bg-stone-50 dark:bg-stone-900/60 p-1.5 rounded mb-3 border border-stone-100 dark:border-stone-800">
                              <span className="text-muted">Agent:</span>
                              <span className="font-bold text-foreground truncate">{assignDetails?.employee_name || "Unassigned"}</span>
                            </div>

                            {/* Move controls simulator */}
                            <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]/20 mt-2">
                              {/* Move Left */}
                              <button
                                disabled={col.id === "assigned"}
                                onClick={() => {
                                  const idx = kanbanColumns.findIndex(c => c.id === col.id);
                                  if (idx > 0) moveKanban(vendor.id, kanbanColumns[idx - 1].id);
                                }}
                                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-muted disabled:opacity-30 transition-colors"
                                title="Move Left"
                              >
                                <IoChevronBack className="text-xs" />
                              </button>

                              <span className="text-[9px] text-muted uppercase tracking-wider font-semibold">Change Stage</span>

                              {/* Move Right */}
                              <button
                                disabled={col.id === "closed"}
                                onClick={() => {
                                  const idx = kanbanColumns.findIndex(c => c.id === col.id);
                                  if (idx < kanbanColumns.length - 1) moveKanban(vendor.id, kanbanColumns[idx + 1].id);
                                }}
                                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-muted disabled:opacity-30 transition-colors"
                                title="Move Right"
                              >
                                <IoChevronForward className="text-xs" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD VENDOR ─── */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create New Vendor Profile" size="lg">
        <form onSubmit={handleCreateVendor} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin">
          <Input label="Company Name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
          <Input label="Tagline / Catchphrase" placeholder="e.g. Quality Iron castings" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Website URL" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>

          <Input label="GST Number" placeholder="e.g. 27AAAPL1234C1Z5" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
          <Input label="PAN Number" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} />
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-foreground/80 block">Vendor Categories</label>
            <div className="flex flex-wrap gap-2 border border-[var(--border-strong)] p-3 rounded-lg bg-surface">
              {categories.map((cat) => {
                const selected = form.category.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      let updated;
                      if (selected) {
                        updated = form.category.filter(c => c !== cat);
                      } else {
                        updated = [...form.category, cat];
                      }
                      setForm({ ...form, category: updated });
                    }}
                    className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer",
                      selected
                        ? "bg-accent text-white border-accent-hover/30"
                        : "bg-stone-50 dark:bg-stone-900 text-muted border-stone-200/50 hover:bg-stone-100 dark:hover:bg-stone-850 dark:text-stone-300"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Business Description / About" type="textarea" placeholder="Detail the business operations, machinery, etc." value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} containerClassName="sm:col-span-2" />
          
          <div className="sm:col-span-2 flex items-center gap-4 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-lg border border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={form.premium}
                onChange={(e) => setForm({ ...form, premium: e.target.checked })}
                className="rounded text-accent focus:ring-accent/20 h-4 w-4"
              />
              <span>Mark as Premium Vendor Partner</span>
            </label>
          </div>

          <div className="sm:col-span-2 pt-2">
            <Button type="submit" loading={saving} className="w-full" size="lg">Create Profile & Invite Vendor</Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: ASSIGN VENDOR ─── */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Vendor to Agent/Pipeline" size="md">
        {selectedVendor && (
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-[var(--border)] flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded border overflow-hidden flex items-center justify-center">
                <img src={selectedVendor.logo_url} alt="" className="object-cover h-full w-full" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{selectedVendor.company_name}</h4>
                <p className="text-xs text-muted">{selectedVendor.city} · {selectedVendor.industry}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-2 block">Select Employee Manager</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Choose Employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-2 block">Initial Pipeline Stage</label>
              <select
                value={assignmentStatus}
                onChange={(e) => setAssignmentStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                {kanbanColumns.map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>

            <Button className="w-full mt-4" onClick={handleAssign} disabled={!selectedEmployeeId}>
              Confirm Relationship Assignment
            </Button>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 3: INVITE TO RFQ ─── */}
      <Modal open={rfqModalOpen} onClose={() => setRfqModalOpen(false)} title="Invite Vendor to RFQ" size="md">
        {selectedVendor && (
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-[var(--border)] flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded border overflow-hidden flex items-center justify-center">
                <img src={selectedVendor.logo_url} alt="" className="object-cover h-full w-full" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{selectedVendor.company_name}</h4>
                <p className="text-xs text-muted">{selectedVendor.city} · {selectedVendor.industry}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-2 block">Select Active RFQ</label>
              <select
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Choose RFQ...</option>
                {rfqs.filter(r => r.status === 'sent').map(r => (
                  <option key={r.id} value={r.id}>{r.rfq_number} — {r.title}</option>
                ))}
              </select>
            </div>

            <Button className="w-full mt-4" onClick={handleInviteToRfq} disabled={!selectedRfqId}>
              Send Formal Invitation Link
            </Button>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 4: BULK ASSIGN ─── */}
      <Modal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Relationship Assignment" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-accent-muted/40 text-accent rounded-lg text-xs font-semibold">
            You are bulk assigning {selectedVendors.length} selected vendors to a procurement manager.
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block">Select Employee Manager</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="">Choose Employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <Button className="w-full mt-4" onClick={handleBulkAssign} disabled={!selectedEmployeeId}>
            Assign {selectedVendors.length} Vendors
          </Button>
        </div>
      </Modal>

      {/* ─── MODAL 5: SIMULATE MESSAGES ─── */}
      <Modal open={msgModalOpen} onClose={() => setMsgModalOpen(false)} title={selectedVendor ? `Collaboration Channel: ${selectedVendor.company_name}` : "Chat"} size="lg">
        {selectedVendor && (
          <div className="flex flex-col h-[55vh]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 p-1 scrollbar-thin">
              {chatHistory.map((chat, i) => (
                <div key={i} className={clsx("flex flex-col max-w-[70%]", chat.sender === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={clsx("rounded-xl p-3 text-sm", 
                    chat.sender === "user" 
                      ? "bg-accent text-white rounded-tr-none" 
                      : "bg-stone-100 dark:bg-stone-850 text-foreground border border-stone-200/50 dark:border-stone-800/40 rounded-tl-none"
                  )}>
                    {chat.text}
                  </div>
                  <span className="text-[9px] text-muted mt-1 px-1">{chat.time}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={sendChatMessage} className="flex gap-2 pt-3 border-t border-[var(--border)] mt-auto">
              <input
                type="text"
                placeholder="Ask about catalogs, logistics details, discounts..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <Button type="submit" icon={IoSend} className="px-4">Send</Button>
            </form>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 6: MANAGE CATEGORIES ─── */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="Manage Categories" size="md">
        <div className="space-y-4">
          {/* Add Category Form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newCatName.trim()) return;
            try {
              await createCategory(newCatName.trim());
              setNewCatName("");
              loadCategories();
            } catch (err) {
              alert("Failed to add category");
            }
          }} className="flex gap-2">
            <Input
              placeholder="e.g. Raw Materials"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              containerClassName="flex-1 !gap-0"
              className="!py-2 bg-surface"
              required
            />
            <Button type="submit" icon={IoAdd} className="px-4">Add</Button>
          </form>

          {/* List Categories */}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Existing Categories</label>
            {categories.length === 0 ? (
              <p className="text-xs text-muted italic">No custom categories created.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-850 border border-stone-200/50 dark:border-stone-800/40 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete category "${cat}"? This will not remove categories from existing vendors.`)) return;
                        try {
                          await deleteCategory(cat);
                          loadCategories();
                        } catch (err) {
                          alert("Failed to delete category");
                        }
                      }}
                      className="ml-1 p-0.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
                    >
                      <IoClose className="text-[10px]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

    </PageTransition>
  );
}
