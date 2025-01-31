import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { supabase } from '../utils/supabase';

interface Project {
  id: string;
  title: string;
  created_at: string;
  onproject: boolean;
}

interface SelectProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectIds: string[]) => void;
  selectedProjectIds: string[];
}

export default function SelectProjectsModal({
  isOpen,
  onClose,
  onConfirm,
  selectedProjectIds
}: SelectProjectsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedProjectIds);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Fetch all projects where onProject is false and status is 'Approved'
        const { data: allProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('onproject', false)
          .eq('status', 'Approved')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        alert('Error loading projects');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Select Projects</h3>
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{project.title}</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.includes(project.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected([...selected, project.id]);
                    } else {
                      setSelected(selected.filter(id => id !== project.id));
                    }
                  }}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="modal-action">
          <Button onClick={onClose} variant="solid" color="secondary" className="btn-outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="btn-primary">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
} 