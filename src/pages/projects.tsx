import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import ProjectModal from '@/components/ProjectModal';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '../utils/supabase';
import ProjectModalView from '../components/ProjectModalView';
import { Settings, BookOpen, FolderKanban, WalletCards, LayoutDashboard, Eye, Trash2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import DashboardLayout from '@/pages/DashboardLayout';
import AiProjectModal from '@/components/AiProjectModal';

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProducts();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(projectData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!selectedProject?.product_ids || selectedProject.product_ids.length === 0) {
        setProducts([]);
        return;
      }

      console.log('Selected project:', selectedProject);
      console.log('Product IDs:', selectedProject.product_ids);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', selectedProject.product_ids);

      console.log('Fetched products:', data);
      console.log('Error:', error);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleSaveProject = async (updatedProject: any) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', selectedProject.id);
      
      if (error) throw error;
      fetchProjects();
      setShowViewModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        // First check if project is referenced in any orders
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('projects')
          .not('projects', 'is', null);

        if (orderError) {
          console.error('Error checking orders:', orderError);
          return;
        }

        // Check if project exists in any order's projects array
        const isProjectInUse = orderData.some(order => 
          order.projects && order.projects.includes(projectId)
        );

        if (isProjectInUse) {
          alert('This project cannot be deleted because it is associated with an existing order.');
          return;
        }

        // If project is not in use, proceed with deletion
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .match({ id: projectId });
        
        if (deleteError) {
          console.error('Failed to delete project:', deleteError);
          return;
        }

        // Update UI after successful deletion
        setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
        await fetchProjects();

      } catch (error) {
        console.error('Error in delete operation:', error);
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  return (
    <DashboardLayout>
      <main className="flex-1 p-6 flex flex-col h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title="Projects"
            description="Manage and organize your projects"
            bgColor="bg-base-200"
            padding='p-4'
            icon={<FolderKanban className="w-5 h-5" />}
          />
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant='solid'
            color='primary'
            icon={PlusIcon}
          >
            New Project
          </Button>
        </div>

        <ProjectModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
        
        <div className="flex flex-col h-[calc(100%-80px)]">
          <div className="flex-1 bg-base-200 rounded-lg overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="bg-base-100">
                  <tr className="text-white">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">Project Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">Product Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-3/4"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-12"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-base-300 rounded w-20"></div></td>
                        </tr>
                      ))}
                    </>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    currentProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-base-300 text-white">
                        <td className="px-6 py-4 font-medium">{project.title}</td>
                        <td className="px-6 py-4">{new Date(project.deadline).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className={`badge text-black p-3 ${
                            project.status === 'On Going' ? 'bg-orange-500' :
                            project.status === 'Completed' ? 'bg-green-500' :
                            project.status === 'Pending' ? 'bg-blue-400' :
                            project.status === 'Quoted' ? 'bg-purple-500' :
                            project.status === 'Canceled' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}>
                            {project.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {project.budget === 0 ? (
                            <button 
                              className="btn btn-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-none"
                              onClick={() => {
                                setSelectedProject(project);
                                setShowAiModal(true);
                              }}
                            >
                              <Wand2 className="w-4 h-4 mr-1" />
                              Get Quote
                            </button>
                          ) : (
                            `$${project.budget.toLocaleString()}`
                          )}
                        </td>
                        <td className="px-10 py-4 text-center">
                          <div className="flex justify-center items-center py-1 w-auto bg-base-300 rounded-lg">
                            {project.product_ids?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setSelectedProject(project);
                                setShowViewModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="btn btn-sm btn-error"
                              onClick={() => handleDeleteProject(project.id)}
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, projects.length)} of {projects.length} projects
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

        {selectedProject && (
          <ProjectModalView
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            projects={selectedProject}
            products={products}
            onSave={handleSaveProject}
          />
        )}

        {selectedProject && (
          <AiProjectModal
            isOpen={showAiModal}
            onClose={() => setShowAiModal(false)}
            project={selectedProject}
            products={products}
          />
        )}
      </main>
    </DashboardLayout>
  );
} 