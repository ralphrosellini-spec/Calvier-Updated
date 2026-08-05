'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getProducts } from '@/lib/firebase-db';
import { uploadImage } from '@/lib/storage';
import { db } from '@/lib/firebase';
import {
  doc, updateDoc, addDoc, deleteDoc, collection
} from 'firebase/firestore';
import type { Product, ProductVariant } from '@/types';
import { formatPrice } from '@/lib/utils';

const EMPTY_VARIANT: ProductVariant = {
  id: 'v1', color: 'Default', colorHex: '#000000',
  sizes: [{ size: 'OS', stock: 10, sku: '' }], images: [],
};

const EMPTY_PRODUCT = {
  name: '', slug: '', price: 0, originalPrice: 0,
  category: '', brand: 'Calvier Rossel', brandId: 'cr',
  categoryId: '', collectionId: '', gender: 'women' as const,
  description: '', shortDescription: '', material: '',
  careInstructions: [], features: [],
  status: 'in_stock' as const, currency: 'INR',
  tags: [], isFeatured: false, isBestSeller: false,
  isNewArrival: true, isLimitedEdition: false, isTrending: false,
  rating: 0, reviewCount: 0, sizeGuide: '',
  deliveryInfo: 'Ships within 5–7 business days.',
  returnsPolicy: '14-day return policy.',
};

