import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Settings,
  ShieldAlert,
  RotateCcw,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Copy,
  Check,
  Code2
} from 'lucide-react';
import { Stage, Workflow, Execution, StepExecution } from '../types';

interface InspectorProps {
  stage: Stage | null;
  workflow: Workflow;
  activeExecution: Execution | null;
  onClose: () => void;
  onUpdateStage: (updatedStage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  stage,
  workflow,
  activeExecution,
  onClose,
  onUpdateStage,
  onDeleteStage
}) => {
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [activeTab, setActiveTab] = useState<'execution' | 'config'>('execution');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStage(stage ? JSON.parse(JSON.stringify(stage)) : null);
  }, [stage]);

  if (!currentStage) {
    return null;
  }

  // Find step execution for this specific stage in activeExecution
  const stepExec: StepExecution | undefined = activeExecution?.steps?.find(
    (s) => s.stage_id === currentStage.id && !s.is_compensation
  );

  // Find compensation step if any
  const compExec: StepExecution | undefined = activeExecution?.steps?.find(
    (s) => s.is_compensation && s.compensates_for === currentStage.id
  );

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleChange = (field: keyof Stage, value: any) => {
    const updated = { ...currentStage, [field]: value };
    setCurrentStage(updated);
    onUpdateStage(updated);
  };

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...(currentStage.config || {}), [key]: value };
    const updated = { ...currentStage, config: updatedConfig };
    setCurrentStage(updated);
    onUpdateStage(updated);
  };

  return (
    <div style={{
      width: '380px',
      background: 'rgba(15, 23, 42, 0.98)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto',
      padding: '20px 16px',
      zIndex: 30,
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Settings size={16} color="#38BDF8" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
              {currentStage.name}
            </div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              Node: {currentStage.id}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs: Execution Result vs Configuration */}
      <div style={{
        display: 'flex',
        background: 'rgba(30, 41, 59, 0.6)',
        padding: '3px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setActiveTab('execution')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'execution' ? '#38BDF8' : 'transparent',
            color: activeTab === 'execution' ? '#090D16' : '#94A3B8'
          }}
        >
          <Activity size={14} />
          Execution Result {stepExec ? `(${stepExec.status})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'config' ? '#38BDF8' : 'transparent',
            color: activeTab === 'config' ? '#090D16' : '#94A3B8'
          }}
        >
          <Code2 size={14} />
          Config
        </button>
      </div>

      {/* TAB 1: EXECUTION RESULT (Detailed Box Result) */}
      {activeTab === 'execution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stepExec ? (
            <>
              {/* Status Banner */}
              <div className="glass-panel" style={{
                padding: '12px',
                borderRadius: '8px',
                border: stepExec.status === 'COMPLETED'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : stepExec.status === 'FAILED'
                  ? '1px solid rgba(244, 63, 94, 0.4)'
                  : '1px solid rgba(56, 189, 248, 0.4)',
                background: stepExec.status === 'COMPLETED'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : stepExec.status === 'FAILED'
                  ? 'rgba(244, 63, 94, 0.08)'
                  : 'rgba(56, 189, 248, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stepExec.status === 'COMPLETED' && <CheckCircle2 size={18} color="#10B981" />}
                    {stepExec.status === 'FAILED' && <XCircle size={18} color="#F43F5E" />}
                    {stepExec.status === 'RUNNING' && <Activity size={18} color="#38BDF8" className="running-glow" />}
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: stepExec.status === 'COMPLETED' ? '#10B981' : stepExec.status === 'FAILED' ? '#F43F5E' : '#38BDF8'
                    }}>
                      {stepExec.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    ⏱ {stepExec.duration_ms}ms
                  </span>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>Unique Step ID:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>{stepExec.id}</span></div>
                  <div><strong>Execution ID:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{activeExecution?.id}</span></div>
                  <div><strong>Attempts:</strong> {stepExec.attempts}</div>
                </div>
              </div>

              {/* Error Message if Failed */}
              {stepExec.error && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F43F5E', display: 'block', marginBottom: '6px' }}>
                    Error Output
                  </label>
                  <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#F43F5E',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {stepExec.error}
                  </div>
                </div>
              )}

              {/* Output Payload Produced by this Box */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                    Output / Produced Result
                  </label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(stepExec.output, null, 2), 'output')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem'
                    }}
                  >
                    {copiedField === 'output' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    {copiedField === 'output' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#38BDF8',
                  overflowX: 'auto',
                  maxHeight: '180px'
                }}>
                  {stepExec.output ? JSON.stringify(stepExec.output, null, 2) : 'No output data'}
                </pre>
              </div>

              {/* Input Payload Received by this Box */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Input Payload Received
                  </label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(stepExec.input, null, 2), 'input')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem'
                    }}
                  >
                    {copiedField === 'input' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    {copiedField === 'input' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                  overflowX: 'auto',
                  maxHeight: '140px'
                }}>
                  {stepExec.input ? JSON.stringify(stepExec.input, null, 2) : '{}'}
                </pre>
              </div>

              {/* Compensation Rollback Result if applicable */}
              {compExec && (
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <RotateCcw size={14} color="#F59E0B" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B' }}>
                      Saga Compensation Executed ({compExec.status})
                    </span>
                  </div>
                  <pre style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#f8fafc',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '6px',
                    borderRadius: '4px'
                  }}>
                    {JSON.stringify(compExec.output, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
              background: 'rgba(30, 41, 59, 0.3)'
            }}>
              <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>Nenhuma execução ativa selecionada para este nó.</div>
              <div style={{ fontSize: '0.7rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                Selecione um ID de execução no topo ou clique em <strong>Trigger Workflow</strong> para ver os resultados.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONFIGURATION */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Stage ID
            </label>
            <input
              type="text"
              value={currentStage.id}
              disabled
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-color)',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Name
            </label>
            <input
              type="text"
              value={currentStage.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-color)',
                color: '#f8fafc',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {currentStage.type === 'http' && (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={currentStage.config?.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Method
                </label>
                <select
                  value={currentStage.config?.method || 'POST'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </>
          )}

          {currentStage.type === 'kafka' && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Topic
              </label>
              <input
                type="text"
                value={currentStage.config?.topic || ''}
                onChange={(e) => handleConfigChange('topic', e.target.value)}
                placeholder="events.stream"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          )}

          {currentStage.type === 'transform' && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Transform Expression (Go expr)
              </label>
              <input
                type="text"
                value={currentStage.config?.expression || ''}
                onChange={(e) => handleConfigChange('expression', e.target.value)}
                placeholder="payload.amount > 0"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          )}

          
          {/* CONNECTIONS & NEXT STAGES */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Code2 size={13} />
              Connected Next Stages
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {workflow.stages.filter(s => s.id !== currentStage.id).map(otherStage => {
                const isConnected = (currentStage.next || []).includes(otherStage.id);
                return (
                  <div
                    key={otherStage.id}
                    onClick={() => {
                      const currentNext = currentStage.next ? [...currentStage.next] : [];
                      const updatedNext = isConnected
                        ? currentNext.filter(id => id !== otherStage.id)
                        : [...currentNext, otherStage.id];
                      handleChange('next', updatedNext);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isConnected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isConnected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span style={{ color: isConnected ? '#f8fafc' : 'var(--text-dim)', fontWeight: isConnected ? 600 : 400 }}>
                      {otherStage.name} ({otherStage.id})
                    </span>
                    <span style={{ color: isConnected ? '#38BDF8' : '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>
                      {isConnected ? '✔ Connected' : '+ Connect'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Button */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => onDeleteStage(currentStage.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#F43F5E',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} />
              Delete Stage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
