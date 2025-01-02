import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../utils/supabase';
import Button from '@/components/ui/Button';

export interface SelectProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  onEdit?: (isEdit: boolean) => void;
  onConfirm: (selectedProducts: string[]) => void;
  selectedProductIds: string[];
}

interface Product {
  id: string;
  title: string;
  category_id: string;
  category: string;
  // ... add other product fields as needed
}

interface Category {
  id: string;
  title: string;
}

export default function SelectProductsModal({ isOpen, onClose, isEdit, onEdit, onConfirm, selectedProductIds }: SelectProductsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
        setSelectedProducts(selectedProductIds);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      initializeData();
    }
  }, [isOpen, selectedProductIds]);

  useEffect(() => {
    localStorage.setItem('selected_product_ids', JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id);
      
    if (products) setProducts(products);
  };

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: categories } = await supabase
      .from('category_list')
      .select('*')
      .eq('user_id', user.id);
    if (categories) setCategories(categories);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (filterContainerRef.current) {
      const scrollAmount = 200;
      const newScrollPosition = filterContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      filterContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCategory === 'all' || product.category === selectedCategory)
  );

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleConfirm = () => {
    localStorage.setItem('selected_product_ids', JSON.stringify(selectedProducts));
    onConfirm(selectedProducts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[99999]"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }} 
      />
      <div 
        className="relative w-full max-w-3xl mx-auto bg-base-200 p-6 rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-base-content">Select Products</h3>
              <button onClick={onClose} className="btn bg-secondary-700 btn-circle text-base-content">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search products..."
                className="input input-bordered w-full text-base-content placeholder:text-base-content/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

                <div className="relative mt-2">
                  <div className=" absolute inset-y-0 left-0 flex items-center">
                    <button 
                      onClick={() => scroll('left')} 
                      className="btn btn-circle btn-sm bg-secondary-700 text-base-content hover:bg-base-300 z-10"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div 
                    ref={filterContainerRef}
                    className="flex gap-2 overflow-x-auto px-12 scrollbar-hide scroll-smooth"
                  >
                    <button
                      className={`btn btn-sm whitespace-nowrap ${
                        selectedCategory === 'all' ? 'btn-primary' : 'btn-ghost text-base-content'
                      }`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`btn btn-sm whitespace-nowrap ${
                          selectedCategory === cat.title ? 'btn-primary' : 'btn-ghost text-base-content'
                        }`}
                        onClick={() => setSelectedCategory(cat.title)}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>

                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button 
                      onClick={() => scroll('right')} 
                      className="btn btn-circle btn-sm bg-secondary-700 text-base-content hover:bg-base-300 z-10"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button 
                    className="btn btn-sm btn-secondary text-base-content"
                    onClick={toggleSelectAll}
                  >
                    {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-base-content/70">
                    {selectedProducts.length} selected
                  </span>
                </div>

                <div className="max-h-[24rem] overflow-y-auto space-y-2 pr-2">
                  {filteredProducts.map((product) => (
                    <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-base-300 rounded-lg text-base-content">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary bg-secondary-600"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => {
                          setSelectedProducts(prev => 
                            prev.includes(product.id)
                              ? prev.filter(id => id !== product.id)
                              : [...prev, product.id]
                          );
                        }}
                      />
                      <span>{product.title}</span>
                    </label>
                  ))}
                </div>
              </div>

            <div className="modal-action">
              <Button variant='solid' color='secondary' onClick={onClose}>Cancel</Button>
              <Button variant='solid' color='secondary' onClick={handleConfirm}>
                Confirm Selection
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 