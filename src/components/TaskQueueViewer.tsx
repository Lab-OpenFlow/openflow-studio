import React, { useState, useEffect } from 'react';
import { Layers, Activity, RefreshCw, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TaskItem } from '../types';

interface TaskQueueViewerProps {
  authToken: string | null;
}

export const TaskQueueViewer: React.FC<TaskQueueViewerProps> = ({ authToken }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQueue, setSelectedQueue] = useState<string>('ALL');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/tasks', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [authToken]);

  const queues = Array.from(new Set(tasks.map((t) => t.queue_name)));
  const filteredTasks = selectedQueue === 'ALL' ? tasks : tasks.filter((t) => t.queue_name === selectedQueue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '28px 40px', overflowY: 'auto', background: 'rgba(11, 17, 32, 0.95)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#A855F7" />
            Distributed Task Queues & External Workers (Temporal-Grade)
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Monitor de filas de atividade assíncronas com <strong>Lease Locking</strong>, <strong>Heartbeats</strong> distribuídos e tolerância a falhas para workers remotos em Go, Python e Node.js.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Queue Filter Badges */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setSelectedQueue('ALL')}
          style={{
            padding: '5px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: selectedQueue === 'ALL' ? '#A855F7' : 'rgba(255, 255, 255, 0.05)',
            color: selectedQueue === 'ALL' ? '#fff' : '#94A3B8'
          }}
        >
          Todas as Filas ({tasks.length})
        </button>
        {queues.map((q) => (
          <button
            key={q}
            onClick={() => setSelectedQueue(q)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedQueue === q ? '#A855F7' : 'rgba(255, 255, 255, 0.05)',
              color: selectedQueue === q ? '#fff' : '#94A3B8'
            }}
          >
            {q} ({tasks.filter((t) => t.queue_name === q).length})
          </button>
        ))}
      </div>

      {loading && tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Carregando Task Queues...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Layers size={36} color="#64748B" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Nenhuma Tarefa nas Filas</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '440px', margin: '6px auto 0' }}>
            Workflows que utilizam nós do tipo <code>worker_task</code> despacham atividades para filas distribuídas automaticamente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '16px' }}>
          {filteredTasks.map((task) => {
            const isRunning = task.status === 'RUNNING';
            const isPending = task.status === 'PENDING';
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: isRunning
                    ? '1px solid rgba(168, 85, 247, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isRunning ? '0 0 20px rgba(168, 85, 247, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#C084FC',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {task.queue_name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Stage: <strong style={{ color: '#f8fafc' }}>{task.stage_id}</strong>
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isRunning
                      ? 'rgba(56, 189, 248, 0.15)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isPending
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(244, 63, 94, 0.15)',
                    color: isRunning
                      ? '#38BDF8'
                      : isCompleted
                      ? '#10B981'
                      : isPending
                      ? '#FBBF24'
                      : '#F43F5E'
                  }}>
                    {task.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '10px' }}>
                  Workflow: <strong style={{ color: '#FBBF24' }}>{task.workflow_id}</strong> • Exec: <code style={{ color: '#38BDF8' }}>{task.execution_id}</code>
                </div>

                {isRunning && (
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.74rem' }}>
                    <div style={{ color: '#C084FC', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} /> Worker Ativo: {task.worker_id}
                    </div>
                    <div style={{ color: '#E9D5FF', fontFamily: 'monospace' }}>
                      Lock Token: {task.lock_token}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Task Input Payload
                  </div>
                  <pre style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-color)',
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(task.input, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
