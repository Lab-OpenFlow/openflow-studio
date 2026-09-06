import React, { useState, useEffect } from 'react';
import { FileText, Download, ShieldCheck, Check, Clock, User, Shield, Terminal, Search, Filter, Eye, X, CheckCircle2 } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  resource_id: string;
  details?: Record<string, any>;
  client_ip?: string;
}

interface AuditTrailProps {
  authToken: string | null;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ authToken }) => {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 3000);
    return () => clearInterval(interval);
  }, [authToken]);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/v1/audits/export', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.records) setAudits(data.records);
    } catch (e) {
      console.error('Failed to fetch audits:', e);
    }
  };

  const handleExportJSON = () => {
    window.open('/api/v1/audits/export', '_blank');
  };

  const filteredAudits = audits.filter((a) => {
    if (filterAction !== 'ALL' && a.action !== filterAction) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchActor = a.actor?.toLowerCase().includes(term);
      const matchAction = a.action?.toLowerCase().includes(term);
      const matchResource = a.resource_id?.toLowerCase().includes(term);
      if (!matchActor && !matchAction && !matchResource) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('EXECUTE') || action.includes('COMPLETED')) {
      return { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', text: '#38BDF8' };
    }
    if (action.includes('APPROVE')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34D399' };
    }
    if (action.includes('REJECT') || action.includes('FAIL')) {
      return { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)', text: '#f87171' };
    }
    return { bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)', text: '#818CF8' };
  };

  return (
    <div style={{
      flex: 1,
      height: 'calc(100vh - 116px)',
      overflowY: 'auto',
      padding: '32px 50px',
      background: '#090d16',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            letterSpacing: '-0.02em'
          }}>
            <FileText size={22} color="#38BDF8" />
            Trilha de Auditoria Regulatória Forense (BACEN / SOX / PCI-DSS)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            Registros imutáveis em tempo real com árvore de Merkle criptográfica e identificação digital de operadores.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none',
            color: '#fff',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
          }}
        >
          <Download size={16} />
          Exportar Pacote Assinado (JSON)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '380px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Buscar por ator, ação ou ID de recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filtrar Ação:</span>
          {['ALL', 'EXECUTE_WORKFLOW', 'WORKFLOW_COMPLETED', 'APPROVE_TRANSACTION', 'REJECT_TRANSACTION'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterAction === act ? '#0284c7' : 'rgba(30, 41, 59, 0.6)',
                color: filterAction === act ? '#ffffff' : '#94A3B8'
              }}
            >
              {act === 'ALL' ? 'Todas' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Timestamp</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Ator / Identidade</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Ação Executada</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Recurso / ID</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>IP</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'right' }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudits.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            ) : (
              filteredAudits.map((a) => {
                const badge = getActionBadge(a.action);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                      {a.actor}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.text
                      }}>
                        {a.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {a.resource}: <strong style={{ color: '#38bdf8' }}>{a.resource_id}</strong>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                      {a.client_ip || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedAudit(a)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38BDF8',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        <Eye size={13} />
                        Inspecionar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Inspecionar Registro de Auditoria Forense */}
      {selectedAudit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '600px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#38BDF8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Comprovante Forense de Auditoria
                </h3>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>ID do Registro:</span>
                <div style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{selectedAudit.id}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>Timestamp:</span>
                <div style={{ color: '#f8fafc' }}>{new Date(selectedAudit.timestamp).toISOString()}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>Ator:</span>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedAudit.actor}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>IP de Origem:</span>
                <div style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{selectedAudit.client_ip || '127.0.0.1'}</div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Detalhes & Carga Criptográfica / Merkle Proof
              </span>
              <pre style={{
                margin: '6px 0 0 0',
                padding: '14px',
                borderRadius: '8px',
                background: '#030712',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: '#93c5fd',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(selectedAudit.details || {}, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedAudit(null)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: '#38BDF8',
                border: 'none',
                color: '#090D16',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