type ModalMode = 'add' | 'edit';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingProduct({
      ...EMPTY_PRODUCT,
      variants: [{ ...EMPTY_VARIANT, images: [] }],
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const closeModal = () => { setEditingProduct(null); setIsModalOpen(false); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      if (modalMode === 'edit' && editingProduct.id) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          name: editingProduct.name,
          price: editingProduct.price,
          originalPrice: editingProduct.originalPrice,
          category: editingProduct.category,
          description: editingProduct.description,
          shortDescription: editingProduct.shortDescription,
          isFeatured: editingProduct.isFeatured,
          isBestSeller: editingProduct.isBestSeller,
          isNewArrival: editingProduct.isNewArrival,
          status: editingProduct.status,
          variants: editingProduct.variants,
          updatedAt: new Date().toISOString(),
        });
        showToast('Product updated successfully!');
      } else {
        // Auto-generate slug
        const slug = (editingProduct.name || '')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await addDoc(collection(db, 'products'), {
          ...EMPTY_PRODUCT,
          ...editingProduct,
          slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        showToast('Product added successfully!');
      }
      await fetchProducts();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Product deleted.');
      await fetchProducts();
    } catch {
      showToast('Failed to delete product.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImage(true);
    try {
      const productId = editingProduct.id || `new-${Date.now()}`;
      const downloadUrl = await uploadImage(file, `products/${productId}`);
      const updatedVariants = [...(editingProduct.variants || [{ ...EMPTY_VARIANT }])];
      if (!updatedVariants[0]) updatedVariants[0] = { ...EMPTY_VARIANT };
      updatedVariants[0] = { ...updatedVariants[0], images: [downloadUrl, ...(updatedVariants[0].images || [])] };
      setEditingProduct({ ...editingProduct, variants: updatedVariants });
      showToast('Image uploaded!');
    } catch {
      showToast('Image upload failed.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    if (!editingProduct?.variants) return;
    const updated = [...editingProduct.variants];
    updated[0] = { ...updated[0], images: updated[0].images.filter((_, i) => i !== idx) };
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  const setField = (key: string, value: unknown) =>
    setEditingProduct(prev => prev ? { ...prev, [key]: value } : prev);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#080808] flex">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-8">
            <h1 className="text-white font-serif text-xl font-light">Products Manager</h1>
            <button
              onClick={openAdd}
              className="bg-[#c9a96e] text-[#080808] px-4 py-2 text-[10px] tracking-widest uppercase font-semibold flex items-center gap-2 hover:bg-white transition-colors"
            >
              <Plus size={14} /> Add Product
            </button>
          </header>

          <div className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <p className="text-white/30 text-sm mb-6">No products found. Add your first product.</p>
                <button onClick={openAdd} className="bg-[#c9a96e] text-[#080808] px-6 py-3 text-xs tracking-widest uppercase font-semibold">
                  + Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-[#111] border border-white/10 p-4 hover:border-white/30 transition-colors group relative">
                    <div className="aspect-[4/5] bg-[#0a0a0a] relative mb-4 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.variants?.[0]?.images?.[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="bg-white text-black p-3 hover:scale-110 transition-transform rounded-full"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="bg-red-600 text-white p-3 hover:scale-110 transition-transform rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {product.isBestSeller && (
                        <div className="absolute top-3 left-3 bg-[#c9a96e] text-[#080808] text-[9px] tracking-widest uppercase px-2 py-1 font-semibold">
                          Best Seller
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-serif text-base leading-snug">{product.name}</h3>
                    <p className="text-white/40 text-xs mt-1">{product.category}</p>
                    <p className="text-[#c9a96e] text-sm mt-2 font-mono">{formatPrice(product.price)}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {product.isFeatured && <span className="text-[9px] tracking-widest text-blue-400 border border-blue-900 px-2 py-0.5">Featured</span>}
                      {product.isNewArrival && <span className="text-[9px] tracking-widest text-green-400 border border-green-900 px-2 py-0.5">New</span>}
                      <span className={`text-[9px] tracking-widest px-2 py-0.5 border ${product.status === 'in_stock' ? 'text-green-400 border-green-900' : 'text-red-400 border-red-900'}`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-[#111] border border-white/10 p-8 max-w-sm w-full text-center shadow-2xl">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-white font-serif text-xl mb-2">Delete Product?</h3>
                <p className="text-white/40 text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 border border-white/10 text-white/60 hover:text-white text-xs tracking-widest uppercase transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white text-xs tracking-widest uppercase hover:bg-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add / Edit Product Modal */}
        <AnimatePresence>
          {isModalOpen && editingProduct && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111] border border-white/10 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Modal header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <h2 className="text-white font-serif text-2xl">
                    {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                  </h2>
                  <button onClick={closeModal} className="text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form id="product-form" onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Product Name *</label>
                        <input required type="text" value={editingProduct.name || ''}
                          onChange={e => setField('name', e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                          placeholder="e.g. Rossel Pump Classic" />
                      </div>
                      <div>
                        <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Price (₹) *</label>
                        <input required type="number" min={0} value={editingProduct.price || ''}
                          onChange={e => setField('price', Number(e.target.value))}
                          className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                          placeholder="12500" />
                      </div>
                      <div>
                        <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Original Price (₹)</label>
                        <input type="number" min={0} value={editingProduct.originalPrice || ''}
                          onChange={e => setField('originalPrice', Number(e.target.value))}
                          className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                          placeholder="15000" />
                      </div>
                      <div>
                        <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Category *</label>
                        <input required type="text" value={editingProduct.category || ''}
                          onChange={e => setField('category', e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                          placeholder="Shoes / Bags / Voyage" />
                      </div>
                      <div>
                        <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Status</label>
                        <select value={editingProduct.status || 'in_stock'}
                          onChange={e => setField('status', e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors">
                          <option value="in_stock">In Stock</option>
                          <option value="low_stock">Low Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="coming_soon">Coming Soon</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Short Description</label>
                      <input type="text" value={editingProduct.shortDescription || ''}
                        onChange={e => setField('shortDescription', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors"
                        placeholder="A brief one-line description shown in listings" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-2">Full Description</label>
                      <textarea rows={3} value={editingProduct.description || ''}
                        onChange={e => setField('description', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 focus:outline-none focus:border-[#c9a96e] transition-colors resize-none"
                        placeholder="Detailed product description…" />
                    </div>

                    {/* Flags */}
                    <div className="border-t border-white/10 pt-5">
                      <label className="block text-white/50 text-[10px] tracking-widest uppercase mb-3">Product Flags</label>
                      <div className="flex flex-wrap gap-4">
                        {([
                          ['isFeatured', 'Featured'],
                          ['isBestSeller', 'Best Seller'],
                          ['isNewArrival', 'New Arrival'],
                          ['isLimitedEdition', 'Limited Edition'],
                          ['isTrending', 'Trending'],
                        ] as [keyof Product, string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox"
                              checked={!!(editingProduct as Record<string, unknown>)[key]}
                              onChange={e => setField(key, e.target.checked)}
                              className="accent-[#c9a96e] w-4 h-4" />
                            <span className="text-white/70 text-xs tracking-wider">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Images */}
                    <div className="border-t border-white/10 pt-5">
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-white/50 text-[10px] tracking-widest uppercase">Product Images</label>
                        <div>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload}
                            accept="image/*" className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="bg-white/10 text-white px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50">
                            {uploadingImage
                              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <Upload size={14} />}
                            {uploadingImage ? 'Uploading…' : 'Upload Image'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {(editingProduct.variants?.[0]?.images || []).map((img, idx) => (
                          <div key={idx} className="relative aspect-square bg-[#0a0a0a] border border-white/10 group overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx)}
                              className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={10} />
                            </button>
                            {idx === 0 && (
                              <div className="absolute bottom-1.5 left-1.5 bg-[#c9a96e] text-[#080808] text-[8px] px-1.5 py-0.5 tracking-widest uppercase font-semibold">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                        {(editingProduct.variants?.[0]?.images || []).length === 0 && (
                          <div className="col-span-4 border border-dashed border-white/10 aspect-video flex items-center justify-center text-white/20 text-sm">
                            No images uploaded yet
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0a]">
                  <button type="button" onClick={closeModal}
                    className="px-6 py-3 text-white/50 hover:text-white transition-colors text-xs tracking-widest uppercase">
                    Cancel
                  </button>
                  <button type="submit" form="product-form" disabled={saving}
                    className="bg-[#c9a96e] text-[#080808] px-6 py-3 text-xs tracking-widest uppercase font-semibold hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50">
                    {saving
                      ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle2 size={16} />}
                    {saving ? 'Saving…' : modalMode === 'add' ? 'Create Product' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className={`fixed bottom-8 right-8 z-[100] px-6 py-4 text-sm flex items-center gap-3 shadow-xl ${toast.type === 'success' ? 'bg-[#111] border border-[#c9a96e] text-white' : 'bg-red-900/80 border border-red-600 text-white'}`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} className="text-[#c9a96e]" /> : <AlertTriangle size={18} className="text-red-400" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminGuard>
  );
}
