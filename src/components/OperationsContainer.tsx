import React, { useState } from 'react';
import { Activity, UserCheck } from 'lucide-react';
import { ExecutionViewer } from './ExecutionViewer';
import { ApprovalInbox } from './ApprovalInbox';
import { DLQViewer } from './DLQViewer';
import { WebhookManager } from './WebhookManager';
import { TaskQueueViewer } from './TaskQueueViewer';
import { Layers } from 'lucide-react';
import { Radio } from 'lucide-react';
import { AlertOctagon } from 'lucide-react';
import { Execution } from '../types';

interface OperationsContainerProps {
  workflows: any[];
  authToken: string | null;
  currentUser: { username: string; full_name: string; role: string } | null;
  executions: Execution[];
  selectedExecution: Execution | null;
  onSelectExecution: (exec: Execution | null) => void;
  pendingApprovalsCount: number;
  onRefreshExecutions: () => void;
}

export const OperationsContainer: React.FC<OperationsContainerProps> = ({
  authToken,
  workflows,
  currentUser,
  executions,
  selectedExecution,
  onSelectExecution,
  pendingApprovalsCount,
  onRefreshExecutions
}) => {
  const [activeTab, setActiveTab] = useState<'executions' | 'approvals' | 'dlq' | 'webhooks' | 'tasks'>('executions');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: 'calc(100vh - 68px)', overflow: 'hidden' }}>
      {/* Sub-header navigation */}
      <div style={{
        height: '48px',
        padding: '0 40px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => setActiveTab('executions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'executions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'executions' ? '#38BDF8' : '#94A3B8',
            borderBottom: activeTab === 'executions' ? '2px solid #38BDF8' : 'none'
          }}
        >
          <Activity size={14} />
          Histórico de Execuções ({executions.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'approvals' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'approvals' ? '#fbbf24' : '#94A3B8',
            borderBottom: activeTab === 'approvals' ? '2px solid #fbbf24' : 'none'
          }}
        >
          <UserCheck size={14} />
          Fila de Aprovações AML
          {pendingApprovalsCount > 0 && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#090D16'
            }}>
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      
        <button
          onClick={() => setActiveTab('dlq')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'dlq' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            color: activeTab === 'dlq' ? '#F43F5E' : '#94A3B8',
            borderBottom: activeTab === 'dlq' ? '2px solid #F43F5E' : 'none'
          }}
        >
          <AlertOctagon size={14} />
          Dead Letter Queue (DLQ)
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'webhooks' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'webhooks' ? '#38BDF8' : '#94A3B8',
            borderBottom: activeTab === 'webhooks' ? '2px solid #38BDF8' : 'none'
          }}
        >
          <Radio size={14} />
          Webhooks Ingestion
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'tasks' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeTab === 'tasks' ? '#C084FC' : '#94A3B8',
            borderBottom: activeTab === 'tasks' ? '2px solid #C084FC' : 'none'
          }}
        >
          <Layers size={14} />
          Task Queues (Workers)
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        {activeTab === 'executions' && (
          <ExecutionViewer
            executions={executions}
            selectedExecution={selectedExecution}
            onSelectExecution={onSelectExecution}
          />
        )}
                {activeTab === 'dlq' && (
          <DLQViewer authToken={authToken} />
        )}

        {activeTab === 'webhooks' && (
          <WebhookManager authToken={authToken} workflows={workflows} />
        )}

        {activeTab === 'tasks' && (
          <TaskQueueViewer authToken={authToken} />
        )}

        {activeTab === 'approvals' && (
          <ApprovalInbox
            authToken={authToken}
            currentUser={currentUser}
            onApprovalDecided={onRefreshExecutions}
          />
        )}
      </div>
    </div>
  );
};
