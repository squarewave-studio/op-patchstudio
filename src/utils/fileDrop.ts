const AUDIO_EXTENSIONS = ['.wav', '.aif', '.aiff', '.mp3', '.m4a', '.ogg', '.flac'];

export function isAudioFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.some(extension => name.endsWith(extension));
}

export function hasDroppedFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items).some(item => item.kind === 'file') ||
    Array.from(dataTransfer.types).includes('Files');
}

export function getDropEffect(dataTransfer: DataTransfer): 'copy' | 'move' {
  return hasDroppedFiles(dataTransfer) ? 'copy' : 'move';
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File[]> {
  return new Promise((resolve, reject) => {
    entry.file(file => resolve([file]), reject);
  });
}

function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];

    const readBatch = () => {
      reader.readEntries(batch => {
        if (batch.length === 0) {
          resolve(entries);
          return;
        }

        entries.push(...batch);
        readBatch();
      }, reject);
    };

    readBatch();
  });
}

async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return readFileEntry(entry as FileSystemFileEntry);
  }

  if (entry.isDirectory) {
    const children = await readDirectoryEntries((entry as FileSystemDirectoryEntry).createReader());
    return (await Promise.all(children.map(readEntry))).flat();
  }

  return [];
}

export async function extractDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  // Drag data becomes protected after the drop callback returns, so capture all
  // synchronously available handles before waiting for directory traversal.
  const fallbackFiles = Array.from(dataTransfer.files);
  const itemResults = await Promise.all(
    Array.from(dataTransfer.items)
      .filter(item => item.kind === 'file')
      .map(item => {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          return readEntry(entry).catch(() => []);
        }

        const file = item.getAsFile();
        return Promise.resolve(file ? [file] : []);
      }),
  );
  const itemFiles = itemResults.flat();

  return itemFiles.length > 0 ? itemFiles : fallbackFiles;
}

export async function extractDroppedAudioFiles(dataTransfer: DataTransfer): Promise<File[]> {
  return (await extractDroppedFiles(dataTransfer)).filter(isAudioFile);
}
