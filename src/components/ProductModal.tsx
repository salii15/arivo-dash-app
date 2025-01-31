import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Pencil, CirclePlus, RefreshCcw, Upload } from 'lucide-react';



interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  onOpenCategories: () => void;
}

type Category = {
  id: number;
  title: string;
  user_id: string;
};

export default function ProductModal({ isOpen, onClose, mode, onOpenCategories }: ProductModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    category: '',
    url: '',
    sku: '',
    note: '',
  });
  const [errors, setErrors] = useState({
    title: false,
    category: false,
    url: false,
    sku: false,
  });
  const [isUploading, setIsUploading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);


  const getCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('category_list')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {
      title: !formData.title,
      category: !formData.category,
      url: !formData.url,
      sku: !formData.sku,
    };
    
    setErrors(newErrors);

    // If any required field is empty, stop submission
    if (Object.values(newErrors).some(error => error)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User authentication required');
      }

      // Get the latest product to find the last ARV ID
      const { data: latestProduct } = await supabase
        .from('products')
        .select('arv_id')
        .order('created_at', { ascending: false })
        .limit(1);

      // Generate new ARV ID
      let newNumber = 2658; // Default starting number
      if (latestProduct && latestProduct[0]?.arv_id) {
        const currentNumber = parseInt(latestProduct[0].arv_id.split('-')[1]);
        newNumber = currentNumber + 1;
      }
      const newArvId = `ARV-${newNumber}`;

      const productData = {
        title: formData.title,
        image_url: formData.image_url,
        category: formData.category || null,
        url: formData.url || null,
        sku: formData.sku || null,
        note: formData.note || null,
        user_id: user.id,
        arv_id: newArvId // Add the new ARV ID
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      onClose();
      window.location.reload();
      setFormData({
        title: '',
        image_url: '',
        category: '',
        url: '',
        sku: '',
        note: '',
      });

    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User authentication required for upload');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));

    } catch (error: any) {
      console.error('Image upload error:', error);
      alert('Image upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadImage(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  });



  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-30">
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-base-300 rounded-lg max-w-4xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-base-content/10">
              <Dialog.Title className="text-xl font-bold text-base-content">
                {mode === 'create' ? 'Create Product' : mode === 'edit' ? 'Edit Product' : 'View Product'}
              </Dialog.Title>
              <Button variant="close" color="primary" onClick={onClose}></Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">



                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="col-span-1 space-y-4">
                    <div className="h-12 bg-gray-700 rounded">
                      <input
                        type="text"
                        placeholder="Title *"
                        className={`input text-base-content input-bordered w-full bg-base-200 placeholder:text-primary-900 ${
                          errors.title ? 'border-red-500' : ''
                        }`}
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          setErrors({ ...errors, title: false });
                        }}
                        required
                      />
                    </div>

                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Select
                            value={formData.category}
                            onChange={(value) => {
                              setFormData({ ...formData, category: value });
                              setErrors({ ...errors, category: false });
                            }}
                            options={categories}
                            placeholder="Select a category *"
                            required
                          />
                        </div>
                        <Button variant="outlined" color="primary" icon={RefreshCcw} onClick={getCategories}>
                        
                        </Button>
                        <Button 
                          variant="solid" 
                          color="primary" 
                          icon={CirclePlus} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCategories();
                          }}
                        >

                        </Button>
                      </div>

                    
                    <input
                        type="text"
                        placeholder="SKU *"
                        className={`input text-base-content input-bordered w-full bg-base-200 placeholder:text-primary-900 ${
                          errors.sku ? 'border-red-500' : ''
                        }`}
                        value={formData.sku}
                        onChange={(e) => {
                          setFormData({ ...formData, sku: e.target.value });
                          setErrors({ ...errors, sku: false });
                        }}
                        required
                      />
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="URL *"
                          className={`input text-base-content input-bordered flex-1 bg-base-200 placeholder:text-primary-900 ${
                            errors.url ? 'border-red-500' : ''
                          }`}
                          value={formData.url}
                          onChange={(e) => {
                            setFormData({ ...formData, url: e.target.value });
                            setErrors({ ...errors, url: false });
                          }}
                          required
                        />
         
                      </div>

                    
                    <textarea
                      placeholder="Notes"
                      className="textarea text-base-content textarea-bordered w-full bg-base-200 resize-none placeholder:text-primary-900"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={4}
                    />

                  </div>

                  <div className="col-span-2 flex flex-col items-center justify-center bg-base-200 rounded-lg p-4">
                   
                      <div {...getRootProps()} className="border-2 w-full h-auto border-dashed border-base-content/20 rounded-lg p-4 cursor-pointer hover:border-primary/50 aspect-square flex flex-col items-center justify-center">
                        <input {...getInputProps()} />
                        <div className="text-center flex flex-col items-center gap-4">
                          {formData.image_url ? (
                            <div className="w-full">
                              <img
                                src={formData.image_url}
                                alt="Ürün resmi"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-gray-400" />
                              <p className="text-gray-400">
                                {isDragActive
                                  ? 'Dosyayı buraya bırakın...'
                                  : 'Resim yüklemek için tıklayın veya dosyayı sürükleyin'}
                              </p>
                              <Button variant="outlined" color="primary" className="mt-2" type="button">
                                Select Image
                              </Button>
                            </>
                          )}
                          {isUploading && (
                            <p className="text-blue-400 mt-2">Yükleniyor...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  

                  <div className="col-span-3 space-y-4 mt-4">
                   
                  </div>
                </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  variant="solid"
                  color='secondary'
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color='primary'
                >
                  {mode === 'create' ? 'Create' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

    </>
  );
} 