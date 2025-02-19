import DashboardLayout from '@/pages/DashboardLayout';
import { Plus, FolderKanban, FileText, Package, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

interface Product {
  id: string;
  title: string;
  image_url?: string;
  category?: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  deadline: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
}

interface Analytics {
  totalProducts: number;
  activeProjects: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProducts: 0,
    activeProjects: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data for analytics
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      // Fetch latest 5 items for cards
      const { data: latestProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: latestProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: latestOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Update states
      setProducts(latestProducts || []);
      setProjects(latestProjects || []);
      setOrders(latestOrders || []);

      // Update analytics
      setAnalytics({
        totalProducts: allProducts?.length || 0,
        activeProjects: allProjects?.filter(p => p.status === 'On Going').length || 0,
        pendingOrders: allOrders?.filter(o => o.status === 'Pending').length || 0,
        totalRevenue: allOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
          {/* Products Card */}
          <div className="card bg-base-200 shadow-xl overflow-hidden">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-base-content text-sm">Products</h2>
                <Link href="/products">
                  <button className="btn btn-primary btn-sm btn-xs">
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </Link>
              </div>
              <div className="divider my-1 opacity-30"></div>
              <div className="overflow-y-auto h-[calc(100%-60px)] space-y-2">
                {loading ? (
                  <div className="flex flex-col gap-4 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-base-300 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-base-300 rounded w-3/4"></div>
                          <div className="h-3 bg-base-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-base-300 rounded-lg transition-colors">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-lg">
                          <img 
                            src={product.image_url || "/placeholder.jpg"} 
                            alt={product.title} 
                            className="object-cover" 
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-base-content">{product.title}</h3>
                        <p className="text-xs text-base-content/60">{product.category}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Projects Card */}
          <div className="card bg-base-200 shadow-xl overflow-hidden">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-base-content text-sm">Projects</h2>
                <Link href="/projects">
                  <button className="btn btn-primary btn-sm btn-xs">
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </Link>
              </div>
              <div className="divider my-1 opacity-30"></div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <table className="table table-sm">
                  <thead className="text-base-content/60 text-xs">
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td><div className="h-4 bg-base-300 rounded w-3/4"></div></td>
                            <td><div className="h-4 bg-base-300 rounded w-16"></div></td>
                            <td><div className="h-4 bg-base-300 rounded w-20"></div></td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      projects.map((project) => (
                        <tr key={project.id} className="hover:bg-base-300">
                          <td className="text-sm text-base-content">{project.title}</td>
                          <td>
                            <span className={`badge badge-sm ${
                              project.status === 'On Going' ? 'badge-warning' :
                              project.status === 'Completed' ? 'badge-success' :
                              project.status === 'Pending' ? 'badge-info' :
                              project.status === 'Quoted' ? 'badge-secondary' :
                              project.status === 'Canceled' ? 'badge-error' :
                              'badge-ghost'
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="text-xs text-base-content/60">
                            {new Date(project.deadline).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="card bg-base-200 shadow-xl overflow-hidden">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-base-content text-sm">Orders</h2>
                <Link href="/orders">
                  <button className="btn btn-primary btn-sm btn-xs">
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </Link>
              </div>
              <div className="divider my-1 opacity-30"></div>
              <div className="overflow-y-auto h-[calc(100%-60px)] space-y-2">
                {loading ? (
                  <div className="flex flex-col gap-4 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-base-300 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-base-300 rounded w-3/4"></div>
                          <div className="h-3 bg-base-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-2 hover:bg-base-300 rounded-lg transition-colors">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-base-content">Order #{order.id}</h3>
                        <p className="text-xs text-base-content/60">${order.total} • {order.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl overflow-hidden">
            <div className="card-body p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="card-title text-base-content text-lg font-bold">Analytics Overview</h2>
                <select className="select select-sm select-ghost ml-auto">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="stat bg-base-300 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-base-100 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-base-100 rounded w-1/3"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="stat bg-base-100/50 backdrop-blur rounded-xl p-6 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div className="stat-title text-base-content/70 font-medium">Total Products</div>
                      </div>
                      <div className="stat-value text-primary text-3xl">{analytics.totalProducts}</div>
                      <div className="text-sm text-success mt-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> +12% from last month
                      </div>
                    </div>

                    <div className="stat bg-base-100/50 backdrop-blur rounded-xl p-6 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          <FolderKanban className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="stat-title text-base-content/70 font-medium">Active Projects</div>
                      </div>
                      <div className="stat-value text-secondary text-3xl">{analytics.activeProjects}</div>
                      <div className="text-sm text-success mt-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> +5% from last month
                      </div>
                    </div>

                    <div className="stat bg-base-100/50 backdrop-blur rounded-xl p-6 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Clock className="w-5 h-5 text-accent" />
                        </div>
                        <div className="stat-title text-base-content/70 font-medium">Pending Orders</div>
                      </div>
                      <div className="stat-value text-accent text-3xl">{analytics.pendingOrders}</div>
                      <div className="text-sm text-error mt-2 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" /> -3% from last month
                      </div>
                    </div>

                    <div className="stat bg-base-100/50 backdrop-blur rounded-xl p-6 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <DollarSign className="w-5 h-5 text-success" />
                        </div>
                        <div className="stat-title text-base-content/70 font-medium">Total Revenue</div>
                      </div>
                      <div className="stat-value text-success text-3xl">
                        ${analytics.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-success mt-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> +18% from last month
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
