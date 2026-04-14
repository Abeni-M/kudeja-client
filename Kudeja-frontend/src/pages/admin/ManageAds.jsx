import React, { useState, useEffect, useMemo } from 'react';
import { getAllAds, createAd, updateAd, deleteAd } from '../../services/adService';
import toast from 'react-hot-toast';
import { LuPlus, LuTrash2, LuPen, LuEye, LuEyeOff, LuImage, LuX, LuSearch } from 'react-icons/lu';
import '../../styles/admin.css';

// ─── Load ALL local images from src/images/ via Vite glob ──────────────────
const imageModules = import.meta.glob('../../images/*', { eager: true });
const localImages = Object.entries(imageModules).map(([path, mod]) => ({
  name: path.split('/').pop(),
  url: mod.default,
}));

// ─── Image Picker Sub-Component ─────────────────────────────────────────────
const ImagePickerModal = ({ onSelect, onClose, currentUrl }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    localImages.filter(img =>
      img.name.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: 0, color: 'var(--admin-text)', fontWeight: 700, fontSize: '1.1rem' }}>
            🖼️ insert images
          </h4>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}
          >
            <LuX />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <LuSearch size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-body)',
                color: 'var(--admin-text)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
            {filtered.length} image{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>No images found</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.75rem',
            }}>
              {filtered.map(img => {
                const isSelected = currentUrl === img.url;
                return (
                  <div
                    key={img.url}
                    onClick={() => { onSelect(img.url); onClose(); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: isSelected
                        ? '2px solid var(--primary, #d11b1b)'
                        : '2px solid transparent',
                      background: 'var(--bg-card)',
                      transition: 'all 0.18s ease',
                      transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary, #d11b1b)';
                      e.currentTarget.style.transform = 'scale(0.97)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = isSelected ? 'scale(0.97)' : 'scale(1)';
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.68rem',
                      color: 'var(--admin-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: isSelected ? 700 : 400,
                      background: isSelected ? 'rgba(209,27,27,0.12)' : 'transparent',
                    }}>
                      {isSelected && '✓ '}{img.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const ManageAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const emptyForm = {
    companyName: '', address: '', description: '',
    website: '', phone: '', email: '', image: '', isActive: true,
    slideImages: [], slideInterval: 5, placement: 'sidebar'
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await getAllAds();
      setAds(res.data);
    } catch {
      toast.error('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleOpenModal = (ad = null) => {
    setEditingAd(ad);
    setFormData(ad ? {
      companyName: ad.companyName || '',
      address: ad.address || '',
      description: ad.description || '',
      website: ad.website || '',
      phone: ad.phone || '',
      email: ad.email || '',
      image: ad.image || '',
      isActive: ad.isActive,
      placement: ad.placement || 'sidebar',
      slideImages: Array.isArray(ad.slideImages) ? ad.slideImages : (typeof ad.slideImages === 'string' ? JSON.parse(ad.slideImages || '[]') : []),
      slideInterval: ad.slideInterval || 5,
    } : emptyForm);
    setShowImagePicker(false);
    setShowModal(true);
  };

  const set = (field) => (e) => setFormData(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        slideImages: JSON.stringify(formData.slideImages),
      };
      if (editingAd) {
        await updateAd(editingAd.id, payload);
        toast.success('Ad updated successfully');
      } else {
        await createAd(payload);
        toast.success('Ad created successfully');
      }
      setShowModal(false);
      fetchAds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await deleteAd(id);
        toast.success('Ad deleted');
        fetchAds();
      } catch {
        toast.error('Failed to delete ad');
      }
    }
  };

  const toggleStatus = async (ad) => {
    try {
      await updateAd(ad.id, { ...ad, isActive: !ad.isActive });
      toast.success(`Ad ${!ad.isActive ? 'activated' : 'deactivated'}`);
      fetchAds();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-body)',
    color: 'var(--admin-text)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  };

  return (
    <div className="admin-container">
      {/* ── Page Header ── */}
      <div className="admin-row" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--admin-text)', fontWeight: 800 }}>Manage Ads</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal()}>
          <LuPlus size={18} style={{ marginRight: '0.5rem' }} />
          Add New Ad
        </button>
      </div>

      {/* ── Ads Table ── */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading ads...</div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
            No ads found. Create your first advertisement!
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Company Name</th>
                  <th>Placement</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td style={{ width: '80px' }}>
                      {ad.image ? (
                        <img
                          src={ad.image}
                          alt={ad.companyName}
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                          onError={e => { e.target.src = ''; e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 40, background: 'var(--bg-card)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                          <LuImage size={18} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{ad.companyName + ' - ' + ad.description}</td>
                    <td>
                      <span className={`admin-pill ${ad.placement === 'banner' ? 'admin-pill-warning' : 'admin-pill-secondary'}`}>
                        {ad.placement === 'banner' ? '⭐ Premium Banner' : 'Sidebar'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--admin-muted)' }}>
                      {ad.address}
                    </td>
                    <td>
                      <span className={`admin-pill ${ad.isActive ? 'admin-pill-success' : 'admin-pill-error'}`}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-outline" onClick={() => toggleStatus(ad)} title={ad.isActive ? 'Deactivate' : 'Activate'}>
                          {ad.isActive ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                        </button>
                        <button className="admin-btn admin-btn-outline" onClick={() => handleOpenModal(ad)} title="Edit">
                          <LuPen size={16} />
                        </button>
                        <button className="admin-btn admin-btn-error" onClick={() => handleDelete(ad.id)} title="Delete">
                          <LuTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <LuX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Company Name */}
              <div className="admin-form-group">
                <label>Company Name *</label>
                <input type="text" style={inputStyle} value={formData.companyName} onChange={set('companyName')} required placeholder="e.g. Kudeja Tech" />
              </div>

              {/* Address */}
              <div className="admin-form-group">
                <label>Company Address *</label>
                <input type="text" style={inputStyle} value={formData.address} onChange={set('address')} required placeholder="e.g. Addis Ababa, Ethiopia" />
              </div>

              {/* Description */}
              <div className="admin-form-group">
                <label>Description / Info</label>
                <textarea
                  value={formData.description}
                  onChange={set('description')}
                  placeholder="What does the company do? Any promotional message..."
                  rows="3"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Phone */}
              <div className="admin-form-group">
                <label>Phone Number <span style={{ color: 'var(--admin-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input type="text" style={inputStyle} value={formData.phone} onChange={set('phone')} placeholder="e.g. +251 9XXXXXXXX" />
              </div>

              {/* Placement Selector */}
              <div className="admin-form-group">
                <label>Ad Placement (Type) *</label>
                <select style={inputStyle} value={formData.placement} onChange={set('placement')} required>
                  <option value="sidebar">📱 Standard Vertical Sidebar</option>
                  <option value="banner">🖥️ Premium Horizontal Top Banner</option>
                </select>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--admin-muted)' }}>
                  Premium banners span across the top of the Home dashboard.
                </p>
              </div>

              {/* Email */}
              <div className="admin-form-group">
                <label>Email Address <span style={{ color: 'var(--admin-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input type="email" style={inputStyle} value={formData.email} onChange={set('email')} placeholder="e.g. contact@company.com" />
              </div>

              {/* Website */}
              <div className="admin-form-group">
                <label>Website URL <span style={{ color: 'var(--admin-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input type="text" style={inputStyle} value={formData.website} onChange={set('website')} placeholder="e.g. https://www.company.com" />
              </div>

              {/* Slide Interval */}
              <div className="admin-form-group">
                <label>Slide Interval (seconds)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={formData.slideInterval}
                  onChange={e => setFormData(f => ({ ...f, slideInterval: Number(e.target.value) }))}
                  min="0"
                />
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--admin-muted)' }}>
                  Interval between image slides. Set to 0 to disable auto-slide.
                </p>
              </div>

              {/* ── Image Field ── */}
              <div className="admin-form-group">
                <label>Ad Image *</label>

                {/* Input + Gallery button row */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <input
                    type="text"
                    style={{ ...inputStyle, flex: 1 }}
                    value={formData.image}
                    onChange={set('image')}
                    required
                    placeholder="Paste URL or click 📁 to pick from library"
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => setShowImagePicker(true)}
                    title="Pick from local image library"
                    style={{ flexShrink: 0, gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    <LuImage size={16} />
                    Pick
                  </button>
                </div>

                {/* Live Preview */}
                {formData.image && (
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--primary, #d11b1b)' }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, image: '' }))}
                      style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                        borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <LuX size={14} />
                    </button>
                  </div>
                )}

                <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--admin-muted)' }}>
                  💡 Tip: This is the primary / cover image for the ad.
                </p>
              </div>

              {/* ── Multiple Slide Images ── */}
              <div className="admin-form-group">
                <label>Additional Slideshow Images</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => {
                        // We'll repurpose the ImagePicker for adding to the array
                        setShowImagePicker(true);
                        // Temporarily flag that we are picking for the SLIDESHOW
                        window.__pickingForSlideshow = true;
                    }}
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <LuPlus size={18} /> Add Image to Slideshow
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {formData.slideImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '70px' }}>
                      <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, slideImages: f.slideImages.filter((_, i) => i !== idx) }))}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <LuX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active checkbox */}
              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 'auto', accentColor: 'var(--primary)' }}
                  />
                  Active — display this ad on the Home page
                </label>
              </div>

              {/* Actions */}
              <div className="admin-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Picker Modal ── */}
      {showImagePicker && (
        <ImagePickerModal
          currentUrl={formData.image}
          onSelect={url => {
            if (window.__pickingForSlideshow) {
              setFormData(f => ({ ...f, slideImages: [...f.slideImages, url] }));
              window.__pickingForSlideshow = false;
            } else {
              setFormData(f => ({ ...f, image: url }));
            }
          }}
          onClose={() => {
              setShowImagePicker(false);
              window.__pickingForSlideshow = false;
          }}
        />
      )}
    </div>
  );
};

export default ManageAds;
