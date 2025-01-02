import { useRouter } from 'next/router';
import { User, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-6">
      <div className="flex-1">

      </div>
      
      <div className="flex-none gap-4">
        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle text-gray-100 hover:bg-base-300">
            <div className="indicator">
              <Bell className="w-5 h-5 stroke-2" />
              <span className="badge badge-sm badge-primary indicator-item">3</span>
            </div>
          </label>
          <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow">
            <div className="card-body">
              <span className="font-bold text-lg text-gray-100">3 Notifications</span>
              <div className="text-sm text-gray-400">View all notifications</div>
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder hover:bg-base-300">
            <div className="w-10 rounded-full bg-primary-500 text-primary-content flex items-center justify-center">
              <User className="w-6 h-6 stroke-2" />
            </div>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li className="menu-title px-4 py-2">
              <span className="text-xs font-semibold text-gray-400">USER MENU</span>
            </li>
            <li>
              <Link href="/profile" className="flex items-center gap-3 py-3 text-gray-100 hover:text-primary">
                <User className="w-4 h-4 stroke-2" />
                Profile
              </Link>
            </li>
            <div className="divider my-1"></div>
            <li>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 py-3 text-error hover:bg-error/10"
              >
                <LogOut className="w-4 h-4 stroke-2" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
