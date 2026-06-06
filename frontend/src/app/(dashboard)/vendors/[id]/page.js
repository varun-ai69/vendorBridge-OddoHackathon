"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoArrowBack, IoShieldCheckmark, IoCalendar, IoPeople, IoGlobe,
  IoLocation, IoTrash, IoCloudUpload, IoLink, IoStar, IoStarHalf,
  IoCheckmarkCircle, IoTime, IoDocumentText, IoCart, IoAlertCircle,
  IoLogoLinkedin, IoLogoFacebook, IoLogoInstagram, IoLogoYoutube,
  IoLogoTwitter, IoLogoWhatsapp, IoLogoGoogle, IoLogoPinterest, IoChevronForward,
  IoCheckmarkDoneCircle, IoWarning, IoHelpCircle
} from "react-icons/io5";
import {
  getVendorDetail,
  updateVendorDetail,
  uploadVendorMedia,
  saveVendorLink,
  deleteVendorLink,
  getCategories
} from "@/utils/api";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// Icon mapping helper for smart social links
const getPlatformConfig = (url) => {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) {
    return { name: "LinkedIn", icon: IoLogoLinkedin, color: "bg-[#0a66c2] text-white", brandColor: "#0a66c2" };
  }
  if (lower.includes("facebook.com")) {
    return { name: "Facebook", icon: IoLogoFacebook, color: "bg-[#1877f2] text-white", brandColor: "#1877f2" };
  }
  if (lower.includes("instagram.com")) {
    return { name: "Instagram", icon: IoLogoInstagram, color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white", brandColor: "#ee2a7b" };
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { name: "YouTube", icon: IoLogoYoutube, color: "bg-[#ff0000] text-white", brandColor: "#ff0000" };
  }
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return { name: "X (Twitter)", icon: IoLogoTwitter, color: "bg-black text-white", brandColor: "#000000" };
  }
  if (lower.includes("whatsapp.com") || lower.includes("wa.me")) {
    return { name: "WhatsApp", icon: IoLogoWhatsapp, color: "bg-[#25d366] text-white", brandColor: "#25d366" };
  }
  if (lower.includes("indiamart.com")) {
    return { name: "IndiaMART", icon: IoLogoGoogle, color: "bg-[#9a1c52] text-white", brandColor: "#9a1c52" }; // IndiaMART custom
  }
  if (lower.includes("pinterest.com")) {
    return { name: "Pinterest", icon: IoLogoPinterest, color: "bg-[#bd081c] text-white", brandColor: "#bd081c" };
  }
  return { name: "Website", icon: IoGlobe, color: "bg-stone-600 text-white", brandColor: "#57534e" };
};

