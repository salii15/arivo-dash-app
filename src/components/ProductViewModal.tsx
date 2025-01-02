import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowPathIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../utils/supabase';
import { Pencil, CirclePlus, RefreshCcw } from 'lucide-react';
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
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50 ">
      <div className="fixed inset-0 bg-black/100" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 bg-base-500">
        <Dialog.Panel className="modal-box bg-base-300 max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center border-b border-base-300">
            <Button variant="close" onClick={handleClose} className="ml-auto" />
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="card bg-neutral p-4">
                  <label className="label text-sm text-primary-900">Product Title</label>
                  <input
                    type="text"
                    placeholder="Title"
                    className="input input-bordered bg-base-200 text-base-content w-full"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div {...getRootProps()} className="border-2 border-dashed border-neutral/50 rounded-lg p-4 cursor-pointer h-[200px] flex items-center justify-center bg-neutral hover:bg-neutral-focus transition-colors">
                  <input {...getInputProps()} />
                  <div className="text-center">
                    {isUploading ? (
                      <p className="text-primary">Uploading...</p>
                    ) : formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Product"
                        className="max-h-[180px] object-contain mx-auto"
                      />
                    ) : (
                      <p className="text-neutral-content">Click or drag to upload image</p>
                    )}
                  </div>
                </div>

                <div className="card bg-neutral p-4">
                  <label className="label text-sm text-primary-900">Category</label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Select
                        value={formData.category}
                        onChange={(value) => setFormData({ ...formData, category: value })}
                        options={categories}
                        placeholder="Select a category"
                      />
                    </div>
                    <Button variant="outlined" color="primary" icon={RefreshCcw} onClick={refreshCategories}>
                    
                    </Button>
                    <Button  variant="solid" color="primary" icon={CirclePlus} onClick={onOpenCategories}>

                    </Button>
                  </div>
                </div>

                <div className="card bg-neutral p-4">
                  <label className="label text-sm text-primary-900">SKU</label>
                  <input
                    type="text"
                    placeholder="SKU"
                    className="input input-bordered bg-base-200 text-base-content w-full"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className="card bg-neutral p-4">
                  <label className="label text-sm text-primary-900">URL</label>
                  <input
                    type="text"
                    placeholder="URL"
                    className="input input-bordered bg-base-200 text-base-content w-full"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>

                <div className="card bg-neutral p-4">
                  <label className="label text-sm text-primary-900">Notes</label>
                  <textarea
                    placeholder="Notes"
                    className="textarea textarea-bordered bg-base-200 text-base-content h-[120px] w-full resize-none"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button variant="solid" color="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="solid" color="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="card bg-base-200 p-4">
                  <label className="label text-sm text-primary-900">Product Title</label>
                  <div className="mt-1 text-neutral-content">{product?.title || '-'}</div>
                </div>

                <div className="h-[300px] card bg-neutral overflow-hidden">
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-contain bg-base-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-neutral-content">No image available</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card bg-base-200 p-4">
                    <label className="label text-sm text-primary-900">Category</label>
                    <div className="mt-1 text-neutral-content">{product?.category || '-'}</div>
                  </div>
                  <div className="card bg-base-200 p-4">
                    <label className="label text-sm text-primary-900">SKU</label>
                    <div className="mt-1 text-neutral-content">{product?.sku || '-'}</div>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <label className="label text-sm text-primary-900">URL</label>
                  <div className="mt-1">
                    <a 
                      href={product?.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary hover:text-primary-focus"
                    >
                      {product?.url || '-'}
                    </a>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <label className="label text-sm text-primary-900">Notes</label>
                  <div className="mt-1 whitespace-pre-wrap h-[120px] overflow-y-auto text-neutral-content">
                    {product?.note || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="p-6 w-full right-0 border-t border-base-300">
              <Button 
                variant="solid"
                color="primary"
                onClick={() => setIsEditing(true)}
                className="ml-auto"
                icon={Pencil}>
                    Edit Product
                
              </Button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 