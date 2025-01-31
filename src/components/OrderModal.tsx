import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '../utils/supabase';
import PageHeader from '@/components/ui/PageHeader';
import { FileText } from "lucide-react";
import SelectProjectsModal from '@/components/SelectProjectsModal';

interface Order {
  id: string;
  title: string;
  budget: number;
  paid: boolean;
  payment_status: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  status?: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProjectCount, setSelectedProjectCount] = useState(0);

  const generateOrderId = () => {
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `ORD-${randomNum}`;
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  const handleCreateOrder = async () => {
    console.log('Create order clicked');
    
    if (!title) {
      alert('Please enter a title');
      return;
    }

    if (selectedProjectIds.length === 0) {
      alert('Please select at least one project');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      if (!user) {
        alert('Please login to create an order');
        return;
      }

      // Fetch selected projects to calculate total budget
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('budget')
        .in('id', selectedProjectIds);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      // Calculate total budget from selected projects
      const totalBudget = projects?.reduce((sum, project) => sum + (project.budget || 0), 0);

      // Fetch the count of existing orders to determine the next order number
      const { data: existingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      const orderCount = existingOrders.length;
      const orderNumber = `ORD-${(2658 + orderCount).toString().padStart(4, '0')}`; // 2658'den başla

      // Create order data
      const orderData = {
        title: title,
        order_number: orderNumber, // Yeni sipariş numarası
        status: 'Pending',
        budget: totalBudget,
        due_date: getDefaultDueDate(),
        paid: false,
        invoice_number: 'none',
        notes: notes,
        projects: selectedProjectIds,
        user_id: user.id,
      };

      console.log('Attempting to insert order:', orderData);

      // Insert into Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Order created successfully:', data);
      alert('Order created successfully!');
      resetForm();
      onClose();
      window.location.reload();

      // Seçilen projeleri güncelle
      await Promise.all(selectedProjectIds.map(async (projectId) => {
        const { error } = await supabase
          .from('projects')
          .update({ onproject: true }) // Projeyi güncelle
          .eq('id', projectId);

        if (error) throw error;
      }));

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setSelectedProjectIds([]);
    setSelectedProjectCount(0);
  };

  const handleProjectSelection = (ids: string[]) => {
    setSelectedProjectIds(ids);
    setSelectedProjectCount(ids.length);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-200 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title="Create Order"
            description="Create new order"
            bgColor="bg-base-100"
            padding='p-4'
            icon={<FileText className="w-5 h-5" />}
          />
          <Button variant="close" color="primary" onClick={onClose}></Button>
        </div>
        
        <div className="space-y-6">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Order Title</span>
            </label>
            <input 
              type="text" 
              placeholder="Enter order title" 
              className="input input-bordered w-full" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea 
              placeholder="Enter order notes" 
              className="textarea textarea-bordered h-24 resize-none" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Select Projects</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowProjectSelector(true)} 
              className="btn btn-outline w-full justify-start"
            >
              Choose Projects...
            </button>
            <div className="text-sm mt-2">
              {selectedProjectCount} projects selected
            </div>
          </div>

          <div className="modal-action">
            <button 
              className="btn btn-outline btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCreateOrder}
            >
              Create Order
            </button>
          </div>
        </div>
      </div>

      <SelectProjectsModal 
        isOpen={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        onConfirm={handleProjectSelection}
        selectedProjectIds={selectedProjectIds}
      />
    </div>
  );
} 