export default function VendorProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  // Root data states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'products' | 'media' | 'performance' | 'timeline'
  const [categories, setCategories] = useState([]);

  // Edit states
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

  // Link manager states
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  // Media Library states
  const [uploadedPhotos, setUploadedPhotos] = useState([
    { id: "photo-1", name: "Corporate Office", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80", type: "office" },
    { id: "photo-2", name: "CNC Workshop Floor", url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80", type: "factory" },
    { id: "photo-3", name: "Quality Testing Lab", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80", type: "factory" }
  ]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropRatio, setCropRatio] = useState(1); // 1 = square, 2 = banner

  // Showcase product modals
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadVendorDetails();
    getCategories().then((res) => setCategories(res.categories || [])).catch(() => {});
  }, [id]);

  const loadVendorDetails = () => {
    setLoading(true);
    getVendorDetail(id)
      .then((res) => {
        setData(res);
        setEditForm(res.vendor || {});
      })
      .catch(() => {
        router.replace("/vendors");
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateVendorDetail(id, editForm);
      setEditProfileModal(false);
      loadVendorDetails();
    } catch {
      alert("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // Add Smart Link
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;
    setAddingLink(true);
    try {
      const platformConfig = getPlatformConfig(newLinkUrl);
      await saveVendorLink(id, {
        platform: platformConfig.name.toLowerCase(),
        url: newLinkUrl
      });
      setNewLinkUrl("");
      loadVendorDetails();
    } catch {
      alert("Failed to add link");
    } finally {
      setAddingLink(false);
    }
  };

  // Delete Link
  const handleDeleteLink = async (linkId) => {
    if (!confirm("Remove this link?")) return;
    try {
      await deleteVendorLink(id, linkId);
      loadVendorDetails();
    } catch {
      alert("Failed to remove link");
    }
  };

  // File Upload Handlers
  const triggerFileUpload = (ratio, type = "logo") => {
    setCropRatio(ratio);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/jpeg, image/webp, application/pdf";
    input.onchange = (e) => {
      if (e.target.files?.length) {
        setCropFile(e.target.files[0]);
        setCropModalOpen(true);
      }
    };
    input.click();
  };

  const handleSaveCroppedMedia = async () => {
    if (!cropFile) return;
    setUpdating(true);
    try {
      await uploadVendorMedia(id, cropFile);
      setCropModalOpen(false);
      setCropFile(null);
      
      // Simulate adding to office/factory photos
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedPhotos(prev => [
          ...prev,
          { id: `photo-${Date.now()}`, name: cropFile.name, url: e.target.result, type: cropRatio === 1 ? "office" : "banner" }
        ]);
      };
      reader.readAsDataURL(cropFile);
      
      alert("Media asset successfully uploaded to gallery.");
    } catch {
      alert("Upload failed");
    } finally {
      setUpdating(false);
    }
  };

  // Star rating rendering helper
  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    const half = rating - floor >= 0.4;
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<IoStar key={i} className="text-amber-500" />);
      } else if (i === floor + 1 && half) {
        stars.push(<IoStarHalf key={i} className="text-amber-500" />);
      } else {
        stars.push(<IoStar key={i} className="text-stone-300 dark:text-stone-700" />);
      }
    }
    return <div className="flex gap-0.5 text-base">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const { vendor, products, links, analytics, timeline } = data || {};

  return (
    <PageTransition>
      {/* Back Button */}
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-5 transition-colors">
        <IoArrowBack /> Back to Vendor Directory
      </Link>

      {/* Hero Section */}
      <div className="relative rounded-2xl border border-[var(--border)] bg-surface overflow-hidden shadow-sm mb-6">
        {/* Banner cover */}
        <div className="h-44 md:h-56 relative w-full bg-stone-200">
          {vendor?.banner_url ? (
            <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-amber-500/10 to-orange-500/10" />
          )}
          <button
            onClick={() => triggerFileUpload(2, "banner")}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
          >
            <IoCloudUpload /> Change Cover
          </button>
        </div>

        {/* Info panel */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Logo positioning */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-14 shrink-0">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center relative group">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <IoStorefront className="text-5xl text-accent" />
              )}
              <div
                onClick={() => triggerFileUpload(1, "logo")}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <IoCloudUpload className="text-white text-2xl" />
              </div>
            </div>

            <div className="min-w-0 pt-2 md:pb-2">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{vendor?.company_name}</h1>
                {vendor?.is_approved && (
                  <Badge color="emerald" showDot={false} className="flex items-center gap-1"><IoShieldCheckmark className="text-sm" /> Approved</Badge>
                )}
                {vendor?.premium && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm">PREMIUM</span>
                )}
              </div>
              <p className="text-sm text-muted mt-1 italic">&quot;{vendor?.tagline}&quot;</p>
              <p className="text-xs text-muted font-medium mt-2 flex items-center gap-1.5">
                <IoLocation className="text-accent" /> {vendor?.address}, {vendor?.city}, {vendor?.state}, {vendor?.country}
              </p>
            </div>
          </div>

          {/* Quick Actions / Performance summary */}
          <div className="flex flex-wrap gap-3 md:pb-2">
            <Button variant="secondary" onClick={() => setEditProfileModal(true)}>Edit Profile</Button>
            <Button variant="primary" onClick={() => router.push(`/rfq/create?vendor=${vendor?.id}`)}>Invite to RFQ</Button>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[var(--border)] text-center divide-x divide-[var(--border)] py-4 bg-stone-50/50 dark:bg-stone-900/10">
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Completed RFQs</span>
            <p className="text-xl font-bold text-foreground mt-1">{analytics?.rfqs_completed || 0}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">On-Time Delivery</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{analytics?.on_time_delivery_rate || 0}%</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Response Rate</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{analytics?.response_rate || 0}%</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Overall Rating</span>
            <p className="text-xl font-bold text-amber-500 mt-1 flex items-center justify-center gap-1">★ {vendor?.rating || "—"}</p>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] overflow-x-auto pb-px mb-6 scrollbar-none">
        {[
          { id: "overview", label: "Overview" },
          { id: "products", label: "Product Showcase" },
          { id: "media", label: "Media & Documents" },
          { id: "performance", label: "Performance Audit" },
          { id: "timeline", label: "History Timeline" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-5 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 whitespace-nowrap",
              activeTab === tab.id
                ? "border-accent text-accent font-bold"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* About Column */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-[var(--border)]">
              <h3 className="font-bold text-lg mb-3">About the Company</h3>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {vendor?.about || "No detailed business description available yet."}
              </p>
            </Card>

            {/* Smart Links Section */}
            <Card className="border border-[var(--border)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Smart Social Cards</h3>
                <span className="text-xs text-muted">Auto-detecting Link Directory</span>
              </div>

              {/* Add link form */}
              <form onSubmit={handleAddLink} className="flex gap-2 mb-6">
                <Input
                  placeholder="Paste URL: e.g. https://linkedin.com/company/profile"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  containerClassName="flex-1 !gap-0"
                  className="!py-2 bg-surface"
                />
                <Button type="submit" loading={addingLink} className="px-5">Add Link</Button>
              </form>

              {/* Links List */}
              {links.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted border border-dashed border-stone-200 dark:border-stone-850 rounded-xl">
                  No social links registered. Paste any URL to auto-generate a card.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {links.map((link) => {
                    const cfg = getPlatformConfig(link.url);
                    const LinkIcon = cfg.icon;
                    return (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-200/50 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={clsx("h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-lg", cfg.color)}>
                            <LinkIcon />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-foreground block">{cfg.name} Profile</span>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted hover:underline truncate block">
                              {link.url}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { navigator.clipboard.writeText(link.url); alert("Link copied!"); }}
                            className="p-1.5 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800 text-[10px] font-bold text-muted transition-colors"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-muted transition-colors"
                          >
                            <IoTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-4">
            <Card className="border border-[var(--border)]">
              <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-4">Corporate Specifications</h3>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-accent-muted text-accent flex items-center justify-center text-base"><IoGlobe /></div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Headquarters</span>
                    <span className="text-foreground">{vendor?.city}, {vendor?.state}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-accent-muted text-accent flex items-center justify-center text-base"><IoCalendar /></div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Established Year</span>
                    <span className="text-foreground">{vendor?.establishment_year || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-accent-muted text-accent flex items-center justify-center text-base"><IoPeople /></div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Team Size</span>
                    <span className="text-foreground">{vendor?.team_size || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-accent-muted text-accent flex items-center justify-center text-base"><IoDocumentText /></div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">GST Number</span>
                    <span className="text-foreground font-mono">{vendor?.gst_number || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-accent-muted text-accent flex items-center justify-center text-base"><IoDocumentText /></div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">PAN Number</span>
                    <span className="text-foreground font-mono">{vendor?.pan_number || "N/A"}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PRODUCTS ─── */}
      {activeTab === "products" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Product Showcase ({products.length})</h3>
            <Button variant="secondary" size="sm" icon={IoDocumentText} onClick={() => alert("Downloading Mock PDF Product Catalog...")}>
              Download Full Catalog PDF
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-[var(--border)] rounded-2xl">
              <IoCart className="text-5xl text-muted mx-auto mb-3" />
              <h3 className="font-bold text-lg">No showcased products</h3>
              <p className="text-sm text-muted mt-1">This vendor has not uploaded product showcase cards yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <Card key={prod.id} className="border border-[var(--border)] flex flex-col group overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image cover */}
                  <div className="h-44 -mx-5 -mt-5 relative overflow-hidden bg-stone-100 flex items-center justify-center border-b border-[var(--border)]">
                    {prod.images?.[0] ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <IoCart className="text-5xl text-muted" />
                    )}
                    <span className="absolute bottom-3 right-3 bg-stone-900/70 text-white font-bold text-[10px] px-2.5 py-0.5 rounded backdrop-blur-sm">
                      MOQ: {prod.moq}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="pt-4 flex-1 flex flex-col">
                    <span className="text-[9px] text-accent uppercase tracking-wider font-bold block mb-1">{prod.category}</span>
                    <h4 className="font-bold text-base text-foreground leading-snug mb-2">{prod.name}</h4>
                    <p className="text-xs text-muted line-clamp-2 min-h-[32px] mb-4">{prod.description}</p>
                    
                    <div className="flex justify-between items-center text-xs mt-auto bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded border border-stone-100 dark:border-stone-800 font-semibold mb-4">
                      <span className="text-muted">Target Price</span>
                      <span className="text-accent">{prod.price_range}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => setSelectedProduct(prod)}>View Details</Button>
                      <Button variant="primary" size="sm" className="flex-1 text-xs" onClick={() => alert(`Shortlisted ${prod.name} for RFQ.`)}>Shortlist</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: MEDIA UPLOADER ─── */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Drag & drop upload area */}
          <Card className="border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Branding Asset Management</h3>
            
            <div
              onClick={() => triggerFileUpload(1.5, "gallery")}
              className="border-2 border-dashed border-[var(--border-strong)] hover:border-accent hover:bg-accent-muted/20 cursor-pointer rounded-xl p-8 text-center transition-all"
            >
              <IoCloudUpload className="text-5xl text-accent mx-auto mb-3" />
              <h4 className="font-bold text-sm">Drag & Drop new images or PDF certificates here</h4>
              <p className="text-xs text-muted mt-1.5">Supports PNG, JPG, WEBP, and PDF up to 10MB</p>
              <Button size="sm" className="mt-4 pointer-events-none">Select File</Button>
            </div>
          </Card>

          {/* Photo library Grid */}
          <Card className="border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Office & Factory Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="group relative rounded-xl border border-stone-200 overflow-hidden bg-stone-50 aspect-square">
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition-opacity duration-300">
                    <span className="text-[10px] font-bold text-white truncate block">{photo.name}</span>
                    <button
                      onClick={() => setUploadedPhotos(uploadedPhotos.filter(p => p.id !== photo.id))}
                      className="mt-1.5 p-1 bg-red-600/80 hover:bg-red-600 rounded text-white self-start transition-colors"
                      title="Delete asset"
                    >
                      <IoTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 4: PERFORMANCE AUDIT ─── */}
      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Metrics breakdown */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-[var(--border)]">
              <h3 className="font-bold text-lg mb-4">Rating Index Breakdown</h3>

              <div className="space-y-4">
                {[
                  { name: "Delivery Speed", score: analytics?.rating_details?.delivery },
                  { name: "Product Quality", score: analytics?.rating_details?.quality },
                  { name: "Communication", score: analytics?.rating_details?.communication },
                  { name: "Price Competitiveness", score: analytics?.rating_details?.pricing },
                  { name: "Documentation", score: analytics?.rating_details?.documentation }
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground/80">{item.name}</span>
                      <span className="text-accent">{item.score || 0} / 5</span>
                    </div>
                    {/* Progress indicator */}
                    <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(item.score || 0) * 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Monthly trend chart */}
          <div className="lg:col-span-8">
            <Card className="border border-[var(--border)]">
              <h3 className="font-bold text-lg mb-4">Performance Quality Trend (Jan - Jun)</h3>

              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={analytics?.monthly_performance || []}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" fill="url(#scoreGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 5: TIMELINE HISTORY ─── */}
      {activeTab === "timeline" && (
        <Card className="border border-[var(--border)] max-w-3xl mx-auto">
          <h3 className="font-bold text-lg mb-6">Interaction Timeline History</h3>

          {timeline.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted">
              No historical ERP logs found.
            </div>
          ) : (
            <div className="relative border-l border-stone-200 dark:border-stone-850 pl-5 ml-2 space-y-6">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  {/* Timeline icon indicator */}
                  <span className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white shadow ring-4 ring-white dark:ring-stone-950 text-[9px] shrink-0 font-bold">
                    ✓
                  </span>
                  
                  <div className="text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      <span className="text-[10px] text-muted font-medium">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-muted mt-1 font-semibold">Agent: {item.performer}</p>
                    <p className="text-foreground/80 mt-1.5 font-medium leading-relaxed bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── MODAL: EDIT PROFILE ─── */}
      <Modal open={editProfileModal} onClose={() => setEditProfileModal(false)} title="Update Company Profile Specs" size="lg">
        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          <Input label="Company Name" value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} required />
          <Input label="Company Tagline" value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} />
          <Input label="Contact Person" value={editForm.contact_person} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} required />
          <Input label="Email Address" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          <Input label="Phone Number" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Website Address" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
          
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <Input label="Industry" value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
            <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            <Input label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
          </div>

          <Input label="GST Number" value={editForm.gst_number} onChange={(e) => setEditForm({ ...editForm, gst_number: e.target.value })} />
          <Input label="PAN Number" value={editForm.pan_number} onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value })} />
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-foreground/80 block">Vendor Categories</label>
            <div className="flex flex-wrap gap-2 border border-[var(--border-strong)] p-3 rounded-lg bg-surface">
              {categories.map((cat) => {
                const selected = editForm.category?.includes(cat) || false;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const current = editForm.category || [];
                      let updated;
                      if (selected) {
                        updated = current.filter(c => c !== cat);
                      } else {
                        updated = [...current, cat];
                      }
                      setEditForm({ ...editForm, category: updated });
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
          <Input label="Business Description / About" type="textarea" value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} containerClassName="sm:col-span-2" />

          <div className="sm:col-span-2 pt-2">
            <Button type="submit" loading={updating} className="w-full" size="lg">Update Profiles Details</Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: PRODUCT DETAIL MODAL ─── */}
      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name || "Product Showcase Details"} size="md">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="h-48 rounded-xl overflow-hidden border border-stone-200">
              <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] text-accent uppercase font-bold tracking-wider">{selectedProduct.category}</span>
              <h4 className="font-bold text-lg mt-0.5">{selectedProduct.name}</h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">{selectedProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-stone-50 dark:bg-stone-900/60 p-2 rounded text-center">
                <span className="text-[10px] text-muted font-semibold uppercase">Minimum Order (MOQ)</span>
                <p className="font-bold text-sm mt-0.5">{selectedProduct.moq}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/60 p-2 rounded text-center">
                <span className="text-[10px] text-muted font-semibold uppercase">Price Range</span>
                <p className="font-bold text-sm mt-0.5 text-accent">{selectedProduct.price_range}</p>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={() => { setSelectedProduct(null); alert(`Shortlisted ${selectedProduct.name} for RFQ.`); }}>
              Shortlist for Procurement RFQ
            </Button>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: BRADING ASSETS CROPPING SIMULATOR ─── */}
      <Modal open={cropModalOpen} onClose={() => { setCropModalOpen(false); setCropFile(null); }} title="Media Processing" size="md">
        {cropFile && (
          <div className="space-y-4">
            <div className="p-3 bg-accent-muted/40 text-accent text-xs font-semibold rounded">
              Crop & Align image for the {cropRatio === 1 ? "1:1 Square Logo" : "16:9 Banner Cover"} specification.
            </div>

            {/* Visual crop preview simulator */}
            <div className={clsx("mx-auto bg-stone-100 rounded-xl border border-stone-200 relative overflow-hidden flex items-center justify-center max-w-full", 
              cropRatio === 1 ? "h-40 w-40" : "h-36 w-full"
            )}>
              <span className="text-xs text-muted z-10 font-bold bg-white/70 px-2 py-0.5 rounded shadow">Simulating Crop Interface</span>
              {/* Fake grid lines */}
              <div className="absolute inset-0 border border-dashed border-accent/40 pointer-events-none grid grid-cols-3 divide-x divide-accent/30 grid-rows-3 divide-y divide-accent/30">
                <div /> <div /> <div /> <div /> <div /> <div /> <div /> <div /> <div />
              </div>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-muted font-semibold">Image: {cropFile.name} ({(cropFile.size / 1024).toFixed(0)} KB)</span>
            </div>

            <Button className="w-full" loading={updating} onClick={handleSaveCroppedMedia}>
              Save and Commit Upload
            </Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
