import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  LIBRARY_EXPORT_APP,
  LIBRARY_EXPORT_FORMAT_VERSION,
  buildLibraryExport,
  type LibraryExportManifest
} from '../../utils/libraryExport';
import type { LibraryPreset } from '../../utils/libraryUtils';

function makePreset(overrides: Partial<LibraryPreset> = {}): LibraryPreset {
  return {
    id: 'preset-1',
    name: 'My Kit',
    type: 'drum',
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
    isFavorite: false,
    sampleCount: 1,
    data: {
      drumSettings: { sampleRate: 44100 },
      drumSamples: [
        { name: 'Kick.wav', originalIndex: 0, audioBlob: new Blob(['kick-audio'], { type: 'audio/wav' }) }
      ],
      multisampleFiles: []
    },
    ...overrides
  };
}

async function readExport(presets: LibraryPreset[]) {
  const blob = await buildLibraryExport(presets, '1.2.3');
  const zip = await JSZip.loadAsync(blob);
  const manifest: LibraryExportManifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
  return { zip, manifest };
}

describe('buildLibraryExport', () => {
  it('writes a manifest the desktop app can read', async () => {
    const { manifest } = await readExport([makePreset()]);

    expect(manifest.formatVersion).toBe(LIBRARY_EXPORT_FORMAT_VERSION);
    expect(manifest.app).toBe(LIBRARY_EXPORT_APP);
    expect(manifest.appVersion).toBe('1.2.3');
    expect(Date.parse(manifest.exportedAt)).not.toBeNaN();
    expect(manifest.presets).toHaveLength(1);
    expect(manifest.presets[0]).toMatchObject({
      id: 'preset-1',
      name: 'My Kit',
      type: 'drum',
      path: 'presets/my-kit/preset.json'
    });
  });

  it('writes each sample out as its own file and references it from the preset', async () => {
    const { zip, manifest } = await readExport([makePreset()]);

    const samplePath = 'presets/my-kit/samples/kick.wav';
    expect(manifest.presets[0].samples).toEqual([samplePath]);
    expect(await zip.file(samplePath)!.async('string')).toBe('kick-audio');

    const preset = JSON.parse(await zip.file('presets/my-kit/preset.json')!.async('string'));
    expect(preset.data.drumSamples[0]).toMatchObject({ name: 'Kick.wav', sampleFile: 'samples/kick.wav' });
    expect(preset.data.drumSamples[0]).not.toHaveProperty('audioBlob');
    expect(preset.data.drumSettings).toEqual({ sampleRate: 44100 });
  });

  it('handles multisample presets', async () => {
    const preset = makePreset({
      id: 'preset-2',
      name: 'Piano',
      type: 'multisample',
      data: {
        multisampleFiles: [
          { name: 'C3.wav', rootNote: 60, audioBlob: new Blob(['c3'], { type: 'audio/wav' }) },
          { name: 'C4.wav', rootNote: 72, audioBlob: new Blob(['c4'], { type: 'audio/wav' }) }
        ]
      }
    });

    const { zip, manifest } = await readExport([preset]);

    expect(manifest.presets[0].samples).toEqual([
      'presets/piano/samples/c3.wav',
      'presets/piano/samples/c4.wav'
    ]);
    expect(await zip.file('presets/piano/samples/c4.wav')!.async('string')).toBe('c4');
  });

  it('keeps presets with the same name in separate folders', async () => {
    const { manifest } = await readExport([
      makePreset({ id: 'a' }),
      makePreset({ id: 'b' })
    ]);

    expect(manifest.presets.map(p => p.path)).toEqual([
      'presets/my-kit/preset.json',
      'presets/my-kit-2/preset.json'
    ]);
  });

  it('keeps samples with the same name apart within a preset', async () => {
    const preset = makePreset({
      data: {
        drumSamples: [
          { name: 'Kick.wav', audioBlob: new Blob(['one'], { type: 'audio/wav' }) },
          { name: 'kick.wav', audioBlob: new Blob(['two'], { type: 'audio/wav' }) }
        ]
      }
    });

    const { zip, manifest } = await readExport([preset]);

    expect(manifest.presets[0].samples).toEqual([
      'presets/my-kit/samples/kick.wav',
      'presets/my-kit/samples/kick-2.wav'
    ]);
    expect(await zip.file('presets/my-kit/samples/kick-2.wav')!.async('string')).toBe('two');
  });

  it('produces a valid empty export when the library has no presets', async () => {
    const { manifest } = await readExport([]);

    expect(manifest.presets).toEqual([]);
  });
});
