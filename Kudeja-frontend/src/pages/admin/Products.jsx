// src/pages/admin/Products.jsx
import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../services/productService';
import { getCategories, createCategory } from '../../services/categoryService';
import { getProductImageUrl } from '../../utils/productImages';
import { formatPrice } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvUtils';
import { LuPlus, LuPencil, LuTrash, LuImage, LuUpload, LuDownload } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

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
    setImageUploading(true);
    try {
      const res = await uploadProductImage(file);
      const url = res?.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, image_url: url }));
        toast.success('Image uploaded!');
      }
    } catch (err) {
      toast.error('Image upload failed. Check Cloudinary credentials.');
    } finally {
      setImageUploading(false);
    }
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
                <label>Product Image</label>
                <div
                  className="admin-image-upload-zone"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageFileChange(file);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e.target.files[0])}
                  />
                  <div className="upload-icon"><LuUpload size={28} /></div>
                  {imageUploading ? (
                    <p className="upload-label">
                      <span className="admin-upload-spinner" />
                      Uploading…
                    </p>
                  ) : formData.image_url ? (
                    <p className="upload-label" style={{ color: 'var(--admin-text)', fontWeight: 600 }}>
                      ✓ Image ready — click or drag to replace
                    </p>
                  ) : (
                    <p className="upload-label">Click or drag &amp; drop an image here (max 5 MB)</p>
                  )}
                </div>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="preview"
                    className="admin-upload-preview"
                  />
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