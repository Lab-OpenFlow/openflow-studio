import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, ShieldAlert, ArrowRight, DollarSign, Activity } from 'lucide-react';

interface ApprovalItem {
  id: string;
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  stage_id: string;
  stage_name: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  required_role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decided_by?: string;
  decided_at?: string;
  reason?: string;
  created_at: string;
}

interface ApprovalInboxProps {
  authToken: string | null;
  currentUser: { username: string; full_name: string; role: string } | null;
  onApprovalDecided?: () => void;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({ authToken, currentUser, onApprovalDecided }) => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
    const interval = setInterval(fetchPendingApprovals, 4000);
    return () => clearInterval(interval);
  }, [authToken]);

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/v1/approvals/pending', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.approvals) {
        setApprovals(data.approvals);
        if (!selectedApproval && data.approvals.length > 0) {
          setSelectedApproval(data.approvals[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch pending approvals:', e);
    }
  };

  const handleDecide = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/approvals/${selectedApproval.id}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          decision: decision,
          reason: decisionReason || (decision === 'APPROVE' ? 'Aprovado pelo operador' : 'Rejeitado por análise de risco')
        })
      });

      if (res.ok) {
        setDecisionReason('');
        setSelectedApproval(null);
        fetchPendingApprovals();
        if (onApprovalDecided) onApprovalDecided();
      }
    } catch (e) {
      console.error('Failed to decide approval:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      height: 'calc(100vh - 68px)',
      overflowY: 'auto',
      padding: '36px 60px',
      background: '#090d16',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            letterSpacing: '-0.02em'
          }}>
            <UserCheck size={24} color="#38BDF8" />
            Inbox de Aprovações Manuais (Human-in-the-Loop)
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Transações bancárias de alto valor ou com alertas de risco retidas para homologação humana.
          </p>
        </div>

        <button
          onClick={fetchPendingApprovals}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          Atualizar Fila
        </button>
      </div>

      {approvals.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
            Fila de Aprovações Limpa!
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Não há transações pendentes de homologação manual neste momento.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', flex: 1 }}>
          {/* Left Column: Pending List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transações Retidas ({approvals.length})
            </span>

            {approvals.map((appr) => {
              const isSelected = selectedApproval?.id === appr.id;
              const amount = appr.payload?.amount || appr.payload?.transfer_amount || 'N/A';
              const currency = appr.payload?.currency || 'USD';

              return (
                <div
                  key={appr.id}
                  onClick={() => setSelectedApproval(appr)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                    border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      <Clock size={12} />
                      RETIDA
                    </span>

                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(appr.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc', marginBottom: '4px' }}>
                    {appr.stage_name || appr.stage_id}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>
                    {appr.workflow_name}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: '#34d399',
                    fontWeight: 700
                  }}>
                    <span>Valor:</span>
                    <span>{currency} ${amount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Review & Decision Inspector */}
          {selectedApproval && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldAlert size={20} color="#fbbf24" />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    {selectedApproval.title}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  {selectedApproval.description} • Execução: <code style={{ color: '#38BDF8' }}>{selectedApproval.execution_id}</code>
                </p>
              </div>

              {/* Payload Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Montante Total</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                    {selectedApproval.payload?.currency || 'USD'} ${selectedApproval.payload?.amount || selectedApproval.payload?.transfer_amount || '0'}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Conta de Origem</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {selectedApproval.payload?.source_account || selectedApproval.payload?.origin_account || 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Beneficiário / Destino</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {selectedApproval.payload?.destination_account || selectedApproval.payload?.target_account || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Full JSON Payload Inspector */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Payload Completo da Transação
                </span>
                <pre style={{
                  margin: '8px 0 0 0',
                  padding: '16px',
                  borderRadius: '10px',
                  background: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#93c5fd',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedApproval.payload, null, 2)}
                </pre>
              </div>

              {/* Operator Decision Action Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <input
                  type="text"
                  placeholder="Justificativa da decisão (opcional)..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ display: 'flex', gap: '14px' }}>
                  <button
                    onClick={() => handleDecide('REJECT')}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: '#f87171',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <XCircle size={18} />
                    Rejeitar & Estornar (Saga Rollback)
                  </button>

                  <button
                    onClick={() => handleDecide('APPROVE')}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Aprovar & Continuar Esteira
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
