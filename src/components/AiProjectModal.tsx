import { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import Button from '@/components/ui/Button';

interface AiProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  products: any[];
}

export default function AiProjectModal({ isOpen, onClose, project, products }: AiProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEstimates(null);
      setLoading(false);
    }
  }, [isOpen]);

  const getQuote = async () => {
    setEstimates(null);
    setLoading(true);
    
    try {
      const productDetails = products.map(product => ({
        id: product.id,
        name: product.title || product.name
      }));

      const response = await fetch('/api/budget-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: productDetails }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Quote Response:', data);
      setEstimates(data.estimates);
    } catch (error) {
      console.error('Error getting quote:', error);
      alert('Failed to get quote. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getImageQuote = async () => {
    setEstimates(null);
    setLoading(true);
    
    try {
      const productDetails = products.map(product => ({
        id: product.id,
        name: product.title || product.name,
        image_url: product.image_url
      }));

      console.log('Making API request to:', '/api/image-budget-api');
      
      const response = await fetch('/api/image-budget-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: productDetails }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      setEstimates(data.estimates);
    } catch (error) {
      console.error('Detailed error:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to get image quote. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!estimates) {
        alert('Please get a quote first');
        return;
      }

      const totalBudget = Object.values(estimates)
        .reduce((a, b) => a + b, 0);

      const { error } = await supabase
        .from('projects')
        .update({ 
          budget: totalBudget,
          status: 'Quoted'
        })
        .eq('id', project.id);

      if (error) throw error;
      
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-300 rounded-lg p-6 w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-base-content">AI Budget Estimation</h2>
          <button className="btn btn-sm btn-circle text-base-content" onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1">
            <div className="overflow-x-auto">
              <table className="table w-full text-base-content">
                <thead className="sticky top-0 bg-base-300 z-10">
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Estimated Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="avatar">
                          <div className="w-12 h-12 rounded">
                            <img 
                              src={product.image_url || '/placeholder-image.jpg'} 
                              alt={product.title || product.name}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td>{product.title || product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.type}</td>
                      <td>
                        {estimates?.[product.title || product.name] 
                          ? `$${estimates[product.title || product.name].toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 border-t border-base-content/20 pt-4">
            <div className="bg-base-200 p-3 rounded-lg shadow-inner mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-base-content/70">Estimated Total Budget:</span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {estimates 
                    ? `$${Object.values(estimates)
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString()}`
                    : '-'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">

              <button 
                type="button"
                className="btn relative overflow-hidden group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white border-0"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  getQuote();
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    <span className="ml-2">Calculating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2 animate-pulse" />
                    <span className="relative z-10">Generate AI Quote</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/30 to-purple-400/0 
                                  group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
                    </div>
                  </>
                )}
              </button>

              <Button 
                variant="solid"
                color="primary"
                onClick={handleSave}
                disabled={!estimates}
              >
                Save Budget
              </Button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}