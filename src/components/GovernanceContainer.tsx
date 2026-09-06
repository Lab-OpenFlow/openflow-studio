import React, { useState } from 'react';
import { Shield, Key, Lock, FileText } from 'lucide-react';
import { AccessControl } from './AccessControl';
import { AuditTrail } from './AuditTrail';

interface GovernanceContainerProps {
  authToken: string | null;
  currentUser: { username: string; full_name: string; role: string } | null;
}

export const GovernanceContainer: React.FC<GovernanceContainerProps> = ({ authToken, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'access' | 'audit'>('access');

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
          onClick={() => setActiveTab('access')}
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
            background: activeTab === 'access' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'access' ? '#38BDF8' : '#94A3B8',
            borderBottom: activeTab === 'access' ? '2px solid #38BDF8' : 'none'
          }}
        >
          <Shield size={14} />
          Controle de Acesso, API Keys & Vault
        </button>

        <button
          onClick={() => setActiveTab('audit')}
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
            background: activeTab === 'audit' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'audit' ? '#38BDF8' : '#94A3B8',
            borderBottom: activeTab === 'audit' ? '2px solid #38BDF8' : 'none'
          }}
        >
          <FileText size={14} />
          Trilha de Auditoria BACEN / SOX
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'access' && (
          <AccessControl authToken={authToken} currentUser={currentUser} />
        )}
        {activeTab === 'audit' && (
          <AuditTrail authToken={authToken} />
        )}
      </div>
    </div>
  );
};
