import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { MdDashboard, MdShoppingCart, MdAnalytics } from 'react-icons/md';
import { BsBox, BsKanban } from 'react-icons/bs';
import { supabase } from '../utils/supabase';
import { useEffect, useState } from 'react';
import { Settings, BookOpen, FolderKanban, WalletCards, LayoutDashboard ,FileBox, ChartColumnBig} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    async function getUserInfo() {
      // First check localStorage for cached user info
      const cachedUserInfo = localStorage.getItem('cachedUserInfo');
      
      if (cachedUserInfo) {
        setUserInfo(JSON.parse(cachedUserInfo));
      }

      // Get fresh data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_info')
          .select('src: pp_url')
          .eq('user_id', user.id)
          .single();
        
        const newUserInfo = {
          ...data,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '#name'
        };

        // Cache the user info
        localStorage.setItem('cachedUserInfo', JSON.stringify(newUserInfo));
        setUserInfo(newUserInfo);
      }
    }
    
    getUserInfo();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear cache on sign out
        localStorage.removeItem('cachedUserInfo');
        setUserInfo(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Refresh user info on sign in or update
        getUserInfo();
      }
    });

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Products', path: '/products', icon: <FileBox className="w-5 h-5" /> },
    { title: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { title: 'Orders', path: '/orders', icon: <WalletCards className="w-5 h-5" /> },
    { title: 'Analytics', path: '/analytics', icon: <ChartColumnBig className="w-5 h-5" /> },
    { type: 'divider' },
    { title: 'AI Tools', path: '/ai-tools', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-screen w-64 bg-base-200 border-r border-base-300">
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">ARIVO LAB</span>
        </div>
      </div>

      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-full overflow-hidden select-none">
            <Image 
              src={userInfo?.src || 'https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/profile-pictures/profile-user.png'} 
              alt="Profile Picture" 
              width={40} 
              height={40}
              className="object-cover select-none"
            />
          </div>
          <div>
            <div>
              <span className="text-sm font-medium text-white">Welcome </span>
            </div>
            <div>
              <span className="text-md font-medium text-white">{userInfo?.displayName || 'Guest'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <ul className="menu p-4 space-y-2">
        {menuItems.map((item, index) => (
          item.type === 'divider' ? (
            <li key={`divider-${index}`} className="h-px bg-base-300 my-2" />
          ) : (
            <li key={item.path}>
              <Link
                href={item.path || ''}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-primary/20 transition-colors ${
                  router.pathname === item.path ? 'bg-secondary-800 text-white' : 'text-gray-300'
                }`}
              >
                <span className="text-primary-900">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            </li>
          )
        ))}
      </ul>
    </div>
  );
}
