import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Pencil, Trash2, Upload, X, Save } from 'lucide-react';
import { ToastContainer } from '../components/Toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = 'http://localhost:5000/api/images';

const SortableImageCard = ({ image, onEdit, onDelete }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="image-card" {...attributes} {...listeners}>
      <div className="image-container">
        <img src={image.imageUrl} alt={image.title} />
      </div>
      <div className="image-info">
        <span className="image-title">{image.title}</span>
        <div className="image-actions" onPointerDown={e => e.stopPropagation()}>
          <button className="action-btn" onClick={() => onEdit(image)}><Pencil size={16} /></button>
          <button className="action-btn delete" onClick={() => onDelete(image._id)}><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
};

const Gallery: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});

  const [editingImage, setEditingImage] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data } = await api.get(API_URL);
      setImages(data);
    } catch (err) {
      console.error('Failed to fetch images', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i._id === active.id);
        const newIndex = items.findIndex(i => i._id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        const reorderPayload = newItems.map((item, index) => ({
          id: item._id,
          order: index
        }));

        api.put(`${API_URL}/reorder`, { items: reorderPayload })
          .catch(err => console.error('Failed to save order', err));

        return newItems;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      const newTitles = { ...titles };
      filesArray.forEach(f => {
        newTitles[f.name] = f.name.split('.')[0];
      });
      setTitles(newTitles);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles.length) return;

    previews.forEach(preview => URL.revokeObjectURL(preview));
    setPreviews([]);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });
    formData.append('titles', JSON.stringify(titles));

    try {
      const { data } = await api.post(`${API_URL}/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImages(prev => [...prev, ...data]);
      setIsUploadOpen(false);
      setSelectedFiles([]);
      setPreviews([]);
      setTitles({});
      addToast(`${data.length} image${data.length > 1 ? 's' : ''} uploaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Upload failed', err);
      addToast(err.response?.data?.message || 'Upload failed. Please try again.', 'error');
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    
    const fileToRemove = selectedFiles[index];
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    const newTitles = { ...titles };
    delete newTitles[fileToRemove.name];
    setTitles(newTitles);
  };

  const openEdit = (image: any) => {
    setEditingImage(image);
    setEditTitle(image.title);
    setEditFile(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingImage) return;

    const formData = new FormData();
    formData.append('title', editTitle);
    if (editFile) {
      formData.append('image', editFile);
    }

    try {
      const { data } = await api.put(`${API_URL}/${editingImage._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImages(prev => prev.map(img => img._id === editingImage._id ? data : img));
      setIsEditOpen(false);
      setEditingImage(null);
      setEditTitle('');
      setEditFile(null);
      addToast('Image updated successfully!', 'success');
    } catch (err: any) {
      console.error('Edit failed', err);
      addToast(err.response?.data?.message || 'Edit failed. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        setImages(prev => prev.filter(img => img._id !== id));
        addToast('Image deleted successfully!', 'success');
      } catch (err: any) {
        console.error('Delete failed', err);
        addToast(err.response?.data?.message || 'Delete failed. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="gallery-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="gallery-header">
        <h2>My Gallery</h2>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setIsUploadOpen(true)}>
          <Upload size={18} /> Upload Images
        </button>
      </div>

      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <p>No images found. Upload some to get started!</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(i => i._id)} strategy={rectSortingStrategy}>
            <div className="image-grid">
              {images.map(image => (
                <SortableImageCard
                  key={image._id}
                  image={image}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="modal-overlay" onClick={() => {
          previews.forEach(preview => URL.revokeObjectURL(preview));
          setPreviews([]);
          setSelectedFiles([]);
          setTitles({});
          setIsUploadOpen(false);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Bulk Upload</h3>
              <button className="action-btn" onClick={() => setIsUploadOpen(false)}><X size={18} /></button>
            </div>

            <div className="file-drop-zone">
              <input
                type="file"
                multiple
                accept="image/*"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={48} style={{ margin: '0 auto 1rem', color: 'var(--accent-color)' }} />
                <p>Click to select or drag and drop images here</p>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Selected Files ({selectedFiles.length})</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {selectedFiles.map((file, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img 
                        src={previews[i]} 
                        alt={file.name}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        onClick={() => removeFile(i)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white',
                          padding: '0'
                        }}
                      >
                        <X size={14} />
                      </button>
                      <div style={{ padding: '0.5rem', background: 'var(--card-bg)' }}>
                        <input
                          type="text"
                          value={titles[file.name] || ''}
                          onChange={(e) => setTitles({ ...titles, [file.name]: e.target.value })}
                          className="form-control"
                          style={{ padding: '0.3rem', fontSize: '0.75rem', width: '100%' }}
                          placeholder="Title"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="btn btn-primary" onClick={handleUploadSubmit} style={{ marginTop: '1rem' }}>
                  <Save size={18} /> Upload All
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingImage && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Edit Image</h3>
              <button className="action-btn" onClick={() => setIsEditOpen(false)}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="form-control"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Replace Image (Optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={e => e.target.files && setEditFile(e.target.files[0])}
              />
            </div>

            <button className="btn btn-primary" onClick={handleEditSubmit}>
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
