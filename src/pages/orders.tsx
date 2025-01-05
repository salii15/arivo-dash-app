import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus, Pencil, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState, useEffect } from 'react';
import OrderModal from '@/components/OrderModal';
import { supabase } from '../utils/supabase';
import BillingModal from '@/components/BillingModal';

// Add interface for Order type
interface Order {
  id: number;
  title: string;
  status: string;
  total: number;
  budget: number;
  due_date: string;
  paid: boolean;
  customer_name: string;
  created_at: string;
}

export default function Orders() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [hasBillingInfo, setHasBillingInfo] = useState(false);

  // Verileri çekme fonksiyonu
  const fetchOrders = async () => {
    try {
      // Kullanıcı bilgisini kontrol et
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      // Siparişleri getir
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      console.log('Orders data:', data);
      console.log('Query error:', error);

      if (error) throw error;
      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  // Silme işlemi
  const handleDelete = async (id: number) => {
    if (window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  // Düzenleme işlemi
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  // Add this new function to check billing info
  const checkBillingInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('billing_info')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking billing info:', error);
      return false;
    }
  };

  // Modify the click handler for new order button
  const handleNewOrderClick = async () => {
    const hasBilling = await checkBillingInfo();
    setHasBillingInfo(hasBilling);

    if (!hasBilling) {
      // Show warning dialog
      if (window.confirm('You don\'t have billing info. You need to create billing info for create order. Would you like to add billing details now?')) {
        setIsBillingModalOpen(true);
      }
    } else {
      setIsOrderModalOpen(true);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Pagination hesaplamaları
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <DashboardLayout>
      <main className="flex-1 p-6 flex flex-col h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title="Orders"
            description="Manage and organize your orders"
            bgColor="bg-base-200"
            padding='p-4'
            icon={<WalletCards className="w-5 h-5" />}
          />
          <div className="flex items-center flex-row space-x-4">
            <Button 
              variant="solid" 
              color="primary" 
              icon={Plus}
              onClick={handleNewOrderClick}
            >
              New Order
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)]">
          <div className="flex-1 bg-base-200 rounded-lg overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="bg-base-100">
                  <tr className="text-white">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-3/4"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-16"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-20"></div></td>
                        </tr>
                      ))}
                    </>
                  ) : currentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-base-300 text-white">
                        <td className="px-6 py-4 font-medium">{order.title}</td>
                        <td className="px-6 py-4">
                          {(() => {
                            const dueDate = new Date(order.due_date);
                            const today = new Date();

                            if (order.paid) {
                              return (
                                <div className="badge badge-success">
                                  Paid
                                </div>
                              );
                            } else if (order.status === 'Pending') {
                              return (
                                <div className="text-white p-3 badge bg-blue-500 border-blue-500">
                                  Pending
                                </div>
                              );
                            } else if (dueDate < today) {
                              return (
                                <div className="badge bg-orange-500 border-orange-500">
                                  Overdue
                                </div>
                              );
                            } else {
                              return (
                                <div className={`badge ${
                                  order.status === 'completed' ? 'badge-success' :
                                  'badge-error'
                                }`}>
                                  {order.status}
                                </div>
                              );
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          ${order.budget?.toLocaleString() ?? '0'}
                        </td>
                        <td className="px-6 py-4">{new Date(order.due_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className={`badge ${order.paid ? 'badge-success' : 'badge-error'}`}>
                            {order.paid ? 'Paid' : 'Unpaid'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit(order)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              className="btn btn-sm btn-error"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 bg-base-200 p-4 rounded-lg flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-300">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, orders.length)} of {orders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-6 h-6" />
                </button>

                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                    if (totalPages > 7) {
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`btn btn-sm ${
                              pageNumber === currentPage 
                                ? 'btn-primary' 
                                : 'btn-outline btn-primary'
                            }`}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="text-gray-400 px-1">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNumber}
                        className={`btn btn-sm ${
                          pageNumber === currentPage 
                            ? 'btn-primary' 
                            : 'btn-outline btn-primary'
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <OrderModal 
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrder(null);
            fetchOrders();
          }}
          order={selectedOrder}
        />

        <BillingModal
          isOpen={isBillingModalOpen}
          onClose={() => {
            setIsBillingModalOpen(false);
            checkBillingInfo().then(setHasBillingInfo);
          }}
        />
      </main>
    </DashboardLayout>
  );
} 