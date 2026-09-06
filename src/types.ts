export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type StageType =
  | 'http'
  | 'kafka'
  | 'rabbitmq'
  | 'grpc'
  | 'websocket'
  | 'database'
  | 'transform'
  | 'script'
  | 'wasm'
  | 'parallel_fork'
  | 'parallel_join'
  | 'exclusive_xor'
  | 'delay'
  | 'wait_for_signal'
  | 'child_workflow'
  | 'approval'
  | 'worker_task';

export interface RetryPolicy {
  max_attempts: number;
  backoff: 'constant' | 'linear' | 'exponential';
  initial_interval: string;
  max_interval?: string;
  multiplier?: number;
}

export interface CompensationConfig {
  id: string;
  name?: string;
  type: StageType;
  config: Record<string, any>;
  timeout?: string;
}

export interface Branch {
  condition: string;
  target: string;
  default?: boolean;
}

export interface UIMetadata {
  x: number;
  y: number;
  color?: string;
  icon?: string;
}

export interface Stage {
  id: string;
  name: string;
  type: StageType;
  description?: string;
  config?: Record<string, any>;
  async?: boolean;
  timeout?: string;
  retry?: RetryPolicy;
  compensation?: CompensationConfig;
  branches?: Branch[];
  next?: string[];
  join_sources?: string[];
  ui?: UIMetadata;
}

export interface TriggerConfig {
  type: 'manual' | 'webhook' | 'kafka' | 'rabbitmq' | 'cron';
  path?: string;
  topic?: string;
  queue?: string;
  cron?: string;
  broker?: string;
  group?: string;
  config?: Record<string, any>;
}

export interface Workflow {
  version: string;
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  status: WorkflowStatus;
  trigger?: TriggerConfig;
  variables?: Record<string, any>;
  start_at: string;
  stages: Stage[];
  created_at?: string;
  updated_at?: string;
}

export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'CANCELLED'
  | 'WAITING_APPROVAL'
  | 'WAITING_SIGNAL'
  | 'WAITING_TIMER'
  | 'WAITING_CHILD';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'RETRYING'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'WAITING_APPROVAL'
  | 'WAITING_SIGNAL'
  | 'WAITING_TIMER'
  | 'WAITING_CHILD';

export interface StepExecution {
  id: string;
  stage_id: string;
  stage_name: string;
  stage_type: StageType;
  status: StepStatus;
  attempts: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  is_compensation?: boolean;
  compensates_for?: string;
}

export interface Execution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_type: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  variables: Record<string, any>;
  steps: StepExecution[];
  error?: string;
  trace_id: string;
  parent_execution_id?: string;
  parent_stage_id?: string;
  merkle_root?: string;
  started_at: string;
  completed_at?: string;
  duration_ms: number;
}

export interface WorkflowEvent {
  type: string;
  execution_id?: string;
  workflow_id?: string;
  stage_id?: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface ConnectorDescriptor {
  type: StageType;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  config_schema: Record<string, any>;
}

export interface DLQMessage {
  id: string;
  workflow_id: string;
  source: string;
  topic_or_path: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  error_message: string;
  stack_trace?: string;
  status: 'PENDING' | 'REPLAYED' | 'DISCARDED';
  attempts: number;
  created_at: string;
  replayed_at?: string;
}

export interface WebhookBinding {
  id: string;
  path_pattern: string;
  workflow_id: string;
  method: string;
  secret_token?: string;
  description?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  queue_name: string;
  workflow_id: string;
  execution_id: string;
  stage_id: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error_message?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  worker_id?: string;
  lock_token?: string;
  lease_expires_at?: string;
  attempts: number;
  max_attempts: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}
