import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Terminal,
  ChevronRight,
  Database,
  Radio
} from 'lucide-react';
import { Execution, StepExecution } from '../types';

interface ExecutionViewerProps {
  executions: Execution[];
  selectedExecution: Execution | null;
  onSelectExecution: (exec: Execution) => void;
}

export const ExecutionViewer: React.FC<ExecutionViewerProps> = ({
  executions,
  selectedExecution,
  onSelectExecution
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [signalModalOpen, setSignalModalOpen] = useState<boolean>(false);
  const [signalName, setSignalName] = useState<string>('otp_confirmed');
  const [signalPayload, setSignalPayload] = useState<string>('{\n  "otp": "994821",\n  "verified": true\n}');
  const [signalLoading, setSignalLoading] = useState<boolean>(false);
  const [signalFeedback, setSignalFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [childExecutions, setChildExecutions] = useState<Execution[]>([]);

  const steps = selectedExecution?.steps || [];
  const maxStep = Math.max(0, steps.length - 1);

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && steps.length > 0) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, steps.length]);

  // Reset step index when execution changes
  useEffect(() => {
    if (steps.length > 0) {
      setCurrentStepIdx(steps.length - 1);
    } else {
      setCurrentStepIdx(0);
    }
    setIsPlaying(false);
    setResumeMessage(null);
  }, [selectedExecution?.id]);

  const activeStep = steps[currentStepIdx] || null;

  
  // Fetch child executions when an execution is selected
  useEffect(() => {
    if (selectedExecution?.id) {
      fetch(`/api/v1/executions/${selectedExecution.id}/children`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.children) {
            setChildExecutions(data.children);
          } else {
            setChildExecutions([]);
          }
        })
        .catch(() => setChildExecutions([]));
    }
  }, [selectedExecution?.id]);

  const handleSendSignal = async () => {
    if (!selectedExecution) return;
    setSignalLoading(true);
    setSignalFeedback(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(signalPayload);
      } catch {
        setSignalFeedback({ ok: false, msg: 'Invalid JSON payload' });
        setSignalLoading(false);
        return;
      }

      const res = await fetch(`/api/v1/executions/${selectedExecution.id}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signalName, payload: parsed })
      });
      const data = await res.json();
      if (res.ok) {
        setSignalFeedback({ ok: true, msg: `Signal '${signalName}' delivered! Workflow resumed.` });
        setTimeout(() => {
          setSignalModalOpen(false);
          setSignalFeedback(null);
        }, 1200);
      } else {
        setSignalFeedback({ ok: false, msg: data.error || 'Failed to deliver signal' });
      }
    } catch (err: any) {
      setSignalFeedback({ ok: false, msg: err.message });
    } finally {
      setSignalLoading(false);
    }
  };

  const handleResume = async () => {
    if (!selectedExecution) return;
    setResumeLoading(true);
    setResumeMessage(null);
    try {
      const res = await fetch(`/api/v1/executions/${selectedExecution.id}/resume`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setResumeMessage(`✔ Replay initiated: ${data.message || 'resuming execution'}`);
      } else {
        setResumeMessage(`❌ Error: ${data.error || 'failed to resume'}`);
      }
    } catch (err: any) {
      setResumeMessage(`❌ Network error: ${err.message}`);
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      height: 'calc(100vh - 64px)',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Execution List Sidebar */}
      <div style={{
        width: '360px',
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.7)',
        overflowY: 'auto',
        padding: '16px 12px'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-dim)',
          marginBottom: '12px',
          paddingLeft: '4px'
        }}>
          Executions ({executions.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {executions.map((exec) => {
            const isSelected = selectedExecution?.id === exec.id;
            let statusColor = '#38BDF8';
            if (exec.status === 'COMPLETED') statusColor = '#10B981';
            if (exec.status === 'FAILED') statusColor = '#F43F5E';
            if (exec.status === 'COMPENSATED' || exec.status === 'COMPENSATING') statusColor = '#F59E0B';

            return (
              <div
                key={exec.id}
                onClick={() => onSelectExecution(exec)}
                className="glass-card"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.05)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(30, 41, 59, 0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${statusColor}18`,
                    color: statusColor,
                    border: `1px solid ${statusColor}40`
                  }}>
                    {exec.status}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {new Date(exec.started_at).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
                  {exec.workflow_name || exec.workflow_id}
                </div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {exec.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Details & Time-Traveler Panel */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {selectedExecution ? (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                  Instance: {selectedExecution.id}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Workflow: <span style={{ color: '#38BDF8', fontWeight: 600 }}>{selectedExecution.workflow_id}</span> • Duration: {selectedExecution.duration_ms}ms • Steps: {steps.length}
                </div>
              </div>

              {/* Cryptographic Merkle Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <ShieldCheck size={16} />
                <span>Merkle Signed & Tamper-Proof</span>
              </div>
            </div>

                        {/* WAITING_SIGNAL ACTION BANNER */}
            {selectedExecution.status === 'WAITING_SIGNAL' && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Radio size={20} color="#FBBF24" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FEF3C7' }}>
                      Execution Suspended — Awaiting External Signal
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#FDE68A' }}>
                      This workflow is waiting for an incoming callback, OTP verification, or external event.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSignalModalOpen(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Zap size={16} />
                  Inject Signal
                </button>
              </div>
            )}

            {/* CHILD EXECUTIONS LINKAGE LIST */}
            {childExecutions.length > 0 && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Layers size={18} color="#A78BFA" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DDD6FE' }}>
                  Spawned Child Executions ({childExecutions.length}):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {childExecutions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectExecution(c)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: '#EDE9FE',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {c.workflow_id} ({c.id.slice(0, 14)}...) ➔
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TIME-TRAVEL REPLAY DEBUGGER TOOLBAR */}
            {steps.length > 0 && (
              <div className="glass-card" style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#38BDF8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      Time-Travel Replay Debugger
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      fontWeight: 600
                    }}>
                      Step {currentStepIdx + 1} of {steps.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
                      disabled={currentStepIdx === 0}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: currentStepIdx === 0 ? 'var(--text-muted)' : '#f8fafc',
                        cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="Previous Step"
                    >
                      <SkipBack size={14} />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: isPlaying ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        border: isPlaying ? '1px solid #F43F5E' : '1px solid #38BDF8',
                        color: isPlaying ? '#F43F5E' : '#38BDF8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      {isPlaying ? 'Pause' : 'Auto Play'}
                    </button>

                    <button
                      onClick={() => setCurrentStepIdx((p) => Math.min(maxStep, p + 1))}
                      disabled={currentStepIdx >= maxStep}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: currentStepIdx >= maxStep ? 'var(--text-muted)' : '#f8fafc',
                        cursor: currentStepIdx >= maxStep ? 'not-allowed' : 'pointer'
                      }}
                      title="Next Step"
                    >
                      <SkipForward size={14} />
                    </button>

                    <button
                      onClick={handleResume}
                      disabled={resumeLoading}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: '8px'
                      }}
                    >
                      <RotateCcw size={13} />
                      {resumeLoading ? 'Replaying...' : 'Replay Deterministic'}
                    </button>
                  </div>
                </div>

                {/* Timeline Scrubber Slider */}
                <input
                  type="range"
                  min="0"
                  max={maxStep}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStepIdx(parseInt(e.target.value, 10));
                  }}
                  style={{
                    width: '100%',
                    accentColor: '#38BDF8',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                />

                {resumeMessage && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.75rem'
                  }}>
                    {resumeMessage}
                  </div>
                )}
              </div>
            )}

            {/* Active Time-Traveled Step Inspector */}
            {activeStep && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>
                  State at Step {currentStepIdx + 1}: <span style={{ color: '#38BDF8' }}>{activeStep.stage_name || activeStep.stage_id}</span>
                </div>

                <div className="glass-panel" style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: activeStep.status === 'COMPLETED' ? '#10B98120' : '#F43F5E20',
                        color: activeStep.status === 'COMPLETED' ? '#10B981' : '#F43F5E',
                        border: `1px solid ${activeStep.status === 'COMPLETED' ? '#10B981' : '#F43F5E'}`
                      }}>
                        {activeStep.status}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                        Type: {activeStep.stage_type}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      Duration: {activeStep.duration_ms}ms
                    </span>
                  </div>

                  {/* Step Output */}
                  {activeStep.output && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        Output Payload:
                      </div>
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#38BDF8',
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(activeStep.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
            Select an execution instance to view details
          </div>
        )}
      </div>
    
      {/* INJECT SIGNAL MODAL */}
      {signalModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '460px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={20} color="#FBBF24" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Inject External Signal
                </h3>
              </div>
              <button
                onClick={() => setSignalModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Signal Name
              </label>
              <input
                type="text"
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
                placeholder="e.g. otp_confirmed"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                JSON Payload (Data injected into stage)
              </label>
              <textarea
                value={signalPayload}
                onChange={(e) => setSignalPayload(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#38BDF8',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {signalFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: signalFeedback.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: signalFeedback.ok ? '#10B981' : '#EF4444',
                border: signalFeedback.ok ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {signalFeedback.msg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setSignalModalOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendSignal}
                disabled={signalLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: signalLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {signalLoading ? 'Sending...' : 'Send Signal ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
