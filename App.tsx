
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Groupages } from './components/Groupages';
import { Orders } from './components/Orders';
import { Deliveries } from './components/Deliveries';
import { Finance } from './components/Finance';
import { Articles } from './components/Articles';
import { Clients } from './components/Clients';
import { Login } from './components/Login';
import { AppData, User } from './types';
import { MOCK_DATA } from './mockData';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(MOCK_DATA);
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);

  const handleNavigateToDelivery = (orderId: string) => {
    setDeliveryOrderId(orderId);
    setActiveTab('deliveries');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard'); // Reset tab on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Si pas connecté, afficher Login
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'articles': return <Articles data={data} setData={setData} />;
      case 'groupages': return <Groupages data={data} setData={setData} />;
      case 'clients': return <Clients data={data} setData={setData} />;
      case 'orders': 
        return <Orders data={data} setData={setData} onNavigateToDelivery={handleNavigateToDelivery} />;
      case 'deliveries': 
        return <Deliveries data={data} setData={setData} preselectedOrderId={deliveryOrderId} clearPreselection={() => setDeliveryOrderId(null)} />;
      case 'finance': 
        // Protection de la route Finance
        if (currentUser.role !== 'ADMIN') return <div className="p-8 text-center text-red-500 font-bold">Accès Non Autorisé</div>;
        return <Finance data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 md:ml-64 p-4 md:p-8 h-screen overflow-y-auto">
        <div className="md:hidden mb-4 flex justify-between items-center">
           <h1 className="text-xl font-bold text-brand-600">IMPORT PRO</h1>
           <div className="text-xs text-slate-400">Menu via Desktop</div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
