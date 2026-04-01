import { create } from 'zustand';
import type { EditorState, ConfigTemplate, ConfigVersion, TemplateFilter } from '../types/config';
import { mockTemplates, defaultTemplateContent } from '../mockData/templates';
import { validateConfig } from '../utils/schema';
import * as yaml from 'js-yaml';

interface ConfigStore extends EditorState {
  templates: ConfigTemplate[];
  selectedTemplate: ConfigTemplate | null;
  selectedVersion: ConfigVersion | null;
  filter: TemplateFilter;
  setMode: (mode: 'visual' | 'code') => void;
  setFormat: (format: 'json' | 'yaml') => void;
  setContent: (content: string) => void;
  setParsedConfig: (config: any) => void;
  setValidationErrors: (errors: any[]) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setTemplates: (templates: ConfigTemplate[]) => void;
  setSelectedTemplate: (template: ConfigTemplate | null) => void;
  setSelectedVersion: (version: ConfigVersion | null) => void;
  setFilter: (filter: TemplateFilter) => void;
  saveTemplate: (metadata: { name: string; description: string; tags: string[] }) => void;
  loadTemplate: (templateId: string, versionId?: string) => void;
  deleteTemplate: (templateId: string) => void;
  createNewVersion: (templateId: string, changeLog: string) => void;
  exportConfig: () => string;
  importConfig: (content: string, format: 'json' | 'yaml') => boolean;
  formatContent: () => string;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  mode: 'visual',
  currentFormat: 'json',
  rawContent: defaultTemplateContent,
  parsedConfig: null,
  validationErrors: [],
  selectedTemplateId: null,
  isDirty: false,
  templates: mockTemplates,
  selectedTemplate: null,
  selectedVersion: null,
  filter: {
    search: '',
    tags: [],
  },

  setMode: (mode) => set({ mode, isDirty: true }),
  
  setFormat: (format) => {
    const { rawContent } = get();
    let newContent = rawContent;
    
    if (format === 'yaml') {
      try {
        const parsed = JSON.parse(rawContent);
        newContent = yaml.dump(parsed, { indent: 2 });
      } catch (error) {
        console.error('Failed to convert to YAML:', error);
      }
    } else {
      try {
        const parsed = yaml.load(rawContent);
        newContent = JSON.stringify(parsed, null, 2);
      } catch (error) {
        console.error('Failed to convert to JSON:', error);
      }
    }
    
    set({ currentFormat: format, rawContent: newContent, isDirty: true });
  },

  setContent: (content) => {
    set({ rawContent: content, isDirty: true });
    
    try {
      const parsed = JSON.parse(content);
      const errors = validateConfig(parsed);
      set({ parsedConfig: parsed, validationErrors: errors });
    } catch (error) {
      set({ parsedConfig: null, validationErrors: [{ 
        line: 0, 
        column: 0, 
        message: 'Invalid JSON format', 
        severity: 'error' 
      }] });
    }
  },

  setParsedConfig: (config) => set({ parsedConfig: config }),
  
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  
  setTemplates: (templates) => set({ templates }),
  
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setSelectedVersion: (version) => set({ selectedVersion: version }),
  
  setFilter: (filter) => set({ filter }),

