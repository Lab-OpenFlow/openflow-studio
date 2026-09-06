import React, { useState, useEffect } from 'react';
import { Shield, Key, Users, Plus, Trash2, Copy, Check, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';

interface UserItem {
  username: string;
  full_name: string;
  role: string;
}

interface APIKeyItem {
  id: string;
  name: string;
  role: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

interface AccessControlProps {
  authToken: string | null;
  currentUser: { username: string; full_name: string; role: string } | null;
}

export const AccessControl: React.FC<AccessControlProps> = ({ authToken, currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'keys' | 'vault' | 'matrix'>('users');
  const [vaultSecrets, setVaultSecrets] = useState<{ key: string; updated_at: string }[]>([]);
  const [showAddSecretModal, setShowAddSecretModal] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKeyItem[]>([]);

  // New user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // New API Key modal state
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState('operator');
  const [newKeyExpiry, setNewKeyExpiry] = useState(0);

  // Revealed newly created raw API key modal state
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedRevealed, setCopiedRevealed] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchKeys();
  }, [authToken]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/auth/users', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/auth/keys', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.keys) setApiKeys(data.keys);
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    try {
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          full_name: newFullName,
          role: newRole
        })
      });

      if (res.ok) {
        setShowAddUserModal(false);
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        fetchUsers();
      } else {
        const err = await res.json();
        setUserFormError(err.error || 'Falha ao criar usuário.');
      }
    } catch (err: any) {
      setUserFormError('Erro ao comunicar com o servidor.');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) return;
    try {
      const res = await fetch(`/api/v1/auth/users/${username}`, {
        method: 'DELETE',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          name: newKeyName || 'Service Integration Key',
          role: newKeyRole,
          expires_in_days: newKeyExpiry
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowAddKeyModal(false);
        setNewKeyName('');
        setRevealedKey(data.api_key);
        fetchKeys();
      }
    } catch (e) {
      console.error('Failed to create key:', e);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja revogar permanentemente a chave "${name}" (${id})?`)) return;
    try {
      const res = await fetch(`/api/v1/auth/keys/${id}`, {
        method: 'DELETE',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (e) {
      console.error('Failed to revoke key:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRevealed(true);
    setTimeout(() => setCopiedRevealed(false), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { label: 'ADMIN', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#38BDF8' };
      case 'operator':
        return { label: 'OPERATOR', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)', text: '#818CF8' };
      case 'viewer':
      case 'auditor':
        return { label: 'AUDITOR / VIEWER', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', text: '#34D399' };
      default:
        return { label: role?.toUpperCase(), bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)', text: '#94A3B8' };
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
      {/* Top Header */}
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
            <Shield size={24} color="#38BDF8" />
            Controle de Acesso Corporativo & RBAC
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Gerenciamento de identidades, papéis de segurança e chaves criptográficas CSPRNG para microsserviços.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveSubTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'users' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeSubTab === 'users' ? '#ffffff' : '#94A3B8'
            }}
          >
            <Users size={15} />
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab('keys')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'keys' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeSubTab === 'keys' ? '#ffffff' : '#94A3B8'
            }}
          >
            <Key size={15} />
            API Keys ({apiKeys.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('vault');
              fetch('/api/v1/vault/secrets', { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} })
                .then(res => res.json())
                .then(d => { if (d.secrets) setVaultSecrets(d.secrets); });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'vault' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeSubTab === 'vault' ? '#ffffff' : '#94A3B8'
            }}
          >
            <Lock size={15} />
            Vault de Segredos
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'matrix' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeSubTab === 'matrix' ? '#ffffff' : '#94A3B8'
            }}
          >
            <ShieldCheck size={15} />
            Matriz de Permissões
          </button>
        </div>
      </div>

      {/* SUBTAB 1: USERS */}
      {activeSubTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Membros e Contas Ativas
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Usuários com acesso ao Studio e às APIs autenticadas via JWT.
              </span>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Plus size={16} />
              Novo Usuário
            </button>
          </div>

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
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Usuário</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Nome Completo</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Papel (RBAC)</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.username} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                        {u.username}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>
                        {u.full_name || '-'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                          letterSpacing: '0.04em'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {u.username !== 'admin' ? (
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <Trash2 size={13} />
                            Excluir
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                            Root Protegido
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: API KEYS */}
      {activeSubTab === 'keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Chaves de API Criptográficas (CSPRNG 256-bit)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Armazenadas sob hash unidirecional SHA-256. Autentique requisições com o header `X-API-Key: ofk_live_...`.
              </span>
            </div>

            <button
              onClick={() => setShowAddKeyModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Plus size={16} />
              Gerar Nova API Key
            </button>
          </div>

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
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Nome do Serviço</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Prefixo da Chave</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Papel (RBAC)</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Criada Em</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => {
                  const badge = getRoleBadge(k.role);
                  return (
                    <tr key={k.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>
                        {k.name}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.82rem' }}>
                        {k.key_prefix}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                          letterSpacing: '0.04em'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={13} />
                          Revogar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      {/* SUBTAB: VAULT DE SEGREDOS */}
      {activeSubTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Cofre Criptográfico de Segredos (AES-256-GCM)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Injete credenciais nos nós YAML usando a sintaxe <code>{'{{ secret("caminho/do/segredo") }}'}</code>.
              </span>
            </div>

            <button
              onClick={() => setShowAddSecretModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Plus size={16} />
              Novo Segredo
            </button>
          </div>

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
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Caminho do Segredo (Key)</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Algoritmo</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vaultSecrets.map((s) => (
                  <tr key={s.key} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                      {s.key}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        AES-256-GCM ENCRYPTED
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Excluir segredo "${s.key}"?`)) return;
                          await fetch(`/api/v1/vault/secrets/${encodeURIComponent(s.key)}`, {
                            method: 'DELETE',
                            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                          });
                          const res = await fetch('/api/v1/vault/secrets', { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} });
                          const d = await res.json();
                          if (d.secrets) setVaultSecrets(d.secrets);
                        }}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERMISSION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Matriz de Governança e Privilégios por Papel
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Hierarquia de controle de acessos em conformidade com políticas de segurança bancária.
            </span>
          </div>

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
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Ação Operacional</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, textAlign: 'center', color: '#38BDF8', fontSize: '0.75rem', letterSpacing: '0.05em' }}>👑 ADMIN</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, textAlign: 'center', color: '#818CF8', fontSize: '0.75rem', letterSpacing: '0.05em' }}>⚙️ OPERATOR</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, textAlign: 'center', color: '#34D399', fontSize: '0.75rem', letterSpacing: '0.05em' }}>🛡️ AUDITOR / VIEWER</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Criar e Editar Workflows (Studio Canvas & YAML)', admin: true, operator: false, viewer: false },
                  { name: 'Excluir Workflows e Etapas', admin: true, operator: false, viewer: false },
                  { name: 'Disparar Execuções e Webhooks', admin: true, operator: true, viewer: false },
                  { name: 'Replay Determinístico e Recuperação de Sagas', admin: true, operator: true, viewer: false },
                  { name: 'Visualizar Histórico de Execuções e Logs OTel', admin: true, operator: true, viewer: true },
                  { name: 'Verificar Prova Criptográfica da Árvore Merkle', admin: true, operator: true, viewer: true },
                  { name: 'Gerenciar Vault de Segredos e Credenciais', admin: true, operator: false, viewer: false },
                  { name: 'Gerenciar Usuários e Chaves de API (RBAC)', admin: true, operator: false, viewer: false },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 24px', color: '#f8fafc', fontWeight: 500 }}>{row.name}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {row.admin ? <CheckCircle2 size={18} color="#38BDF8" style={{ margin: '0 auto' }} /> : <XCircle size={18} color="#475569" style={{ margin: '0 auto' }} />}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {row.operator ? <CheckCircle2 size={18} color="#818CF8" style={{ margin: '0 auto' }} /> : <XCircle size={18} color="#475569" style={{ margin: '0 auto' }} />}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {row.viewer ? <CheckCircle2 size={18} color="#34D399" style={{ margin: '0 auto' }} /> : <XCircle size={18} color="#475569" style={{ margin: '0 auto' }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REVEAL SECRET KEY (ONE-TIME VIEW) */}
      {revealedKey && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '560px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  Chave de API Criptográfica Gerada
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                  256-bit CSPRNG Entropy • SHA-256 Hash
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              marginBottom: '18px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Atenção:</strong> Esta chave só será exibida <u>uma única vez</u>. Guarde-a em seu cofre de segredos (ex: HashiCorp Vault, AWS Secrets Manager ou variáveis de ambiente).
              </div>
            </div>

            <div style={{
              background: '#030712',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <code style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#38BDF8',
                wordBreak: 'break-all',
                userSelect: 'all'
              }}>
                {revealedKey}
              </code>
              <button
                onClick={() => copyToClipboard(revealedKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: copiedRevealed ? '#10B981' : '#0284c7',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {copiedRevealed ? <Check size={14} /> : <Copy size={14} />}
                {copiedRevealed ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <button
              onClick={() => setRevealedKey(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Já copiei e salvei a chave com segurança
            </button>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Novo Usuário */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '460px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Cadastrar Novo Usuário Corporativo
            </h3>

            {userFormError && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
                {userFormError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="ex: joao.silva"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Nome Completo</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="ex: João Silva"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Papel (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="admin">👑 Admin (Acesso Total)</option>
                  <option value="operator">⚙️ Operator (Disparo e Operação)</option>
                  <option value="viewer">🛡️ Auditor / Viewer (Somente Leitura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: '#38BDF8', border: 'none', color: '#090D16', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerar Nova API Key */}
      {showAddKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '460px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Gerar Nova Chave de API Criptográfica
            </h3>

            <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Nome / Descrição do Serviço</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="ex: Core Banking Settlement Worker"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Papel (Privilégios da Chave)</label>
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="admin">👑 Admin (Acesso Total)</option>
                  <option value="operator">⚙️ Operator (Disparo e Webhooks)</option>
                  <option value="viewer">🛡️ Auditor / Viewer (Somente Leitura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: '#38BDF8', border: 'none', color: '#090D16', fontWeight: 700, cursor: 'pointer' }}
                >
                  Gerar Chave Segura (256-bit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
