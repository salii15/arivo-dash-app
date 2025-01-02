import DashboardLayout from '@/pages/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { WalletCards, Plus } from "lucide-react";
import  Button  from "@/components/ui/Button";
import { useState } from 'react';

export default function Analytics() {
  const [isNewOrderModalOpen, setIsNewAnalyticModalOpen] = useState(false);

  return (
    <DashboardLayout>

        <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
        <PageHeader 
              title="Analytics"
              description="View your product statics"
              bgColor="bg-base-200"
              padding='p-4'
              icon={<WalletCards className="w-5 h-5" />}
            />
            <div className="flex items-center flex-row space-x-4">

            </div>
          </div>
   
          {/* Orders content */}
        </main>

    </DashboardLayout>
  );
} 