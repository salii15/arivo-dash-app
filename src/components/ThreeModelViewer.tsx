import { useEffect, useRef } from 'react';

interface ThreeModelViewerProps {
  model3d_url?: string;
  mode: 'view' | 'edit';
}

export default function ThreeModelViewer({ model3d_url, mode }: ThreeModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initViewer = async () => {
      const ThreeViewer = (window as any).ThreeViewer;
      if (!ThreeViewer) return;

      viewerRef.current = await new ThreeViewer(containerRef.current!.id);
      
      if (model3d_url) {
        viewerRef.current.loadModel(model3d_url);
      }
    };

    
    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
      }
    };
  }, [model3d_url]);

  return (
    <div 
      id={`three-${mode}-${Math.random().toString(36).substr(2, 9)}`} 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
} 