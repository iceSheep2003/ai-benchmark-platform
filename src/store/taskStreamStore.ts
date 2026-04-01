import { create } from 'zustand';

interface MetricDataPoint {
  timestamp: number;
  computeUtilization: number;
  memoryBandwidth: number;
  hbmTemperature: number;
  tokenSpeed: number;
  powerConsumption: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
}

interface ClusterNodeMetrics {
  nodeId: string;
  gpuUtil: number;
  memoryUtil: number;
  temperature: number;
  power: number;
}

interface RuntimeNodeStatus {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  elapsedTime: number;
  error?: string;
}

interface TaskStreamState {
  isConnected: boolean;
  currentTaskId: string | null;
  metrics: MetricDataPoint[];
  logs: LogEntry[];
  clusterMetrics: ClusterNodeMetrics[];
  runtimeNodes: RuntimeNodeStatus[];
  
  connect: (taskId: string) => void;
  disconnect: () => void;
  addMetric: (metric: MetricDataPoint) => void;
  addLog: (log: LogEntry) => void;
  updateClusterMetrics: (metrics: ClusterNodeMetrics[]) => void;
  updateRuntimeNode: (nodeId: string, status: Partial<RuntimeNodeStatus>) => void;
  clearData: () => void;
}

export const useTaskStreamStore = create<TaskStreamState>((set) => ({
  isConnected: false,
  currentTaskId: null,
  metrics: [],
  logs: [],
  clusterMetrics: [],
  runtimeNodes: [],

  connect: (taskId: string) => {
    set({ currentTaskId: taskId, isConnected: true });
  },

  disconnect: () => {
    set({ currentTaskId: null, isConnected: false });
  },

  addMetric: (metric: MetricDataPoint) => {
    set((state) => ({
      metrics: [...state.metrics.slice(-99), metric],
    }));
  },

  addLog: (log: LogEntry) => {
    set((state) => ({
      logs: [...state.logs.slice(-999), log],
    }));
  },

  updateClusterMetrics: (metrics: ClusterNodeMetrics[]) => {
    set({ clusterMetrics: metrics });
  },

  updateRuntimeNode: (nodeId: string, status: Partial<RuntimeNodeStatus>) => {
    set((state) => {
      const existingIndex = state.runtimeNodes.findIndex((n) => n.nodeId === nodeId);
      if (existingIndex >= 0) {
        const updated = [...state.runtimeNodes];
        updated[existingIndex] = { ...updated[existingIndex], ...status };
        return { runtimeNodes: updated };
      } else {
        return {
          runtimeNodes: [
            ...state.runtimeNodes,
            { nodeId, status: 'pending', progress: 0, elapsedTime: 0, ...status } as RuntimeNodeStatus,
          ],
        };
      }
    });
  },

  clearData: () => {
    set({ metrics: [], logs: [], clusterMetrics: [], runtimeNodes: [] });
  },
}));
