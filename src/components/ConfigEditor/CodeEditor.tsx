import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button, Select, Space, Tag } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useConfigStore } from '../../store/configStore';
import { getFieldDocumentation } from '../../utils/schema';

interface CodeEditorProps {
  height?: string;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  height = '500px', 
  readOnly = false,
  onContentChange 
}) => {
  const editorRef = useRef<any>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  
  const {
    rawContent,
    currentFormat,
    validationErrors,
    setFormat,
    setContent,
    exportConfig,
  } = useConfigStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && onContentChange) {
      onContentChange(value);
      setContent(value);
    }
  };

  const handleFormatChange = (format: 'json' | 'yaml') => {
    setFormat(format);
  };

  const handleExport = () => {
    exportConfig();
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorPosition((e: any) => {
      const model = editor.getModel();
      if (model) {
        const position = model.getPositionAt(e.position);
        const lineContent = model.getLineContent(position.lineNumber);
        const match = lineContent.match(/['"]?(\w+)['"]?:/);
        
        if (match && match[1]) {
          const fieldPath = match[1];
          setSelectedField(fieldPath);
        } else {
          setSelectedField(null);
        }
      }
    });
  };

  const getLanguage = () => {
    return currentFormat === 'yaml' ? 'yaml' : 'json';
  };

  const fieldDoc = selectedField ? getFieldDocumentation(selectedField) : null;

  const hasErrors = validationErrors.length > 0;
  const hasCriticalErrors = validationErrors.some((e) => e.severity === 'error');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '12px 16px', 
        backgroundColor: '#1f1f1f', 
        borderBottom: '1px solid #303030',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Space>
          <span style={{ color: '#999', fontSize: '12px' }}>
            Editor Mode: <strong style={{ color: '#fff' }}>{currentFormat.toUpperCase()}</strong>
          </span>
          <Select
            value={currentFormat}
            onChange={handleFormatChange}
            style={{ width: 120 }}
            size="small"
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'yaml', label: 'YAML' },
            ]}
          />
        </Space>
        
        <Space>
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,.yaml,.yml';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event: any) => {
                    const content = event.target.result;
                    const format = file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? 'yaml' : 'json';
                    handleFormatChange(format);
                    setContent(content);
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
          >
            Import
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height={height}
          defaultLanguage={getLanguage()}
          value={rawContent}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            folding: true,
            showFoldingControls: 'always',
          }}
        />

        {hasErrors && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            borderTop: '1px solid #ff4d4f',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: 1000,
          }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: hasCriticalErrors ? '#2a0a0a' : '#1a1a1a',
              borderBottom: `1px solid ${hasCriticalErrors ? '#ff4d4f' : '#faad14'}`,
            }}>
              <Space style={{ marginBottom: '8px' }}>
                {hasCriticalErrors ? (
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                ) : (
                  <CheckCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                )}
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {hasCriticalErrors ? 'Validation Errors' : 'Validation Warnings'}
                </span>
                <Tag color={hasCriticalErrors ? 'error' : 'warning'}>
                  {validationErrors.length}
                </Tag>
              </Space>
              
              <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px 0',
                      borderBottom: '1px solid #303030',
                      fontSize: '12px',
                      color: error.severity === 'error' ? '#ff4d4f' : '#faad14',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ marginRight: '8px', minWidth: '60px' }}>
                        Line {error.line}:
                      </span>
                      <span style={{ flex: 1 }}>
                        {error.message}
                      </span>
                    </div>
                    {error.path && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '11px', 
                        color: '#999',
                        fontFamily: 'monospace',
                      }}>
                        Path: {error.path}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {fieldDoc && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '300px',
          height: '100%',
          backgroundColor: '#1f1f1f',
          borderLeft: '1px solid #303030',
          padding: '16px',
          overflow: 'auto',
          zIndex: 999,
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                Field Documentation
              </span>
            </Space>
          </div>
          
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#2a2a2a', 
            borderRadius: '4px',
            marginBottom: '16px',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Field: </span>
              <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                {selectedField}
              </Tag>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Type: </span>
              <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                {fieldDoc.type}
              </span>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#999', fontSize: '12px' }}>Description: </span>
              <span style={{ color: '#ccc' }}>
                {fieldDoc.description}
              </span>
            </div>
            
            {fieldDoc.enum && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Values: </span>
                <div style={{ marginTop: '4px' }}>
                  {fieldDoc.enum.map((value, index) => (
                    <Tag key={index} color="green" style={{ margin: '2px' }}>
                      {value}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            {fieldDoc.range && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Range: </span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                  {fieldDoc.range.min} - {fieldDoc.range.max}
                </span>
              </div>
            )}
            
            {fieldDoc.default !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Default: </span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                  {typeof fieldDoc.default === 'object' 
                    ? JSON.stringify(fieldDoc.default) 
                    : String(fieldDoc.default)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;