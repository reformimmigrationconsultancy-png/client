import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import ComposeModal from '../components/ComposeModal';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiCards from '../components/dashboard/KpiCards';
import RecentLeadsTable from '../components/dashboard/RecentLeadsTable';
import PipelineChartCard from '../components/dashboard/PipelineChartCard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Socket.io for live updates on dashboard
    const socket = io(BACKEND_URL, { withCredentials: true, transports: ['polling', 'websocket'] });

    socket.on('new_lead', (newLead) => {
      setRecentLeads(prev => [newLead, ...prev.slice(0, 7)]);
      fetchDashboardData();
    });

    socket.on('new_client', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('new_lead');
      socket.off('new_client');
      socket.close();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, clientsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/clients?limit=8')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (clientsRes.data.success) {
        setRecentLeads(clientsRes.data.clients || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateStage = (stage) => {
    navigate('/leads');
  };

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50/50 p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium text-xs tracking-wide animate-pulse">
            Loading CRM metrics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] p-4 md:p-6 pb-20 w-full min-h-full">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* 1. Dashboard Header */}
        <DashboardHeader user={user} onComposeClick={() => setIsComposeOpen(true)} />

        {/* 2. KPI Summary Cards */}
        <KpiCards stats={stats} onNavigateStage={handleNavigateStage} />

        {/* 3. Main CRM Dashboard Content */}
        <div className="flex flex-col gap-6">
          <RecentLeadsTable 
            leads={recentLeads} 
            loading={loading} 
            user={user} 
          />
          
          <PipelineChartCard stats={stats} />
        </div>
      </div>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onSent={() => {
            setIsComposeOpen(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
