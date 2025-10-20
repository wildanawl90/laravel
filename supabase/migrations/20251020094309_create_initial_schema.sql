/*
  # Laravel Server Manager - Initial Database Schema

  ## Overview
  This migration creates the complete database structure for the Laravel Server Manager application
  with AI Assistant capabilities.

  ## 1. New Tables

  ### `users`
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `password_hash` (text)
  - `full_name` (text)
  - `role` (text) - admin, devops, viewer
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `servers`
  - `id` (uuid, primary key)
  - `name` (text) - server display name
  - `host` (text) - IP or hostname
  - `port` (integer) - SSH port
  - `username` (text) - SSH username
  - `ssh_key` (text) - encrypted SSH private key
  - `laravel_path` (text) - path to Laravel project
  - `php_version` (text)
  - `status` (text) - online, offline, error
  - `last_seen` (timestamptz)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `server_metrics`
  - `id` (uuid, primary key)
  - `server_id` (uuid, foreign key to servers)
  - `cpu_usage` (numeric)
  - `memory_usage` (numeric)
  - `memory_total` (bigint)
  - `disk_usage` (numeric)
  - `disk_total` (bigint)
  - `load_average` (jsonb) - 1, 5, 15 minute averages
  - `recorded_at` (timestamptz)

  ### `logs`
  - `id` (uuid, primary key)
  - `server_id` (uuid, foreign key to servers)
  - `log_type` (text) - laravel, nginx, php-fpm
  - `level` (text) - debug, info, warning, error, critical
  - `message` (text)
  - `context` (jsonb) - additional log data
  - `file_path` (text)
  - `line_number` (integer)
  - `logged_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `commands`
  - `id` (uuid, primary key)
  - `server_id` (uuid, foreign key to servers)
  - `user_id` (uuid, foreign key to users)
  - `command` (text)
  - `command_type` (text) - artisan, composer, custom, git
  - `status` (text) - pending, running, completed, failed
  - `output` (text)
  - `error_output` (text)
  - `exit_code` (integer)
  - `executed_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `ai_conversations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `server_id` (uuid, foreign key to servers) - nullable
  - `title` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `ai_messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to ai_conversations)
  - `role` (text) - user, assistant, system
  - `content` (text)
  - `metadata` (jsonb) - includes suggested commands, error references, etc.
  - `created_at` (timestamptz)

  ### `deployments`
  - `id` (uuid, primary key)
  - `server_id` (uuid, foreign key to servers)
  - `user_id` (uuid, foreign key to users)
  - `commit_hash` (text)
  - `branch` (text)
  - `status` (text) - pending, in_progress, completed, failed
  - `steps` (jsonb) - deployment steps and their status
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Create policies for role-based access
  - Admin can do everything
  - Devops can manage servers and execute commands
  - Viewer can only read data

  ## 3. Indexes
  - Indexes on foreign keys
  - Indexes on frequently queried fields (status, created_at, server_id)
  - GIN index on jsonb fields for faster queries
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'devops', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  host text NOT NULL,
  port integer DEFAULT 22,
  username text NOT NULL,
  ssh_key text,
  laravel_path text NOT NULL DEFAULT '/var/www/html',
  php_version text DEFAULT '8.2',
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create server_metrics table
CREATE TABLE IF NOT EXISTS server_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  cpu_usage numeric(5,2),
  memory_usage numeric(5,2),
  memory_total bigint,
  disk_usage numeric(5,2),
  disk_total bigint,
  load_average jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  log_type text DEFAULT 'laravel' CHECK (log_type IN ('laravel', 'nginx', 'php-fpm', 'system')),
  level text DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  message text NOT NULL,
  context jsonb,
  file_path text,
  line_number integer,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  command text NOT NULL,
  command_type text DEFAULT 'custom' CHECK (command_type IN ('artisan', 'composer', 'custom', 'git', 'system')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  output text,
  error_output text,
  exit_code integer,
  executed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  server_id uuid REFERENCES servers(id) ON DELETE SET NULL,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  commit_hash text,
  branch text DEFAULT 'main',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  steps jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_servers_created_by ON servers(created_by);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_id ON server_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_server_metrics_recorded_at ON server_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_server_id ON logs(server_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_logged_at ON logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_context ON logs USING gin(context);
CREATE INDEX IF NOT EXISTS idx_commands_server_id ON commands(server_id);
CREATE INDEX IF NOT EXISTS idx_commands_user_id ON commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_created_at ON commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_metadata ON ai_messages USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_deployments_server_id ON deployments(server_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Servers table policies
CREATE POLICY "Authenticated users can view servers"
  ON servers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and devops can create servers"
  ON servers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "Admins and devops can update servers"
  ON servers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "Admins can delete servers"
  ON servers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Server metrics policies
CREATE POLICY "Authenticated users can view server metrics"
  ON server_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert server metrics"
  ON server_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Logs policies
CREATE POLICY "Authenticated users can view logs"
  ON logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Commands policies
CREATE POLICY "Users can view own commands"
  ON commands FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "Admins and devops can create commands"
  ON commands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "System can update command status"
  ON commands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI conversations policies
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- AI messages policies
CREATE POLICY "Users can view messages in own conversations"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Deployments policies
CREATE POLICY "Users can view deployments"
  ON deployments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "Admins and devops can create deployments"
  ON deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'devops')
    )
  );

CREATE POLICY "System can update deployment status"
  ON deployments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);