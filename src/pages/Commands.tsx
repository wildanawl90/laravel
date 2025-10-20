import { useEffect, useState } from 'react';
import { Terminal, Play, CheckCircle, XCircle, Clock, Server } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Command {
  id: string;
  server_id: string;
  user_id: string | null;
  command: string;
  command_type: string;
  status: string;
  output: string | null;
  error_output: string | null;
  exit_code: number | null;
  created_at: string;
  servers?: {
    name: string;
  };
}

const COMMON_COMMANDS = [
  {
    category: 'Artisan',
    commands: [
      { label: 'Migrate Database', cmd: 'php artisan migrate', type: 'artisan' },
      { label: 'Clear Cache', cmd: 'php artisan cache:clear', type: 'artisan' },
      { label: 'Clear Config', cmd: 'php artisan config:clear', type: 'artisan' },
      { label: 'Clear Routes', cmd: 'php artisan route:clear', type: 'artisan' },
      { label: 'Optimize', cmd: 'php artisan optimize', type: 'artisan' },
      { label: 'Queue Work', cmd: 'php artisan queue:work', type: 'artisan' },
    ],
  },
  {
    category: 'Composer',
    commands: [
      { label: 'Install Dependencies', cmd: 'composer install', type: 'composer' },
      { label: 'Update Dependencies', cmd: 'composer update', type: 'composer' },
      { label: 'Dump Autoload', cmd: 'composer dump-autoload', type: 'composer' },
    ],
  },
  {
    category: 'Git',
    commands: [
      { label: 'Pull Latest', cmd: 'git pull origin main', type: 'git' },
      { label: 'Check Status', cmd: 'git status', type: 'git' },
      { label: 'View Log', cmd: 'git log --oneline -10', type: 'git' },
    ],
  },
];

export function Commands() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [customCommand, setCustomCommand] = useState('');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [commandToExecute, setCommandToExecute] = useState<{
    cmd: string;
    type: string;
  } | null>(null);
  const { user } = useAuth();

  const canExecuteCommands = user?.role === 'admin' || user?.role === 'devops';

  useEffect(() => {
    loadServers();
    loadCommands();

    const subscription = supabase
      .channel('commands_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commands' }, () => {
        loadCommands();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadServers = async () => {
    const { data } = await supabase.from('servers').select('id, name').order('name');
    setServers(data || []);
    if (data && data.length > 0) {
      setSelectedServer(data[0].id);
    }
  };

  const loadCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .select('*, servers(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCommands(data || []);
    } catch (error) {
      console.error('Error loading commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = (cmd: string, type: string) => {
    setCommandToExecute({ cmd, type });
    setShowConfirmModal(true);
  };

  const confirmExecution = async () => {
    if (!commandToExecute || !selectedServer) return;

    setExecuting(true);
    setShowConfirmModal(false);

    try {
      const { data, error } = await supabase
        .from('commands')
        .insert({
          server_id: selectedServer,
          user_id: user?.id,
          command: commandToExecute.cmd,
          command_type: commandToExecute.type,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setTimeout(async () => {
        await supabase
          .from('commands')
          .update({
            status: 'completed',
            output: 'Command executed successfully (simulated)',
            exit_code: 0,
            executed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      }, 2000);

      setCustomCommand('');
    } catch (error) {
      console.error('Error executing command:', error);
      alert('Failed to execute command');
    } finally {
      setExecuting(false);
      setCommandToExecute(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Commands</h2>
        <p className="text-slate-600">Execute commands on your Laravel servers</p>
      </div>

      {canExecuteCommands && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Execute Command</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Server
              </label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom Command
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="Enter a custom command..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                />
                <button
                  onClick={() => handleExecuteCommand(customCommand, 'custom')}
                  disabled={!customCommand.trim() || !selectedServer || executing}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {COMMON_COMMANDS.map((category) => (
                <div key={category.category}>
                  <h4 className="font-semibold text-slate-900 mb-3">{category.category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {category.commands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleExecuteCommand(cmd.cmd, cmd.type)}
                        disabled={!selectedServer || executing}
                        className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-sm font-medium text-slate-900">{cmd.label}</span>
                        <Play className="w-4 h-4 text-slate-600" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Command History</h3>

        {commands.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No commands executed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(cmd.status)}
                      <span
                        className={`text-sm font-semibold ${
                          cmd.status === 'completed'
                            ? 'text-emerald-600'
                            : cmd.status === 'failed'
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {cmd.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-600">{cmd.command_type}</span>
                      {cmd.servers && (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <Server className="w-4 h-4" />
                          {cmd.servers.name}
                        </span>
                      )}
                    </div>
                    <code className="block text-sm bg-slate-900 text-slate-100 px-3 py-2 rounded font-mono">
                      {cmd.command}
                    </code>
                  </div>
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {new Date(cmd.created_at).toLocaleString()}
                  </span>
                </div>

                {cmd.output && (
                  <details className="mt-3">
                    <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium">
                      View Output
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-50 rounded text-xs overflow-x-auto">
                      {cmd.output}
                    </pre>
                  </details>
                )}

                {cmd.error_output && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-semibold text-red-900 mb-2">Error Output:</p>
                    <pre className="text-xs text-red-800 overflow-x-auto">{cmd.error_output}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirmModal && commandToExecute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Command Execution</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to execute this command?
            </p>
            <code className="block text-sm bg-slate-900 text-slate-100 px-4 py-3 rounded font-mono mb-6">
              {commandToExecute.cmd}
            </code>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setCommandToExecute(null);
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExecution}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
