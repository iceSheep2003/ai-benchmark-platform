import { create } from 'zustand';
import type { WorkflowDefinition, OrchestratorStore } from '../types/workflow';
import { workflowToYaml, yamlToWorkflow, flowToWorkflow, cloneWorkflow } from '../utils/transformers';
import { validateWorkflowDefinition, hasCriticalErrors } from '../utils/validator';
import { mockWorkflowTemplates } from '../mockData/workflowTemplates';


const defaultWorkflow: WorkflowDefinition = {
  version: '1.0',
  metadata: {
    name: 'New Workflow',
    description: '',
    author: 'user',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  globals: {},
  nodes: [],
  edges: [],
  executionConfig: {
    timeoutSeconds: 3600,
    retryCount: 3,
    parallelism: 4,
  },
};

export const useOrchestratorStore = create<OrchestratorStore>((set, get) => ({
  workflow: defaultWorkflow,
  rawYaml: workflowToYaml(defaultWorkflow),
  viewMode: 'visual',
  errors: [],
  history: [cloneWorkflow(defaultWorkflow)],
  historyIndex: 0,
  selectedNodeId: null,
  isDirty: false,
  isLoading: false,

  setWorkflow: (workflow) => {
    const rawYaml = workflowToYaml(workflow);
    const errors = validateWorkflowDefinition(workflow);
    set({ workflow, rawYaml, errors, isDirty: true });
  },

  setRawYaml: (yaml) => {
    set({ rawYaml: yaml, isDirty: true });
  },

  setViewMode: (mode) => {
    const { rawYaml } = get();
    
    if (mode === 'visual') {
      try {
        const parsedWorkflow = yamlToWorkflow(rawYaml);
        const errors = validateWorkflowDefinition(parsedWorkflow);
        
        if (hasCriticalErrors(errors)) {
          set({ errors });
          return;
        }
        
        set({ workflow: parsedWorkflow, viewMode: mode, errors });
      } catch (error) {
        console.error('Failed to parse YAML:', error);
        set({ 
          errors: [{
            path: '',
            message: 'Failed to parse YAML. Please fix syntax errors before switching to visual mode.',
            severity: 'error',
          }],
        });
        return;
      }
    } else {
      set({ viewMode: mode });
    }
  },

  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  updateFromVisual: (nodes, edges) => {
    const { workflow } = get();
    if (!workflow) return;
    
    try {
      const updatedWorkflow = flowToWorkflow(nodes, edges, workflow);
      const rawYaml = workflowToYaml(updatedWorkflow);
      const errors = validateWorkflowDefinition(updatedWorkflow);
      
      set({ 
        workflow: updatedWorkflow, 
        rawYaml, 
        errors,
        isDirty: true 
      });
    } catch (error) {
      console.error('Failed to update from visual:', error);
    }
  },

  updateFromCode: (yaml) => {
    try {
      const parsedWorkflow = yamlToWorkflow(yaml);
      const errors = validateWorkflowDefinition(parsedWorkflow);
      
      set({ 
        workflow: parsedWorkflow, 
        rawYaml: yaml, 
        errors,
        isDirty: true 
      });
    } catch (error) {
      console.error('Failed to update from code:', error);
      set({ 
        rawYaml: yaml,
        errors: [{
          path: '',
          message: error instanceof Error ? error.message : 'Failed to parse YAML',
          severity: 'error',
        }],
      });
    }
  },

  updateNodeConfig: (nodeId, config) => {
    const { workflow } = get();
    if (!workflow) return;
    
    const updatedNodes = workflow.nodes.map((node) => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, config } }
        : node
    );
    
    const updatedWorkflow: WorkflowDefinition = { 
      ...workflow, 
      nodes: updatedNodes,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    const rawYaml = workflowToYaml(updatedWorkflow);
    const errors = validateWorkflowDefinition(updatedWorkflow);
    
    set({ 
      workflow: updatedWorkflow, 
      rawYaml, 
      errors,
      isDirty: true 
    });
  },

  validateWorkflow: () => {
    const { workflow } = get();
    if (!workflow) return [];
    
    const errors = validateWorkflowDefinition(workflow);
    set({ errors });
    return errors;
  },

  saveVersion: async (_changeLog) => {
    const { workflow, history, historyIndex } = get();
    if (!workflow) return;
    
    set({ isLoading: true });
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newHistory = history.slice(0, historyIndex + 1);
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    newHistory.push(newWorkflow);
    
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1,
      isDirty: false,
      isLoading: false,
    });
  },

  loadTemplate: (templateId) => {
    const template = mockWorkflowTemplates.find((t: any) => t.id === templateId);
    
    if (template) {
      const workflow = cloneWorkflow(template.workflow);
      const rawYaml = workflowToYaml(workflow);
      const errors = validateWorkflowDefinition(workflow);
      
      const newHistory = [...get().history, workflow];
      
      set({ 
        workflow, 
        rawYaml, 
        errors,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: false,
      });
    }
  },

  undo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const workflow = cloneWorkflow(history[newIndex]);
      const rawYaml = workflowToYaml(workflow);
      const errors = validateWorkflowDefinition(workflow);
      
      set({ 
        workflow, 
        rawYaml, 
        errors,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const workflow = cloneWorkflow(history[newIndex]);
      const rawYaml = workflowToYaml(workflow);
      const errors = validateWorkflowDefinition(workflow);
      
      set({ 
        workflow, 
        rawYaml, 
        errors,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  exportWorkflow: () => {
    const { rawYaml, workflow } = get();
    if (!workflow) return;
    
    const filename = `${workflow.metadata.name.replace(/\s+/g, '_')}.yaml`;
    
    const blob = new Blob([rawYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importWorkflow: async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        try {
          const workflow = yamlToWorkflow(content);
          const rawYaml = workflowToYaml(workflow);
          const errors = validateWorkflowDefinition(workflow);
          
          const newHistory = [...get().history, workflow];
          
          set({ 
            workflow, 
            rawYaml, 
            errors,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: false,
          });
          
          resolve(true);
        } catch (error) {
          console.error('Failed to import workflow:', error);
          set({
            errors: [{
              path: '',
              message: 'Failed to import workflow. Invalid YAML format.',
              severity: 'error',
            }],
          });
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  },
}));