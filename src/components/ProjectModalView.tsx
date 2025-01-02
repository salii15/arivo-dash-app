import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SelectProductsModal from './SelectProductsModal';


interface ProjectModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (isEdit: boolean) => void;
  projects: {
    id: string;
    title: string;
    deadline: string;
    notes: string;
    product_ids: string[];
  };
  products: Array<{ 
    id: string; 
    title: string;
  }>;
  onSave: (updatedProject: {
    title: string;
    deadline: string;
    notes: string;
    product_ids: string[];
  }) => void;
}

export default function ProjectModalView({ isOpen, onClose, onEdit, projects, products, onSave }: ProjectModalViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelectProductsModalOpen, setIsSelectProductsModalOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    title: projects.title,
    deadline: projects.deadline,
    notes: projects.notes,
    product_ids: projects.product_ids
  });

  const handleSave = () => {
    onSave(editedProject);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject({
      title: projects.title,
      deadline: projects.deadline,
      notes: projects.notes,
      product_ids: projects.product_ids
    });
    setIsEditing(false);
  };

  const handleEditProducts = () => {
    setIsSelectProductsModalOpen(true);
    if (onEdit) {
      onEdit(true);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-base-200 rounded-lg shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-base-300">
              <Dialog.Title className="text-xl font-semibold text-white">
                {isEditing ? 'Edit Project' : 'View Project'}
              </Dialog.Title>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn btn-primary btn-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-ghost btn-sm"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Project Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.title}
                    onChange={(e) => setEditedProject({...editedProject, title: e.target.value})}
                    className="input input-bordered w-full bg-base-300 text-white"
                  />
                ) : (
                  <div className="p-2 bg-base-300 rounded text-white">
                    {projects.title}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Deadline</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedProject.deadline.split('T')[0]}
                    onChange={(e) => setEditedProject({...editedProject, deadline: e.target.value})}
                    className="input input-bordered w-full bg-base-300 text-white"
                  />
                ) : (
                  <div className="p-2 bg-base-300 rounded text-white">
                    {new Date(projects.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Note</label>
                {isEditing ? (
                  <textarea
                    value={editedProject.notes}
                    onChange={(e) => setEditedProject({...editedProject, notes: e.target.value})}
                    className="textarea textarea-bordered w-full bg-base-300 text-white min-h-[100px]"
                  />
                ) : (
                  <div className="p-2 bg-base-300 rounded text-white min-h-[100px]">
                    {projects.notes}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                
                <label className="text-sm font-medium text-white">Selected Products</label>
                <div className="p-2 bg-base-300 rounded text-white max-h-96 overflow-y-auto">
                {isEditing ? (
    <button
      onClick={handleEditProducts}
      className="btn btn-primary btn-sm w-full"
    >
      Edit Selected Products
    </button>
  ) : (
    <div className="text-gray-400">No products selected</div>
  )}
                
                {projects.product_ids && projects.product_ids.length > 0 ? (
                  <div className="mb-2 pb-2 border-base-300">
                    {projects.product_ids.map(id => {
                      const matchingProduct = products?.find(p => p.id.trim() === id.trim());
                      return (
                        <div key={id} className="py-1 text-sm">
                          {matchingProduct ? (
                            <>
                              <span className="opacity-75">{matchingProduct.title}</span>
                            </>
                          ) : (
                            <span className="opacity-50">
                              Product not found ({id})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400">No products selected</div>
                )}              
              </div>
            </div>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>

    <SelectProductsModal 
      isOpen={isSelectProductsModalOpen}
      onClose={() => setIsSelectProductsModalOpen(false)}
      isEdit={true}
      onEdit={onEdit}
      selectedProductIds={editedProject.product_ids}
      onConfirm={(selectedProducts) => {
        setEditedProject({ ...editedProject, product_ids: selectedProducts });
        setIsSelectProductsModalOpen(false);
      }}
    />
    </>
  );
} 