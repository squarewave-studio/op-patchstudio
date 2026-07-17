import { describe, expect, it, vi } from 'vitest';
import { extractDroppedAudioFiles, getDropEffect, isAudioFile } from '../../utils/fileDrop';

function createDataTransfer({
  files = [],
  items = [],
  types = [],
}: {
  files?: File[];
  items?: Partial<DataTransferItem>[];
  types?: string[];
}): DataTransfer {
  return {
    files,
    items,
    types,
  } as unknown as DataTransfer;
}

describe('fileDrop', () => {
  it('extracts a Splice-style file item when dataTransfer.files is empty', async () => {
    const sample = new File(['audio'], 'splice-sample.wav', { type: '' });
    const dataTransfer = createDataTransfer({
      items: [{
        kind: 'file',
        type: '',
        getAsFile: vi.fn(() => sample),
        webkitGetAsEntry: vi.fn(() => null),
      }],
    });

    await expect(extractDroppedAudioFiles(dataTransfer)).resolves.toEqual([sample]);
  });

  it('uses a copy drop effect for Splice file drags', () => {
    const dataTransfer = createDataTransfer({
      items: [{ kind: 'file', type: 'audio/wav' }],
      types: ['Files'],
    });

    expect(getDropEffect(dataTransfer)).toBe('copy');
  });

  it('keeps the move drop effect for internal sample drags', () => {
    expect(getDropEffect(createDataTransfer({}))).toBe('move');
  });

  it('falls back to files supplied by Finder', async () => {
    const sample = new File(['audio'], 'finder-sample.aif', { type: 'audio/aiff' });
    const dataTransfer = createDataTransfer({ files: [sample] });

    await expect(extractDroppedAudioFiles(dataTransfer)).resolves.toEqual([sample]);
  });

  it('keeps recursively extracting audio files from dropped folders', async () => {
    const sample = new File(['audio'], 'folder-sample.wav', { type: 'audio/wav' });
    const fileEntry = {
      isFile: true,
      isDirectory: false,
      file: (success: FileCallback) => success(sample),
    } as FileSystemFileEntry;
    const directoryEntry = {
      isFile: false,
      isDirectory: true,
      createReader: () => {
        let hasRead = false;
        return {
          readEntries: (success: FileSystemEntriesCallback) => {
            const entries = hasRead ? [] : [fileEntry];
            hasRead = true;
            success(entries);
          },
        } as FileSystemDirectoryReader;
      },
    } as FileSystemDirectoryEntry;
    const dataTransfer = createDataTransfer({
      items: [{
        kind: 'file',
        webkitGetAsEntry: vi.fn(() => directoryEntry),
      }],
    });

    await expect(extractDroppedAudioFiles(dataTransfer)).resolves.toEqual([sample]);
  });

  it('recognizes supported extensions when the source omits the MIME type', () => {
    expect(isAudioFile(new File(['audio'], 'sample.WAV', { type: '' }))).toBe(true);
    expect(isAudioFile(new File(['text'], 'notes.txt', { type: '' }))).toBe(false);
  });
});
