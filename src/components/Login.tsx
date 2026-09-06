import React, { useState } from 'react';
import { Activity, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: { username: string; full_name: string; role: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('openflow2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Credenciais inválidas. Verifique usuário e senha.');
      }
    } catch (err: any) {
      setError('Falha ao conectar com o servidor de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
    }}>
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '25%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '25%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '420px',
        padding: '36px',
        borderRadius: '20px',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
            marginBottom: '16px'
          }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 6px 0',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            OpenFlow Orchestrator
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
            Enterprise Workflow Automation & Core Banking Engine
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f87171',
            fontSize: '0.8rem',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Usuário Corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="ex: admin"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
              marginTop: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar Plataforma</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Perfis de Demonstração (RBAC):
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleQuickLogin('admin', 'openflow2026')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              👑 Admin
            </button>
            <button
              onClick={() => handleQuickLogin('operator', 'operator123')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818CF8',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚙️ Operator
            </button>
            <button
              onClick={() => handleQuickLogin('auditor', 'auditor123')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🛡️ Auditor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
