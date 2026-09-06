import React from 'react';
import { Play, Layers, Activity, ShieldCheck, BookOpen, LogOut, ChevronDown, Cpu } from 'lucide-react';
import { Workflow, Execution } from '../types';

interface HeaderProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow) => void;
  onRunWorkflow: () => void;
  onDryRun?: () => void;
  isRunning: boolean;
  mainTab: 'studio' | 'operations' | 'governance' | 'docs';
  setMainTab: (tab: 'studio' | 'operations' | 'governance' | 'docs') => void;
  executionsCount: number;
  pendingApprovalsCount: number;
  wsConnected: boolean;
  currentUser: { username: string; full_name: string; role: string } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  onRunWorkflow,
  onDryRun,
  isRunning,
  mainTab,
  setMainTab,
  executionsCount,
  pendingApprovalsCount,
  wsConnected,
  currentUser,
  onLogout
}) => {
  const getRoleStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { label: 'ADMIN', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#38BDF8' };
      case 'operator':
        return { label: 'OPERATOR', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)', text: '#818CF8' };
      case 'viewer':
      case 'auditor':
        return { label: 'AUDITOR', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', text: '#34D399' };
      default:
        return { label: role?.toUpperCase() || 'USER', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)', text: '#94A3B8' };
    }
  };

  const roleBadge = getRoleStyle(currentUser?.role || 'admin');

  return (
    <header style={{
      height: '68px',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(11, 17, 32, 0.98)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      zIndex: 50,
      position: 'relative',
      userSelect: 'none'
    }}>
      {/* LEFT: Brand & Workflow Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Activity size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              OpenFlow
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                letterSpacing: '0.04em'
              }}>
                CORE
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Workflow Dropdown Picker */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedWorkflow?.id || ''}
            onChange={(e) => {
              const wf = workflows.find((w) => w.id === e.target.value);
              if (wf) onSelectWorkflow(wf);
            }}
            style={{
              appearance: 'none',
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f1f5f9',
              borderRadius: '8px',
              padding: '8px 32px 8px 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '240px',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                {wf.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="#94a3b8"
            style={{ position: 'absolute', right: '10px', top: '12px', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* CENTER: 3 Clean Primary Modules */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.9)',
        padding: '5px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '6px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        {/* TAB 1: STUDIO */}
        <button
          onClick={() => setMainTab('studio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'studio' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mainTab === 'studio' ? '#ffffff' : '#94a3b8',
            boxShadow: mainTab === 'studio' ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Layers size={16} />
          Studio
        </button>

        {/* TAB 2: OPERAÇÕES */}
        <button
          onClick={() => setMainTab('operations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'operations' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mainTab === 'operations' ? '#ffffff' : '#94a3b8',
            boxShadow: mainTab === 'operations' ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Activity size={16} />
          Operações
          {pendingApprovalsCount > 0 && (
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '10px',
              background: '#f59e0b',
              color: '#090D16',
              fontWeight: 800
            }}>
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* TAB 3: GOVERNANÇA */}
        <button
          onClick={() => setMainTab('governance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'governance' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mainTab === 'governance' ? '#ffffff' : '#94a3b8',
            boxShadow: mainTab === 'governance' ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <ShieldCheck size={16} />
          Governança & Segurança
        </button>

        {/* TAB 4: DOCS */}
        <button
          onClick={() => setMainTab('docs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mainTab === 'docs' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
            color: mainTab === 'docs' ? '#ffffff' : '#94a3b8',
            boxShadow: mainTab === 'docs' ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <BookOpen size={16} />
          Docs API
        </button>
      </nav>

      {/* RIGHT: Live Status, Run Trigger & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live WS Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          border: wsConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
          fontSize: '0.75rem',
          color: wsConnected ? '#34d399' : '#64748b',
          fontWeight: 600
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: wsConnected ? '#10B981' : '#64748B',
            boxShadow: wsConnected ? '0 0 8px #10B981' : 'none'
          }} />
          {wsConnected ? 'Live WS' : 'Offline'}
        </div>

                {/* Dry-Run Simulation Button */}
        {mainTab === 'studio' && (
          <button
            onClick={onDryRun}
            disabled={!selectedWorkflow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: selectedWorkflow ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            title="Simular execução em memória sem tocar em sistemas externos"
          >
            <Cpu size={15} />
            Dry Run
          </button>
        )}

        {/* Primary Run Trigger */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning || !selectedWorkflow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '8px',
            background: isRunning
              ? 'rgba(100, 116, 139, 0.5)'
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            boxShadow: isRunning ? 'none' : '0 0 20px rgba(16, 185, 129, 0.45)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Play size={15} fill="#fff" />
          {isRunning ? 'Executando...' : 'Run Workflow'}
        </button>

        {/* User Profile */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 6px 4px 12px',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                {currentUser.username}
              </div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '0 4px',
                borderRadius: '3px',
                background: roleBadge.bg,
                border: `1px solid ${roleBadge.border}`,
                color: roleBadge.text
              }}>
                {roleBadge.label}
              </span>
            </div>

            <button
              onClick={onLogout}
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Sair da Conta (Logout)"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
