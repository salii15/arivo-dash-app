import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { ChevronLeft, Trash2, Eye, EyeOff, Edit2, Palette, MousePointer, ChevronDown, Plus, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import sceneConfig from '@/config/scene.json';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { toast } from 'react-hot-toast';
import { supabase } from '@/utils/supabase';

export default function ThreeEditor() {
  const router = useRouter();
  const { productId } = router.query;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [sceneObjects, setSceneObjects] = useState<THREE.Object3D[]>([]);
  const [materials, setMaterials] = useState<THREE.Material[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controls = useRef<OrbitControls | null>(null);
  const [highlightedMaterialName, setHighlightedMaterialName] = useState<string | null>(null);
  const [focusedMaterialName, setFocusedMaterialName] = useState<string | null>(null);
  const [isColorConfigOpen, setIsColorConfigOpen] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [colorConfigs, setColorConfigs] = useState<Array<{ id: number, colorName: string, colorData: string }>>([]);
  const [isPickingMesh, setIsPickingMesh] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredMesh, setHoveredMesh] = useState<THREE.Mesh | null>(null);
  const [selectedMeshName, setSelectedMeshName] = useState('');
  const [dropdownMeshes, setDropdownMeshes] = useState<THREE.Mesh[]>([]);
  const [selectedColorConfig, setSelectedColorConfig] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBack = () => {
    setShowConfirmDialog(true);
  };

  useEffect(() => {
    async function initScene() {
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const container = document.getElementById('scene-container');
      if (!container) return;
      
      const camera = new THREE.PerspectiveCamera(
        sceneConfig.camera.fov,
        container.clientWidth / container.clientHeight,
        sceneConfig.camera.near,
        sceneConfig.camera.far
      );
      cameraRef.current = camera;
      camera.position.set(
        sceneConfig.camera.position.x,
        sceneConfig.camera.position.y,
        sceneConfig.camera.position.z
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      
      // Setup renderer
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      container.appendChild(renderer.domElement);

      // Add grid helper with more divisions
      const gridHelper = new THREE.GridHelper(
        sceneConfig.grid.size,
        sceneConfig.grid.divisions,
        parseInt(sceneConfig.grid.centerLineColor),
        parseInt(sceneConfig.grid.gridLineColor)
      );
      scene.add(gridHelper);

      // Setup camera position
      camera.position.set(1, 1, 1);
      camera.lookAt(0, 0, 0);

      // Update orbit controls limits
      controls.current = new OrbitControls(camera, renderer.domElement);
      controls.current.enabled = false;
      controls.current.enableDamping = true;
      controls.current.dampingFactor = sceneConfig.controls.dampingFactor;
      controls.current.minDistance = sceneConfig.controls.minDistance;
      controls.current.maxDistance = sceneConfig.controls.maxDistance;

      // Load HDR environment
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load(
        'https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/studio02-b.hdr',
        (texture: THREE.Texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
          const envMap = new THREE.PMREMGenerator(renderer).fromEquirectangular(texture).texture;
          const colorBG = new THREE.Color(0x585858);
          scene.background = colorBG;
        }
      );

      // Add fog to the scene
      scene.fog = new THREE.Fog(0xffffff, 1, 33);

      // Add axes helper with absolute positioning
      const axesHelper = new THREE.AxesHelper(2);
      const axesDiv = document.createElement('div');
      axesDiv.style.position = 'absolute';
      axesDiv.style.right = '10px';
      axesDiv.style.top = '10px';
      axesDiv.style.width = '100px';
      axesDiv.style.height = '100px';
      axesDiv.style.zIndex = '1000';
      axesDiv.style.pointerEvents = 'none';
      axesDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      axesDiv.style.borderRadius = '5rem';
      container.appendChild(axesDiv);

      const axesRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      axesRenderer.setSize(100, 100);
      axesRenderer.setClearColor(0x000000, 0);
      axesDiv.appendChild(axesRenderer.domElement);

      const axesCamera = new THREE.PerspectiveCamera(99, 1, 0.1, 10);
      axesCamera.position.set(25, 25, 25);
      axesCamera.lookAt(0, 0, 0);

      const axesScene = new THREE.Scene();
      axesScene.add(axesHelper);

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        controls.current?.update();
        
        // Update fog based on camera distance
        const distance = camera.position.length();
        scene.fog = new THREE.Fog(
          parseInt(sceneConfig.fog.color),
          distance * sceneConfig.fog.nearFactor,
          distance * sceneConfig.fog.farFactor
        );
        
        // Sync axes camera rotation with main camera
        axesCamera.position.copy(camera.position);
        axesCamera.position.normalize().multiplyScalar(3);
        axesCamera.lookAt(0, 0, 0);
        
        // Render main scene
        renderer.render(scene, camera);
        
        // Render axes helper
        axesRenderer.render(axesScene, axesCamera);
      }
      animate();

      // Handle resize
      function handleResize() {
        const container = document.getElementById('scene-container');
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        container.removeChild(renderer.domElement);
        container.removeChild(axesDiv);
        renderer.dispose();
        axesRenderer.dispose();
      };
    }

    initScene();
  }, []);

  const handleModelUpload = async (file: File) => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    const loader = new GLTFLoader();
    const model = await loader.loadAsync(URL.createObjectURL(file));
    
    // Add model to scene
    sceneRef.current.add(model.scene);
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Update camera position based on model size
    const distance = Math.max(size.x, size.y, size.z) * 2;
    cameraRef.current.position.set(distance, distance * 0.8, distance);
    cameraRef.current.lookAt(center);
    
    // Extract objects and materials
    const objects: THREE.Object3D[] = [];
    const mats: THREE.Material[] = [];
    
    model.scene.traverse((child: THREE.Object3D) => {
      if (child.type === 'Mesh') {
        objects.push(child);
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mats.push(...mesh.material);
        } else {
          mats.push(mesh.material);
        }
      }
    });
    
    setSceneObjects(objects);
    setMaterials(Array.from(new Set(mats)));
    setIsModelLoaded(true);
    
    // Enable controls
    if (controls.current) {
      controls.current.enabled = true;
      controls.current.target.copy(center);
      controls.current.update();
    }
    

  };

  const handleObjectVisibility = (obj: THREE.Object3D) => {
    obj.visible = !obj.visible;
    setSceneObjects([...sceneObjects]); // Force re-render
  };

  const handleObjectRename = (obj: THREE.Object3D) => {
    const newName = prompt('Enter new name:', obj.name);
    if (newName !== null) {
      obj.name = newName;
      setSceneObjects([...sceneObjects]); // Force re-render
    }
  };

  const handleObjectDelete = (obj: THREE.Object3D) => {
    if (confirm('Are you sure you want to delete this object?')) {
      obj.removeFromParent();
      setSceneObjects(sceneObjects.filter(o => o !== obj));
    }
  };

  const handleMaterialEdit = (material: THREE.Material) => {
    // Implement material editing logic here
    console.log('Edit material:', material);
  };

  const handleMaterialHighlight = (material: THREE.Material) => {
    // First, clear all previous highlights
    sceneObjects.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        const meshMaterial = Array.isArray(obj.material) ? obj.material : [obj.material];
        meshMaterial.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (mat.userData.originalEmissive) {
              mat.emissive.copy(mat.userData.originalEmissive);
              mat.emissiveIntensity = 1;
              delete mat.userData.originalEmissive;
            }
          }
        });
      }
    });

    // If clicking the same material, just clear highlight
    if (highlightedMaterialName === material.name) {
      setHighlightedMaterialName(null);
      return;
    }

    // Add highlight to objects with this material
    sceneObjects.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        const meshMaterial = Array.isArray(obj.material) ? obj.material : [obj.material];
        meshMaterial.forEach((mat) => {
          if (mat.name === material.name && mat instanceof THREE.MeshStandardMaterial) {
            mat.userData.originalEmissive = mat.emissive.clone();
            mat.emissive.setHex(0x00ff00);
            mat.emissiveIntensity = 0.5;
          }
        });
      }
    });
    
    setHighlightedMaterialName(material.name);
  };

  const handleMaterialFocus = (material: THREE.Material) => {
    // If already focused, show all objects
    if (focusedMaterialName === material.name) {
      sceneObjects.forEach((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.visible = true;
        }
      });
      setFocusedMaterialName(null);
      return;
    }

    // Hide all objects except those with the selected material
    sceneObjects.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        const meshMaterial = Array.isArray(obj.material) ? obj.material : [obj.material];
        const hasMaterial = meshMaterial.some(mat => mat.name === material.name);
        obj.visible = hasMaterial;
      }
    });
    
    setFocusedMaterialName(material.name);
  };

  const handleMouseMove = (event: MouseEvent) => {
    // Mouse text selection'ı engelle
    if (isPickingMesh) {
      event.preventDefault();
    }

    if (!isPickingMesh || 
        event.buttons !== 0 || 
        !sceneRef.current || 
        !cameraRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const container = document.getElementById('scene-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneObjects, true);

    // Reset all materials first
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
        delete child.userData.originalMaterial;
      }
    });

    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      if (hoveredObject instanceof THREE.Mesh) {
        setHoveredMesh(hoveredObject);
        
        hoveredObject.userData.originalMaterial = hoveredObject.material.clone();
        
        const highlightMaterial = new THREE.MeshStandardMaterial({
          color: hoveredObject.material.color,
          transparent: true,
          opacity: 0.7,
          emissive: new THREE.Color(0x00ff00),
          emissiveIntensity: 0.5
        });

        hoveredObject.material = highlightMaterial;
      }
    }
  };

  const handleClick = () => {
    if (isPickingMesh && hoveredMesh) {
      console.log('Selected Mesh:', {
        name: hoveredMesh.name,
        type: hoveredMesh.type,
        material: hoveredMesh.material
      });
      
      setSelectedMeshName(hoveredMesh.name);
      setIsPickingMesh(false);
    }
  };

  useEffect(() => {
    const container = document.getElementById('scene-container');
    if (!container) return;

    const onClick = () => handleClick();
    container.addEventListener('click', onClick);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPickingMesh, hoveredMesh]);

  useEffect(() => {
    if (!isPickingMesh && sceneRef.current) {
      // Reset all materials when exiting picking mode
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
          delete child.userData.originalMaterial;
        }
      });
    }
  }, [isPickingMesh]);

  const addNewColorConfig = () => {
    const newId = colorConfigs.length > 0 ? Math.max(...colorConfigs.map(c => c.id)) + 1 : 1;
    setColorConfigs([...colorConfigs, { id: newId, colorName: '', colorData: '' }]);
  };

  const handleColorChange = (configId: number, color: string) => {
    const hexColor = color.replace('#', '0x');
    const updated = colorConfigs.map(c => 
      c.id === configId ? { ...c, colorData: hexColor } : c
    );
    setColorConfigs(updated);
  };

  useEffect(() => {
    if (sceneRef.current) {
      const meshes: THREE.Mesh[] = [];
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
      setDropdownMeshes(meshes);
    }
  }, [sceneObjects]);

  const handleMeshColorChange = (colorData: string) => {
    if (selectedMeshName) {
      const mesh = sceneRef.current?.getObjectByName(selectedMeshName);
      if (mesh instanceof THREE.Mesh) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.color.setHex(parseInt(colorData.replace('0x', ''), 16));
      }
    }
  };

  const handleSave = async () => {
    if (!hasChanges || !sceneRef.current) {
      return;
    }

    try {
      setIsSaving(true);

      // Get the current scene as GLB
      const exporter = new GLTFExporter();
      const glbBlob = await new Promise((resolve) => {
        exporter.parse(
          sceneRef.current!,
          (gltf: ArrayBuffer) => {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            resolve(blob);
          },
          { binary: true }
        );
      });

      // Create unique filename
      const filename = `model_${productId}_${Date.now()}.glb`;

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('models-glb')
        .upload(filename, glbBlob as Blob);

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('models-glb')
        .getPublicUrl(filename);

      const modelUrl = publicUrlData.publicUrl;

      // Update database
      const { error: dbError } = await supabase
        .from('model3d')
        .upsert({
          product_id: productId,
          model_url: modelUrl
        }, {
          onConflict: 'product_id'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      setHasChanges(false);
      toast.success('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Set hasChanges to true when a model is loaded
    if (isModelLoaded) {
      setHasChanges(true);
    }
  }, [isModelLoaded]);

  useEffect(() => {
    // Set hasChanges to true when materials are modified
    if (materials.length > 0) {
      setHasChanges(true);
    }
  }, [materials]);

  useEffect(() => {
    // Set hasChanges to true when color configs change
    if (colorConfigs.length > 0) {
      setHasChanges(true);
    }
  }, [colorConfigs]);

  return (
    <>
      <div className="flex flex-col h-screen bg-base-300">
        {/* Top Navbar */}
        <div className="h-16 bg-base-200 border-b border-base-300 flex items-center px-6 justify-between">
          <Button
            variant="solid"
            onClick={handleBack}
            className="mr-4 bg-base-200 hover:bg-base-300 text-base-content"
            size="sm"
          >
            <ChevronLeft className="w-5 h-5 text-base-content" />
            Back
          </Button>
          
          <div className="flex items-center">
            <h1 className="text-lg font-medium text-base-content">{productId}</h1>
          </div>

          <Button
            variant="solid"
            size="sm"
            className={`bg-primary hover:bg-primary-focus text-primary-content ${
              !hasChanges && 'opacity-50 cursor-not-allowed'
            }`}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save 3D Model
          </Button>

        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-200 p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-bold mb-4">Are you sure you want to leave?</h3>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outlined"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Continue Editing
                </Button>
                <Button
                  variant="solid"
                  onClick={() => router.back()}
                  className="bg-primary"
                >
                  Yes, Leave
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with Sidebars */}
        <div className="flex flex-1">
          {/* Left Sidebar */}
          <div className="w-80 bg-base-200 border-r border-base-300 p-4">
            {isModelLoaded ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-base-content-light">Objects</h2>
                    <span className="text-xs text-base-content-dim">{sceneObjects.length} items</span>
                  </div>
                  
                  <div className="bg-base-300/50 rounded-lg">
                    <div className="flex items-center justify-between p-2 border-b border-base-100">
                      <span className="text-xs text-base-content-dim">Name</span>
                      <div className="flex gap-3">
                        <span className="text-xs text-base-content-dim">Visibility</span>
                        <span className="text-xs text-base-content-dim">Actions</span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-base-100">
                      {sceneObjects.map((obj, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 hover:bg-base-100/50 transition-colors group"
                        >
                          <span className="text-sm text-base-content truncate max-w-[150px]">
                            {obj.name || `Object ${index + 1}`}
                          </span>
                          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1.5 rounded-md hover:bg-base-100"
                              onClick={() => handleObjectVisibility(obj)}
                            >
                              {obj.visible ? 
                                <Eye className="w-3.5 h-3.5 text-base-content" /> : 
                                <EyeOff className="w-3.5 h-3.5 text-base-content" />
                              }
                            </button>
                            <button 
                              className="p-1.5 rounded-md hover:bg-base-100"
                              onClick={() => handleObjectRename(obj)}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-base-content" />
                            </button>
                            <button 
                              className="p-1.5 rounded-md hover:bg-red-500/10"
                              onClick={() => handleObjectDelete(obj)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-base-content-light">Materials</h2>
                    <span className="text-xs text-base-content-dim">{materials.length} items</span>
                  </div>
                  
                  <div className="bg-base-300/50 rounded-lg">
                    <div className="flex items-center justify-between p-2 border-b border-base-100">
                      <span className="text-xs text-base-content-dim">Material Name</span>
                      <div className="flex gap-3">
                        <span className="text-xs text-base-content-dim">Actions</span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-base-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {materials.map((mat, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 hover:bg-base-100/50 transition-colors group
                            ${highlightedMaterialName === mat.name ? 'bg-green-900/30' : ''}`}
                        >
                          <span className="text-sm text-base-content truncate max-w-[150px]">
                            {mat.name || `Material ${index + 1}`}
                          </span>
                          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1.5 rounded-md hover:bg-base-100"
                              onClick={() => handleMaterialFocus(mat)}
                            >
                              <Eye className={`w-3.5 h-3.5 ${
                                focusedMaterialName === mat.name ? 'text-blue-400' : 'text-base-content'
                              }`} />
                            </button>
                            <button 
                              className="p-1.5 rounded-md hover:bg-base-100"
                              onClick={() => handleMaterialHighlight(mat)}
                            >
                              <Palette className={`w-3.5 h-3.5 ${
                                highlightedMaterialName === mat.name ? 'text-green-400' : 'text-base-content'
                              }`} />
                            </button>
                            <button 
                              className="p-1.5 rounded-md hover:bg-base-100"
                              onClick={() => handleMaterialEdit(mat)}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-base-content" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <h2 className="text-lg font-bold text-base-content-light">Upload a model to start</h2>
            )}
          </div>

          {/* 3D Scene Container */}
          <div className="flex-1 relative">
            <div id="scene-container" className="absolute inset-0">
              {!isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-300 bg-opacity-90">
                  <div className="bg-base-200 p-8 rounded-lg shadow-xl text-center">
                    <div 
                      className="border-4 border-dashed border-base-300 rounded-lg p-12 mb-4"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files[0];
                        if (file.name.match(/\.(glb|gltf)$/)) {
                          await handleModelUpload(file);
                        }
                      }}
                    >
                      <p className="text-lg mb-4">Drag and drop your 3D model here</p>
                      <p className="text-sm text-base-content-dim">Supported formats: .glb, .gltf</p>
                    </div>
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      className="hidden"
                      id="model-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleModelUpload(file);
                        }
                      }}
                    />
                    <Button
                      onClick={() => document.getElementById('model-upload')?.click()}
                      variant="solid"
                      className="bg-primary text-primary-content"
                    >
                      Select Model
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className={`absolute bottom-0 left-0 right-0 bg-base-200/90 backdrop-blur-sm transition-all duration-300 ${isColorConfigOpen ? 'h-24' : 'h-0'} overflow-hidden`}>
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar">
                  {colorConfigs.map((config) => (
                    <div 
                      key={config.id} 
                      className="flex flex-col items-center gap-1 min-w-[60px]"
                    >
                      <button
                        className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${
                          selectedColorConfig === config.colorData ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: config.colorData.replace('0x', '#') }}
                        onClick={() => {
                          setSelectedColorConfig(config.colorData);
                          handleMeshColorChange(config.colorData);
                        }}
                      />
                      <span className="text-xs text-base-content whitespace-nowrap">
                        {config.colorName || `Color ${config.id}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-base-200 border-l border-base-300 p-4">
            
            <div className="mb-6 bg-base-100 rounded-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-base-content" />
                  <h2 className="text-sm font-semibold text-base-content-light">Color Configuration</h2>
                </div>
                <input 
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={isColorConfigOpen}
                  onChange={(e) => setIsColorConfigOpen(e.target.checked)}
                />
              </div>

              {isColorConfigOpen && (
                <div className="space-y-4">
                  <div className="bg-base-300/50 rounded-lg p-2">
                    <div className="mb-3 relative">
                      <label className="text-xs text-base-content-dim block mb-1">Select Mesh</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={selectedMeshName}
                          readOnly
                          placeholder="Select a mesh..."
                          className="input input-sm input-bordered flex-1 text-base-content bg-base-200"
                        />
                        <button
                          className={`p-1.5 rounded-md ${isPickingMesh ? 'bg-primary text-primary-content' : 'hover:bg-base-100 text-base-content'}`}
                          onClick={() => setIsPickingMesh(!isPickingMesh)}
                        >
                          <MousePointer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-base-100 text-base-content"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-base-200 rounded-lg shadow-lg border border-base-300">
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {dropdownMeshes.map((mesh, index) => (
                              <button
                                key={index}
                                className="w-full text-left px-3 py-2 hover:bg-base-300 text-sm text-base-content"
                                onClick={() => {
                                  setSelectedMeshName(mesh.name);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {mesh.name || `Mesh ${index + 1}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {colorConfigs.map((config) => (
                        <div key={config.id} className="bg-base-200/50 rounded-lg p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-base-content-dim w-5">{config.id}</span>
                            <input
                              type="text"
                              placeholder="Color name"
                              className="input input-sm input-bordered flex-1 text-base-content bg-base-200"
                              value={config.colorName}
                              onChange={(e) => {
                                const updated = colorConfigs.map(c => 
                                  c.id === config.id ? { ...c, colorName: e.target.value } : c
                                );
                                setColorConfigs(updated);
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-base-content-dim w-5"></span>
                            <div className="flex-1 relative">
                              <input
                                type="color"
                                value={config.colorData.replace('0x', '#')}
                                onChange={(e) => handleColorChange(config.id, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <input
                                type="text"
                                value={config.colorData}
                                readOnly
                                className="input input-sm input-bordered w-full text-base-content cursor-pointer"
                                style={{
                                  backgroundColor: config.colorData.replace('0x', '#'),
                                  color: parseInt(config.colorData) > 0x808080 ? '#000' : '#fff'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="pastel"
                      color='primary'
                      icon={Plus}
                      size='sm'
                      className="w-full mt-3"
                      onClick={addNewColorConfig}
                    >
                      <span className="text-sm">Add Color Configuration</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}