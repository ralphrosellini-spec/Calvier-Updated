'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload, Save, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
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
  heroImage: '',
  campaignBagsImage: '',
  campaignShoesImage: '',
  featuredSplitImage: '',
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
      showToast('Homepage content saved successfully!');
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
      showToast('Banner added successfully!');
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
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{label}</h5>
        <label className={`btn btn-sm btn-phoenix-primary mb-0 cursor-pointer ${uploadingField === field ? 'disabled' : ''}`}>
          {uploadingField === field ? (
            <span className="spinner-border spinner-border-sm me-1" />
          ) : (
            <Upload size={14} className="me-1" />
          )}
          {uploadingField === field ? 'Uploading"¦' : 'Replace'}
          <input
            type="file"
            className="d-none"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, field)}
            disabled={uploadingField === field}
          />
        </label>
      </div>
      <div className="card-body p-3">
        <div className={`position-relative bg-body-tertiary border border-translucent rounded-2 overflow-hidden ${aspect}`}>
          {content[field] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={content[field]} alt={label} className="w-100 h-100 object-fit-cover" />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-body-tertiary">
              <div className="text-center">
                <Upload size={28} className="mb-2 opacity-50" />
                <p className="fs-10 mb-0">No image uploaded yet</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-body-tertiary fs-10 mt-2 font-monospace text-truncate mb-0">
          {content[field] || 'Upload an image above to set this section'}
        </p>
      </div>
    </div>
  );

  return (
    <AdminGuard>
      <main className="main" id="top">

        <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Dashboard</span>
            </Link>
          </div>
          <div className="mb-9">
            {/* Page Header */}
            <div className="row g-3 mb-4 align-items-center">
              <div className="col-auto">
                <h2 className="mb-0">Site Content Management</h2>
                <p className="text-body-tertiary mt-1 mb-0">
                  Update homepage hero images, featured promotions, and site-wide marketing banners.
                </p>
              </div>
              <div className="col-auto ms-auto">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <Save size={16} className="me-2" />
                  )}
                  {saving ? 'Saving"¦' : 'Save Changes'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Homepage Section Images */}
                <div className="mb-6">
                  <h4 className="mb-3">Homepage Section Images</h4>
                  <div className="row g-4 mb-4">
                    <div className="col-12 col-lg-8">
                      {renderImageUploader('Hero Banner', 'heroImage', 'ratio ratio-16x9')}
                    </div>
                    <div className="col-12 col-lg-4">
                      {renderImageUploader('Featured Split Section', 'featuredSplitImage', 'ratio ratio-4x3')}
                    </div>
                  </div>

                  <h5 className="mb-3 text-body-secondary">Campaign Features</h5>
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      {renderImageUploader('Campaign "” Luxury Bags', 'campaignBagsImage', 'ratio ratio-4x3')}
                    </div>
                    <div className="col-12 col-md-6">
                      {renderImageUploader('Campaign "” Fine Shoes', 'campaignShoesImage', 'ratio ratio-4x3')}
                    </div>
                  </div>
                </div>

                <hr className="my-5" />

                {/* Promotional Banners */}
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h4 className="mb-1">Promotional Banners & Posters</h4>
                      <p className="text-body-tertiary fs-9 mb-0">
                        Active banners appear in marketing carousels on the customer shop.
                      </p>
                    </div>
                    <button
                      onClick={() => setAddingBanner(true)}
                      className="btn btn-phoenix-secondary btn-sm"
                    >
                      <Plus size={14} className="me-1" /> Add New Banner
                    </button>
                  </div>

                  <div className="row g-4">
                    {banners.map((banner) => (
                      <div key={banner.id} className="col-12 col-md-6 col-xl-4">
                        <div className="card h-100 overflow-hidden">
                          <div className="position-relative ratio ratio-16x9 bg-body-tertiary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="w-100 h-100 object-fit-cover"
                            />
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                              title="Delete banner"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="card-body p-3">
                            <h5 className="card-title mb-1 fs-9 fw-bold">{banner.title}</h5>
                            {banner.subtitle && (
                              <p className="card-text text-body-tertiary fs-10 mb-2">
                                {banner.subtitle}
                              </p>
                            )}
                            <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-translucent">
                              <span className="font-monospace text-primary fs-10">
                                {banner.link}
                              </span>
                              <span
                                className={`badge badge-phoenix fs-10 ${
                                  banner.isActive
                                    ? 'badge-phoenix-success'
                                    : 'badge-phoenix-secondary'
                                }`}
                              >
                                {banner.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {banners.length === 0 && (
                      <div className="col-12">
                        <div className="border border-dashed border-translucent rounded-3 p-5 text-center text-body-tertiary">
                          <p className="mb-2">No promotional banners created yet.</p>
                          <button
                            onClick={() => setAddingBanner(true)}
                            className="btn btn-sm btn-primary"
                          >
                            + Create First Banner
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Banner Modal */}
        {addingBanner && (
          <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Promotional Banner</h5>
                  <button
                    className="btn-close"
                    onClick={() => setAddingBanner(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Banner Image *</label>
                    <div className="d-flex align-items-center gap-3">
                      {newBanner.image ? (
                        <div
                          className="rounded-2 overflow-hidden border border-translucent"
                          style={{ width: '80px', height: '50px' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={newBanner.image}
                            alt=""
                            className="w-100 h-100 object-fit-cover"
                          />
                        </div>
                      ) : null}
                      <label className="btn btn-sm btn-phoenix-secondary mb-0">
                        {uploadingBannerImage ? (
                          <span className="spinner-border spinner-border-sm me-1" />
                        ) : (
                          <Upload size={14} className="me-1" />
                        )}
                        {uploadingBannerImage ? 'Uploading"¦' : 'Upload Image'}
                        <input
                          type="file"
                          className="d-none"
                          accept="image/*"
                          onChange={handleBannerImageUpload}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Summer Leather Collection 2026"
                      value={newBanner.title}
                      onChange={(e) =>
                        setNewBanner((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Subtitle</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Limited Edition Handcrafted Pieces"
                      value={newBanner.subtitle}
                      onChange={(e) =>
                        setNewBanner((p) => ({ ...p, subtitle: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Click Link</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="/shop or /collections/shoes"
                      value={newBanner.link}
                      onChange={(e) =>
                        setNewBanner((p) => ({ ...p, link: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-phoenix-secondary"
                    onClick={() => setAddingBanner(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddBanner}>
                    Add Banner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`toast show position-fixed bottom-0 end-0 m-4 ${
              toast.type === 'success' ? 'bg-success' : 'bg-danger'
            } text-white`}
            style={{ zIndex: 9999, minWidth: '280px' }}
          >
            <div className="toast-body d-flex align-items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
              {toast.msg}
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
