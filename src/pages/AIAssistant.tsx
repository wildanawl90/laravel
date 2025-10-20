import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Plus, Trash2, Server } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Conversation {
  id: string;
  title: string;
  server_id: string | null;
  created_at: string;
  servers?: {
    name: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: any;
  created_at: string;
}

export function AIAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
    loadServers();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadServers = async () => {
    const { data } = await supabase.from('servers').select('id, name').order('name');
    setServers(data || []);
  };

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*, servers(name)')
        .order('updated_at', { ascending: false });

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user?.id,
          server_id: selectedServer,
          title: 'New Conversation',
        })
        .select()
        .single();

      if (error) throw error;
      setConversations([data, ...conversations]);
      setCurrentConversation(data.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await supabase.from('ai_conversations').delete().eq('id', id);
      setConversations(conversations.filter((c) => c.id !== id));
      if (currentConversation === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const { data: userMsg } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversation,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userMsg) {
        setMessages([...messages, userMsg]);
      }

      const assistantResponse = generateAIResponse(userMessage);

      const { data: assistantMsg } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversation,
          role: 'assistant',
          content: assistantResponse.content,
          metadata: assistantResponse.metadata,
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages((prev) => [...prev, assistantMsg]);
      }

      if (messages.length === 0) {
        const newTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
        await supabase
          .from('ai_conversations')
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq('id', currentConversation);
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('migrate') || lowerMessage.includes('migration')) {
      return {
        content:
          'To run Laravel migrations, you can use the following command:\n\n`php artisan migrate`\n\nIf you want to rollback the last migration:\n`php artisan migrate:rollback`\n\nTo refresh the database:\n`php artisan migrate:refresh`\n\nWould you like me to execute any of these commands on a specific server?',
        metadata: {
          suggested_commands: [
            'php artisan migrate',
            'php artisan migrate:rollback',
            'php artisan migrate:refresh',
          ],
        },
      };
    }

    if (lowerMessage.includes('cache') || lowerMessage.includes('clear')) {
      return {
        content:
          'Here are common Laravel cache clearing commands:\n\n`php artisan cache:clear` - Clear application cache\n`php artisan config:clear` - Clear config cache\n`php artisan route:clear` - Clear route cache\n`php artisan view:clear` - Clear compiled views\n`php artisan optimize:clear` - Clear all caches\n\nWhich command would you like to run?',
        metadata: {
          suggested_commands: [
            'php artisan cache:clear',
            'php artisan config:clear',
            'php artisan optimize:clear',
          ],
        },
      };
    }

    if (lowerMessage.includes('queue') || lowerMessage.includes('worker')) {
      return {
        content:
          'Laravel Queue commands:\n\n`php artisan queue:work` - Start processing queue jobs\n`php artisan queue:restart` - Restart queue workers\n`php artisan queue:failed` - List failed jobs\n`php artisan queue:retry all` - Retry all failed jobs\n\nFor production, consider using Supervisor to manage queue workers.',
        metadata: {
          suggested_commands: [
            'php artisan queue:work',
            'php artisan queue:restart',
            'php artisan queue:failed',
          ],
        },
      };
    }

    if (lowerMessage.includes('composer')) {
      return {
        content:
          'Composer commands for dependency management:\n\n`composer install` - Install dependencies\n`composer update` - Update dependencies\n`composer dump-autoload` - Regenerate autoload files\n\nFor production deployments, use:\n`composer install --no-dev --optimize-autoloader`',
        metadata: {
          suggested_commands: [
            'composer install',
            'composer update',
            'composer dump-autoload',
          ],
        },
      };
    }

    if (lowerMessage.includes('deploy') || lowerMessage.includes('deployment')) {
      return {
        content:
          'Here\'s a typical Laravel deployment workflow:\n\n1. Pull latest code: `git pull origin main`\n2. Install dependencies: `composer install --no-dev`\n3. Run migrations: `php artisan migrate --force`\n4. Clear caches: `php artisan optimize:clear`\n5. Cache config: `php artisan config:cache`\n6. Cache routes: `php artisan route:cache`\n\nWould you like me to create a deployment script for your server?',
        metadata: {
          suggested_commands: [
            'git pull origin main',
            'composer install --no-dev --optimize-autoloader',
            'php artisan migrate --force',
            'php artisan optimize:clear',
            'php artisan config:cache',
          ],
        },
      };
    }

    if (lowerMessage.includes('error') || lowerMessage.includes('debug')) {
      return {
        content:
          'To debug Laravel errors:\n\n1. Check logs: `storage/logs/laravel.log`\n2. Enable debug mode in `.env`: `APP_DEBUG=true`\n3. View recent errors: `tail -f storage/logs/laravel.log`\n\nCommon error causes:\n- Missing dependencies\n- Incorrect file permissions\n- Database connection issues\n- Cache conflicts\n\nWould you like to check the logs for a specific server?',
        metadata: {
          suggested_commands: ['tail -100 storage/logs/laravel.log', 'php artisan optimize:clear'],
        },
      };
    }

    return {
      content:
        "I'm here to help you manage your Laravel servers! You can ask me about:\n\n- Running migrations\n- Clearing caches\n- Managing queue workers\n- Deployment workflows\n- Debugging errors\n- Composer commands\n\nWhat would you like help with?",
      metadata: {},
    };
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Assistant</h2>
        <p className="text-slate-600">Get intelligent help with server management</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full">
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <div className="mb-4">
            <select
              value={selectedServer || ''}
              onChange={(e) => setSelectedServer(e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Servers</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={createConversation}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mb-4"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentConversation === conv.id
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
                onClick={() => setCurrentConversation(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{conv.title}</p>
                    {conv.servers && (
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <Server className="w-3 h-3" />
                        {conv.servers.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-9 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          {!currentConversation ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <Bot className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome to AI Assistant
                </h3>
                <p className="text-slate-600 mb-6">
                  Start a new conversation to get help with your Laravel servers
                </p>
                <button
                  onClick={createConversation}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Start Chatting
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="bg-violet-100 p-2 rounded-lg h-fit">
                        <Bot className="w-5 h-5 text-violet-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.metadata?.suggested_commands && (
                        <div className="mt-3 pt-3 border-t border-slate-300 space-y-2">
                          <p className="text-sm font-semibold">Suggested commands:</p>
                          {message.metadata.suggested_commands.map((cmd: string, idx: number) => (
                            <code
                              key={idx}
                              className="block text-sm bg-slate-800 text-slate-100 px-3 py-2 rounded font-mono"
                            >
                              {cmd}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="bg-violet-100 p-2 rounded-lg h-fit">
                      <Bot className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="bg-slate-100 rounded-lg p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-3"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your servers..."
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
