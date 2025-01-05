import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { supabase } from '../utils/supabase';
import DashboardLayout from '@/pages/DashboardLayout';
import { Bot } from 'lucide-react';

export default function AITools() {
  return (
    <DashboardLayout>
      <main className="flex-1 p-6 flex flex-col h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title="Ai Tools"
            description="Manage and organize your projects"
            bgColor="bg-base-200"
            padding='p-4'
            icon={<Bot className="w-5 h-5" />}
          />
        </div>
      </main>
    </DashboardLayout>
  );
} 