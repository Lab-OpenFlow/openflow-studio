import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Link,
  ArrowRight
} from 'lucide-react';
import { Workflow, Stage, Execution, StepExecution } from '../types';

interface CanvasProps {
  workflow: Workflow;
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage | null) => void;
  activeExecution: Execution | null;
  onUpdateStagePosition: (stageId: string, x: number, y: number) => void;
  onConnectStages?: (sourceId: string, targetId: string) => void;
  onDeleteConnection?: (sourceId: string, targetId: string) => void;
}

const getStageIcon = (type: string) => {
  switch (type) {
    case 'http': return Globe;
    case 'kafka': return Layers;
    case 'rabbitmq': return Send;
    case 'grpc': return Zap;
    case 'websocket': return Radio;
    case 'transform': return Cpu;
    case 'database': return Database;
    case 'exclusive_xor': return GitBranch;
    case 'parallel_fork': return GitBranch;
    case 'parallel_join': return Layers;
    case 'delay': return Clock;
    case 'wait_for_signal': return Radio;
    case 'child_workflow': return GitBranch;
    case 'wasm': return Cpu;
    default: return Cpu;
  }
};

const getStageColor = (type: string) => {
  switch (type) {
    case 'http': return '#38BDF8';
    case 'kafka': return '#818CF8';
    case 'rabbitmq': return '#FB923C';
    case 'grpc': return '#F43F5E';
    case 'websocket': return '#2DD4BF';
    case 'transform': return '#A855F7';
    case 'database': return '#10B981';
    case 'exclusive_xor': return '#F59E0B';
    case 'parallel_fork': return '#EC4899';
    case 'parallel_join': return '#6366F1';
    case 'delay': return '#94A3B8';
    case 'wait_for_signal': return '#FBBF24';
    case 'child_workflow': return '#8B5CF6';
    case 'wasm': return '#06B6D4';
    default: return '#38BDF8';
  }
};

function computeDAGLayout(workflow: Workflow): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  if (!workflow.stages || workflow.stages.length === 0) return positions;

  const stageMap = new Map<string, Stage>();
  const childrenMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  workflow.stages.forEach((s) => {
    stageMap.set(s.id, s);
    childrenMap.set(s.id, []);
    inDegree.set(s.id, 0);
  });

  workflow.stages.forEach((s) => {
    const targets = new Set<string>();
    if (s.next) s.next.forEach((t) => targets.add(t));
    if (s.branches) s.branches.forEach((b) => b.target && targets.add(b.target));

    targets.forEach((targetId) => {
      if (childrenMap.has(s.id)) {
        childrenMap.get(s.id)!.push(targetId);
      }
      if (inDegree.has(targetId)) {
        inDegree.set(targetId, inDegree.get(targetId)! + 1);
      }
    });
  });

  const levels: Record<string, number> = {};
  const startId = workflow.start_at || workflow.stages[0]?.id;

  const queue: { id: string; level: number }[] = [];
  if (startId && stageMap.has(startId)) {
    queue.push({ id: startId, level: 0 });
    levels[startId] = 0;
  } else {
    workflow.stages.forEach((s) => {
      if ((inDegree.get(s.id) || 0) === 0) {
        queue.push({ id: s.id, level: 0 });
        levels[s.id] = 0;
      }
    });
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      const currLevel = levels[childId] ?? 0;
      const nextLevel = Math.max(currLevel, level + 1);
      levels[childId] = nextLevel;
      queue.push({ id: childId, level: nextLevel });
    });
  }

  let maxAssignedLevel = 0;
  Object.values(levels).forEach((l) => { if (l > maxAssignedLevel) maxAssignedLevel = l; });
  workflow.stages.forEach((s) => {
    if (levels[s.id] === undefined) {
      maxAssignedLevel++;
      levels[s.id] = maxAssignedLevel;
    }
  });

  const levelGroups: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, lvl]) => {
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(id);
  });

  const HORIZONTAL_GAP = 320;
  const VERTICAL_GAP = 140;
  const START_X = 140;
  const START_Y = 160;

  Object.entries(levelGroups).forEach(([lvlStr, nodeIds]) => {
    const lvl = parseInt(lvlStr, 10);
    const count = nodeIds.length;
    nodeIds.forEach((nodeId, idx) => {
      const x = START_X + lvl * HORIZONTAL_GAP;
      const yOffset = (idx - (count - 1) / 2) * VERTICAL_GAP;
      const y = Math.max(60, START_Y + yOffset);
      positions[nodeId] = { x, y };
    });
  });

  return positions;
}

