import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConnectorCatalog } from './components/ConnectorCatalog';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { YamlEditor } from './components/YamlEditor';
import { Login } from './components/Login';
import { RunModal } from './components/RunModal';
import { OperationsContainer } from './components/OperationsContainer';
import { GovernanceContainer } from './components/GovernanceContainer';
import { Workflow, Stage, Execution, StepExecution, StageType, WorkflowEvent } from './types';
import { Layers, Code2, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('openflow_token'));
  const [currentUser, setCurrentUser] = useState<{ username: string; full_name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('openflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  // 3 Primary Modes: 'studio' | 'operations' | 'governance' | 'docs'
  const [mainTab, setMainTab] = useState<'studio' | 'operations' | 'governance' | 'docs'>('studio');
  const [studioSubTab, setStudioSubTab] = useState<'canvas' | 'yaml'>('canvas');

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState<boolean>(false);
  const [dryRunModalOpen, setDryRunModalOpen] = useState<boolean>(false);
  const [dryRunPayload, setDryRunPayload] = useState<string>('{\n  "amount": 1500,\n  "customer_id": "CUST_9918"\n}');
  const [dryRunLoading, setDryRunLoading] = useState<boolean>(false);
  // Multi-Tenancy State
  const [currentTenant, setCurrentTenant] = useState<string>(() => localStorage.getItem('openflow_tenant_id') || 'default');
  const [availableTenants, setAvailableTenants] = useState<string[]>(['default', 'production', 'finance', 'staging']);

  const handleSelectTenant = (tenant: string) => {
    setCurrentTenant(tenant);
    localStorage.setItem('openflow_tenant_id', tenant);
    if (!availableTenants.includes(tenant)) {
      setAvailableTenants((prev) => [...prev, tenant]);
    }
  };


  const handleLoginSuccess = (token: string, user: { username: string; full_name: string; role: string }) => {
    localStorage.setItem('openflow_token', token);
    localStorage.setItem('openflow_user', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('openflow_token');
    localStorage.removeItem('openflow_user');
    setAuthToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    if (!authToken) return;
    fetchWorkflows();
    fetchExecutions();
    fetchPendingApprovals();
  }, [authToken, currentTenant]);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/v1/workflows', {
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Tenant-ID': currentTenant
        }
      });
      const data = await res.json();
      if (data.workflows && data.workflows.length > 0) {
        setWorkflows(data.workflows);
        setSelectedWorkflow((prev) => prev || data.workflows[0]);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  };

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/v1/executions', {
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Tenant-ID': currentTenant
        }
      });
      const data = await res.json();
      if (data.executions && data.executions.length > 0) {
        setExecutions(data.executions);
        setSelectedExecution((prev) => {
          if (prev) {
            const found = data.executions.find((e: Execution) => e.id === prev.id);
            return found || data.executions[0];
          }
          return null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/v1/approvals/pending', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.approvals) {
        setPendingApprovalsCount(data.approvals.length);
      }
    } catch (e) {
      console.error('Failed to fetch pending approvals count:', e);
    }
  };

  // WebSocket Live Real-Time Events
  useEffect(() => {
    if (!authToken) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
    let socket: WebSocket;

    const connectWS = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const wfEvent: WorkflowEvent = JSON.parse(event.data);
          handleLiveEvent(wfEvent);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 2000);
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    };

    connectWS();
    return () => {
      if (socket) socket.close();
    };
  }, [authToken]);

  const handleLiveEvent = (event: WorkflowEvent) => {
    if (!event || !event.execution_id) return;
    const eventType = String(event.type);

    if (eventType.includes('approval')) {
      fetchPendingApprovals();
    }

    if (eventType === 'step.started' || eventType === 'step_started') {
      setSelectedExecution((prev) => {
        const baseExec = prev && prev.id === event.execution_id ? prev : {
          id: event.execution_id,
          workflow_id: event.workflow_id,
          status: 'RUNNING',
          started_at: event.timestamp || new Date().toISOString(),
          steps: []
        } as Execution;

        const steps = [...(baseExec.steps || [])];
        const existingIdx = steps.findIndex((s) => s.stage_id === event.stage_id);
        const newStep: StepExecution = {
          id: `step_${event.stage_id}_${Date.now()}`,
          stage_id: event.stage_id,
          stage_name: (event.payload && event.payload.stage_name) || event.stage_id,
          stage_type: (event.payload && event.payload.stage_type) || 'transform',
          status: 'RUNNING',
          duration_ms: 0,
          attempts: 1,
          input: event.payload && event.payload.input,
          started_at: event.timestamp || new Date().toISOString()
        };

        if (existingIdx >= 0) {
          steps[existingIdx] = { ...steps[existingIdx], status: 'RUNNING' };
        } else {
          steps.push(newStep);
        }

        return { ...baseExec, status: 'RUNNING', steps };
      });
    } else if (eventType === 'step.completed' || eventType === 'step_completed') {
      setSelectedExecution((prev) => {
        if (!prev || prev.id !== event.execution_id) return prev;
        const steps = [...(prev.steps || [])];
        const existingIdx = steps.findIndex((s) => s.stage_id === event.stage_id);
        if (existingIdx >= 0) {
          steps[existingIdx] = {
            ...steps[existingIdx],
            status: 'COMPLETED',
            duration_ms: (event.payload && event.payload.duration_ms) || 0,
            output: event.payload && event.payload.output
          };
        }
        return { ...prev, steps };
      });
    } else if (eventType === 'execution.completed' || eventType === 'execution_completed' || eventType === 'execution.failed' || eventType === 'execution_failed') {
      setIsRunning(false);
      fetch(`/api/v1/executions/${event.execution_id}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })
        .then((res) => res.json())
        .then((exec: Execution) => {
          if (!exec.steps) exec.steps = [];
          setSelectedExecution(exec);
          setExecutions((prev) => [exec, ...prev.filter((e) => e.id !== exec.id)]);
        })
        .catch((e) => console.error('Fetch execution error:', e));
    }
  };

  const handleExecuteWithPayload = async (customPayload: Record<string, any>, initialVars?: Record<string, any>) => {
    if (!selectedWorkflow) return;
    setIsRunning(true);
    try {
      const res = await fetch(`/api/v1/workflows/${selectedWorkflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Tenant-ID': currentTenant
        },
        body: JSON.stringify({ input: customPayload, variables: initialVars || {} })
      });

      if (res.ok) {
        const exec: Execution = await res.json();
        if (!exec.steps) exec.steps = [];
        setSelectedExecution(exec);
        setExecutions((prev) => [exec, ...prev.filter((e) => e.id !== exec.id)]);
      } else {
        setIsRunning(false);
      }
    } catch (err) {
      console.error('Execution run error:', err);
      setIsRunning(false);
    }
  };

  const handleAddStage = (type: StageType, name: string) => {
    if (!selectedWorkflow) return;
    const newId = `${type}_${crypto.randomUUID().slice(0, 8)}`;
    const newStage: Stage = {
      id: newId,
      name: name,
      type: type,
      config: {},
      ui: {
        x: 100 + selectedWorkflow.stages.length * 50,
        y: 150 + (selectedWorkflow.stages.length % 3) * 60
      }
    };


    if (type === 'dmn') {
      newStage.config = {
        hit_policy: 'first',
        inputs: [{ name: 'amount', expression: 'amount' }],
        outputs: [{ name: 'status' }],
        rules: [
          { id: 'rule_1', conditions: { amount: '> 1000' }, outputs: { status: 'APPROVED' } },
          { id: 'rule_2', conditions: { amount: '<= 1000' }, outputs: { status: 'AUTO_REJECT' } }
        ]
      };
    }
    const updatedWorkflow: Workflow = {
      ...selectedWorkflow,
      stages: [...selectedWorkflow.stages, newStage]
    };

    setSelectedWorkflow(updatedWorkflow);
    saveWorkflowToServer(updatedWorkflow);
  };

  
  const handleConnectStages = (sourceId: string, targetId: string) => {
    if (!selectedWorkflow || sourceId === targetId) return;
    const updatedStages = selectedWorkflow.stages.map((s) => {
      if (s.id === sourceId) {
        const next = s.next ? [...s.next] : [];
        if (!next.includes(targetId)) next.push(targetId);
        return { ...s, next };
      }
      return s;
    });
    const updatedWorkflow = { ...selectedWorkflow, stages: updatedStages };
    setSelectedWorkflow(updatedWorkflow);
    saveWorkflowToServer(updatedWorkflow);
  };

  const handleDeleteConnection = (sourceId: string, targetId: string) => {
    if (!selectedWorkflow) return;
    const updatedStages = selectedWorkflow.stages.map((s) => {
      if (s.id === sourceId) {
        const next = (s.next || []).filter((id) => id !== targetId);
        const branches = (s.branches || []).filter((b) => b.target !== targetId);
        return { ...s, next, branches };
      }
      return s;
    });
    const updatedWorkflow = { ...selectedWorkflow, stages: updatedStages };
    setSelectedWorkflow(updatedWorkflow);
    saveWorkflowToServer(updatedWorkflow);
  };

  const handleUpdateStage = (updatedStage: Stage) => {
    if (!selectedWorkflow) return;
    const updatedStages = selectedWorkflow.stages.map((s) =>
      s.id === updatedStage.id ? updatedStage : s
    );
    const updatedWorkflow = { ...selectedWorkflow, stages: updatedStages };
    setSelectedWorkflow(updatedWorkflow);
    saveWorkflowToServer(updatedWorkflow);
  };

  const handleUpdateStagePosition = (stageId: string, x: number, y: number) => {
    if (!selectedWorkflow) return;
    const updatedStages = selectedWorkflow.stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          ui: { ...(s.ui || { x: 0, y: 0 }), x, y }
        };
      }
      return s;
    });
    setSelectedWorkflow({ ...selectedWorkflow, stages: updatedStages });
  };

  const handleDeleteStage = (stageId: string) => {
    if (!selectedWorkflow) return;
    const updatedStages = selectedWorkflow.stages.filter((s) => s.id !== stageId);
    const updatedWorkflow = { ...selectedWorkflow, stages: updatedStages };
    setSelectedWorkflow(updatedWorkflow);
    setSelectedStage(null);
    saveWorkflowToServer(updatedWorkflow);
  };

  const saveWorkflowToServer = async (wf: Workflow) => {
    try {
      const wfWithTenant = { ...wf, tenant_id: wf.tenant_id || currentTenant };
      await fetch(`/api/v1/workflows/${wf.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Tenant-ID': currentTenant
        },
        body: JSON.stringify(wfWithTenant)
      });
      fetchWorkflows();
    } catch (e) {
      console.error('Failed to save workflow:', e);
    }
  };

  const handleExecuteDryRun = async () => {
    if (!selectedWorkflow) return;
    setDryRunLoading(true);
    try {
      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(dryRunPayload);
      } catch {
        alert('JSON inválido no payload do Dry-Run');
        setDryRunLoading(false);
        return;
      }
      const res = await fetch(`/api/v1/workflows/${selectedWorkflow.id}/dry-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ input: parsed, mock_connectors: true })
      });
      if (res.ok) {
        const simExec: Execution = await res.json();
        setSelectedExecution(simExec);
        setDryRunModalOpen(false);
        setMainTab('operations');
      } else {
        const errData = await res.json();
        alert('Erro no Dry-Run: ' + (errData.error || 'desconhecido'));
      }
    } catch (e: any) {
      alert('Erro na simulação: ' + e.message);
    } finally {
      setDryRunLoading(false);
    }
  };

  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header
        workflows={workflows}
        selectedWorkflow={selectedWorkflow}
        onSelectWorkflow={setSelectedWorkflow}
        onRunWorkflow={() => setIsRunModalOpen(true)}
        onDryRun={() => setDryRunModalOpen(true)}
        isRunning={isRunning}
        mainTab={mainTab}
        setMainTab={setMainTab}
        executionsCount={executions.length}
        pendingApprovalsCount={pendingApprovalsCount}
        wsConnected={wsConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentTenant={currentTenant}
        onSelectTenant={handleSelectTenant}
        availableTenants={availableTenants}
      />

      {/* Interactive Run Modal with Custom Payload */}
      {selectedWorkflow && (
        <RunModal
          workflow={selectedWorkflow}
          isOpen={isRunModalOpen}
          onClose={() => setIsRunModalOpen(false)}
          onExecute={handleExecuteWithPayload}
          onDryRun={(payload) => {
            setDryRunPayload(JSON.stringify(payload, null, 2));
            setDryRunModalOpen(true);
          }}
          isRunning={isRunning}
        />
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* TAB 1: STUDIO (Canvas & YAML Toggle) */}
        {mainTab === 'studio' && selectedWorkflow && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* Top Toolbar Subtab Toggle */}
            <div style={{
              height: '42px',
              padding: '0 24px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setStudioSubTab('canvas')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: studioSubTab === 'canvas' ? '#38BDF8' : 'transparent',
                    color: studioSubTab === 'canvas' ? '#090D16' : '#94A3B8'
                  }}
                >
                  <Layers size={13} />
                  Visual Canvas
                </button>
                <button
                  onClick={() => setStudioSubTab('yaml')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: studioSubTab === 'yaml' ? '#38BDF8' : 'transparent',
                    color: studioSubTab === 'yaml' ? '#090D16' : '#94A3B8'
                  }}
                >
                  <Code2 size={13} />
                  YAML Spec
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                Workflow: <strong style={{ color: '#cbd5e1' }}>{selectedWorkflow.name}</strong> ({selectedWorkflow.id})
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
              {studioSubTab === 'canvas' ? (
                <>
                  <ConnectorCatalog onAddStage={handleAddStage} />
                  <Canvas
                    workflow={selectedWorkflow}
                    selectedStage={selectedStage}
                    onSelectStage={setSelectedStage}
                    activeExecution={selectedExecution}
                    onUpdateStagePosition={handleUpdateStagePosition}
                    onConnectStages={handleConnectStages}
                    onDeleteConnection={handleDeleteConnection}
                  />
                  {selectedStage && (
                    <Inspector
                      stage={selectedStage}
                      workflow={selectedWorkflow}
                      activeExecution={selectedExecution}
                      onClose={() => setSelectedStage(null)}
                      onUpdateStage={handleUpdateStage}
                      onDeleteStage={handleDeleteStage}
                    />
                  )}
                </>
              ) : (
                <YamlEditor
                  workflow={selectedWorkflow}
                  onSaveWorkflow={(wf) => {
                    setSelectedWorkflow(wf);
                    saveWorkflowToServer(wf);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OPERAÇÕES (Execuções + Fila AML) */}
        {mainTab === 'operations' && (
          <OperationsContainer
            workflows={workflows}
            authToken={authToken}
            currentUser={currentUser}
            executions={executions}
            selectedExecution={selectedExecution}
            onSelectExecution={setSelectedExecution}
            pendingApprovalsCount={pendingApprovalsCount}
            onRefreshExecutions={fetchExecutions}
          />
        )}

        {/* TAB 3: GOVERNANÇA & SEGURANÇA (RBAC, API Keys, Vault, Auditoria) */}
        {mainTab === 'governance' && (
          <GovernanceContainer
            authToken={authToken}
            currentUser={currentUser}
          />
        )}

        {/* TAB 4: DOCS */}
        {mainTab === 'docs' && (
          <iframe
            src="/docs/index.html"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#090d16'
            }}
            title="OpenFlow Documentation Portal"
          />
        )}
      </div>
    
      {/* DRY-RUN SIMULATION MODAL */}
      {dryRunModalOpen && (
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
            width: '480px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="#FBBF24" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Simulador de Workflow (Dry Run)
                </h3>
              </div>
              <button
                onClick={() => setDryRunModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#FEF3C7', marginBottom: '14px', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              Executa uma simulação rápida em memória sem chamar sistemas externos, testando expressões Go expr, gateways e roteamento.
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Input Payload de Teste (JSON)
              </label>
              <textarea
                value={dryRunPayload}
                onChange={(e) => setDryRunPayload(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#38BDF8',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDryRunModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteDryRun}
                disabled={dryRunLoading}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: dryRunLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {dryRunLoading ? 'Simulando...' : 'Iniciar Simulação ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
