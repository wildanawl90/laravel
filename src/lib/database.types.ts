export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          role: 'admin' | 'devops' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          role?: 'admin' | 'devops' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          role?: 'admin' | 'devops' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      servers: {
        Row: {
          id: string
          name: string
          host: string
          port: number
          username: string
          ssh_key: string | null
          laravel_path: string
          php_version: string
          status: 'online' | 'offline' | 'error'
          last_seen: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          host: string
          port?: number
          username: string
          ssh_key?: string | null
          laravel_path?: string
          php_version?: string
          status?: 'online' | 'offline' | 'error'
          last_seen?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          host?: string
          port?: number
          username?: string
          ssh_key?: string | null
          laravel_path?: string
          php_version?: string
          status?: 'online' | 'offline' | 'error'
          last_seen?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      server_metrics: {
        Row: {
          id: string
          server_id: string
          cpu_usage: number | null
          memory_usage: number | null
          memory_total: number | null
          disk_usage: number | null
          disk_total: number | null
          load_average: Json | null
          recorded_at: string
        }
        Insert: {
          id?: string
          server_id: string
          cpu_usage?: number | null
          memory_usage?: number | null
          memory_total?: number | null
          disk_usage?: number | null
          disk_total?: number | null
          load_average?: Json | null
          recorded_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          cpu_usage?: number | null
          memory_usage?: number | null
          memory_total?: number | null
          disk_usage?: number | null
          disk_total?: number | null
          load_average?: Json | null
          recorded_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          server_id: string
          log_type: 'laravel' | 'nginx' | 'php-fpm' | 'system'
          level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
          message: string
          context: Json | null
          file_path: string | null
          line_number: number | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          log_type?: 'laravel' | 'nginx' | 'php-fpm' | 'system'
          level?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
          message: string
          context?: Json | null
          file_path?: string | null
          line_number?: number | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          log_type?: 'laravel' | 'nginx' | 'php-fpm' | 'system'
          level?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
          message?: string
          context?: Json | null
          file_path?: string | null
          line_number?: number | null
          logged_at?: string
          created_at?: string
        }
      }
      commands: {
        Row: {
          id: string
          server_id: string
          user_id: string | null
          command: string
          command_type: 'artisan' | 'composer' | 'custom' | 'git' | 'system'
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          output: string | null
          error_output: string | null
          exit_code: number | null
          executed_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id?: string | null
          command: string
          command_type?: 'artisan' | 'composer' | 'custom' | 'git' | 'system'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          output?: string | null
          error_output?: string | null
          exit_code?: number | null
          executed_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string | null
          command?: string
          command_type?: 'artisan' | 'composer' | 'custom' | 'git' | 'system'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          output?: string | null
          error_output?: string | null
          exit_code?: number | null
          executed_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          server_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          server_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          server_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      deployments: {
        Row: {
          id: string
          server_id: string
          user_id: string | null
          commit_hash: string | null
          branch: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back'
          steps: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id?: string | null
          commit_hash?: string | null
          branch?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back'
          steps?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string | null
          commit_hash?: string | null
          branch?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back'
          steps?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
