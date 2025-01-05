import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X } from "lucide-react";
import SelectProductsModal from '@/components/SelectProductsModal';
import { supabase } from '../utils/supabase';
import { SelectProductsModalProps } from '@/components/SelectProductsModal';
import PageHeader from '@/components/ui/PageHeader';
import { FolderKanban } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [selectedProductCount, setSelectedProductCount] = useState(0);

  useEffect(() => {
    const savedProducts = localStorage.getItem('selected_product_ids');
    if (savedProducts) {
      setSelectedProductCount(JSON.parse(savedProducts).length);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to create a project');
        return;
      }

      if (selectedProductIds.length === 0) {
        alert('Please select at least one product');
        return;
      }

      const projectData = {
        title: title,
        deadline: deadline,
        notes: note,
        user_id: user.id,
        product_ids: selectedProductIds,
        status: 'Pending',
        budget: 0,
        approved: false
      };
      console.log('Sending project data:', projectData);

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message);
      }

      console.log('Created project:', newProject);
      alert('Project created successfully!');
      
      setTitle('');
      setDeadline('');
      setNote('');
      setSelectedProductIds([]);
      setSelectedProductCount(0);
      
      onClose();
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Detailed error:', error);
        alert(`Error creating project: ${error.message}`);
      } else {
        console.error('Unknown error object:', error);
        alert('Error creating project: Unknown error');
      }
    }
  };

  const handleProductSelection = (ids: string[]) => {
    setSelectedProductIds(ids);
    setSelectedProductCount(ids.length);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-200 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
         <PageHeader 
              title="Create Project"
              description="Create your projects"
              bgColor="bg-base-100"
              padding='p-4'
              icon={<FolderKanban className="w-5 h-5" />}
              />
          <Button variant="close" color="primary" onClick={onClose}></Button>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Project Title</span>
            </label>
            <input 
              type="text" 
              placeholder="Enter project title" 
              className="input input-bordered w-full" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Deadline</span>
            </label>
            <input 
              type="date" 
              className="input input-bordered w-full text-base-content" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Note</span>
            </label>
            <textarea 
              placeholder="Enter project details" 
              className="textarea textarea-bordered h-24 resize-none" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Select Products</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowProductSelector(true)} 
              className="btn btn-outline w-full justify-start"
            >
              Choose Products...
            </button>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Selected Products</span>
            </label>
            <div className="text-sm text-blue-500">
              {selectedProductCount} products selected
            </div>
          </div>

          <div className="modal-action">
            <Button 
              variant="solid"
              color="secondary" 
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>

      <SelectProductsModal 
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onConfirm={handleProductSelection}
        selectedProductIds={selectedProductIds}
      />
    </div>
  );
} 