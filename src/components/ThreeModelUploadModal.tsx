import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import ThreeModelViewer from './ThreeModelViewer';
import { supabase } from '../utils/supabase';

interface ThreeModelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSuccess?: () => void;
}

export default function ThreeModelUploadModal({ isOpen, onClose, productId, onSuccess }: ThreeModelUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Create temporary URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not found');

      const fileName = `${Math.random()}.glb`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('3d_models')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('3d_models')
        .getPublicUrl(filePath);

      // Save to model3d table
      const { error: dbError } = await supabase
        .from('model3d')
        .upsert({
          product_id: productId,
          model3d_url: publicUrl,
          user_id: user.id
        });

      if (dbError) throw dbError;

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Model upload error:', error);
      alert('Model upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-300 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-base-content/10">
            <Dialog.Title className="text-xl font-bold text-base-content">
              Add 3D Model
            </Dialog.Title>
            <Button variant="close" color="primary" onClick={onClose} />
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="h-[500px] bg-base-200 rounded-lg mb-4">
              {previewUrl ? (
                <ThreeModelViewer model3d_url={previewUrl} mode="view" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-base-content/60">Select a 3D model to preview</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.glb,.gltf';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                Select 3D Model
              </Button>

              <Button
                variant="solid"
                color="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save'}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 