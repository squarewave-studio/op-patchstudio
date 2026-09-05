import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateDrumPatch, generateMultisamplePatch, downloadBlob } from '../utils/patchGeneration';
import { ANALYTICS_EVENTS, capture } from '../utils/analytics';
import { notifyPresetExported } from '../utils/exportEvents';

export function usePatchGeneration() {
  const { state, dispatch } = useAppContext();

  const generateDrumPatchFile = useCallback(async (patchName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const loadedSamples = state.drumSamples.filter(sample => sample.isLoaded);
      if (loadedSamples.length === 0) {
        throw new Error('No samples loaded');
      }

      const finalPatchName = patchName || state.drumSettings.presetName || `drum_patch_${Date.now()}`;
      
      // Get audio format settings from drum settings
      const targetSampleRate = state.drumSettings.sampleRate || undefined;
      const targetBitDepth = state.drumSettings.bitDepth || undefined;
      const targetChannels = state.drumSettings.channels === 1 ? "mono" : "keep";
      
      const patchBlob = await generateDrumPatch(
        state, 
        finalPatchName,
        targetSampleRate,
        targetBitDepth,
        targetChannels,
        state.drumSettings.audioFormat
      );
      
      downloadBlob(patchBlob, `${finalPatchName}.preset.zip`);

      capture(ANALYTICS_EVENTS.PRESET_EXPORTED, {
        mode: 'drum',
        sampleCount: loadedSamples.length,
        sampleRate: targetSampleRate ?? 0,
        bitDepth: targetBitDepth ?? 0,
        channels: targetChannels
      });
      notifyPresetExported();
      
    } catch (error) {
      console.error('Error generating drum patch:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to generate patch' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, dispatch]);

  const generateMultisamplePatchFile = useCallback(async (patchName?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (state.multisampleFiles.length === 0) {
        throw new Error('No samples loaded');
      }

      const finalPatchName = patchName || state.multisampleSettings.presetName || `multisample_patch_${Date.now()}`;
      
      // Get audio format settings from multisample settings
      const targetSampleRate = state.multisampleSettings.sampleRate || undefined;
      const targetBitDepth = state.multisampleSettings.bitDepth || undefined;
      const targetChannels = state.multisampleSettings.channels === 1 ? "mono" : "keep";
      const multisampleGain = state.multisampleSettings.gain || 0; // Get gain from UI settings
      
      const patchBlob = await generateMultisamplePatch(
        state, 
        finalPatchName,
        targetSampleRate,
        targetBitDepth,
        targetChannels,
        multisampleGain,
        state.multisampleSettings.audioFormat
      );
      
      downloadBlob(patchBlob, `${finalPatchName}.preset.zip`);

      capture(ANALYTICS_EVENTS.PRESET_EXPORTED, {
        mode: 'multisample',
        sampleCount: state.multisampleFiles.length,
        sampleRate: targetSampleRate ?? 0,
        bitDepth: targetBitDepth ?? 0,
        channels: targetChannels
      });
      notifyPresetExported();
      
    } catch (error) {
      console.error('Error generating multisample patch:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to generate patch' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, dispatch]);

  return {
    generateDrumPatchFile,
    generateMultisamplePatchFile,
  };
}