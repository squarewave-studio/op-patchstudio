import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAppContext } from '../../context/AppContext';
import { createCompleteMultisampleSettings } from '../utils/testHelpers';
import { readAudioMetadata, type AudioMetadata } from '../../utils/audioFormats';

// Mock the AppContext
vi.mock('../../context/AppContext');

// Mock the metadata boundary used by the hook.
vi.mock('../../utils/audioFormats', () => ({
  readAudioMetadata: vi.fn()
}));

// Mock the session storage
vi.mock('../../utils/sessionStorageIndexedDB', () => ({
  sessionStorageIndexedDB: {
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    clearSession: vi.fn(),
    hasSession: vi.fn(),
    getSessionInfo: vi.fn(),
    resetSavedToLibraryFlag: vi.fn()
  }
}));

describe('useFileUpload', () => {
  const mockDispatch = vi.fn();
  const mockAudioBuffer = {} as AudioBuffer;
  const mockMetadata: AudioMetadata = {
    format: 'wav',
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    duration: 1,
    audioBuffer: mockAudioBuffer,
    fileSize: 1024,
    midiNote: 60,
    loopStart: 0,
    loopEnd: 1,
    hasLoopData: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the AppContext with complete multisample settings
    (useAppContext as any).mockReturnValue({
      state: {
        currentTab: 'multisample',
        drumSamples: [],
        multisampleFiles: [],
        selectedMultisample: null,
        isLoading: false,
        error: null,
        isDrumKeyboardPinned: false,
        isMultisampleKeyboardPinned: false,
        notifications: [],
        importedDrumPreset: null,
        importedMultisamplePreset: null,
        isSessionRestorationModalOpen: false,
        sessionInfo: null,
        midiNoteMapping: 'C3' as const,
        drumSettings: {
          sampleRate: 44100,
          bitDepth: 16,
          channels: 2,
          presetName: '',
          normalize: false,
          normalizeLevel: 0,
          presetSettings: {
            playmode: 'poly' as const,
            transpose: 0,
            velocity: 100,
            volume: 100,
            width: 100
          },
          renameFiles: false,
          filenameSeparator: ' ' as const,
        audioFormat: 'wav' as const
        },
        multisampleSettings: createCompleteMultisampleSettings()
      },
      dispatch: mockDispatch
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide expected functions', () => {
    const { result } = renderHook(() => useFileUpload())
    
    expect(typeof result.current.handleDrumSampleUpload).toBe('function')
    expect(typeof result.current.handleMultisampleUpload).toBe('function')
    expect(typeof result.current.clearDrumSample).toBe('function')
    expect(typeof result.current.clearMultisampleFile).toBe('function')
  })

  it('should handle drum sample upload calls', async () => {
    vi.mocked(readAudioMetadata).mockResolvedValueOnce(mockMetadata);
    const { result } = renderHook(() => useFileUpload())
    const mockFile = new File(['mock audio data'], 'test.wav', { type: 'audio/wav' })
    
    await act(async () => {
      await result.current.handleDrumSampleUpload(mockFile, 0)
    })
    
    expect(readAudioMetadata).toHaveBeenCalledWith(mockFile, 'C3')
    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'SET_LOADING', payload: true })
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'SET_ERROR', payload: null })
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'LOAD_DRUM_SAMPLE',
      payload: { index: 0, file: mockFile, audioBuffer: mockAudioBuffer, metadata: mockMetadata }
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(4, { type: 'SET_LOADING', payload: false })
  })

  it('should handle multisample upload calls', async () => {
    vi.mocked(readAudioMetadata).mockResolvedValueOnce(mockMetadata);
    const { result } = renderHook(() => useFileUpload())
    const mockFile = new File(['mock audio data'], 'C4.wav', { type: 'audio/wav' })
    
    await act(async () => {
      await result.current.handleMultisampleUpload(mockFile, 60)
    })
    
    expect(readAudioMetadata).toHaveBeenCalledWith(mockFile, 'C3')
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'LOAD_MULTISAMPLE_FILE',
      payload: {
        file: mockFile,
        audioBuffer: mockAudioBuffer,
        metadata: mockMetadata,
        rootNoteOverride: 60
      }
    })
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'SET_LOADING', payload: false })
  })

  it('should handle errors during upload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(readAudioMetadata).mockRejectedValueOnce(new Error('Invalid audio file'))

    const { result } = renderHook(() => useFileUpload())
    const mockFile = new File(['invalid data'], 'test.txt', { type: 'text/plain' })
    
    await act(async () => {
      await result.current.handleDrumSampleUpload(mockFile, 0)
    })
    
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'SET_ERROR',
      payload: 'Invalid audio file'
    })
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'SET_LOADING', payload: false })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'LOAD_DRUM_SAMPLE' }))
  })

  it('should use a safe error message for non-Error failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(readAudioMetadata).mockRejectedValueOnce('unreadable file')

    const { result } = renderHook(() => useFileUpload())

    await act(async () => {
      await result.current.handleMultisampleUpload(new File([], 'broken.wav'))
    })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR',
      payload: 'Failed to load audio file'
    })
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'SET_LOADING', payload: false })
  })

  it('should provide clear functions that call dispatch', () => {
    const { result } = renderHook(() => useFileUpload())
    
    act(() => {
      result.current.clearDrumSample(0)
      result.current.clearMultisampleFile(0)
    })
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CLEAR_DRUM_SAMPLE'
      })
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CLEAR_MULTISAMPLE_FILE'
      })
    )
  })
})
