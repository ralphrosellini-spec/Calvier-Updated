'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Save, CheckCircle2, AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { uploadImage } from '@/lib/storage';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc
} from 'firebase/firestore';

interface HomepageContent {
  heroImage: string;
  campaignBagsImage: string;
  campaignShoesImage: string;
  featuredSplitImage: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isActive: boolean;
  createdAt: string;
}

const defaultContent: HomepageContent = {
  heroImage: '/hero-1.jpg',
  campaignBagsImage: '/campaign-bags.jpg',
  campaignShoesImage: '/campaign-shoes.jpg',
  featuredSplitImage: '/bag-1.jpg',
};

export default function AdminContentPage() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [addingBanner, setAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', link: '/shop', image: '' });
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = async () => {
    try {
      const [docSnap, bannersSnap] = await Promise.all([
        getDoc(doc(db, 'site_content', 'homepage')),
        getDocs(collection(db, 'banners')),
      ]);
      if (docSnap.exists()) {
        setContent(docSnap.data() as HomepageContent);
      } else {
        await setDoc(doc(db, 'site_content', 'homepage'), defaultContent);
      }
      setBanners(bannersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_content', 'homepage'), content);
      showToast('Homepage content saved!');
    } catch {
      showToast('Failed to save content.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof HomepageContent
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadImage(file, 'content/homepage');
      setContent(prev => ({ ...prev, [field]: url }));
      showToast('Image uploaded!');
    } catch {
      showToast('Upload failed.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBannerImage(true);
    try {
      const url = await uploadImage(file, 'banners');
      setNewBanner(prev => ({ ...prev, image: url }));
      showToast('Banner image uploaded!');
    } catch {
      showToast('Upload failed.', 'error');
    } finally {
      setUploadingBannerImage(false);
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.title || !newBanner.image) {
      showToast('Title and image are required.', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'banners'), {
        ...newBanner,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      showToast('Banner added!');
      setNewBanner({ title: '', subtitle: '', link: '/shop', image: '' });
      setAddingBanner(false);
      fetchAll();
    } catch {
      showToast('Failed to add banner.', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      showToast('Banner deleted.');
      fetchAll();
    } catch {
      showToast('Failed to delete banner.', 'error');
    }
  };

  const renderImageUploader = (label: string, field: keyof HomepageContent, aspect: string) => (
    <div className="bg-[#111] border border-white/10 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-serif text-lg">{label}</h3>
        <label className={`cursor-pointer bg-white/10 text-white px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/20 transition-colors ${uploadingField === field ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingField === field
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Upload size={14} />}
          {uploadingField === field ? 'Uploading…' : 'Replace Image'}
          <input type="file" className="hidden" accept="image/*"
            onChange={(e) => handleImageUpload(e, field)} />
        </label>
      </div>
      <div className={`relative bg-[#0a0a0a] border border-white/10 overflow-hidden ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content[field]} alt={label} className="w-full h-full object-cover" />
      </div>
      <p className="text-white/30 text-xs mt-2 font-mono truncate">{content[field]}</p>
    </div>
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#080808] flex">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-8">
            <h1 className="text-white font-serif text-xl font-light">Site Content</h1>
            <button onClick={handleSave} disabled={saving}
              className="bg-[#c9a96e] text-[#080808] px-6 py-2 text-[10px] tracking-widest uppercase font-semibold flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </header>

          <div className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="max-w-6xl space-y-12">

                {/* Homepage Images */}
                <section>
                  <h2 className="text-white font-serif text-2xl mb-2">Homepage Images</h2>
                  <p className="text-white/40 text-sm mb-6">
                    Upload images for hero banner, campaign posters, and featured sections. Changes apply immediately after saving.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderImageUploader('Hero Banner', 'heroImage', 'aspect-[16/9]')}
                    {renderImageUploader('Featured Split Section', 'featuredSplitImage', 'aspect-[4/5] max-w-xs')}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-white font-serif text-xl mb-4 pb-3 border-b border-white/10">Campaign Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderImageUploader('Campaign — Bags', 'campaignBagsImage', 'aspect-[4/5]')}
                      {renderImageUploader('Campaign — Shoes', 'campaignShoesImage', 'aspect-[4/5]')}
                    </div>
                  </div>
                </section>

                {/* Banners / Posters */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-white font-serif text-2xl">Banners & Posters</h2>
                      <p className="text-white/40 text-sm mt-1">Manage promotional banners. Active banners appear on the site.</p>
                    </div>
                    <button onClick={() => setAddingBanner(true)}
                      className="bg-white/10 text-white px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/20 transition-colors tracking-widest uppercase">
                      <Plus size={14} /> Add Banner
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {banners.map(banner => (
                      <div key={banner.id} className="bg-[#111] border border-white/10 overflow-hidden group relative">
                        <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button onClick={() => handleDeleteBanner(banner.id)}
                              className="bg-red-600 text-white p-3 rounded-full hover:scale-110 transition-transform">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-white text-sm font-medium">{banner.title}</p>
                          {banner.subtitle && <p className="text-white/40 text-xs mt-1">{banner.subtitle}</p>}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[#c9a96e] text-xs font-mono">{banner.link}</span>
                            <span className={`text-[9px] px-2 py-0.5 tracking-widest uppercase border ${banner.isActive ? 'text-green-400 border-green-900' : 'text-white/30 border-white/10'}`}>
                              {banner.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {banners.length === 0 && (
                      <div className="col-span-3 py-12 text-center text-white/20 border border-dashed border-white/10">
                        No banners added yet. Click &quot;Add Banner&quot; to create one.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>

        {/* Add Banner Modal */}
        <AnimatePresence>
          {addingBanner && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-[#111] border border-white/10 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-white font-serif text-2xl">Add Banner</h2>
                  <button onClick={() => setAddingBanner(false)} className="text-white/50 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Banner Image *</label>
                    <label className={`flex items-center gap-3 border border-dashed border-white/20 p-4 cursor-pointer hover:border-[#c9a96e] transition-colors ${uploadingBannerImage ? 'opacity-50' : ''}`}>
                      {newBanner.image
                        ? (/* eslint-disable-next-line @next/next/no-img-element */
                          <img src={newBanner.image} alt="" className="w-20 h-12 object-cover" />)
                        : <div className="w-20 h-12 bg-white/5 flex items-center justify-center text-white/30"><Upload size={20} /></div>}
                      <div>
                        <p className="text-white text-sm">{newBanner.image ? 'Change image' : 'Upload banner image'}</p>
                        <p className="text-white/30 text-xs mt-1">Recommended: 1200×600px</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleBannerImageUpload} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Title *</label>
                    <input type="text" value={newBanner.title}
                      onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                      placeholder="Summer Sale 2026" />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Subtitle</label>
                    <input type="text" value={newBanner.subtitle}
                      onChange={e => setNewBanner(p => ({ ...p, subtitle: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                      placeholder="Up to 30% off on selected items" />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Link</label>
                    <input type="text" value={newBanner.link}
                      onChange={e => setNewBanner(p => ({ ...p, link: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                      placeholder="/shop" />
                  </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                  <button onClick={() => setAddingBanner(false)}
                    className="px-5 py-2.5 text-white/50 hover:text-white text-xs tracking-widest uppercase">
                    Cancel
                  </button>
                  <button onClick={handleAddBanner}
                    className="bg-[#c9a96e] text-[#080808] px-6 py-2.5 text-xs tracking-widest uppercase font-semibold hover:bg-white transition-colors flex items-center gap-2">
                    <Plus size={14} /> Add Banner
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`fixed bottom-8 right-8 z-[100] px-6 py-4 text-sm flex items-center gap-3 shadow-xl ${toast.type === 'success' ? 'bg-[#111] border border-[#c9a96e] text-white' : 'bg-red-900/80 border border-red-600 text-white'}`}>
              {toast.type === 'success'
                ? <CheckCircle2 size={18} className="text-[#c9a96e]" />
                : <AlertTriangle size={18} className="text-red-400" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminGuard>
  );
}
