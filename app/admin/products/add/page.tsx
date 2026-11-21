'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { addProduct, getProductBySlug, getCategories } from '@/lib/firebase-db';
import { uploadImage } from '@/lib/storage';
import type { Product, ProductVariant, Category } from '@/types';

export default function AdminAddProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [brand, setBrand] = useState('Calvier Rossel');
  const [gender, setGender] = useState<'women' | 'men' | 'unisex' | 'kids'>('women');
  const [material, setMaterial] = useState('Full-grain Italian leather');
  const [status, setStatus] = useState<'in_stock' | 'out_of_stock'>('in_stock');
  const [tagsInput, setTagsInput] = useState('Luxury, Handcrafted, Leather');

  // Badges
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isTrending, setIsTrending] = useState(false);

  // Images list — starts empty, only uploaded images are stored
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: 'v1',
      color: 'Black',
      colorHex: '#111111',
      sizes: [{ size: 'Standard', stock: 25, sku: 'CR-001-BLK' }],
      images: [],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load categories from Firestore
  useEffect(() => {
    getCategories().then((cats) => {
      setDbCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSubmit = async (submitStatus: 'in_stock' | 'out_of_stock') => {
    if (!name.trim()) {
      setToast('Please enter a product title.');
      return;
    }
    if (price <= 0) {
      setToast('Please enter a valid product price.');
      return;
    }

    setSaving(true);
    try {
      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!slug) slug = `product-${Date.now()}`;

      // Check if product with this slug already exists to prevent duplicate slugs
      const existing = await getProductBySlug(slug);
      if (existing) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const productData: Omit<Product, 'id'> = {
        name: name.trim(),
        slug,
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        category,
        brand,
        brandId: 'cr',
        categoryId: category.toLowerCase().replace(/\s+/g, '-'),
        categorySlug: category.toLowerCase().replace(/\s+/g, '-'),
        collectionId: 'signature',
        gender,
        description,
        shortDescription: shortDescription || description.slice(0, 120),
        material,
        careInstructions: [
          'Store in provided dust bag when not in use.',
          'Clean with a soft, dry cloth.',
          'Avoid prolonged exposure to direct sunlight and moisture.',
        ],
        features: [
          'Handcrafted with premium craftsmanship',
          'Structured silhouette with reinforced base',
          'Custom gold-tone hardware',
        ],
        status: submitStatus,
        currency: 'INR',
        tags,
        isFeatured,
        isBestSeller,
        isNewArrival,
        isLimitedEdition: false,
        isTrending,
        rating: 4.8,
        reviewCount: 12,
        sizeGuide: 'Length: 28cm | Height: 20cm | Depth: 12cm',
        deliveryInfo: 'Complimentary shipping across India within 3–5 business days.',
        returnsPolicy: '14-day return and exchange policy.',
        variants: [
          {
            ...variants[0],
            images: images,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addProduct(productData);
      setToast('Product published successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 800);
    } catch (err) {
      console.error('Failed to add product:', err);
      setToast('Failed to create product. Please try again.');
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
          <form className="mb-9" onSubmit={(e) => e.preventDefault()}>
            {/* Action Bar matching re() from reference */}
            <div className="row g-3 flex-between-end mb-5">
              <div className="col-auto">
                <h2 className="mb-2 text-body-emphasis fw-bolder">Add a product</h2>
                <h5 className="text-body-tertiary fw-semibold">
                  Orders placed across your store
                </h5>
              </div>
              <div className="col-auto d-flex flex-wrap gap-2 justify-content-start justify-content-sm-end">
                <Link href="/admin/products" className="btn btn-phoenix-secondary">
                  Discard
                </Link>
                <button
                  type="button"
                  className="btn btn-phoenix-primary"
                  disabled={saving}
                  onClick={() => handleSubmit('out_of_stock')}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => handleSubmit('in_stock')}
                >
                  {saving ? 'Publishing...' : 'Publish product'}
                </button>
              </div>
            </div>

            {/* Main Form 2-Column Grid */}
            <div className="row g-5">
              {/* Left Column: Title, Description, Images, Inventory */}
              <div className="col-12 col-xl-8">
                {/* Product Title */}
                <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Product Title</h4>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Write title here..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Product Description */}
                <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Product Description</h4>
                  <textarea
                    className="form-control mb-3"
                    rows={6}
                    placeholder="Write detailed product description here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>

                  <h5 className="mb-2 text-body-emphasis fs-9">Short Summary</h5>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Brief highlight sentence for cards..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>

                {/* Display Images Dropzone matching Phoenix dz */}
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

                {/* Inventory & Variants */}
                <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Inventory &amp; Variants</h4>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-9">Color Name</label>
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        value={variants[0].color}
                        onChange={(e) =>
                          setVariants([
                            { ...variants[0], color: e.target.value },
                          ])
                        }
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-9">Stock Quantity</label>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        min="0"
                        value={variants[0].sizes[0].stock}
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
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-9">SKU Code</label>
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        value={variants[0].sizes[0].sku}
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

              {/* Right Column: Organization, Pricing, Status */}
              <div className="col-12 col-xl-4">
                {/* Pricing Card */}
                <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Pricing</h4>
                  <div className="mb-3">
                    <label className="form-label fs-9">Regular Price (₹)</label>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="0"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label fs-9">Original Price / Compare at (₹)</label>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="0"
                      value={originalPrice || ''}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    />
                    <span className="text-body-tertiary fs-10">
                      Shows a discounted strike-through price if higher than regular price.
                    </span>
                  </div>
                </div>

                {/* Organization Card */}
                <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Organize</h4>
                  <div className="mb-3">
                    <label className="form-label fs-9">Category</label>
                    {dbCategories.length > 0 ? (
                      <select
                        className="form-select form-select-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">— Select a category —</option>
                        {dbCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="form-control form-control-sm"
                        type="text"
                        placeholder="e.g. Handbags (add categories in admin first)"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    )}
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

                {/* Visibility & Badges */}
                <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                  <h4 className="mb-3 text-body-emphasis">Status &amp; Badges</h4>
                  <div className="mb-3">
                    <label className="form-label fs-9">Inventory Status</label>
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
                        id="checkFeatured"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <label className="form-check-label fs-9" htmlFor="checkFeatured">
                        Featured Product
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkBestSeller"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                      />
                      <label className="form-check-label fs-9" htmlFor="checkBestSeller">
                        Best Seller
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkNewArrival"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                      />
                      <label className="form-check-label fs-9" htmlFor="checkNewArrival">
                        New Arrival
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkTrending"
                        checked={isTrending}
                        onChange={(e) => setIsTrending(e.target.checked)}
                      />
                      <label className="form-check-label fs-9" htmlFor="checkTrending">
                        Trending
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Toast Notification */}
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
