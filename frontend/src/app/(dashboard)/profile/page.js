"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoShieldCheckmark, IoCalendar, IoPeople, IoGlobe,
  IoLocation, IoTrash, IoCloudUpload, IoLink, IoStar, IoStarHalf,
  IoDocumentText, IoCart, IoAdd, IoClose,
  IoLogoLinkedin, IoLogoFacebook, IoLogoInstagram, IoLogoYoutube,
  IoLogoTwitter, IoLogoWhatsapp, IoLogoGoogle, IoLogoPinterest
} from "react-icons/io5";
import {
  getVendorProfile,
  getVendorDetail,
  updateVendorDetail,
  uploadVendorMedia,
  saveVendorLink,
  deleteVendorLink,
  getCategories,
  createVendorProduct,
  deleteVendorProduct
} from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/format";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
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
    return { name: "Instagram", icon: IoLogoInstagram, color: "bg-linear-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white", brandColor: "#ee2a7b" };
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
    return { name: "IndiaMART", icon: IoLogoGoogle, color: "bg-[#9a1c52] text-white", brandColor: "#9a1c52" };
  }
  if (lower.includes("pinterest.com")) {
    return { name: "Pinterest", icon: IoLogoPinterest, color: "bg-[#bd081c] text-white", brandColor: "#bd081c" };
  }
  return { name: "Website", icon: IoGlobe, color: "bg-stone-600 text-white", brandColor: "#57534e" };
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Root data states
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'products' | 'media' | 'performance' | 'timeline'
  const [categories, setCategories] = useState([]);

  // Edit profile states
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
  const [addProductModal, setAddProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProductForm, setNewProductForm] = useState({
    name: "", category: "Raw Materials", moq: "100 Units", price_range: "₹500 - ₹800 per Unit", description: "", imagePreset: "machinery"
  });

  // Preset images for product showcase simulation
  const imagePresets = {
    machinery: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80",
    steel: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80",
    electronics: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80",
    metals: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=300&auto=format&fit=crop&q=80"
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "vendor") {
      router.replace("/dashboard");
      return;
    }
    loadProfileDetails();
    getCategories().then((res) => setCategories(res.categories || [])).catch(() => {});
  }, [user]);

  const loadProfileDetails = async () => {
    setLoading(true);
    try {
      const basicProfile = await getVendorProfile();
      if (basicProfile) {
        const fullDetail = await getVendorDetail(basicProfile.id);
        setVendorData(fullDetail);
        setEditForm(fullDetail.vendor || {});
      }
    } catch (err) {
      console.error("Failed to load vendor details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateVendorDetail(vendorData.vendor.id, editForm);
      setEditProfileModal(false);
      loadProfileDetails();
    } catch {
      alert("Failed to update profile details");
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
      await saveVendorLink(vendorData.vendor.id, {
        platform: platformConfig.name.toLowerCase(),
        url: newLinkUrl
      });
      setNewLinkUrl("");
      loadProfileDetails();
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
      await deleteVendorLink(vendorData.vendor.id, linkId);
      loadProfileDetails();
    } catch {
      alert("Failed to remove link");
    }
  };

  // File Upload Handlers
  const triggerFileUpload = (ratio, type = "logo") => {
    setCropRatio(ratio);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/jpeg, image/webp";
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
      await uploadVendorMedia(vendorData.vendor.id, cropFile);
      setCropModalOpen(false);
      setCropFile(null);

      // Simulate readers for immediate visual update
      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = e.target.result;
        if (cropRatio === 1) {
          await updateVendorDetail(vendorData.vendor.id, { logo_url: url });
        } else if (cropRatio === 2) {
          await updateVendorDetail(vendorData.vendor.id, { banner_url: url });
        } else {
          setUploadedPhotos(prev => [
            ...prev,
            { id: `photo-${Date.now()}`, name: cropFile.name, url, type: "office" }
          ]);
        }
        loadProfileDetails();
      };
      reader.readAsDataURL(cropFile);
      alert("Asset uploaded successfully");
    } catch {
      alert("Upload failed");
    } finally {
      setUpdating(false);
    }
  };

  // Create Product in Showcase
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const selectedImage = imagePresets[newProductForm.imagePreset] || imagePresets.machinery;
      await createVendorProduct(vendorData.vendor.id, {
        name: newProductForm.name,
        category: newProductForm.category,
        moq: newProductForm.moq,
        price_range: newProductForm.price_range,
        description: newProductForm.description,
        image: selectedImage
      });
      setAddProductModal(false);
      setNewProductForm({
        name: "", category: "Raw Materials", moq: "100 Units", price_range: "₹500 - ₹800 per Unit", description: "", imagePreset: "machinery"
      });
      loadProfileDetails();
      alert("Product successfully added to showcase.");
    } catch {
      alert("Failed to add product");
    } finally {
      setUpdating(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to remove this product from your showcase?")) return;
    try {
      await deleteVendorProduct(vendorData.vendor.id, productId);
      loadProfileDetails();
    } catch {
      alert("Failed to delete product");
    }
  };

  // Star rendering
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

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!vendorData) return null;

  const { vendor, products, links, analytics, timeline } = vendorData;

  return (
    <PageTransition>
      {/* Header Info */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vendor Profile Designer</h1>
          <p className="text-sm text-muted">Customize and build the page seen by procurement officers.</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 font-semibold flex items-center gap-1.5">
          <IoShieldCheckmark className="text-sm" /> Live Seeding & Sync Mode Active
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl border border-(--border) bg-surface overflow-hidden shadow-sm mb-6">
        {/* Banner cover */}
        <div className="h-44 md:h-56 relative w-full bg-stone-200">
          {vendor?.banner_url ? (
            <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to- from-amber-500/10 to-orange-500/10" />
          )}
          <button
            onClick={() => triggerFileUpload(2, "banner")}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
          >
            <IoCloudUpload /> Change Cover Image
          </button>
        </div>

        {/* Info panel */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-14 shrink-0">
            {/* Logo image upload overlay */}
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center relative group">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <IoStorefront className="text-5xl text-accent" />
              )}
              <div
                onClick={() => triggerFileUpload(1, "logo")}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs font-bold"
              >
                <IoCloudUpload className="text-2xl mb-1" />
                Upload Logo
              </div>
            </div>

            <div className="min-w-0 pt-2 md:pb-2">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{vendor?.company_name}</h1>
                {vendor?.is_approved && (
                  <Badge color="emerald" showDot={false} className="flex items-center gap-1"><IoShieldCheckmark className="text-sm" /> Approved</Badge>
                )}
                {vendor?.premium && (
                  <span className="bg-linear-to- from-amber-500 to-orange-500 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm">PREMIUM PARTNER</span>
                )}
              </div>
              <p className="text-sm text-muted mt-1 italic">&quot;{vendor?.tagline || "Quality supplier partner."}&quot;</p>
              <p className="text-xs text-muted font-medium mt-2 flex items-center gap-1.5">
                <IoLocation className="text-accent" /> {vendor?.address}, {vendor?.city}, {vendor?.state}, {vendor?.country}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:pb-2">
            <Button variant="primary" onClick={() => setEditProfileModal(true)}>Edit Profile Details</Button>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-(--border) text-center divide-x divide-(--border) py-4 bg-stone-50/50 dark:bg-stone-900/10">
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Completed RFQs</span>
            <p className="text-xl font-bold text-foreground mt-1">{analytics?.rfqs_completed || 0}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">On-Time Delivery</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{analytics?.on_time_delivery_rate || 100}%</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Response Rate</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{analytics?.response_rate || 100}%</p>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Overall Rating</span>
            <p className="text-xl font-bold text-amber-500 mt-1 flex items-center justify-center gap-1">★ {vendor?.rating || "—"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-(--border) overflow-x-auto pb-px mb-6 scrollbar-none">
        {[
          { id: "overview", label: "Overview Specs" },
          { id: "products", label: "Product Showcase Catalog" },
          { id: "media", label: "Office & Factory Media" },
          { id: "performance", label: "Performance Audit (Read-Only)" },
          { id: "timeline", label: "ERP Timeline (Read-Only)" }
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
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-(--border)">
              <h3 className="font-bold text-lg mb-3">About the Company</h3>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {vendor?.about || "Enter detailed company description in edit profile details."}
              </p>
            </Card>

            {/* Smart Links Section */}
            <Card className="border border-(--border)">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Smart Social Cards</h3>
                <span className="text-xs text-muted">Auto-detecting Links</span>
              </div>

              <form onSubmit={handleAddLink} className="flex gap-2 mb-6">
                <Input
                  placeholder="Paste URL: e.g. https://linkedin.com/company/yourprofile"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  containerClassName="flex-1 !gap-0"
                  className="! bg-surface"
                />
                <Button type="submit" loading={addingLink} className="px-5">Add Link</Button>
              </form>

              {links.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted border border-dashed border-stone-200 dark:border-stone-850 rounded-xl">
                  No links registered yet. Paste any link above to auto-detect its platform.
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
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-muted transition-colors"
                        >
                          <IoTrash className="text-sm" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-4">
            <Card className="border border-(--border)">
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
            <Button variant="primary" icon={IoAdd} onClick={() => setAddProductModal(true)}>
              Add Showcase Product
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-(--border) rounded-2xl">
              <IoCart className="text-5xl text-muted mx-auto mb-3" />
              <h3 className="font-bold text-lg">No showcased products</h3>
              <p className="text-sm text-muted mt-1">Upload products to display them to procurement agents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <Card key={prod.id} className="border border-(--border) flex flex-col group overflow-hidden hover:shadow-md transition-shadow relative">
                  {/* Delete button overlay */}
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 z-20 shadow transition-colors cursor-pointer"
                    title="Remove Product"
                  >
                    <IoTrash className="text-sm" />
                  </button>

                  <div className="h-44 -mx-5 -mt-5 relative overflow-hidden bg-stone-100 flex items-center justify-center border-b border-(--border)">
                    {prod.images?.[0] ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <IoCart className="text-5xl text-muted" />
                    )}
                    <span className="absolute bottom-3 right-3 bg-stone-900/70 text-white font-bold text-[10px] px-2.5 py-0.5 rounded backdrop-blur-sm">
                      MOQ: {prod.moq}
                    </span>
                  </div>

                  <div className="pt-4 flex-1 flex flex-col">
                    <span className="text-[9px] text-accent uppercase tracking-wider font-bold block mb-1">{prod.category}</span>
                    <h4 className="font-bold text-base text-foreground leading-snug mb-2">{prod.name}</h4>
                    <p className="text-xs text-muted line-clamp-2 min-h-[32px] mb-4">{prod.description}</p>
                    
                    <div className="flex justify-between items-center text-xs mt-auto bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded border border-stone-100 dark:border-stone-800 font-semibold mb-2">
                      <span className="text-muted">Target Price</span>
                      <span className="text-accent">{prod.price_range}</span>
                    </div>

                    <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setSelectedProduct(prod)}>View Full Details</Button>
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
          <Card className="border border-(--border)">
            <h3 className="font-bold text-lg mb-4">Branding Asset Management</h3>
            
            <div
              onClick={() => triggerFileUpload(1.5, "gallery")}
              className="border-2 border-dashed border-(--border-strong) hover:border-accent hover:bg-accent-muted/20 cursor-pointer rounded-xl p-8 text-center transition-all"
            >
              <IoCloudUpload className="text-5xl text-accent mx-auto mb-3" />
              <h4 className="font-bold text-sm">Upload new images to your gallery</h4>
              <p className="text-xs text-muted mt-1.5">Supports PNG, JPG, WEBP</p>
              <Button size="sm" className="mt-4 pointer-events-none">Select File</Button>
            </div>
          </Card>

          <Card className="border border-(--border)">
            <h3 className="font-bold text-lg mb-4">Office & Factory Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="group relative rounded-xl border border-stone-200 overflow-hidden bg-stone-50 aspect-square">
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-linear-to- from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition-opacity duration-300">
                    <span className="text-[10px] font-bold text-white truncate block">{photo.name}</span>
                    <button
                      onClick={() => setUploadedPhotos(uploadedPhotos.filter(p => p.id !== photo.id))}
                      className="mt-1.5 p-1 bg-red-600/80 hover:bg-red-600 rounded text-white self-start transition-colors cursor-pointer"
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
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-(--border)">
              <h3 className="font-bold text-lg mb-4">Rating Index Breakdown</h3>

              <div className="space-y-4">
                {[
                  { name: "Delivery Speed", score: analytics?.rating_details?.delivery || 4.0 },
                  { name: "Product Quality", score: analytics?.rating_details?.quality || 4.0 },
                  { name: "Communication", score: analytics?.rating_details?.communication || 4.0 },
                  { name: "Price Competitiveness", score: analytics?.rating_details?.pricing || 4.0 },
                  { name: "Documentation", score: analytics?.rating_details?.documentation || 4.0 }
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground/80">{item.name}</span>
                      <span className="text-accent">{item.score} / 5</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${item.score * 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border border-(--border)">
              <h3 className="font-bold text-lg mb-4">Performance Quality Trend (Jan - Jun)</h3>

              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={analytics?.monthly_performance || [
                  { month: "Jan", score: 4.0 }, { month: "Feb", score: 4.0 }, { month: "Mar", score: 4.0 }, { month: "Apr", score: 4.0 }, { month: "May", score: 4.0 }, { month: "Jun", score: 4.0 }
                ]}>
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

      {/* ─── TAB 5: TIMELINE ─── */}
      {activeTab === "timeline" && (
        <Card className="border border-(--border) max-w-3xl mx-auto">
          <h3 className="font-bold text-lg mb-6">Interaction Timeline History</h3>

          {!timeline || timeline.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted">
              No historical ERP logs found.
            </div>
          ) : (
            <div className="relative border-l border-stone-200 dark:border-stone-850 pl-5 ml-2 space-y-6">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  <span className="absolute left-[-29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white shadow ring-4 ring-white dark:ring-stone-950 text-[9px] shrink-0 font-bold">
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
          <Input label="Company Name" value={editForm.company_name || ""} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} required />
          <Input label="Company Tagline" value={editForm.tagline || ""} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} />
          <Input label="Contact Person" value={editForm.contact_person || ""} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} required />
          <Input label="Email Address" type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          <Input label="Phone Number" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Website Address" value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
          
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <Input label="Industry" value={editForm.industry || ""} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
            <Input label="City" value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            <Input label="State" value={editForm.state || ""} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <Input label="Established Year" type="number" value={editForm.establishment_year || ""} onChange={(e) => setEditForm({ ...editForm, establishment_year: e.target.value })} />
            <Input label="Team Size Description" placeholder="e.g. 50-100 employees" value={editForm.team_size || ""} onChange={(e) => setEditForm({ ...editForm, team_size: e.target.value })} />
          </div>

          <Input label="GST Number" value={editForm.gst_number || ""} onChange={(e) => setEditForm({ ...editForm, gst_number: e.target.value })} />
          <Input label="PAN Number" value={editForm.pan_number || ""} onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value })} />
          
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-foreground/80 block">Vendor Categories</label>
            <div className="flex flex-wrap gap-2 border border-(--border-strong) p-3 rounded-lg bg-surface">
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
          <Input label="Business Description / About" type="textarea" value={editForm.about || ""} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} containerClassName="sm:col-span-2" />

          <div className="sm:col-span-2 pt-2">
            <Button type="submit" loading={updating} className="w-full" size="lg">Update Profiles Details</Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: PRODUCT DETAIL MODAL ─── */}
      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name || "Product Details"} size="md">
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
          </div>
        )}
      </Modal>

      {/* ─── MODAL: ADD SHOWCASE PRODUCT ─── */}
      <Modal open={addProductModal} onClose={() => setAddProductModal(false)} title="Add Showcase Product" size="md">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input label="Product Name" value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} required />
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-2 block">Category</label>
            <select
              value={newProductForm.category}
              onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
              className="w-full h-10 rounded-lg border border-(--border-strong) bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minimum Order Qty (MOQ)" value={newProductForm.moq} onChange={(e) => setNewProductForm({ ...newProductForm, moq: e.target.value })} required />
            <Input label="Price Range / Target Price" placeholder="e.g. ₹500 - ₹800 per Unit" value={newProductForm.price_range} onChange={(e) => setNewProductForm({ ...newProductForm, price_range: e.target.value })} required />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-2 block">Choose Showcase Image Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(imagePresets).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewProductForm({ ...newProductForm, imagePreset: preset })}
                  className={clsx("rounded-lg overflow-hidden border-2 relative h-12",
                    newProductForm.imagePreset === preset ? "border-accent shadow" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={imagePresets[preset]} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-[8px] font-bold text-white uppercase">{preset}</span>
                </button>
              ))}
            </div>
          </div>

          <Input label="Product Description" type="textarea" value={newProductForm.description} onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })} />
          <Button type="submit" loading={updating} className="w-full">Upload & Publish Product</Button>
        </form>
      </Modal>

      {/* ─── MODAL: BRADING ASSETS CROPPING SIMULATOR ─── */}
      <Modal open={cropModalOpen} onClose={() => { setCropModalOpen(false); setCropFile(null); }} title="Media Processing" size="md">
        {cropFile && (
          <div className="space-y-4">
            <div className="p-3 bg-accent-muted/40 text-accent text-xs font-semibold rounded">
              Crop & Align image for the {cropRatio === 1 ? "1:1 Square Logo" : cropRatio === 2 ? "16:9 Banner Cover" : "Gallery Aspect Ratio"} specification.
            </div>

            <div className={clsx("mx-auto bg-stone-100 rounded-xl border border-stone-200 relative overflow-hidden flex items-center justify-center max-w-full", 
              cropRatio === 1 ? "h-40 w-40" : "h-36 w-full"
            )}>
              <span className="text-xs text-muted z-10 font-bold bg-white/70 px-2 py-0.5 rounded shadow">Simulating Crop Interface</span>
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
