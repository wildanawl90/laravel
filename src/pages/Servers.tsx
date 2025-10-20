import { useEffect, useState } from 'react';
import { Plus, Server, Trash2, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  laravel_path: string;
  php_version: string;
  status: 'online' | 'offline' | 'error';
  last_seen: string | null;
}

export function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  const canManageServers = user?.role === 'admin' || user?.role === 'devops';

  useEffect(() => {
    loadServers();

    const subscription = supabase
      .channel('servers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, () => {
        loadServers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      const { error } = await supabase.from('servers').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-slate-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Servers</h2>
          <p className="text-slate-600">Manage your Laravel server connections</p>
        </div>
        {canManageServers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Server
          </button>
        )}
      </div>

      {servers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Server className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No servers yet</h3>
          <p className="text-slate-600 mb-6">Add your first Laravel server to get started</p>
          {canManageServers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Add Your First Server
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {servers.map((server) => (
            <div
              key={server.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <Server className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{server.name}</h3>
                    <p className="text-sm text-slate-600">{server.host}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(server.status)}
                  <span className="text-sm font-medium capitalize text-slate-600">
                    {server.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Username:</span>
                  <span className="font-medium text-slate-900">{server.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Port:</span>
                  <span className="font-medium text-slate-900">{server.port}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">PHP Version:</span>
                  <span className="font-medium text-slate-900">{server.php_version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Laravel Path:</span>
                  <span className="font-medium text-slate-900 truncate ml-2">
                    {server.laravel_path}
                  </span>
                </div>
              </div>

              {canManageServers && (
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteServer(server.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddServerModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

function AddServerModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    ssh_key: '',
    laravel_path: '/var/www/html',
    php_version: '8.2',
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('servers').insert({
        ...formData,
        created_by: user?.id,
      });

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error adding server:', error);
      alert('Failed to add server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900">Add New Server</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Server Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Production Server"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="192.168.1.100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="root"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">PHP Version</label>
              <input
                type="text"
                value={formData.php_version}
                onChange={(e) => setFormData({ ...formData, php_version: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="8.2"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Laravel Path
              </label>
              <input
                type="text"
                value={formData.laravel_path}
                onChange={(e) => setFormData({ ...formData, laravel_path: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="/var/www/html"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SSH Private Key (optional)
              </label>
              <textarea
                value={formData.ssh_key}
                onChange={(e) => setFormData({ ...formData, ssh_key: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
