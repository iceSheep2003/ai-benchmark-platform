import { useTaskStreamStore } from '../store/taskStreamStore';

let intervalId: ReturnType<typeof setInterval> | null = null;
let logIntervalId: ReturnType<typeof setInterval> | null = null;
let clusterIntervalId: ReturnType<typeof setInterval> | null = null;

const LOG_MESSAGES = [
  'Processing batch {batchId}',
  'Loading model weights',
  'Initializing CUDA context',
  'Starting inference',
  'Batch completed successfully',
  'Memory allocation: {memory} GB',
  'GPU utilization: {util}%',
  'Token generation speed: {speed} tokens/s',
  'Temperature: {temp}°C',
  'Power consumption: {power}W',
  'Checkpoint saved',
  'Validation passed',
];

const ERROR_MESSAGES = [
  'CUDA out of memory',
  'Kernel launch failed',
  'NCCL communication error',
  'Timeout waiting for GPU',
  'Memory allocation failed',
];

const NODE_IDS = ['data_loader', 'model_inference', 'resource_alloc', 'evaluator', 'reporter'];

export const startWebSocketMock = () => {
  if (intervalId) {
    stopWebSocketMock();
  }

  const { addMetric, addLog, updateClusterMetrics, updateRuntimeNode } = useTaskStreamStore.getState();

  intervalId = setInterval(() => {
    const metric = {
      timestamp: Date.now(),
      computeUtilization: 60 + Math.random() * 35,
      memoryBandwidth: 400 + Math.random() * 600,
      hbmTemperature: 65 + Math.random() * 20,
      tokenSpeed: 2000 + Math.random() * 1000,
      powerConsumption: 300 + Math.random() * 200,
    };
    addMetric(metric);

    const clusterMetrics = Array.from({ length: 8 }, (_, i) => ({
      nodeId: `gpu-${i}`,
      gpuUtil: 60 + Math.random() * 35,
      memoryUtil: 40 + Math.random() * 40,
      temperature: 65 + Math.random() * 20,
      power: 300 + Math.random() * 200,
    }));
    updateClusterMetrics(clusterMetrics);

    NODE_IDS.forEach((nodeId, index) => {
      const progress = Math.min(100, (Date.now() % 10000) / 100 + index * 20);
      const elapsedTime = (Date.now() % 30000) / 1000;
      updateRuntimeNode(nodeId, {
        status: progress >= 100 ? 'completed' : 'running',
        progress,
        elapsedTime,
      });
    });
  }, 1000);

  logIntervalId = setInterval(() => {
    const isError = Math.random() > 0.98;
    const isWarning = Math.random() > 0.85;

    const template = isError
      ? ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]
      : LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];

    const message = template
      .replace('{batchId}', Math.floor(Math.random() * 10000).toString())
      .replace('{memory}', (40 + Math.random() * 20).toFixed(1))
      .replace('{util}', (60 + Math.random() * 35).toFixed(1))
      .replace('{speed}', (2000 + Math.random() * 1000).toFixed(0))
      .replace('{temp}', (65 + Math.random() * 20).toFixed(1))
      .replace('{power}', (300 + Math.random() * 200).toFixed(0));

    const log = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level: (isError ? 'ERROR' : isWarning ? 'WARNING' : 'INFO') as 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG',
      message,
    };
    addLog(log);
  }, 500);

  clusterIntervalId = setInterval(() => {
    const clusterMetrics = Array.from({ length: 8 }, (_, i) => ({
      nodeId: `gpu-${i}`,
      gpuUtil: Math.max(0, Math.min(100, 60 + Math.random() * 35)),
      memoryUtil: Math.max(0, Math.min(100, 40 + Math.random() * 40)),
      temperature: Math.max(50, Math.min(90, 65 + Math.random() * 20)),
      power: Math.max(200, Math.min(500, 300 + Math.random() * 200)),
    }));
    updateClusterMetrics(clusterMetrics);
  }, 2000);
};

export const stopWebSocketMock = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (logIntervalId) {
    clearInterval(logIntervalId);
    logIntervalId = null;
  }
  if (clusterIntervalId) {
    clearInterval(clusterIntervalId);
    clusterIntervalId = null;
  }
};
