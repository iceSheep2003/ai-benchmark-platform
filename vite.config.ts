import { mkdir, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Connect, type PreviewServer, type ProxyOptions, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '_');

function attachConfigFilesMiddleware(middlewares: Connect.Server) {
  middlewares.use('/api/v1/config-files', async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      return;
    }

    try {
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const payload = JSON.parse(body || '{}');
      const taskId = sanitize(payload.taskId || `task-${Date.now()}`);
      const taskName = sanitize(payload.taskName || 'llm_task');
      const requestedType = sanitize(payload.taskType || 'llm');
      const taskType = requestedType === 'accelerator' ? 'accelerator' : 'llm';
      const config = payload.config || {};

      const outputDir = path.join(__dirname, 'generated-configs', taskType);
      await mkdir(outputDir, { recursive: true });

      const fileName = `${taskName}_${taskId}.json`;
      const absolutePath = path.join(outputDir, fileName);
      const generatedAt = new Date().toISOString();

      const content = JSON.stringify(
        {
          task_id: taskId,
          task_name: payload.taskName || taskName,
          generated_at: generatedAt,
          source: 'frontend',
          framework: 'opencompass-like',
          config,
        },
        null,
        2
      );
      await writeFile(absolutePath, content, 'utf-8');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          file: {
            fileName,
            relativePath: `generated-configs/${taskType}/${fileName}`,
            absolutePath,
            generatedAt,
          },
        })
      );
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate config file',
        })
      );
    }
  });
}

const configFileWriterPlugin = () => ({
  name: 'local-config-file-writer',
  configureServer(server: ViteDevServer) {
    attachConfigFilesMiddleware(server.middlewares);
  },
  /** preview 不会跑 configureServer，不写则 /api/v1/config-files 在 preview 下 404 */
  configurePreviewServer(server: PreviewServer) {
    attachConfigFilesMiddleware(server.middlewares);
  },
});

/** 单前缀代理整棵 /api/v1；config-files 由 bypass 交给上方中间件 */
const apiV1Proxy: ProxyOptions = {
  target: 'http://127.0.0.1:8711',
  changeOrigin: true,
  bypass(req) {
    const url = req.url ?? '';
    if (url.startsWith('/api/v1/config-files')) {
      return false;
    }
  },
};

const apiProxy = {
  '/api/v1': apiV1Proxy,
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), configFileWriterPlugin()],
  assetsInclude: ['**/*.json'],
  server: {
    host: 'localhost',
    proxy: { ...apiProxy },
  },
  preview: {
    proxy: { ...apiProxy },
  },
});
