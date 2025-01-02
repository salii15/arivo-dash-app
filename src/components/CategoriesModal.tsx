import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Dialog } from '@headlessui/react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Plus, Pencil, Trash } from 'lucide-react';

interface Category {
  id: number;
  title: string;
  user_id: string;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('category_list')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    setCategories(data || []);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('category_list')
      .insert([{ 
        title: newCategory,
        user_id: user?.id 
      }]);

    if (error) {
      console.error('Error adding category:', error);
      return;
    }

    setNewCategory('');
    fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    const { error } = await supabase
      .from('category_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return;
    }

    fetchCategories();
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingTitle(category.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = async (id: number) => {
    if (!editingTitle.trim()) return;

    const { error } = await supabase
      .from('category_list')
      .update({ title: editingTitle })
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      return;
    }

    setEditingId(null);
    setEditingTitle('');
    fetchCategories();
  };

  const confirmDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[50]">
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
        <div className="bg-base-300 rounded-lg p-6 w-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-base-content">Categories</h2>
            <Button variant="close" onClick={onClose} className="ml-auto" />
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
              className="flex-1 px-4 py-2 bg-base-200 text-base-content rounded-md border-base-content/20 border"
            />
            <Button
              onClick={addCategory}
              variant="solid"
              color="primary"
              icon={Plus}
            >
              Add Category
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between bg-base-200 p-3 rounded-md">
                {editingId === category.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-3 py-1 bg-base-100 text-base-content rounded-md mr-2 border-base-content/20 border"
                    />
                    <div className="space-x-2 flex flex-row">
                      <Button
                        onClick={cancelEditing}
                        variant="outlined"
                        color="secondary"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => saveEdit(category.id)}
                        variant="solid"
                        color="primary"
                      
                      >
                        Save
                      </Button>
                    </div>
                  </>
                ) : deleteConfirmId === category.id ? (
                  <>
                    <span className="text-base-content">Are you sure?</span>
                    <div className="space-x-2 flex flex-row">
                      <Button
                        onClick={cancelDelete}
                        variant="solid"
                        color="primary"
                      >
                        No
                      </Button>
                      <Button
                        onClick={() => deleteCategory(category.id)}
                        variant="solid"
                        color="primary"
                      >
                        Yes
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-base-content">{category.title}</span>
                    <div className="space-x-2 flex flex-row">
                      <Button
                        onClick={() => startEditing(category)}
                        variant="outlined"
                        color="secondary"
                        icon={Pencil}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => confirmDelete(category.id)}
                        variant="solid"
                        color="danger"
                        icon={Trash}
                      >
                        
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 