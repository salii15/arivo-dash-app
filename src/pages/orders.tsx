import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus, Pencil, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye, CreditCard } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState, useEffect } from 'react';
import OrderModal from '@/components/OrderModal';
import { supabase } from '../utils/supabase';
import BillingModal from '@/components/BillingModal';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

// Update the Order interface
interface Order {
  id: string;
  title: string;
  budget: number;  // opsiyonel olarak işaretlendi
  paid: boolean;
  payment_status: string;
  created_at: string;
  updated_at: string; // Optional field from OrderModal
  status?: string;        // Optional field from OrderModal
  user_id: string; // user_id ekleyelim
  order_number?: string;
}

interface Billing {
  id: string;  // Optional field from OrderModal
  user_id: string; 
  legal_name?: string;  // Optional field from OrderModal
  tax_id?: string; // Optional field from OrderModal
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  postal_code?: string;
  stripe_customer_id?: string; // Optional field from OrderModal
}

interface CheckoutResponse {
  url?: string;
  message?: string;
  details?: string;
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
  const [billing, setBilling] = useState<Billing | null>(null);
  const router = useRouter();

  // Verileri çekme fonksiyonu
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

        const { data: billing_info, error: billingError } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched orders:', orders); // Debug için
      setOrders(orders || []);
      if (billing_info) {
        setBilling(billing_info[0] || null);
      } else {
        setBilling(null);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Silme işlemi
  const handleDelete = async (id: string) => {
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

  // Add the handlePayment function to redirect to Stripe
  const handlePayment = async (order: Order, billing: Billing) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('User not found');
        return;
      }

      // Prepare order data for Stripe
      const orderData = {
        orderId: order.order_number,
        amount: order.budget,
        title: order.title,
        billingInfo: {
          legal_name: billing.legal_name,
          address1: billing.address1,
          address2: billing.address2,
          city: billing.city,
          state: billing.state,
          postal_code: billing.postal_code,
          country: billing.country,
          tax_id: billing.tax_id,
          phone: billing.phone,
          email: user.email,
          currency: 'usd', // or use billing.currency if available
          customer_id: billing.stripe_customer_id, // Use existing Stripe customer ID
        },
      };

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error response from Stripe:', data);
        throw new Error(data.details || data.message || 'Payment initiation failed');
      }

      if (data && data.url) {
        window.location.href = data.url; // Redirect to Stripe payment page
      } else {
        throw new Error('No checkout URL received. Please try again later.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = () => {
    const { success, canceled } = router.query;

    if (success) {
      toast.success('Payment completed successfully!');
      fetchOrders(); // Refresh orders
    }

    if (canceled) {
      toast.error('Payment canceled.');
    }
  };

  // Pagination hesaplamaları
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
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
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
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
                        <td className="px-6 py-4">{order.title}</td>
                        <td className="px-6 py-4 font-medium">{order.order_number || order.id}</td>
                        <td className="px-6 py-4">
                          {order.title || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          ${order.budget ? order.budget.toFixed(2) : '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.payment_status)}`}>
                            {order.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => {/* Add view logic */}}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="btn btn-sm btn-error"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {/* Add the Pay Now button if the order is unpaid */}
                            {!order.paid && order.payment_status !== 'pending' && (
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={() => {
                                  if (billing) {
                                    handlePayment(order, billing); // Call only if billing is not null
                                  } else {
                                    // Handle the case where billing is null, e.g., show a message
                                    toast.error('Billing information is required.');
                                  }
                                }}
                                disabled={loading}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Pay Now
                              </button>
                            )}
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