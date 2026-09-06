import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { Save, AlertCircle, Check } from 'lucide-react';
import { Workflow } from '../types';

interface YamlEditorProps {
  workflow: Workflow;
  onSaveWorkflow: (updated: Workflow) => void;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({ workflow, onSaveWorkflow }) => {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const dump = yaml.dump(workflow, { indent: 2 });
      setYamlContent(dump);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [workflow]);

  const handleSave = () => {
    try {
      const parsed = yaml.load(yamlContent) as Workflow;
      if (!parsed.id || !parsed.stages) {
        throw new Error('Invalid workflow: missing "id" or "stages"');
      }
      onSaveWorkflow(parsed);
      setError(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: 'calc(100vh - 64px)',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Declarative YAML Specification ({workflow.id})
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            background: savedSuccess ? '#10B981' : '#38BDF8',
            color: '#090D16',
            fontWeight: 700,
            fontSize: '0.82rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {savedSuccess ? <Check size={15} /> : <Save size={15} />}
          {savedSuccess ? 'Saved & Synced!' : 'Apply YAML'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#F43F5E',
          fontSize: '0.75rem',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Editor textarea */}
      <textarea
        value={yamlContent}
        onChange={(e) => setYamlContent(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: '#38BDF8',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          lineHeight: '1.5',
          padding: '16px',
          resize: 'none',
          outline: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};
