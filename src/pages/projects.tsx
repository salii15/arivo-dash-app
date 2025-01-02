import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import ProjectModal from '@/components/ProjectModal';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '../utils/supabase';
import ProjectModalView from '../components/ProjectModalView';
import { Settings, BookOpen, FolderKanban, WalletCards, LayoutDashboard } from "lucide-react";
import DashboardLayout from '@/pages/DashboardLayout';

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

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
        .select('*');

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

  return (
    <DashboardLayout>

<main className="flex-1 p-6">
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
          
          {loading ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-base-content text-lg mb-4">No projects found</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outlined"
                color="primary"
                icon={PlusIcon}
              >
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto select-none">
              <table className="table table-zebra w-full bg-base-200">
                <thead>
                  <tr className="text-white">
                    <th className="text-white">Project Name</th>
                    <th className="text-white">Deadline</th>
                    <th className="text-white">Status</th>
                    <th className="text-white">Budget</th>
                    <th className="text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-base-300 text-white">
                      <td className="font-medium">{project.title}</td>
                      <td>{new Date(project.deadline).toLocaleDateString()}</td>
                      <td>
                        <div className={`badge ${
                          project.status === 'On Going' ? 'badge-warning' :
                          project.status === 'Completed' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {project.status}
                        </div>
                      </td>
                      <td>${project.budget.toLocaleString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowViewModal(true);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        {selectedProject && (
        <ProjectModalView
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          projects={selectedProject}
          products={products}
          onSave={handleSaveProject}
        />
      )}
    </DashboardLayout>

  );
} 