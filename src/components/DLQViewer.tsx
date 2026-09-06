import React, { useState, useEffect } from 'react';
import { AlertOctagon, RotateCcw, CheckCircle2, Trash2, Clock, Terminal, ChevronRight } from 'lucide-react';
import { DLQMessage } from '../types';

interface DLQViewerProps {
  authToken: string | null;
}

export const DLQViewer: React.FC<DLQViewerProps> = ({ authToken }) => {
  const [messages, setMessages] = useState<DLQMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<DLQMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDLQ = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/dlq', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.messages.length > 0 && !selectedMsg) {
          setSelectedMsg(data.messages[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch DLQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, [authToken]);

  const handleReplay = async (id: string) => {
    try {
      setReplayingId(id);
      setFeedback(null);
      const res = await fetch(`/api/v1/dlq/${id}/replay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Mensagem reprocessada com sucesso! Nova Execução: ${data.execution_id}`);
        fetchDLQ();
      } else {
        setFeedback(`Erro ao reprocessar: ${data.error}`);
      }
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setReplayingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja descartar esta mensagem da DLQ?')) return;
    try {
      const res = await fetch(`/api/v1/dlq/${id}`, {
        method: 'DELETE',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        setSelectedMsg(null);
        fetchDLQ();
      }
    } catch (err) {
      console.error('Failed to delete DLQ message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* LEFT: Messages List */}
      <div style={{
        width: '380px',
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#F43F5E" />
              Dead Letter Queue
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {messages.length} eventos enfileirados
            </span>
          </div>
          <button
            onClick={fetchDLQ}
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>Carregando DLQ...</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>Fila DLQ Limpa</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Nenhum poison pill ou evento com falha registrado.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((m) => {
              const isSelected = selectedMsg?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMsg(m)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #38BDF8' : '3px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                      {m.workflow_id}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: m.status === 'REPLAYED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: m.status === 'REPLAYED' ? '#10B981' : '#F43F5E'
                    }}>
                      {m.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#F87171', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.error_message}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                    <span>Origem: {m.source}</span>
                    <span>• {new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Detail View & Actions */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'rgba(11, 17, 32, 0.95)' }}>
        {selectedMsg ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
                  Evento DLQ: {selectedMsg.id}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Alvo: <strong style={{ color: '#38BDF8' }}>{selectedMsg.workflow_id}</strong> • Origem: <strong>{selectedMsg.source}</strong> ({selectedMsg.topic_or_path})
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDelete(selectedMsg.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#F43F5E',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> Descartar
                </button>
                <button
                  onClick={() => handleReplay(selectedMsg.id)}
                  disabled={replayingId === selectedMsg.id}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: replayingId === selectedMsg.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <RotateCcw size={15} />
                  {replayingId === selectedMsg.id ? 'Reexecutando...' : 'Replay Event ➔'}
                </button>
              </div>
            </div>

            {feedback && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: feedback.includes('Erro') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: feedback.includes('Erro') ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                color: feedback.includes('Erro') ? '#F87171' : '#34D399',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                {feedback}
              </div>
            )}

            {/* Error Card */}
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', marginBottom: '6px' }}>
                Erro Registrado
              </div>
              <div style={{ fontSize: '0.9rem', color: '#FECDD3', fontFamily: 'var(--font-mono)' }}>
                {selectedMsg.error_message}
              </div>
            </div>

            {/* Payload Viewer */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Payload do Evento Original
              </div>
              <pre style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                color: '#38BDF8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                overflowX: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(selectedMsg.payload, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Selecione uma mensagem da fila para inspecionar os detalhes e reprocessar.
          </div>
        )}
      </div>
    </div>
  );
};
