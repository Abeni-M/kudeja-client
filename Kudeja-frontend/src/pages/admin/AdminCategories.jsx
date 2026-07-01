import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { LuPlus, LuPencil, LuTrash, LuList, LuDownload } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvUtils';
import '../../styles/admin.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleExport = () => {
    exportToCSV(
      categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        specs: Array.isArray(c.specFields) ? c.specFields.join(', ') : ''
      })),
      `kudeja-categories-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'specs', label: 'Specification Template' }
      ]
    );
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specFields: ''
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      const data = res.data?.data || res.data;
      setCategories(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        specFields: Array.isArray(category.specFields) ? category.specFields.join(', ') : ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', specFields: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        specFields: formData.specFields ? formData.specFields.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      closeModal();
      loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading && categories.length === 0) {
    return <div className="admin-loading">Loading categories...</div>;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="admin-btn admin-btn--outline" onClick={handleExport} disabled={categories.length === 0}>
            <LuDownload size={16} style={{ marginRight: '6px' }} />
            Export CSV
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => openModal()}>
            <LuPlus size={18} style={{ marginRight: '8px' }} />
            Add Category
          </button>
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      <div className="admin-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="admin-card category-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>{cat.name}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '2px 8px', borderRadius: '10px', marginTop: '4px', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                  ID: {cat.id.substring(0, 8)}...
                </span>
              </div>
              <div className="admin-card-actions" style={{ padding: 0 }}>
                <button onClick={() => openModal(cat)} className="admin-icon-btn" title="Edit Category">
                  <LuPencil size={16} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="admin-icon-btn action-delete" title="Delete Category">
                  <LuTrash size={16} />
                </button>
              </div>
            </div>
            <div className="admin-card-content" style={{ paddingTop: '1rem' }}>
              <p className="admin-card-subtitle" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{cat.description || 'No description provided.'}</p>

              <div className="spec-template-box" style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>Specification Template:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {cat.specFields?.length > 0 ? cat.specFields.map(f => (
                    <span key={f} style={{ fontSize: '0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px' }}>
                      {f}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No custom specs defined</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={closeModal} className="admin-modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label>Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Laptops" />
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <div className="admin-form-group">
                <label>Specification Template (Comma separated)</label>
                <input type="text" name="specFields" value={formData.specFields} onChange={handleInputChange} placeholder="e.g. RAM, Storage, CPU, GPU" />
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
                  These fields will appear when adding/editing products in this category.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={closeModal} className="admin-btn admin-btn--outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}