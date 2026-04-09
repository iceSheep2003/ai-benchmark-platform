import type { Dataset } from '../types/dataset';

interface RawDatasetVersion {
  version: string;
  createdAt: string;
  changes: string[];
  parentVersion?: string;
}

interface RawDataset extends Omit<Dataset, 'createdAt' | 'updatedAt' | 'versions'> {
  createdAt: string;
  updatedAt: string;
  versions: RawDatasetVersion[];
}

interface CatalogResponse {
  generatedAt: string;
  datasets: RawDataset[];
}

const normalizeDataset = (dataset: RawDataset): Dataset => ({
  ...dataset,
  createdAt: new Date(dataset.createdAt),
  updatedAt: new Date(dataset.updatedAt),
  versions: dataset.versions.map((version) => ({
    ...version,
    createdAt: new Date(version.createdAt),
  })),
});

const countJsonlRows = async (path: string): Promise<number> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .length;
};

const resolveDatasetSampleCount = async (dataset: Dataset): Promise<number> => {
  const basePath = getDatasetBasePath(dataset);
  try {
    return await countJsonlRows(`${basePath}/test.jsonl`);
  } catch {
    try {
      return await countJsonlRows(`${basePath}/sample.jsonl`);
    } catch {
      return dataset.sampleCount;
    }
  }
};

export const loadDatasetCatalog = async (): Promise<Dataset[]> => {
  const response = await fetch('/datasets/catalog.json');
  if (!response.ok) {
    throw new Error(`Failed to load dataset catalog: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as CatalogResponse;
  const normalized = payload.datasets.map(normalizeDataset);
  const withResolvedSampleCount = await Promise.all(
    normalized.map(async (dataset) => ({
      ...dataset,
      sampleCount: await resolveDatasetSampleCount(dataset),
    })),
  );
  return withResolvedSampleCount;
};

export interface DatasetPreviewLoadResult {
  rows: Record<string, unknown>[];
  source: 'test' | 'sample' | 'catalog';
}

const DATASET_PREVIEW_LIMIT = 100;

const readJsonl = async (path: string, limit: number = DATASET_PREVIEW_LIMIT): Promise<Record<string, unknown>[]> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, limit);
  return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
};

export const getDatasetBasePath = (dataset: Pick<Dataset, 'id' | 'source'>): string =>
  dataset.source === 'open-source'
    ? `/datasets/open-source/${dataset.id}`
    : `/datasets/self-built/${dataset.id}`;

export const loadDatasetPreviewRows = async (
  dataset: Pick<Dataset, 'id' | 'source'>,
  fallbackPreviewData?: Record<string, unknown>[],
): Promise<DatasetPreviewLoadResult> => {
  const basePath = getDatasetBasePath(dataset);

  try {
    const rows = await readJsonl(`${basePath}/test.jsonl`);
    if (rows.length > 0) {
      return { rows, source: 'test' };
    }
  } catch {
    // Fallback to sample.jsonl
  }

  try {
    const rows = await readJsonl(`${basePath}/sample.jsonl`);
    if (rows.length > 0) {
      return { rows, source: 'sample' };
    }
  } catch {
    // Fallback to catalog preview data
  }

  const rows = (fallbackPreviewData || []).slice(0, DATASET_PREVIEW_LIMIT);
  return { rows, source: 'catalog' };
};
