import DashboardLayout from '@/pages/DashboardLayout';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Card */}
        <div className="card bg-neutral shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-neutral-content">Products</h2>
              <button className="btn btn-primary btn-sm hover:btn-primary-focus">
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>
            <div className="divider opacity-30"></div>
            <div className="space-y-2 text-neutral-content/90">
              {/* Product list items will go here */}
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div className="card bg-neutral shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-neutral-content">Projects</h2>
              <button className="btn btn-primary btn-sm hover:btn-primary-focus">
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            </div>
            <div className="divider opacity-30"></div>
            <div className="space-y-2 text-neutral-content/90">
              {/* Project list items will go here */}
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="card bg-neutral shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-neutral-content">Orders</h2>
              <button className="btn btn-primary btn-sm hover:btn-primary-focus">
                <Plus className="w-5 h-5" />
                Add Order
              </button>
            </div>
            <div className="divider opacity-30"></div>
            <div className="space-y-2 text-neutral-content/90">
              {/* Order list items will go here */}
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="card bg-neutral shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-neutral-content">Analytics</h2>
            </div>
            <div className="divider opacity-30"></div>
            <div className="space-y-2 text-neutral-content/90">
              {/* Analytics content will go here */}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
