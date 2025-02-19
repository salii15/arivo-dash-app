import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import CategoriesModal from '@/components/CategoriesModal';
import ProductModal from '@/components/ProductModal';
import { supabase } from '../utils/supabase';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Pencil, Trash2, FileBox, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ProductViewModal from '@/components/ProductViewModal';
import Button from '@/components/ui/Button';
import { FiFilter, FiUpload, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';
import PageHeader from '@/components/ui/PageHeader';
import DashboardLayout from '@/pages/DashboardLayout';

interface Product {
  id: string;
  title: string;
  category: string;
  sku: string;
  url: string;
  image_url?: string;
  user_id: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewProductModalOpen, setIsViewProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productToDelete.id));
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <DashboardLayout>


<main className="flex-1 p-6 flex flex-col h-[calc(100vh-80px)]">

          <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <PageHeader 
              title="Products"
              description="Manage and organize your products"
              bgColor="bg-base-200"
              padding='p-4'
              icon={<FileBox className="w-5 h-5" />}
            />
            <div className="flex items-center flex-row space-x-4">
              <Button 
                variant="outlined" 
                color="primary" 
                icon={FiFilter}
                onClick={() => setIsCategoriesModalOpen(true)}
              >
                Categories
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                icon={FiUpload}
              >
                Import CSV
              </Button>
              <Button 
                variant="solid" 
                color="primary" 
                icon={FiPlus}
                onClick={() => setIsNewProductModalOpen(true)}
              >
                New Product
              </Button>
            </div>
          </div>

          <div className="flex flex-col h-[calc(100%-80px)]">
            <div className="flex-1 bg-base-200 rounded-lg overflow-hidden">
              <div className="h-full overflow-y-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-base-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-16">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-40">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-48">URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {loading ? (
                      <>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-10 w-10 bg-base-300 rounded"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-3/4"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-16"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-48"></div></td>
                            <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-20"></div></td>
                          </tr>
                        ))}
                      </>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      currentProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-base-200 transition-colors">
                          <td className="px-6 py-4">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.title} 
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : (
                              <QuestionMarkCircleIcon className="h-10 w-10 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-200 truncate">{product.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-200 truncate">{product.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-200 truncate">{product.sku}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="truncate">
                              <a 
                                href={product.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary-500 hover:text-primary-400 hover:underline"
                              >
                                {product.url}
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsViewProductModalOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                className="btn btn-sm btn-error"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setIsDeleteModalOpen(true);
                                }}
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
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, products.length)} of {products.length} products
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

          <CategoriesModal 
            isOpen={isCategoriesModalOpen} 
            onClose={() => setIsCategoriesModalOpen(false)} 
          />
          
          <ProductModal
            isOpen={isNewProductModalOpen}
            onClose={() => setIsNewProductModalOpen(false)}
            mode="create"
            onOpenCategories={() => {
              setIsNewProductModalOpen(false);
              setIsCategoriesModalOpen(true);
            }}
          />

          <ProductViewModal 
            isOpen={isViewProductModalOpen}
            onClose={() => {
              setIsViewProductModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onOpenCategories={() => {
              setIsViewProductModalOpen(false);
              setIsCategoriesModalOpen(true);
            }}
          />

          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-base-300 p-6 rounded-lg max-w-sm w-full mx-4">
                <div className='flex flex-col '>
                    <h3 className="text-lg font-medium text-white mb-4">Delete Product</h3>
                    <span className="text-gray-300 mb-2">
                        Are you sure you want to delete this product? 
                    </span>
                    <span className="text-gray-300 mb-6">
                        This action cannot be undone.
                    </span>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="solid"
                    color="secondary"
                    icon={FiX}
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setProductToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    color="danger"
                    icon={FiTrash2}
                    onClick={handleDeleteProduct}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

    </DashboardLayout>
  );
} 