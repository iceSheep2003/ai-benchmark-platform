import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Alert, Spin, Space, Typography, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash';
import type { editor } from 'monaco-editor';
import { useOrchestratorStore } from '../../store/orchestratorStore';

const { Text } = Typography;

export const FullCodeEditor = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const {
    rawYaml,
    errors,
    updateFromCode,
    validateWorkflow,
    isLoading,
  } = useOrchestratorStore();

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      validateWorkflow();
    });
  }, [validateWorkflow]);

  const handleEditorChange = useCallback(
    debounce((value: string | undefined) => {
      if (value !== undefined) {
        updateFromCode(value);
      }
    }, 500),
    [updateFromCode]
  );

  const handleFormatDocument = useCallback(() => {
    if (editorRef.current) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
      }
    }
  }, []);

  const criticalErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #303030',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1f1f1f',
      }}>
        <Space>
          <Text strong style={{ color: '#ffffff' }}>
            Workflow Definition (YAML)
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Press Ctrl/Cmd + S to validate
          </Text>
        </Space>
        <Button 
          type="primary" 
          size="small"
          icon={<SyncOutlined />}
          onClick={handleFormatDocument}
        >
          Format
        </Button>
      </div>

      {(criticalErrors.length > 0 || warnings.length > 0) && (
        <div style={{ 
          padding: '8px 16px', 
          borderBottom: '1px solid #303030',
          backgroundColor: '#1f1f1f',
        }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {criticalErrors.length > 0 && (
              <Alert
                message={`${criticalErrors.length} error${criticalErrors.length > 1 ? 's' : ''} found`}
                description={
                  <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {criticalErrors.map((error, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                        <Text type="danger">
                          {error.path ? `${error.path}: ` : ''}{error.message}
                        </Text>
                      </div>
                    ))}
                  </div>
                }
                type="error"
                showIcon
                closable
              />
            )}
            {warnings.length > 0 && criticalErrors.length === 0 && (
              <Alert
                message={`${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`}
                description={
                  <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {warnings.map((warning, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                        <Text type="warning">
                          {warning.path ? `${warning.path}: ` : ''}{warning.message}
                        </Text>
                      </div>
                    ))}
                  </div>
                }
                type="warning"
                showIcon
                closable
              />
            )}
            {errors.length === 0 && (
              <Alert
                message="Workflow is valid"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </Space>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading ? (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f1f1f',
          }}>
            <Spin size="large" tip="Loading workflow..." />
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={rawYaml}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              rulers: [80, 120],
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        )}
      </div>
    </div>
  );
};