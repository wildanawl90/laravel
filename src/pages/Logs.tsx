import { useEffect, useState } from 'react';
import { FileText, Filter, Search, AlertCircle, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Log {
  id: string;
  server_id: string;
  log_type: string;
  level: string;
  message: string;
  context: any;
  file_path: string | null;
  line_number: number | null;
  logged_at: string;
  servers?: {
    name: string;
  };
}

export function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIExplain, setShowAIExplain] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
    loadLogs();

    const subscription = supabase
      .channel('logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
        setLogs((prev) => [payload.new as Log, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedServer, selectedLevel]);

  const loadServers = async () => {
    const { data } = await supabase.from('servers').select('id, name').order('name');
    setServers(data || []);
  };

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('logs')
        .select('*, servers(name)')
        .order('logged_at', { ascending: false })
        .limit(100);

      if (selectedServer !== 'all') {
        query = query.eq('server_id', selectedServer);
      }

      if (selectedLevel !== 'all') {
        query = query.eq('level', selectedLevel);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
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
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Server Logs</h2>
        <p className="text-slate-600">Monitor and analyze server logs in real-time</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Search Logs
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in log messages..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Server
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Servers</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No logs found</h3>
          <p className="text-slate-600">No logs match your current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(
                        log.level
                      )}`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-600">{log.log_type}</span>
                    {log.servers && (
                      <span className="text-sm font-medium text-slate-900">
                        {log.servers.name}
                      </span>
                    )}
                    <span className="text-sm text-slate-500">
                      {new Date(log.logged_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-900 mb-2 break-words">{log.message}</p>

                  {log.file_path && (
                    <p className="text-sm text-slate-600">
                      {log.file_path}
                      {log.line_number && `:${log.line_number}`}
                    </p>
                  )}

                  {log.context && Object.keys(log.context).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                        View Context
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {(log.level === 'error' || log.level === 'critical') && (
                  <button
                    onClick={() => setShowAIExplain(log.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Bot className="w-4 h-4" />
                    Explain with AI
                  </button>
                )}
              </div>

              {showAIExplain === log.id && (
                <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-violet-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-violet-900 mb-2">AI Analysis</h4>
                      <p className="text-sm text-violet-800 mb-3">
                        This feature will use AI to analyze the error and provide explanations and
                        solutions. Connect your AI service to enable this functionality.
                      </p>
                      <button
                        onClick={() => setShowAIExplain(null)}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
