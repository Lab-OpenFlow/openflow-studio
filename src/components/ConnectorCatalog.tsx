import React from 'react';
import {
  Globe,
  Layers,
  Send,
  Cpu,
  Database,
  Radio,
  Zap,
  GitBranch,
  Clock,
  Plus,
  TableProperties
} from 'lucide-react';
import { StageType } from '../types';

interface ConnectorCatalogProps {
  onAddStage: (type: StageType, name: string) => void;
}

const ITEMS: { type: StageType; name: string; category: string; icon: any; color: string; desc: string }[] = [
  {
    type: 'dmn',
    name: 'DMN Decision Table',
    category: 'Decision & Rules',
    icon: TableProperties,
    color: '#EC4899',
    desc: 'Evaluate declarative decision tables (first, collect, rule_order)'
  },
  {
    type: 'wait_for_signal',
    name: 'Wait for Signal',
    category: 'BPMN Gateways',
    icon: Radio,
    color: '#FBBF24',
    desc: 'Pause until external event / OTP / webhook signal is injected'
  },
  {
    type: 'child_workflow',
    name: 'Child Workflow',
    category: 'Compute',
    icon: GitBranch,
    color: '#8B5CF6',
    desc: 'Execute a reusable sub-workflow and await result'
  },
  {
    type: 'wasm',
    name: 'WASM Plugin Sandbox',
    category: 'Compute',
    icon: Cpu,
    color: '#06B6D4',
    desc: 'Execute zero-trust WebAssembly binaries'
  },
  {
    type: 'http',
    name: 'HTTP / REST API',
    category: 'Protocols',
    icon: Globe,
    color: '#38BDF8',
    desc: 'Call external REST endpoints and Webhooks'
  },
  {
    type: 'kafka',
    name: 'Apache Kafka',
    category: 'Protocols',
    icon: Layers,
    color: '#818CF8',
    desc: 'Publish streaming events to Kafka topics'
  },
  {
    type: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'Protocols',
    icon: Send,
    color: '#FB923C',
    desc: 'Publish AMQP messages to exchanges and queues'
  },
  {
    type: 'grpc',
    name: 'gRPC Microservice',
    category: 'Protocols',
    icon: Zap,
    color: '#F43F5E',
    desc: 'High-speed remote procedure calls'
  },
  {
    type: 'websocket',
    name: 'WebSocket Stream',
    category: 'Protocols',
    icon: Radio,
    color: '#2DD4BF',
    desc: 'Broadcast real-time socket frames'
  },
  {
    type: 'transform',
    name: 'Data Transform',
    category: 'Compute',
    icon: Cpu,
    color: '#A855F7',
    desc: 'Map, calculate & filter payload with Go expressions'
  },
  {
    type: 'database',
    name: 'SQL Database',
    category: 'Storage',
    icon: Database,
    color: '#10B981',
    desc: 'Execute SQL queries, updates & transactions'
  },
  {
    type: 'exclusive_xor',
    name: 'Exclusive XOR Gateway',
    category: 'BPMN Gateways',
    icon: GitBranch,
    color: '#F59E0B',
    desc: 'Conditional routing based on payload expressions'
  },
  {
    type: 'delay',
    name: 'Timer / Delay',
    category: 'BPMN Gateways',
    icon: Clock,
    color: '#64748B',
    desc: 'Pause execution for configured duration'
  }
];

export const ConnectorCatalog: React.FC<ConnectorCatalogProps> = ({ onAddStage }) => {
  return (
    <div style={{
      width: '260px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto',
      padding: '16px 12px'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-dim)',
        marginBottom: '12px',
        paddingLeft: '4px'
      }}>
        Connector Palette
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              onClick={() => onAddStage(item.type, item.name)}
              className="glass-card"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {item.category}
                  </div>
                </div>
              </div>
              <Plus size={14} color="var(--text-muted)" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
