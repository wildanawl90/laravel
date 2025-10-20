import { useEffect, useState } from 'react';
import { Server, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  errorServers: number;
  recentCommands: number;
  failedCommands: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalServers: 0,
    onlineServers: 0,
    offlineServers: 0,
    errorServers: 0,
    recentCommands: 0,
    failedCommands: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: servers } = await supabase.from('servers').select('status');

      const { data: recentCommands } = await supabase
        .from('commands')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const totalServers = servers?.length || 0;
      const onlineServers = servers?.filter((s) => s.status === 'online').length || 0;
      const offlineServers = servers?.filter((s) => s.status === 'offline').length || 0;
      const errorServers = servers?.filter((s) => s.status === 'error').length || 0;
      const recentCommandsCount = recentCommands?.length || 0;
      const failedCommandsCount = recentCommands?.filter((c) => c.status === 'failed').length || 0;

      setStats({
        totalServers,
        onlineServers,
        offlineServers,
        errorServers,
        recentCommands: recentCommandsCount,
        failedCommands: failedCommandsCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Servers',
      value: stats.totalServers,
      icon: Server,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Online',
      value: stats.onlineServers,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Offline',
      value: stats.offlineServers,
      icon: Activity,
      color: 'bg-slate-500',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
    {
      title: 'Errors',
      value: stats.errorServers,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Commands (24h)',
      value: stats.recentCommands,
      icon: Clock,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Failed Commands',
      value: stats.failedCommands,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Overview</h2>
        <p className="text-slate-600">Monitor your Laravel servers at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
            Add Server
          </button>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            View Logs
          </button>
          <button className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors">
            Run Command
          </button>
          <button className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors">
            AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
