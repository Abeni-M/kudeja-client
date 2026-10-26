// src/pages/admin/Products.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../services/productService';
import { getCategories, createCategory } from '../../services/categoryService';
import { getProductImageUrl } from '../../utils/productImages';
import { formatPrice } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvUtils';
import { LuPlus, LuPencil, LuTrash, LuImage, LuUpload, LuDownload, LuX, LuSearch } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

// ─── Load ALL local images from src/images/ via Vite glob ──────────────────
const imageModules = import.meta.glob('../../images/*', { eager: true });
const localImages = Object.entries(imageModules).map(([path, mod]) => ({
  name: path.split('/').pop(),
  url: mod.default,
}));

// Image picker modal component
const ProductImagePickerModal = ({ onSelect, onClose, currentUrl }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    localImages.filter(img =>
      img.name.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2500,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--admin-bg, #1a1a2e)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: 0, color: 'var(--admin-text)', fontWeight: 700 }}>
            🖼️ Pick from Local Image Library
          </h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer', fontSize: '1.4rem' }}>
            <LuX />
          </button>
        </div>
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <LuSearch size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
            <input
              type="text"
              placeholder="Search local images..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-body)',
                color: 'var(--admin-text)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {filtered.map(img => (
              <div
                key={img.url}
                onClick={() => { onSelect(img.url); onClose(); }}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: currentUrl === img.url ? '2px solid var(--primary, #d11b1b)' : '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  padding: '4px',
                }}
              >
                <img src={img.url} alt={img.name} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                <div style={{ fontSize: '0.68rem', textAlign: 'center', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const desktopFileInputRef = useRef(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    categoryId: '',
    stock: '',
    image_url: '',
    specs: {}
  });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        getProducts({ limit: 100 }),
        getCategories()
      ]);

      const prodData = prodRes?.data?.data ?? prodRes?.data;
      setProducts(Array.isArray(prodData) ? prodData : []);
      const catData = catRes.data?.data || catRes.data;
      setCategories(Array.isArray(catData) ? catData : []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (product = null) => {
    setIsAddingNewCategory(false);
    setNewCategoryName('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        categoryId: product.categoryId || '',
        stock: product.stock !== undefined ? product.stock : '',
        image_url: product.image_url || '',
        specs: typeof product.specs === 'object' && !Array.isArray(product.specs) ? product.specs : {},
        specsText: Array.isArray(product.specs) ? product.specs.join('\n') : (typeof product.specs === 'string' ? product.specs : '')
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', categoryId: '', stock: '', image_url: '', specs: {}, specsText: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setShowImagePicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let currentCategoryId = formData.categoryId;
      let currentCategoryName = formData.category;

      // Handle new category creation inline
      if (isAddingNewCategory && newCategoryName.trim()) {
        const catRes = await createCategory({ name: newCategoryName.trim() });
        const newCat = catRes.data?.data || catRes.data;
        currentCategoryId = newCat.id;
        currentCategoryName = newCat.name;
      }

      // Merge specs: category specific (object) + manual ones (array from lines)
      let finalSpecs = { ...formData.specs };
      if (formData.specsText && formData.specsText.trim()) {
        const lines = formData.specsText.split('\n').filter(line => line.trim() !== '');
        // If it's pure lines, store as array. If we have category fields, maybe merge?
        // Let's store as array if no cat fields, or combined if possible.
        // The backend model says JSON. Let's stick to array if no fields, else object.
        if (Object.keys(finalSpecs).length === 0) {
          finalSpecs = lines;
        } else {
          // Merge lines into object if they follow "Key: Value" or just as index
          lines.forEach((line, index) => {
            if (line.includes(':')) {
              const [k, v] = line.split(':');
              finalSpecs[k.trim()] = v.trim();
            } else {
              finalSpecs[`spec_${index}`] = line.trim();
            }
          });
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        categoryId: currentCategoryId || null,
        category: currentCategoryName || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        image_url: formData.image_url,
        specs: finalSpecs
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product created successfully');
      }
      closeModal();
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    }
  };

    const handleImageFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setImageUploading(true);
    const toastId = toast.loading('Uploading product image to server...');

    try {
      const res = await uploadProductImage(file);
      const serverUrl = res?.data?.url || res?.url;
      if (serverUrl) {
        setFormData((prev) => ({ ...prev, image_url: serverUrl }));
        toast.success('Product image uploaded!', { id: toastId });
        setImageUploading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend image upload error; falling back to local reader.', err);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setFormData((prev) => ({ ...prev, image_url: dataUrl }));
      toast.success('Image loaded (offline preview)', { id: toastId });
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    exportToCSV(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryData?.name || p.category || '',
        price: p.price,
        stock: p.stock,
        image_url: p.image_url || '',
      })),
      `kudeja-products-${Date.now()}`,
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price (ETB)' },
        { key: 'stock', label: 'Stock' },
        { key: 'image_url', label: 'Image URL' },
      ]
    );
  };

  if (loading && products.length === 0) {
    return <div className="admin-loading">Loading products...</div>;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-btn admin-btn--outline" onClick={handleExport} disabled={products.length === 0}>
            <LuDownload size={16} style={{ marginRight: '6px' }} />
            Export CSV
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => openModal()}>
            <LuPlus size={18} style={{ marginRight: '8px' }} />
            Add Product
          </button>
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {products.length === 0 && !loading && !error ? (
        <div className="admin-empty-state">
          <p>No products available.</p>
          <button className="admin-btn admin-btn--primary" onClick={() => openModal()}>Create your first product</button>
        </div>
      ) : (
        <div className="admin-grid">
          {products.map((product) => (
            <div key={product.id} className="admin-card">
              <div className="admin-card-image">
                {product.image_url ? (
                  <img src={getProductImageUrl(product.image_url)} alt={product.name} />
                ) : (
                  <div className="admin-card-image-placeholder">
                    <LuImage size={32} />
                  </div>
                )}
              </div>
              <div className="admin-card-content">
                <h3 className="admin-card-title">{product.name}</h3>
                <p className="admin-card-subtitle">{product.categoryData?.name || product.category || 'Uncategorized'}</p>
                <div className="admin-card-details">
                  <span className="admin-card-price">{formatPrice(product.price)} ETB</span>
                  <span className={`admin-card-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              <div className="admin-card-actions">
                <button onClick={() => openModal(product)} className="admin-icon-btn" title="Edit Product">
                  <LuPencil size={18} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="admin-icon-btn action-delete" title="Delete Product">
                  <LuTrash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="admin-modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label>Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price (ETB) *</label>
                  <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div className="admin-form-group">
                  <label>Stock</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Category *</label>
                <select
                  name="categoryId"
                  value={isAddingNewCategory ? 'NEW' : formData.categoryId}
                  onChange={(e) => {
                    if (e.target.value === 'NEW') {
                      setIsAddingNewCategory(true);
                      setNewCategoryName(''); 
                      setFormData({ ...formData, categoryId: '', category: '', specs: {} });
                    } else {
                      setIsAddingNewCategory(false);
                      setNewCategoryName('');
                      const selectedCat = categories.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        category: selectedCat ? selectedCat.name : '',
                        specs: {}
                      });
                    }
                  }}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="NEW">+ Create New Category</option>
                </select>
              </div>

              {isAddingNewCategory && (
                <div className="admin-form-group" style={{ background: 'rgba(52, 152, 219, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--admin-primary)' }}>
                  <label>New Category Name *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    required={isAddingNewCategory}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
                    This category will be saved and selected for this product.
                  </p>
                </div>
              )}

              {formData.categoryId && !isAddingNewCategory && (
                <div className="admin-form-specs">
                  <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: 'var(--admin-primary)' }}>Optional Specifications for {formData.category}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {categories.find(c => c.id === formData.categoryId)?.specFields?.map(field => (
                      <div className="admin-form-group" key={field} style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem' }}>{field}</label>
                        <input
                          type="text"
                          value={formData.specs[field] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            specs: { ...formData.specs, [field]: e.target.value }
                          })}
                          placeholder={`Enter ${field}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, fontWeight: 600 }}>Product Image</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => setShowImagePicker(true)}
                  >
                    <LuImage size={14} /> Pick from Library
                  </button>
                </div>

                {/* Hidden file input for file chooser */}
                <input
                  ref={desktopFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                    e.target.value = '';
                  }}
                />

                {/* Unified Drag-and-drop / Choose Image zone */}
                <div
                  className={`admin-image-upload-zone${isDragging ? ' dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                  onClick={() => desktopFileInputRef.current?.click()}
                  style={{ cursor: 'pointer', padding: '1.25rem 1rem' }}
                >
                  <div className="upload-icon" style={{ marginBottom: '0.4rem' }}>
                    <LuUpload size={28} />
                  </div>
                  {imageUploading ? (
                    <p className="upload-label">
                      <span className="admin-upload-spinner" />
                      Uploading…
                    </p>
                  ) : formData.image_url ? (
                    <div>
                      <p className="upload-label" style={{ color: 'var(--admin-text)', fontWeight: 600, margin: '0 0 0.25rem' }}>
                        ✓ Image selected
                      </p>
                      <span className="admin-btn admin-btn--outline" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}>
                        Click to change image
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="admin-btn admin-btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.45rem 1rem', marginBottom: '0.4rem', pointerEvents: 'none' }}>
                        <LuUpload size={14} /> Choose Image
                      </span>
                      <p className="upload-label" style={{ margin: 0, fontSize: '0.82rem' }}>
                        or drag &amp; drop an image here (max 5 MB)
                      </p>
                    </div>
                  )}
                </div>

                {formData.image_url && (
                  <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                    <img
                      src={getProductImageUrl(formData.image_url)}
                      alt="preview"
                      className="admin-upload-preview"
                      style={{ marginTop: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                      style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff',
                        borderRadius: '50%', width: 26, height: 26, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Remove Image"
                    >
                      <LuX size={14} />
                    </button>
                  </div>
                )}

                {/* Fallback: paste a URL directly */}
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="Or paste an image URL directly"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>

              {/* Image library picker modal */}
              {showImagePicker && (
                <ProductImagePickerModal
                  currentUrl={formData.image_url}
                  onSelect={(url) => { setFormData(p => ({ ...p, image_url: url })); setShowImagePicker(false); }}
                  onClose={() => setShowImagePicker(false)}
                />
              )}

              <div className="admin-form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4"></textarea>
              </div>

              <div className="admin-form-group">
                <label>Specifications (One per line)</label>
                <textarea name="specsText" value={formData.specsText} onChange={handleInputChange} rows="4" placeholder="e.g. 16GB RAM&#10;512GB SSD&#10;Intel i7"></textarea>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={closeModal} className="admin-btn admin-btn--outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}