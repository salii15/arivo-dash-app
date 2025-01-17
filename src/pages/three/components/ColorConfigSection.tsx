import { Plus, MousePointer, ChevronDown } from 'lucide-react';

interface ColorConfigType {
  type: 'mesh' | 'material';
  id: number;
  colorName: string;
  colorData: string;
}

interface ColorConfigSectionProps {
  type: 'mesh' | 'material';
  configs: ColorConfigType[];
  selectedName: string;
  setSelectedName: (name: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onAddConfig: () => void;
  onColorChange: (id: number, color: string) => void;
  isPickingMesh: boolean;
  setIsPickingMesh: (value: boolean) => void;
}

const ColorConfigSection = ({
  type,
  configs,
  selectedName,
  setSelectedName,
  isDropdownOpen,
  setIsDropdownOpen,
  onAddConfig,
  onColorChange,
  isPickingMesh,
  setIsPickingMesh
}: ColorConfigSectionProps) => (
  <div className="bg-base-300/50 rounded-lg p-2">
    <div className="mb-3 relative">
      <label className="text-xs text-base-content-dim block mb-1">Select {type === 'mesh' ? 'Mesh' : 'Material'}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selectedName}
          readOnly
          placeholder={`Select a ${type}...`}
          className="input input-sm input-bordered flex-1 text-base-content bg-base-200"
        />
        {type === 'mesh' && (
          <button
            className={`p-1.5 rounded-md ${isPickingMesh ? 'bg-primary text-primary-content' : 'hover:bg-base-100 text-base-content'}`}
            onClick={() => setIsPickingMesh(!isPickingMesh)}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          className="p-1.5 rounded-md hover:bg-base-100 text-base-content"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="space-y-2">
      {configs.map((config) => (
        <div key={config.id} className="bg-base-200/50 rounded-lg p-2 space-y-2">
          <input
            type="text"
            placeholder="Color name"
            className="input input-sm input-bordered w-full text-base-content bg-base-200"
            value={config.colorName}
            onChange={(e) => {
              const updated = configs.map(c => 
                c.id === config.id ? { ...c, colorName: e.target.value } : c
              );
              onColorChange(config.id, config.colorData);
            }}
          />
          <input
            type="color"
            value={config.colorData.replace('0x', '#')}
            onChange={(e) => onColorChange(config.id, e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      ))}
    </div>

    <button
      className="mt-3 flex items-center justify-center gap-1 w-full p-2 rounded-md hover:bg-base-100 text-base-content-dim hover:text-base-content transition-colors"
      onClick={onAddConfig}
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="text-sm">Add Color</span>
    </button>
  </div>
);

export default ColorConfigSection; 