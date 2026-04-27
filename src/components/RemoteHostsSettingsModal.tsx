import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  message,
  Alert,
  Typography,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudServerOutlined } from '@ant-design/icons';
import {
  acceleratorTaskApi,
  type SshTargetConfigItem,
} from '../services/acceleratorTaskService';

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatSaveError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return '保存失败';
  }
  if (!('response' in err)) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'Network Error' || msg.includes('ECONNREFUSED')) {
      return '无法连接后端：请确认已运行 ./backend/start.sh（8711）且 npm run dev 代理正常';
    }
    return msg || '保存失败';
  }
  const res = (err as { response?: { status?: number; data?: { detail?: unknown } } }).response;
  const detail = res?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((x: { msg?: string; type?: string }) => x.msg || x.type || JSON.stringify(x))
      .join('；');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  if (res?.status === 404) {
    return '接口不存在：请升级后端或检查 /api/v1/system/ssh-targets-config';
  }
  return '保存失败';
}

const emptyRow = (): SshTargetConfigItem => ({
  id: '',
  host: '',
  port: 22,
  user: '',
  identity_file: '',
  project_root: '',
  opencompass_root: '',
  python_executable: 'python3',
});

const RemoteHostsSettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const [items, setItems] = useState<SshTargetConfigItem[]>([]);
  const [persisted, setPersisted] = useState(false);
  const [dataFile, setDataFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm<SshTargetConfigItem>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await acceleratorTaskApi.getSshTargetsConfig();
      setItems(
        data.items.map((r) => ({
          ...r,
          identity_file: r.identity_file ?? '',
          password: undefined,
        })),
      );
      setPersisted(data.persisted);
      setDataFile(data.data_file);
    } catch {
      message.error('加载远程主机配置失败，请确认后端已启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const openAdd = () => {
    setEditingIndex(null);
    form.setFieldsValue(emptyRow());
    setEditorOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    form.setFieldsValue({ ...items[index] });
    setEditorOpen(true);
  };

  const handleEditorOk = async () => {
    try {
      const v = await form.validateFields();
      const prev = editingIndex !== null ? items[editingIndex] : undefined;
      const idFile = v.identity_file?.trim() || undefined;
      const pwd = v.password?.trim() || undefined;
      const row: SshTargetConfigItem = {
        ...v,
        identity_file: idFile,
        password: pwd,
        opencompass_root: v.opencompass_root?.trim() || undefined,
        python_executable: v.python_executable?.trim() || 'python3',
        password_set: Boolean(
          idFile ? false : pwd || (prev?.password_set && !pwd),
        ),
      };
      if (editingIndex === null) {
        setItems((prev) => [...prev, row]);
      } else {
        setItems((prev) => {
          const next = [...prev];
          next[editingIndex] = row;
          return next;
        });
      }
      setEditorOpen(false);
      message.success(editingIndex === null ? '已添加到列表，请点击「保存到服务端」生效' : '已更新列表');
    } catch {
      /* validate */
    }
  };

  const removeAt = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const ids = items.map((i) => i.id.trim());
    if (ids.some((id) => !id)) {
      message.error('每条记录必须填写唯一 ID');
      return;
    }
    if (new Set(ids).size !== ids.length) {
      message.error('存在重复的 ID');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      if (!r.host?.trim()) {
        message.error(`第 ${i + 1} 行：请填写主机`);
        return;
      }
      if (!r.user?.trim()) {
        message.error(`第 ${i + 1} 行：请填写 SSH 用户`);
        return;
      }
      if (!r.project_root?.trim()) {
        message.error(`第 ${i + 1} 行：请填写远程仓库根目录（服务器上含 backend/ 的绝对路径）`);
        return;
      }
      const hasKey = Boolean(r.identity_file?.trim());
      const hasPw = Boolean(r.password?.trim()) || Boolean(r.password_set);
      if (!hasKey && !hasPw) {
        message.error(`第 ${i + 1} 行：请填写私钥路径或 SSH 密码（至少一种）`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = items.map(({ password_set: _ps, ...r }) => {
        const row: SshTargetConfigItem = {
          ...r,
          port: r.port ?? 22,
          identity_file: r.identity_file?.trim() || undefined,
          opencompass_root: r.opencompass_root?.trim() || undefined,
          python_executable: (r.python_executable || 'python3').trim(),
        };
        if (!r.password?.trim()) {
          delete row.password;
        }
        return row;
      });
      await acceleratorTaskApi.saveSshTargetsConfig(payload);
      message.success('已保存到服务端');
      await load();
    } catch (err: unknown) {
      message.error(formatSaveError(err));
    } finally {
      setSaving(false);
    }
  };

  const editingHasSavedPassword =
    editingIndex !== null && Boolean(items[editingIndex]?.password_set);

  const columns: ColumnsType<SshTargetConfigItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
    { title: '主机', dataIndex: 'host', key: 'host', width: 140, ellipsis: true },
    { title: '端口', dataIndex: 'port', key: 'port', width: 72 },
    { title: '用户', dataIndex: 'user', key: 'user', width: 100 },
    {
      title: '登录',
      key: 'auth',
      width: 72,
      render: (_, r) =>
        r.identity_file?.trim() ? '私钥' : r.password_set || r.password ? '密码' : '—',
    },
    {
      title: '项目根目录（远程）',
      dataIndex: 'project_root',
      key: 'project_root',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, __, index) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(index)}>
            编辑
          </Button>
          <Popconfirm title="从列表中移除？" onConfirm={() => removeAt(index)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <CloudServerOutlined />
            <span>SSH 远程主机</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        width={920}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSaveAll}>
            保存到服务端
          </Button>,
        ]}
        destroyOnClose
      >
        {!persisted && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="当前列表来自环境变量 BENCHMARK_SSH_TARGETS 或 BENCHMARK_SSH_TARGETS_FILE。点击「保存到服务端」后将写入本地文件并优先生效；删除该文件可恢复为仅使用环境变量。"
          />
        )}
        {persisted && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
            配置文件：{dataFile}
          </Typography.Paragraph>
        )}
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="若使用密码登录，密码会以明文保存在上述配置文件中；公网环境请改用 SSH 私钥。"
        />
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            添加主机
          </Button>
          <Button onClick={load} loading={loading}>
            重新加载
          </Button>
        </Space>
        <Table
          size="small"
          rowKey={(_, index) => String(index)}
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Modal>

      <Modal
        title={editingIndex === null ? '添加 SSH 主机' : '编辑 SSH 主机'}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        onOk={handleEditorOk}
        okText="确定"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="id"
            label="目标 ID"
            rules={[{ required: true, message: '用于任务里选择，如 lab-gpu-1' }]}
          >
            <Input placeholder="lab-gpu-1" />
          </Form.Item>
          <Form.Item name="host" label="主机名 / IP" rules={[{ required: true }]}>
            <Input placeholder="192.168.1.10" />
          </Form.Item>
          <Form.Item name="port" label="端口" initialValue={22}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="user" label="SSH 用户" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="identity_file" label="私钥路径（本机，可选）">
            <Input placeholder="/Users/you/.ssh/id_ed25519" />
          </Form.Item>
          <Form.Item
            name="password"
            label="SSH 密码（可选）"
            extra={
              <span style={{ fontSize: 12, color: '#888' }}>
                {editingHasSavedPassword
                  ? '已保存过密码：留空则不修改；填写则覆盖。若填写私钥路径并保存，将改用私钥并清除已存密码。'
                  : '仅密码登录时填写（后端使用 Paramiko）；与私钥同时配置时优先私钥。'}
              </span>
            }
          >
            <Input.Password placeholder="留空表示不修改 / 不使用密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="project_root"
            label="远程仓库根目录（绝对路径）"
            rules={[{ required: true, message: '需包含 backend/ 目录' }]}
          >
            <Input placeholder="/home/ubuntu/demo" />
          </Form.Item>
          <Form.Item name="opencompass_root" label="OpenCompass 根目录（可选）">
            <Input placeholder="默认 {project_root}/opencompass" />
          </Form.Item>
          <Form.Item name="python_executable" label="远程 Python" initialValue="python3">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RemoteHostsSettingsModal;