  saveTemplate: ({ name, description, tags }) => {
    const { templates, rawContent, currentFormat } = get();
    
    const existingTemplate = templates.find((t) => t.name === name);
    
    if (existingTemplate) {
      const updatedTemplates = templates.map((t) => {
        if (t.id === existingTemplate.id) {
          const newVersion: ConfigVersion = {
            versionId: `ver-${existingTemplate.id}-${Date.now()}`,
            versionNumber: getNextVersionNumber(existingTemplate.versions),
            content: rawContent,
            format: currentFormat,
            changeLog: `Updated configuration`,
            author: 'user',
            createdAt: new Date().toISOString(),
          };
          return {
            ...t,
            description,
            tags,
            updatedAt: new Date().toISOString(),
            versions: [...t.versions, newVersion],
          };
        }
        return t;
      });
      set({ templates: updatedTemplates, isDirty: false });
    } else {
      const newTemplate: ConfigTemplate = {
        id: `tpl-${Date.now()}`,
        name,
        description,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [
          {
            versionId: `ver-${Date.now()}`,
            versionNumber: '1.0',
            content: rawContent,
            format: currentFormat,
            changeLog: 'Initial version',
            author: 'user',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      set({ templates: [...templates, newTemplate], isDirty: false });
    }
  },

  loadTemplate: (templateId, versionId) => {
    const { templates } = get();
    const template = templates.find((t) => t.id === templateId);
    
    if (template) {
      const version = versionId 
        ? template.versions.find((v) => v.versionId === versionId)
        : template.versions[template.versions.length - 1];
      
      if (version) {
        set({ 
          rawContent: version.content, 
          currentFormat: version.format,
          selectedTemplate: template,
          selectedVersion: version,
          selectedTemplateId: templateId,
          isDirty: false 
        });
        
        try {
          const parsed = JSON.parse(version.content);
          const errors = validateConfig(parsed);
          set({ parsedConfig: parsed, validationErrors: errors });
        } catch (error) {
          set({ parsedConfig: null, validationErrors: [{ 
            line: 0, 
            column: 0, 
            message: 'Invalid JSON format', 
            severity: 'error' 
          }] });
        }
      }
    }
  },

  deleteTemplate: (templateId) => {
    const { templates, selectedTemplateId } = get();
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    set({ 
      templates: updatedTemplates,
      selectedTemplate: selectedTemplateId === templateId ? null : get().selectedTemplate,
      selectedTemplateId: selectedTemplateId === templateId ? null : get().selectedTemplateId,
    });
  },

  createNewVersion: (templateId, changeLog) => {
    const { templates, rawContent, currentFormat } = get();
    const template = templates.find((t) => t.id === templateId);
    
    if (template) {
      const newVersion: ConfigVersion = {
        versionId: `ver-${templateId}-${Date.now()}`,
        versionNumber: getNextVersionNumber(template.versions),
        content: rawContent,
        format: currentFormat,
        changeLog,
        author: 'user',
        createdAt: new Date().toISOString(),
      };
      
      const updatedTemplates = templates.map((t) => {
        if (t.id === templateId) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            versions: [...t.versions, newVersion],
          };
        }
        return t;
      });
      
      set({ templates: updatedTemplates, isDirty: false });
    }
  },

  exportConfig: () => {
    const { rawContent, currentFormat } = get();
    const filename = `config.${currentFormat}`;
    
    const blob = new Blob([rawContent], { type: currentFormat === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return rawContent;
  },

  importConfig: (content, format) => {
    try {
      let parsedContent = content;
      
      if (format === 'yaml') {
        const parsed = yaml.load(content);
        parsedContent = JSON.stringify(parsed, null, 2);
      }
      
      const parsed = JSON.parse(parsedContent);
      const errors = validateConfig(parsed);
      
      set({ 
        rawContent: parsedContent, 
        currentFormat: format,
        parsedConfig: parsed, 
        validationErrors: errors,
        isDirty: true 
      });
      
      return errors.length === 0;
    } catch (error) {
      console.error('Import failed:', error);
      set({ 
        validationErrors: [{ 
          line: 0, 
          column: 0, 
          message: `Failed to parse ${format.toUpperCase()}`, 
          severity: 'error' 
        }] 
      });
      return false;
    }
  },

  formatContent: () => {
    const { rawContent } = get();
    try {
      const parsed = JSON.parse(rawContent);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return rawContent;
    }
  },
}));

function getNextVersionNumber(versions: ConfigVersion[]): string {
  if (versions.length === 0) return '1.0';
  
  const lastVersion = versions[versions.length - 1].versionNumber;
  const parts = lastVersion.split('.');
  
  if (parts.length === 2) {
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    return `${major}.${minor + 1}`;
  }
  
  return '1.0';
}