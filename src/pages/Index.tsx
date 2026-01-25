import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { SearchTab } from '@/components/SearchTab';
import { ProgressTab } from '@/components/ProgressTab';
import { ProfileTab } from '@/components/ProfileTab';
import { BottomNav } from '@/components/BottomNav';

type Tab = 'dashboard' | 'search' | 'progress' | 'profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <SearchTab />;
      case 'progress':
        return <ProgressTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