export const Canvas: React.FC<CanvasProps> = ({
  workflow,
  selectedStage,
  onSelectStage,
  activeExecution,
  onUpdateStagePosition,
  onConnectStages,
  onDeleteConnection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingStageId, setDraggingStageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Interactive connection state
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect ? rect.left : 0;
    const top = rect ? rect.top : 0;
    return {
      x: (clientX - left - pan.x) / zoom,
      y: (clientY - top - pan.y) / zoom
    };
  };

  const autoPositions = useMemo(() => computeDAGLayout(workflow), [workflow]);

  const getStagePosition = (stage: Stage) => {
    if (localPositions[stage.id]) return localPositions[stage.id];
    if (stage.ui?.x !== undefined && stage.ui?.y !== undefined && stage.ui.x !== 0 && stage.ui.y !== 0) {
      return { x: stage.ui.x, y: stage.ui.y };
    }
    return autoPositions[stage.id] || { x: 100, y: 100 };
  };

  const getStepStatus = (stageId: string): string | null => {
    if (!activeExecution || !activeExecution.steps) return null;
    const step = activeExecution.steps.find((s) => s.stage_id === stageId && !s.is_compensation);
    return step ? step.status : null;
  };

  const handleFitView = () => {
    if (!workflow.stages || workflow.stages.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    workflow.stages.forEach((s) => {
      const pos = getStagePosition(s);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + 240);
      maxY = Math.max(maxY, pos.y + 100);
    });

    const cWidth = containerRef.current?.clientWidth || 1000;
    const cHeight = containerRef.current?.clientHeight || 600;
    const graphWidth = Math.max(maxX - minX + 160, 400);
    const graphHeight = Math.max(maxY - minY + 160, 300);

    const scaleX = cWidth / graphWidth;
    const scaleY = cHeight / graphHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY) * 0.85, 0.35), 1.2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: cWidth / 2 - centerX * newZoom,
      y: cHeight / 2 - centerY * newZoom
    });
  };

  const handleAutoLayoutAll = () => {
    const layout = computeDAGLayout(workflow);
    setLocalPositions(layout);
    Object.entries(layout).forEach(([id, pos]) => {
      onUpdateStagePosition(id, pos.x, pos.y);
    });
    setTimeout(handleFitView, 50);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (connectingFromId) {
      setConnectingFromId(null);
    }
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleStageMouseDown = (e: React.MouseEvent, stage: Stage) => {
    e.stopPropagation();
    onSelectStage(stage);
    if (connectingFromId) {
      if (connectingFromId !== stage.id && onConnectStages) {
        onConnectStages(connectingFromId, stage.id);
      }
      setConnectingFromId(null);
      return;
    }

    const pos = getStagePosition(stage);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDragOffset({ x: coords.x - pos.x, y: coords.y - pos.y });
    setDraggingStageId(stage.id);
  };

  const handleStartConnect = (e: React.MouseEvent, stageId: string) => {
    e.stopPropagation();
    if (connectingFromId === stageId) {
      // Toggle off if clicking the same port again
      setConnectingFromId(null);
      return;
    }
    if (connectingFromId) {
      if (onConnectStages) {
        onConnectStages(connectingFromId, stageId);
      }
      setConnectingFromId(null);
      return;
    }
    setConnectingFromId(stageId);
  };

  const handleInPortClick = (e: React.MouseEvent, targetStageId: string) => {
    e.stopPropagation();
    if (connectingFromId && connectingFromId !== targetStageId) {
      if (onConnectStages) {
        onConnectStages(connectingFromId, targetStageId);
      }
      setConnectingFromId(null);
    }
  };

  // Escape key to cancel connection or deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFromId(null);
        onSelectStage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSelectStage]);

  // Window mouse move / up for drag, pan & connection line
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setMousePos(coords);

      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      } else if (draggingStageId) {
        const newX = Math.max(20, Math.round((coords.x - dragOffset.x) / 10) * 10);
        const newY = Math.max(20, Math.round((coords.y - dragOffset.y) / 10) * 10);
        setLocalPositions((prev) => ({ ...prev, [draggingStageId]: { x: newX, y: newY } }));
      }
    };

    const onWindowMouseUp = () => {
      if (draggingStageId) {
        const finalPos = localPositions[draggingStageId];
        if (finalPos) {
          onUpdateStagePosition(draggingStageId, finalPos.x, finalPos.y);
        }
        setDraggingStageId(null);
      }
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [draggingStageId, isPanning, panStart, pan.x, pan.y, zoom, dragOffset, localPositions, onUpdateStagePosition]);

  return (
    <div
      ref={containerRef}
      className="grid-background"
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={(e) => {
        if (connectingFromId) {
          e.preventDefault();
          setConnectingFromId(null);
        }
      }}
      onClick={() => {
        if (connectingFromId) {
          setConnectingFromId(null);
        }
      }}
      style={{
        flex: 1,
        height: 'calc(100vh - 64px)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : draggingStageId ? 'grabbing' : connectingFromId ? 'crosshair' : 'grab',
        userSelect: 'none'
      }}
    >
      {/* Floating Canvas Navigation Toolbar */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        padding: '6px 10px',
        borderRadius: '10px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        {connectingFromId && (
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#FBBF24',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Link size={13} />
            <span>Click any target node to connect</span>
            <button
              onClick={() => setConnectingFromId(null)}
              style={{ background: 'none', border: 'none', color: '#FBBF24', cursor: 'pointer', fontWeight: 800, marginLeft: '4px' }}
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          style={{
            padding: '6px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#38BDF8',
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
          style={{
            padding: '6px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={handleFitView}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38BDF8',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Fit entire workflow to view"
        >
          <Maximize2 size={14} />
          Fit View
        </button>

        <button
          onClick={handleAutoLayoutAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            border: 'none',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Automatically arrange graph nodes into a clean topological DAG layout"
        >
          <Sparkles size={14} />
          Auto-Layout
        </button>
      </div>

      {/* TRANSFORM CONTAINER (Pan & Zoom Matrix) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '8000px',
          height: '4000px',
          pointerEvents: 'auto'
        }}
      >
        {/* SVG Canvas for Connecting Edges */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '8000px',
            height: '4000px',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-hover"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#F43F5E" />
            </marker>
          </defs>

          {/* Start Connection */}
          {workflow.stages.length > 0 && (() => {
            const startStage = workflow.stages.find((s) => s.id === workflow.start_at) || workflow.stages[0];
            const pos = getStagePosition(startStage);
            const sx = 60;
            const sy = 180;
            const tx = pos.x;
            const ty = pos.y + 38;
            return (
              <path
                d={`M ${sx} ${sy} C ${sx + 60} ${sy}, ${tx - 60} ${ty}, ${tx} ${ty}`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#arrow-active)"
              />
            );
          })()}

          {/* Active Live Dragging Connection Line */}
          {connectingFromId && (() => {
            const srcStage = workflow.stages.find((s) => s.id === connectingFromId);
            if (!srcStage) return null;
            const srcPos = getStagePosition(srcStage);
            const sx = srcPos.x + 240;
            const sy = srcPos.y + 38;
            const tx = mousePos.x;
            const ty = mousePos.y;
            const dx = Math.max(Math.abs(tx - sx) * 0.5, 40);
            return (
              <path
                d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3"
                strokeDasharray="6 4"
                markerEnd="url(#arrow-active)"
              />
            );
          })()}

          {/* Inter-stage Connections */}
          {workflow.stages.map((stage) => {
            const srcPos = getStagePosition(stage);
            const sx = srcPos.x + 240;
            const sy = srcPos.y + 38;

            const targets = stage.next ? [...stage.next] : [];
            if (stage.branches) {
              stage.branches.forEach((b) => {
                if (b.target && !targets.includes(b.target)) {
                  targets.push(b.target);
                }
              });
            }

            return targets.map((targetId) => {
              const targetStage = workflow.stages.find((s) => s.id === targetId);
              if (!targetStage) return null;

              const targetPos = getStagePosition(targetStage);
              const tx = targetPos.x;
              const ty = targetPos.y + 38;

              const isStepActive = !!getStepStatus(stage.id) && !!getStepStatus(targetStage.id);
              const edgeKey = `${stage.id}->${targetId}`;
              const isHovered = hoveredEdge === edgeKey;

              const midX = (sx + tx) / 2;
              const midY = (sy + ty) / 2;

              return (
                <g
                  key={edgeKey}
                  onMouseEnter={() => setHoveredEdge(edgeKey)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  <path
                    d={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    stroke={isHovered ? '#F43F5E' : isStepActive ? '#38BDF8' : '#475569'}
                    strokeWidth={isHovered ? '3.5' : isStepActive ? '2.5' : '2'}
                    markerEnd={isHovered ? 'url(#arrow-hover)' : isStepActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                  />

                  {/* Flow Particle on active execution */}
                  {isStepActive && (
                    <circle r="4" fill="#38BDF8">
                      <animateMotion
                        path={`M ${sx} ${sy} C ${sx + 80} ${sy}, ${tx - 80} ${ty}, ${tx} ${ty}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Delete Link Button on Hover */}
                  {isHovered && onDeleteConnection && (
                    <g
                      transform={`translate(${midX - 10}, ${midY - 10})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConnection(stage.id, targetId);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="10" cy="10" r="10" fill="#F43F5E" />
                      <text x="10" y="14" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">✕</text>
                    </g>
                  )}
                </g>
              );
            });
          })}
        </svg>

        {/* BPMN Start Event Circle */}
        <div
          style={{
            position: 'absolute',
            left: '20px',
            top: '160px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            border: '2px solid rgba(255,255,255,0.8)'
          }}
          title="Workflow Start Trigger"
        >
          <Play size={18} color="#fff" style={{ marginLeft: '2px' }} />
        </div>

        {/* STAGE NODES */}
        {workflow.stages.map((stage) => {
          const pos = getStagePosition(stage);
          const Icon = getStageIcon(stage.type);
          const color = getStageColor(stage.type);
          const isSelected = selectedStage?.id === stage.id;
          const status = getStepStatus(stage.id);
          const step = activeExecution?.steps?.find((s) => s.stage_id === stage.id);
          const isConnectingFromThis = connectingFromId === stage.id;

          return (
            <div
              key={stage.id}
              onMouseDown={(e) => handleStageMouseDown(e, stage)}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: '240px',
                borderRadius: '12px',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))'
                  : 'rgba(15, 23, 42, 0.9)',
                border: isSelected
                  ? '2px solid #38BDF8'
                  : isConnectingFromThis
                  ? '2px dashed #FBBF24'
                  : '1px solid var(--border-color)',
                boxShadow: isSelected
                  ? '0 0 25px rgba(56, 189, 248, 0.35)'
                  : status === 'RUNNING'
                  ? '0 0 20px rgba(56, 189, 248, 0.5)'
                  : '0 4px 16px rgba(0, 0, 0, 0.4)',
                cursor: draggingStageId === stage.id ? 'grabbing' : 'grab',
                zIndex: isSelected ? 20 : 10,
                backdropFilter: 'blur(10px)',
                transition: draggingStageId === stage.id ? 'none' : 'box-shadow 0.15s ease'
              }}
            >
                            {/* RETRY BADGE IF ATTEMPTS > 1 */}
              {step && step.attempts > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '10px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#090D16',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  zIndex: 30
                }}>
                  <RotateCcw size={10} /> Tentativa {step.attempts}
                </div>
              )}

              {/* IN-PORT (Left Connector Handle) */}
              <div
                onClick={(e) => handleInPortClick(e, stage.id)}
                title="Connect from previous stage"
                style={{
                  position: 'absolute',
                  left: '-9px',
                  top: 'calc(50% - 9px)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: connectingFromId && connectingFromId !== stage.id ? '#10B981' : '#1e293b',
                  border: '2px solid #64748b',
                  boxShadow: connectingFromId && connectingFromId !== stage.id ? '0 0 10px #10B981' : 'none',
                  cursor: 'pointer',
                  zIndex: 25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
              </div>

              {/* OUT-PORT (Right Connector Handle - Output only) */}
              <div
                onClick={(e) => {
                  if (connectingFromId && connectingFromId !== stage.id) {
                    // Connect to this stage's input when clicked on card
                    e.stopPropagation();
                    if (onConnectStages) onConnectStages(connectingFromId, stage.id);
                    setConnectingFromId(null);
                    return;
                  }
                  handleStartConnect(e, stage.id);
                }}
                title={isConnectingFromThis ? "Connecting... click target node" : "Draw connection to next stage"}
                style={{
                  position: 'absolute',
                  right: '-9px',
                  top: 'calc(50% - 9px)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isConnectingFromThis ? '#FBBF24' : '#0284c7',
                  border: isConnectingFromThis ? '2px solid #FEF08A' : '2px solid #38BDF8',
                  boxShadow: isConnectingFromThis ? '0 0 14px #FBBF24' : '0 0 10px rgba(56, 189, 248, 0.5)',
                  cursor: isConnectingFromThis ? 'pointer' : 'crosshair',
                  zIndex: 25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: connectingFromId && !isConnectingFromThis ? 'none' : 'auto'
                }}
              >
                <Plus size={12} color="#fff" />
              </div>

              {/* Card Header */}
              <div style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: color, fontWeight: 600, textTransform: 'uppercase' }}>
                      {stage.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {status && (
                  <div>
                    {status === 'COMPLETED' && <CheckCircle2 size={16} color="#10B981" />}
                    {status === 'RUNNING' && <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' }} />}
                    {status === 'FAILED' && <XCircle size={16} color="#F43F5E" />}
                    {status === 'COMPENSATING' && <RotateCcw size={16} color="#F59E0B" />}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '8px 14px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b' }}>
                  ID: {stage.id}
                </div>
                {step && step.error && (
                  <div style={{ marginTop: '4px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', color: '#F87171', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.error}
                  </div>
                )}
                {stage.next && stage.next.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#38BDF8', fontSize: '0.68rem', fontWeight: 600 }}>
                    <ArrowRight size={11} /> Next: {stage.next.join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
