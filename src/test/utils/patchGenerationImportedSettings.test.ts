import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { initialState, type AppState } from '../../context/AppContext';
import { generateDrumPatch } from '../../utils/patchGeneration';

describe('generateDrumPatch imported settings', () => {
  it('preserves imported advanced settings from the application state', async () => {
    const state: AppState = {
      ...initialState,
      drumSamples: [],
      importedDrumPreset: {
        engine: { highpass: 8192 },
        envelope: { amp: { attack: 1234 } },
        fx: { active: true, type: 'spring' }
      }
    };

    const patchBlob = await generateDrumPatch(state, 'Imported Settings');
    const zip = await JSZip.loadAsync(patchBlob);
    const patchFile = zip.file('patch.json');

    expect(patchFile).not.toBeNull();

    const patch = JSON.parse(await patchFile!.async('string'));

    expect(patch.engine.highpass).toBe(8192);
    expect(patch.envelope.amp.attack).toBe(1234);
    expect(patch.fx).toMatchObject({ active: true, type: 'spring' });
  });
});
