import React, { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, Send, CheckCircle2, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import { WebhookBinding, Workflow } from '../types';

interface WebhookManagerProps {
  authToken: string | null;
  workflows: Workflow[];
}

export const WebhookManager: React.FC<WebhookManagerProps> = ({ authToken, workflows }) => {
  const [bindings, setBindings] = useState<WebhookBinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [pathPattern, setPathPattern] = useState<string>('pix/inbound');
  const [workflowId, setWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [method, setMethod] = useState<string>('POST');
  const [secretToken, setSecretToken] = useState<string>('');
  const [description, setDescription] = useState<string>('Inbound Pix payment webhook');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  const fetchBindings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/webhook-bindings', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.bindings) {
        setBindings(data.bindings);
      }
    } catch (err) {
      console.error('Failed to fetch webhook bindings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBindings();
  }, [authToken]);

  const handleCreate = async () => {
    if (!pathPattern || !workflowId) return;
    try {
      const res = await fetch('/api/v1/webhook-bindings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          path_pattern: pathPattern,
          workflow_id: workflowId,
          method,
          secret_token: secretToken,
          description
        })
      });
      if (res.ok) {
        setModalOpen(false);
        fetchBindings();
      } else {
        const err = await res.json();
        alert('Erro ao criar binding: ' + (err.error || 'desconhecido'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este Webhook Binding?')) return;
    try {
      const res = await fetch(`/api/v1/webhook-bindings/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        fetchBindings();
      }
    } catch (err) {
      console.error('Failed to delete binding:', err);
    }
  };

  const handleQuickTest = async (binding: WebhookBinding) => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const cleanPath = binding.path_pattern.replace(/^\/+/, '').replace(/^webhooks\/+/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (binding.secret_token) {
        headers['X-Webhook-Secret'] = binding.secret_token;
      }
      const res = await fetch(`/api/v1/webhooks/${cleanPath}`, {
        method: binding.method === '*' ? 'POST' : binding.method,
        headers,
        body: JSON.stringify({
          test_event: true,
          timestamp: new Date().toISOString(),
          customer_id: 'CUST-PIX-101',
          amount: 250.00
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`✅ Webhook disparado com sucesso! Execution ID: ${data.execution_id}`);
      } else {
        setTestResult(`❌ Falha: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Erro: ${e.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '28px 40px', overflowY: 'auto', background: 'rgba(11, 17, 32, 0.95)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={22} color="#38BDF8" />
            Dynamic Inbound Webhooks Router
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
            Mapeie rotas HTTP públicas dinâmicas (<code style={{ color: '#38BDF8' }}>/api/v1/webhooks/*</code>) diretamente para disparar Workflows com validação de assinatura e segredos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchBindings}
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
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#fff',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Plus size={15} /> Novo Webhook Binding
          </button>
        </div>
      </div>

      {testResult && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: testResult.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: testResult.startsWith('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
          color: testResult.startsWith('✅') ? '#34D399' : '#F87171',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {testResult}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Carregando Webhooks...</div>
      ) : bindings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Radio size={36} color="#64748B" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Nenhum Webhook Binding Configurado</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '400px', margin: '6px auto 16px' }}>
            Crie um mapeamento de URL para que parceiros externos ou microserviços possam disparar seus workflows via HTTP REST.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Configurar Primeiro Webhook
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
          {bindings.map((b) => (
            <div
              key={b.id}
              className="glass-card"
              style={{
                borderRadius: '12px',
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: b.method === 'POST' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: b.method === 'POST' ? '#10B981' : '#38BDF8',
                    letterSpacing: '0.04em'
                  }}>
                    {b.method}
                  </span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer', padding: '4px' }}
                    title="Excluir Webhook Binding"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  /api/v1/webhooks/{b.path_pattern.replace(/^\/+/, '')}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Alvo: <strong style={{ color: '#FBBF24' }}>{b.workflow_id}</strong> {b.description && `• ${b.description}`}
                </div>

                {b.secret_token && (
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginBottom: '14px', fontFamily: 'monospace' }}>
                    Header: <code>X-Webhook-Secret: {b.secret_token}</code>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/api/v1/webhooks/${b.path_pattern.replace(/^\/+/, '')}`;
                    navigator.clipboard.writeText(fullUrl);
                    alert('URL copiada para a área de transferência!');
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={13} /> Copiar URL
                </button>
                <button
                  onClick={() => handleQuickTest(b)}
                  disabled={testLoading}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: testLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Send size={13} /> Disparar Teste
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '460px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px' }}>
              Novo Webhook Route Binding
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  Path da URL Inbound
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>/api/v1/webhooks/</span>
                  <input
                    type="text"
                    value={pathPattern}
                    onChange={(e) => setPathPattern(e.target.value)}
                    placeholder="pix/inbound"
                    style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  Workflow Alvo
                </label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.82rem' }}
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {w.name} ({w.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                    Método HTTP
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.82rem' }}
                  >
                    <option value="POST" style={{ background: '#0f172a' }}>POST</option>
                    <option value="GET" style={{ background: '#0f172a' }}>GET</option>
                    <option value="PUT" style={{ background: '#0f172a' }}>PUT</option>
                    <option value="*" style={{ background: '#0f172a' }}>Qualquer (*)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                    Segredo (Opcional - X-Webhook-Secret)
                  </label>
                  <input
                    type="text"
                    value={secretToken}
                    onChange={(e) => setSecretToken(e.target.value)}
                    placeholder="whsec_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  Descrição / Notas
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Recebimento de eventos PIX Bacen"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '8px 18px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Criar Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
