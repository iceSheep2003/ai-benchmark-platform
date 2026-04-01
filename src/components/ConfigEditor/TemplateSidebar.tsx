import React, { useState, useMemo } from 'react';
import { 
  Input, 
  List, 
  Tag, 
  Space, 
  Button, 
  Dropdown, 
  Modal, 
  Form, 
  Select, 
  message, 
  Drawer,
  Timeline,
  Empty,
  Tooltip,
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  MoreOutlined, 
  HistoryOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useConfigStore } from '../../store/configStore';
import type { ConfigTemplate } from '../../types/config';

const TemplateSidebar: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [renameForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [newVersionForm] = Form.useForm();

  const {
    templates,
    selectedTemplateId,
    loadTemplate,
    deleteTemplate,
    createNewVersion,
    isDirty,
  } = useConfigStore();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach((template) => {
      template.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchText.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => template.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [templates, searchText, selectedTags]);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    if (isDirty) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to continue loading the template?',
        onOk: () => {
          loadTemplate(templateId);
        },
      });
    } else {
      loadTemplate(templateId);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
    message.success('Template deleted successfully');
  };

  const handleRenameTemplate = (templateId: string, values: { name: string }) => {
    const { templates } = useConfigStore.getState();
    const updatedTemplates = templates.map((t) => {
      if (t.id === templateId) {
        return { ...t, name: values.name, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    useConfigStore.getState().setTemplates(updatedTemplates);
    message.success('Template renamed successfully');
    setIsRenameModalOpen(false);
  };

  const handleShowHistory = (template: ConfigTemplate) => {
    setSelectedTemplate(template);
    setIsHistoryDrawerOpen(true);
  };

  const handleLoadVersion = (templateId: string, versionId: string) => {
    if (isDirty) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to continue loading this version?',
        onOk: () => {
          loadTemplate(templateId, versionId);
          setIsHistoryDrawerOpen(false);
        },
      });
    } else {
      loadTemplate(templateId, versionId);
      setIsHistoryDrawerOpen(false);
    }
  };

  const handleCreateNewVersion = (templateId: string, changeLog: string) => {
    createNewVersion(templateId, changeLog);
    message.success('New version created successfully');
    setIsHistoryDrawerOpen(false);
  };

  const getTemplateActions = (template: ConfigTemplate) => [
    {
      key: 'load',
      label: 'Load Template',
      icon: <FileTextOutlined />,
      onClick: () => handleLoadTemplate(template.id),
    },
    {
      key: 'history',
      label: 'Version History',
      icon: <HistoryOutlined />,
      onClick: () => handleShowHistory(template),
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: <EditOutlined />,
      onClick: () => {
        setSelectedTemplate(template);
        renameForm.setFieldsValue({ name: template.name });
        setIsRenameModalOpen(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteTemplate(template.id),
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1f1f1f' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #303030' }}>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              Templates
            </span>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New
            </Button>
          </div>
          
          <Input
            placeholder="Search templates..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ backgroundColor: '#2a2a2a', borderColor: '#404040', color: '#fff' }}
          />
          
          {allTags.length > 0 && (
            <div>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>
                <TagOutlined /> Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {allTags.map((tag) => (
                  <Tag
                    key={tag}
                    color={selectedTags.includes(tag) ? 'blue' : 'default'}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedTags.includes(tag) ? '#1890ff' : '#2a2a2a',
                      borderColor: selectedTags.includes(tag) ? '#1890ff' : '#404040',
                      color: selectedTags.includes(tag) ? '#fff' : '#999',
                    }}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        {filteredTemplates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No templates found"
            style={{ marginTop: '40px', color: '#999' }}
          />
        ) : (
          <List
            dataSource={filteredTemplates}
            renderItem={(template) => (
              <div
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: selectedTemplateId === template.id ? '#2a2a2a' : 'transparent',
                  border: selectedTemplateId === template.id ? '1px solid #1890ff' : '1px solid transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleLoadTemplate(template.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ 
                        color: '#fff', 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {template.name}
                      </span>
                      {template.versions && template.versions.length > 0 && (
                        <Tag 
                          color="blue" 
                          style={{ marginLeft: '8px', fontSize: '11px' }}
                        >
                          v{template.versions[template.versions.length - 1].versionNumber}
                        </Tag>
                      )}
                    </div>
                    
                    {template.description && (
                      <div style={{ 
                        color: '#999', 
                        fontSize: '12px', 
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {template.description}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Tag key={tag} style={{ fontSize: '11px', padding: '0 4px', margin: 0 }}>
                          {tag}
                        </Tag>
                      ))}
                      {template.tags.length > 3 && (
                        <span style={{ color: '#999', fontSize: '11px' }}>
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginTop: '8px', 
                      color: '#666', 
                      fontSize: '11px' 
                    }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      {formatDate(template.updatedAt)}
                    </div>
                  </div>
                  
                  <Dropdown
                    menu={{ items: getTemplateActions(template) }}
                    trigger={['click']}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      style={{ color: '#999' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </div>
            )}
          />
        )}
      </div>

      <Modal
        title="Create New Template"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => {
            const { templates } = useConfigStore.getState();
            const newTemplate = {
              id: `tpl-${Date.now()}`,
              name: values.name,
              description: values.description,
              tags: values.tags || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              versions: [],
            };
            useConfigStore.getState().setTemplates([...templates, newTemplate]);
            message.success('Template created successfully');
            setIsCreateModalOpen(false);
            createForm.resetFields();
          }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>
          
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter template description" rows={3} />
          </Form.Item>
          
          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              placeholder="Add tags"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rename Template"
        open={isRenameModalOpen}
        onCancel={() => setIsRenameModalOpen(false)}
        footer={null}
      >
        <Form
          form={renameForm}
          layout="vertical"
          onFinish={(values) => {
            if (selectedTemplate) {
              handleRenameTemplate(selectedTemplate.id, values);
            }
          }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter new template name" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Rename
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>Version History</span>
            <span style={{ color: '#999', fontSize: '12px' }}>
              {selectedTemplate?.name}
            </span>
          </Space>
        }
        placement="right"
        size="large"
        open={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      >
        {selectedTemplate && (
          <div>
            <Timeline
              items={selectedTemplate.versions.map((version) => ({
                children: (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Tag color="blue" style={{ marginBottom: '4px' }}>
                          v{version.versionNumber}
                        </Tag>
                        <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      <Space>
                        <Tooltip title="Load this version">
                          <Button
                            type="link"
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => handleLoadVersion(selectedTemplate.id, version.versionId)}
                          >
                            Load
                          </Button>
                        </Tooltip>
                      </Space>
                    </div>
                    
                    {version.changeLog && (
                      <div style={{ 
                        color: '#ccc', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '4px',
                      }}>
                        {version.changeLog}
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginTop: '8px', 
                      color: '#666', 
                      fontSize: '11px' 
                    }}>
                      <UserOutlined style={{ marginRight: '4px' }} />
                      {version.author}
                    </div>
                  </div>
                ),
              }))}
            />
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #303030' }}>
              <Button
                type="primary"
                block
                icon={<PlusOutlined />}
                onClick={() => setIsNewVersionModalOpen(true)}
              >
                Create New Version
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="Create New Version"
        open={isNewVersionModalOpen}
        onCancel={() => setIsNewVersionModalOpen(false)}
        footer={null}
      >
        <Form
          form={newVersionForm}
          layout="vertical"
          onFinish={(values) => {
            if (selectedTemplate) {
              handleCreateNewVersion(selectedTemplate.id, values.changeLog);
              setIsNewVersionModalOpen(false);
              newVersionForm.resetFields();
            }
          }}
        >
          <Form.Item
            name="changeLog"
            label="Change Log"
            rules={[{ required: true, message: 'Please enter change log' }]}
          >
            <Input.TextArea 
              placeholder="Describe the changes in this version"
              rows={4}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Create Version
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateSidebar;