import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { 
  addNoticeApi, 
  updateNoticeApi, 
  getNoticeByIdApi, 
  deleteNoticeImageApi 
} from '../services/api';
import FormSkeleton from '../components/skeletons/FormSkeleton';

const emptyForm = {
  title: '',
  description: '',
  isActive: true,
  images: [], // for File objects
};

const AdminNoticeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const isEditing = !!id;

  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getNoticeByIdApi(id);
        setForm({
          title: data.title || '',
          description: data.description || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          images: [],
        });
        setExistingImages(data.images || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load notice details');
        navigate('/admin/notices');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      fetchNotice();
    }
  }, [id, isEditing, navigate, toast]);

  const validate = () => {
    const newErrs = {};
    if (!form.title.trim()) newErrs.title = 'Title is required';
    if (!form.description.trim()) newErrs.description = 'Description is required';

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
    const validFiles = [];
    const oversizedFiles = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 2MB and were skipped: ${oversizedFiles.join(', ')}`);
    }

    if (!validFiles.length) {
      e.target.value = null;
      return;
    }

    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
    
    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...previews]);
    
    // Clear input so same file can be selected again if needed
    e.target.value = null;
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteNoticeImageApi(imageId);
      toast.success('Image deleted successfully');
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    // Include isActive specifically
    formData.append('isActive', form.isActive);
    
    // Append all selected files
    form.images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      if (isEditing) {
        await updateNoticeApi(id, formData);
        toast.success('Notice updated successfully');
      } else {
        await addNoticeApi(formData);
        toast.success('Notice added successfully');
      }
      navigate('/admin/notices');
    } catch (err) {
      toast.error(err.message || 'Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton sections={1} fieldsPerSection={4} />;

  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <button 
          type="button" 
          className="btn btn-sm btn-outline" 
          onClick={() => navigate('/admin/notices')}
          style={{ gap: '0.35rem' }}
        >
          <span>←</span> Back to Notices
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{isEditing ? 'Edit Notice' : 'Add Notice'}</h1>
          <p className="page-subtitle">Provide details and upload related images for this notice.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="client-form-container">
        <div className="form-section-card">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--gray-100)',
            borderLeft: `3px solid var(--primary-500)`,
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            margin: '-1.25rem -1.5rem 1rem -1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.1rem' }}>📢</span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                Notice Details
              </h3>
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Title *</label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="Notice title..."
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={5}
                className="form-control"
                placeholder="Enter detailed description..."
                style={{ resize: 'vertical' }}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
               <input 
                 type="checkbox" 
                 id="isActive"
                 name="isActive" 
                 checked={form.isActive} 
                 onChange={handleChange} 
                 style={{ width: 'auto' }}
               />
               <label htmlFor="isActive" style={{ marginBottom: 0, cursor: 'pointer' }}>Active</label>
            </div>
            
            <div className="form-group">
               <label>Upload Images</label>
               <input 
                 type="file" 
                 multiple 
                 accept="image/*" 
                 onChange={handleFileChange}
                 className="form-control"
                 style={{ padding: '0.4rem' }}
               />
               <small style={{ color: 'var(--gray-500)', marginTop: '0.5rem', display: 'block' }}>
                 Select one or more images. Images will be stored along with the notice.
               </small>
            </div>

            {/* Display newly added images (Previews) */}
            {form.images.length > 0 && (
              <div className="form-group">
                <label>New Images Preview:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                  {newImagePreviews.map((previewUrl, index) => (
                    <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img 
                        src={previewUrl} 
                        alt={`new-${index}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          background: 'var(--danger-500)', color: 'white',
                          border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '0.8rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display existing images for edit mode */}
            {existingImages.length > 0 && (
              <div className="form-group">
                <label>Existing Images:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                  {existingImages.map((img) => (
                    <div key={img.id} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img 
                        src={img.imageUrl} 
                        alt={img.imageName || `existing-${img.id}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          background: 'var(--danger-500)', color: 'white',
                          border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '0.8rem'
                        }}
                        title="Delete this image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => navigate('/admin/notices')}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Notice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNoticeForm;
