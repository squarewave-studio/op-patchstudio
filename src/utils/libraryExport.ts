import JSZip from 'jszip';
import type { LibraryPreset } from './libraryUtils';

// Exports the whole local library as a single zip so it can be carried over to
// the OP-PatchStudio desktop app. Audio is written out as separate wav files
// and each preset's stored data keeps a relative path to them in place of the
// blob, which keeps preset.json readable and the zip compressible.

export const LIBRARY_EXPORT_FORMAT_VERSION = 1;
export const LIBRARY_EXPORT_APP = 'op-patchstudio-web';

export interface LibraryExportPresetEntry {
  id: string;
  name: string;
  type: 'drum' | 'multisample';
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  sampleCount: number;
  path: string;
  samples: string[];
}

export interface LibraryExportManifest {
  formatVersion: typeof LIBRARY_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  app: typeof LIBRARY_EXPORT_APP;
  appVersion: string;
  presets: LibraryExportPresetEntry[];
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return slug || fallback;
}

function uniqueName(taken: Set<string>, candidate: string): string {
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }

  const dot = candidate.lastIndexOf('.');
  const stem = dot > 0 ? candidate.slice(0, dot) : candidate;
  const extension = dot > 0 ? candidate.slice(dot) : '';

  let counter = 2;
  let next = `${stem}-${counter}${extension}`;
  while (taken.has(next)) {
    counter += 1;
    next = `${stem}-${counter}${extension}`;
  }

  taken.add(next);
  return next;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

// Replaces every audioBlob in a stored sample list with a relative wav path,
// adding the blob itself to the zip. Returns the rewritten list.
function extractSamples(
  samples: unknown,
  zip: JSZip,
  presetDir: string,
  takenFileNames: Set<string>,
  writtenPaths: string[]
): unknown {
  if (!Array.isArray(samples)) {
    return samples;
  }

  return samples.map((sample, index) => {
    if (!sample || typeof sample !== 'object') {
      return sample;
    }

    const { audioBlob, ...rest } = sample as Record<string, unknown>;

    if (!isBlob(audioBlob)) {
      return rest;
    }

    const rawName = typeof rest.name === 'string' && rest.name ? rest.name : `sample-${index + 1}`;
    const withExtension = /\.wav$/i.test(rawName) ? rawName : `${rawName}.wav`;
    const fileName = uniqueName(takenFileNames, slugify(withExtension, `sample-${index + 1}.wav`));
    const relativePath = `samples/${fileName}`;

    zip.file(`${presetDir}/${relativePath}`, audioBlob);
    writtenPaths.push(`${presetDir}/${relativePath}`);

    return { ...rest, sampleFile: relativePath };
  });
}

export async function buildLibraryExport(presets: LibraryPreset[], appVersion: string): Promise<Blob> {
  const zip = new JSZip();
  const takenDirs = new Set<string>();
  const entries: LibraryExportPresetEntry[] = [];

  for (const preset of presets) {
    const presetDir = `presets/${uniqueName(takenDirs, slugify(preset.name, preset.id))}`;
    const takenFileNames = new Set<string>();
    const writtenPaths: string[] = [];

    const data = (preset.data ?? {}) as Record<string, unknown>;
    const exportedData = {
      ...data,
      drumSamples: extractSamples(data.drumSamples, zip, presetDir, takenFileNames, writtenPaths),
      multisampleFiles: extractSamples(data.multisampleFiles, zip, presetDir, takenFileNames, writtenPaths)
    };

    zip.file(
      `${presetDir}/preset.json`,
      JSON.stringify(
        {
          id: preset.id,
          name: preset.name,
          type: preset.type,
          createdAt: preset.createdAt,
          updatedAt: preset.updatedAt,
          isFavorite: Boolean(preset.isFavorite),
          tags: preset.tags ?? [],
          description: preset.description ?? '',
          sampleCount: preset.sampleCount ?? writtenPaths.length,
          data: exportedData
        },
        null,
        2
      )
    );

    entries.push({
      id: preset.id,
      name: preset.name,
      type: preset.type,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
      isFavorite: Boolean(preset.isFavorite),
      sampleCount: preset.sampleCount ?? writtenPaths.length,
      path: `${presetDir}/preset.json`,
      samples: writtenPaths
    });
  }

  const manifest: LibraryExportManifest = {
    formatVersion: LIBRARY_EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: LIBRARY_EXPORT_APP,
    appVersion,
    presets: entries
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: 'blob' });
}
