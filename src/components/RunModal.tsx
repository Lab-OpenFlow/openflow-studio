import React, { useState } from 'react';
import { Play, X, Zap, ShieldAlert, AlertTriangle, ArrowRight, Layers, FileCode, Cpu } from 'lucide-react';
import { Workflow } from '../types';

interface RunModalProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (payload: Record<string, any>, variables?: Record<string, any>) => void;
  onDryRun?: (payload: Record<string, any>) => void;
  isRunning: boolean;
}

export const RunModal: React.FC<RunModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onExecute,
  onDryRun,
  isRunning
}) => {
  const getDefaultPayload = () => {
    if (workflow.id === 'pix-crossborder-settlement') {
      return JSON.stringify({
        tx_id: 'TX-PIX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        amount: 2500.00,
        currency: 'USD',
        source_account: 'ACC-BR-9948-12',
        destination_account: 'ACC-US-4819-88',
        source_tax_id: '123.456.789-00',
        destination_tax_id: '98-7654321',
        destination_country: 'USA'
      }, null, 2);
    }
    return JSON.stringify({
      device_id: 'sensor-brazil-01',
      temperature: 92.5,
      timestamp: new Date().toISOString(),
      transaction_id: 'tx_' + Math.random().toString(36).substring(2, 9),
      sender_id: 'acc_alice_987',
      receiver_id: 'acc_bob_123',
      amount: 150.00
    }, null, 2);
  };

  const [payloadText, setPayloadText] = useState(getDefaultPayload);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'payload' | 'variables'>('payload');
  const [variablesText, setVariablesText] = useState('{\n  "environment": "production",\n  "dry_run": false\n}');

  if (!isOpen) return null;

  const handleApplyScenario = (scenarioPayload: Record<string, any>) => {
    setPayloadText(JSON.stringify(scenarioPayload, null, 2));
    setParseError(null);
  };

  const handleDryRunClick = () => {
    try {
      const parsedPayload = JSON.parse(payloadText);
      if (onDryRun) {
        onDryRun(parsedPayload);
        onClose();
      }
    } catch (e: any) {
      setParseError('JSON inválido: ' + e.message);
    }
  };

  const handleRun = () => {
    try {
      const parsedPayload = JSON.parse(payloadText);
      let parsedVariables: Record<string, any> = {};
      try {
        if (variablesText.trim()) {
          parsedVariables = JSON.parse(variablesText);
        }
      } catch (err: any) {
        setParseError('Variáveis JSON inválidas: ' + err.message);
        return;
      }
      setParseError(null);
      onExecute(parsedPayload, parsedVariables);
      onClose();
    } catch (e: any) {
      setParseError('JSON inválido: ' + e.message);
    }
  };

  return (
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
        width: '680px',
        maxWidth: '100%',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Play size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Disparar Execução de Workflow
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {workflow.name} ({workflow.id})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Scenario Buttons */}
          {workflow.id === 'pix-crossborder-settlement' && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Cenários de Teste Bancário Rápido:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyScenario({
                    tx_id: 'TX-PIX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    amount: 2500.00,
                    currency: 'USD',
                    source_account: 'ACC-BR-9948-12',
                    destination_account: 'ACC-US-4819-88',
                    source_tax_id: '123.456.789-00',
                    destination_tax_id: '98-7654321',
                    destination_country: 'USA'
                  })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  ⚡ Padrão: $2.500 USD (Sucesso Total)
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario({
                    tx_id: 'TX-PIX-DOMESTIC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    amount: 500.00,
                    currency: 'BRL',
                    source_account: 'ACC-BR-1111-22',
                    destination_account: 'ACC-BR-3333-44',
                    source_tax_id: '123.456.789-00',
                    destination_tax_id: '987.654.321-00',
                    destination_country: 'BRA'
                  })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🇧🇷 PIX Nacional (Sem Câmbio FX)
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario({
                    tx_id: 'TX-PIX-EXCEED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    amount: 250000.00,
                    currency: 'USD',
                    source_account: 'ACC-BR-9948-12',
                    destination_account: 'ACC-US-4819-88',
                    source_tax_id: '123.456.789-00',
                    destination_tax_id: '98-7654321',
                    destination_country: 'USA'
                  })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🛑 Limite Excedido: $250.000 (Rejeição)
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyScenario({
                    tx_id: 'TX-PIX-AML-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    amount: 15000.00,
                    currency: 'USD',
                    source_account: 'ACC-BR-FRAUD-99',
                    destination_account: 'ACC-KYC-WATCHLIST-01',
                    source_tax_id: '000.000.000-99',
                    destination_tax_id: '99-9999999',
                    destination_country: 'IRN'
                  })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🚨 Alerta Fraude AML (Retenção Manual)
                </button>
              </div>
            </div>
          )}

          {/* JSON Payload Editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                Payload de Entrada (JSON):
              </label>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                application/json
              </span>
            </div>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={9}
              style={{
                width: '100%',
                background: '#090d16',
                border: parseError ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '12px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            {parseError && (
              <div style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
                {parseError}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
                    {onDryRun && (
            <button
              onClick={handleDryRunClick}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FBBF24',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Cpu size={15} />
              Simular (Dry-Run)
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Play size={16} fill="#fff" />
            {isRunning ? 'Executando...' : 'Iniciar Execução'}
          </button>
        </div>
      </div>
    </div>
  );
};
