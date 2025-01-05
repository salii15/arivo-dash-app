import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowPathIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../utils/supabase';
import { Pencil, CirclePlus, RefreshCcw, Upload } from 'lucide-react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import {  } from 'lucide-react';

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onOpenCategories: () => void;
}

interface Product {
  id: string;
  title: string;
  image_url?: string;
  category?: string;
  url?: string;
  sku?: string;
  note?: string;
}

interface Category {
  id: number;
  title: string;
  user_id: string;
}

export default function ProductViewModal({ isOpen, onClose, product, onOpenCategories }: ProductViewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: product?.title || '',
    image_url: product?.image_url || '',
    category: product?.category || '',
    url: product?.url || '',
    sku: product?.sku || '',
    note: product?.note || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Reset form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        image_url: product.image_url || '',
        category: product.category || '',
        url: product.url || '',
        sku: product.sku || '',
        note: product.note || ''
      });
    }
  }, [product]);

  useEffect(() => {
    if (isEditing) {
      fetchCategories();
    }
  }, [isEditing]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('category_list')
        .select('*')
        .eq('user_id', user.id)
        .order('title');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          image_url: formData.image_url,
          category: formData.category,
          url: formData.url,
          sku: formData.sku,
          note: formData.note
        })
        .eq('id', product?.id);

      if (error) throw error;
      
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));

    } catch (error) {
      console.error('Image upload error:', error);
      alert('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: files => files[0] && uploadImage(files[0]),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  });

  const refreshCategories = async () => {
    await fetchCategories();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-300 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-base-content/10">
            <Dialog.Title className="text-xl font-bold text-base-content">
              {isEditing ? 'Edit Product' : 'View Product'}
            </Dialog.Title>
            <Button variant="close" color="primary" onClick={handleClose} />
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            {isEditing ? (
              // Edit Mode
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="col-span-1 space-y-4">
                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Title</label>
                    <input
                      type="text"
                      placeholder="Title"
                      className="input text-base-content input-bordered w-full bg-base-200 placeholder:text-primary-900"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Category</label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Select
                          value={formData.category}
                          onChange={(value) => setFormData({ ...formData, category: value })}
                          options={categories}
                          placeholder="Select a category"
                        />
                      </div>
                      <Button variant="outlined" color="primary" icon={RefreshCcw} onClick={refreshCategories} />
                      <Button variant="solid" color="primary" icon={CirclePlus} onClick={onOpenCategories} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">SKU</label>
                    <input
                      type="text"
                      placeholder="SKU"
                      className="input text-base-content input-bordered w-full bg-base-200 placeholder:text-primary-900"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">URL</label>
                    <input
                      type="text"
                      placeholder="URL"
                      className="input text-base-content input-bordered w-full bg-base-200 placeholder:text-primary-900"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Notes</label>
                    <textarea
                      placeholder="Notes"
                      className="textarea text-base-content textarea-bordered w-full bg-base-200 resize-none placeholder:text-primary-900"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="text-sm text-base-content/60 mb-1 block">Image</label>
                  <div {...getRootProps()} className="border-2 w-full h-auto border-dashed border-base-content/20 rounded-lg p-4 cursor-pointer hover:border-primary/50 aspect-square flex flex-col items-center justify-center">
                    <input {...getInputProps()} />
                    <div className="text-center flex flex-col items-center gap-4">
                      {formData.image_url ? (
                        <div className="w-full">
                          <img
                            src={formData.image_url}
                            alt="Product"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-400">
                            Click or drag to upload image
                          </p>
                          <Button variant="outlined" color="primary" className="mt-2" type="button">
                            Select Image
                          </Button>
                        </>
                      )}
                      {isUploading && (
                        <p className="text-blue-400 mt-2">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="col-span-1 space-y-4">
                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Title</label>
                    <div className="h-12 bg-base-200 rounded flex items-center px-4">
                      <span className="text-base-content truncate">{product?.title || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Category</label>
                    <div className="h-12 bg-base-200 rounded flex items-center px-4">
                      <span className="text-base-content truncate">{product?.category || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">SKU</label>
                    <div className="h-12 bg-base-200 rounded flex items-center px-4">
                      <span className="text-base-content truncate">{product?.sku || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">URL</label>
                    <div className="h-12 bg-base-200 rounded flex items-center px-4">
                      {product?.url ? (
                        <a 
                          href={product.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="link link-primary truncate block"
                        >
                          {product.url}
                        </a>
                      ) : (
                        <span className="text-base-content">-</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-base-content/60 mb-1 block">Notes</label>
                    <div className="bg-base-200 rounded p-4 min-h-[128px]">
                      <span className="text-base-content whitespace-pre-wrap">{product?.note || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="text-sm text-base-content/60 mb-1 block">Image</label>
                  <div className="border-2 w-full h-auto border-dashed border-base-content/20 rounded-lg p-4 aspect-square flex flex-col items-center justify-center">
                    {product?.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center flex flex-col items-center gap-4">
                        <Upload className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-400">No image available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons - Move outside of scrollable area */}
          <div className="p-6 border-t border-base-content/10 mt-auto">
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button variant="solid" color="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="solid" color="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="solid" color="primary" onClick={() => setIsEditing(true)} icon={Pencil}>
                  Edit Product
                </Button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 