'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getProductById, updateProduct } from '@/lib/firebase-db';
import { uploadImage } from '@/lib/storage';
import type { Product, ProductVariant } from '@/types';


export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [category, setCategory] = useState('Handbags');
  const [brand, setBrand] = useState('Calvier Rossel');
  const [gender, setGender] = useState<'women' | 'men' | 'unisex' | 'kids'>('women');
  const [material, setMaterial] = useState('Full-grain Italian leather');
  const [status, setStatus] = useState<'in_stock' | 'out_of_stock'>('in_stock');
  const [tagsInput, setTagsInput] = useState('');

  // Badges
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isTrending, setIsTrending] = useState(false);

  // Images & Variants
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: 'v1',
      color: 'Default',
      colorHex: '#111111',
      sizes: [{ size: 'Standard', stock: 10, sku: '' }],
      images: [],
    },
  ]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const prod = await getProductById(resolvedParams.id);
      if (prod) {
        setName(prod.name || '');
        setDescription(prod.description || '');
        setShortDescription(prod.shortDescription || '');
        setPrice(prod.price || 0);
        setOriginalPrice(prod.originalPrice || 0);
        setCategory(prod.category || 'Handbags');
        setBrand(prod.brand || 'Calvier Rossel');
        setGender(prod.gender || 'women');
        setMaterial(prod.material || '');
        setStatus(prod.status === 'out_of_stock' ? 'out_of_stock' : 'in_stock');
        setTagsInput(prod.tags ? prod.tags.join(', ') : '');
        setIsFeatured(Boolean(prod.isFeatured));
        setIsBestSeller(Boolean(prod.isBestSeller));
        setIsNewArrival(Boolean(prod.isNewArrival));
        setIsTrending(Boolean(prod.isTrending));

        if (prod.variants && prod.variants.length > 0) {
          setVariants(prod.variants);
          const allImgs = prod.variants.flatMap((v) => v.images || []).filter(Boolean);
          setImages(allImgs);
        }
      } else {
        setToast('Product not found.');
      }
      setLoading(false);
    }
    load();
  }, [resolvedParams.id]);

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const downloadUrl = await uploadImage(file, 'products');
      setImages((prev) => [...prev, downloadUrl]);
      setToast('Product image uploaded successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast('Failed to upload image file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdate = async (submitStatus?: 'in_stock' | 'out_of_stock') => {
    if (!name.trim()) {
      setToast('Product title cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updateData: Partial<Product> = {
        name: name.trim(),
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        category,
        categoryId: category.toLowerCase().replace(/\s+/g, '-'),
        categorySlug: category.toLowerCase().replace(/\s+/g, '-'),
        brand,
        gender,
        description,
        shortDescription,
        material,
        status: submitStatus || status,
        tags,
        isFeatured,
        isBestSeller,
        isNewArrival,
        isTrending,
        variants: [
          {
            ...variants[0],
            images: images,
          },
        ],
      };

      await updateProduct(resolvedParams.id, updateData);
      setToast('Product updated successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 700);
    } catch (err) {
      console.error(err);
      setToast('Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <main className="main" id="top">
        <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin/products" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Back to Products</span>
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading product...</span>
              </div>
            </div>
          ) : (
            <form className="mb-9" onSubmit={(e) => e.preventDefault()}>
              {/* Action Bar */}
              <div className="row g-3 flex-between-end mb-5">
                <div className="col-auto">
                  <h2 className="mb-2 text-body-emphasis fw-bolder">Edit Product</h2>
                  <h5 className="text-body-tertiary fw-semibold">
                    ID: #{resolvedParams.id}
                  </h5>
                </div>
                <div className="col-auto d-flex flex-wrap gap-2 justify-content-start justify-content-sm-end">
                  <Link href="/admin/products" className="btn btn-phoenix-secondary">
                    Cancel
                  </Link>
                  <button
                    type="button"
                    className="btn btn-phoenix-primary"
                    disabled={saving}
                    onClick={() => handleUpdate('out_of_stock')}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => handleUpdate()}
                  >
                    {saving ? 'Updating...' : 'Save changes'}
                  </button>
                </div>
              </div>

              {/* Form 2-Column Grid */}
              <div className="row g-5">
                <div className="col-12 col-xl-8">
                  {/* Title */}
                  <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Product Title</h4>
                    <input
                      className="form-control"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Product Description</h4>
                    <textarea
                      className="form-control mb-3"
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>

                    <h5 className="mb-2 text-body-emphasis fs-9">Short Summary</h5>
                    <input
                      className="form-control"
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                    />
                  </div>

                  {/* Images */}
                  <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Display images</h4>
                    <div className="d-flex flex-wrap gap-3 mb-3">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="border border-translucent bg-body-emphasis rounded-3 position-relative overflow-hidden"
                          style={{ width: '90px', height: '90px' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt="Product preview"
                            className="w-100 h-100 object-fit-cover"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-dark position-absolute top-0 end-0 p-1 m-1 rounded-circle"
                            style={{ width: '22px', height: '22px', lineHeight: 1 }}
                            onClick={() => removeImage(idx)}
                          >
                            <span className="fas fa-times" style={{ fontSize: '10px' }}></span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="input-group mb-2">
                      <input
                        type="url"
                        className="form-control form-control-sm"
                        placeholder="Paste image URL (e.g. /site/assets/img/products/1.png or https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-phoenix-primary"
                        onClick={addImage}
                      >
                        <span className="fas fa-plus me-1"></span> Add URL
                      </button>
                      <label className={`btn btn-sm btn-phoenix-secondary mb-0 ${uploadingImage ? 'disabled' : ''}`}>
                        {uploadingImage ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <span className="fas fa-upload me-1"></span> Upload File
                          </>
                        )}
                        <input
                          type="file"
                          className="d-none"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <p className="text-body-tertiary fs-10 mb-0">
                      Supports direct file upload to Firebase Storage or entering image URLs.
                    </p>
                  </div>

                  {/* Inventory */}
                  <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Inventory &amp; Stock</h4>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fs-9">Stock Quantity</label>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          min="0"
                          value={variants[0]?.sizes[0]?.stock || 0}
                          onChange={(e) =>
                            setVariants([
                              {
                                ...variants[0],
                                sizes: [
                                  {
                                    ...variants[0].sizes[0],
                                    stock: Number(e.target.value),
                                  },
                                ],
                              },
                            ])
                          }
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fs-9">SKU</label>
                        <input
                          className="form-control form-control-sm"
                          type="text"
                          value={variants[0]?.sizes[0]?.sku || ''}
                          onChange={(e) =>
                            setVariants([
                              {
                                ...variants[0],
                                sizes: [
                                  {
                                    ...variants[0].sizes[0],
                                    sku: e.target.value,
                                  },
                                ],
                              },
                            ])
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-12 col-xl-4">
                  {/* Pricing */}
                  <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Pricing</h4>
                    <div className="mb-3">
                      <label className="form-label fs-9">Regular Price (₹)</label>
                      <input
                        className="form-control"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label fs-9">Compare at / Original Price (₹)</label>
                      <input
                        className="form-control"
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Organizing */}
                  <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Organize</h4>
                    <div className="mb-3">
                      <label className="form-label fs-9">Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Handbags">Handbags</option>
                        <option value="Shoulder Bags">Shoulder Bags</option>
                        <option value="Tote Bags">Tote Bags</option>
                        <option value="Leather Goods">Leather Goods</option>
                        <option value="Clutches">Clutches</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-9">Vendor / Brand</label>
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-9">Gender</label>
                      <select
                        className="form-select form-select-sm"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'women' | 'men' | 'unisex')}
                      >
                        <option value="women">Women</option>
                        <option value="men">Men</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-9">Material</label>
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label fs-9">Tags (comma separated)</label>
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status & Badges */}
                  <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                    <h4 className="mb-3 text-body-emphasis">Status &amp; Badges</h4>
                    <div className="mb-3">
                      <label className="form-label fs-9">Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'in_stock' | 'out_of_stock')}
                      >
                        <option value="in_stock">In Stock (Active)</option>
                        <option value="out_of_stock">Out of Stock / Draft</option>
                      </select>
                    </div>

                    <div className="d-flex flex-column gap-2 mt-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkFeaturedEdit"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                        />
                        <label className="form-check-label fs-9" htmlFor="checkFeaturedEdit">
                          Featured Product
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkBestSellerEdit"
                          checked={isBestSeller}
                          onChange={(e) => setIsBestSeller(e.target.checked)}
                        />
                        <label className="form-check-label fs-9" htmlFor="checkBestSellerEdit">
                          Best Seller
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkNewArrivalEdit"
                          checked={isNewArrival}
                          onChange={(e) => setIsNewArrival(e.target.checked)}
                        />
                        <label className="form-check-label fs-9" htmlFor="checkNewArrivalEdit">
                          New Arrival
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkTrendingEdit"
                          checked={isTrending}
                          onChange={(e) => setIsTrending(e.target.checked)}
                        />
                        <label className="form-check-label fs-9" htmlFor="checkTrendingEdit">
                          Trending
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {toast && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
            <div className="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert">
              <div className="d-flex">
                <div className="toast-body fs-9">{toast}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setToast(null)}
                ></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
