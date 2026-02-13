"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useGenerateAudio, useSaveAudio, useUploadAudio } from "@/hooks/usePronunciationAdmin";
import { TTS_VOICES, type TTSVoice } from "@/types/pronunciation";
import { 
  IconPlayerPlay, 
  IconPlayerPause,
  IconUpload, 
  IconWand, 
  IconDeviceFloppy,
  IconRefresh,
  IconX,
  IconCheck,
  IconMicrophone,
  IconPlayerStop,
} from "@tabler/icons-react";

interface AudioGeneratorProps {
  text: string;
  onTextChange?: (text: string) => void;
  audioUrl: string;
  onAudioUrlChange: (url: string) => void;
  voice?: TTSVoice;
  onVoiceChange?: (voice: TTSVoice) => void;
  isCustomAudio?: boolean;
  onIsCustomAudioChange?: (isCustom: boolean) => void;
  // Combined callback for atomic updates (prevents race conditions)
  onAudioChange?: (url: string, isCustom: boolean) => void;
  folder: string;
  filename?: string;
  showTextInput?: boolean;
  textLabel?: string;
  textPlaceholder?: string;
  /** Hide AI voice selection and generate button */
  hideGeneration?: boolean;
  /** Show microphone recording button */
  showRecording?: boolean;
}

export function AudioGenerator({
  text,
  onTextChange,
  audioUrl,
  onAudioUrlChange,
  voice: voiceProp,
  onVoiceChange,
  isCustomAudio: isCustomAudioProp,
  onIsCustomAudioChange,
  onAudioChange,
  folder,
  filename,
  showTextInput = true,
  textLabel = "Text",
  textPlaceholder = "Enter text to generate audio...",
  hideGeneration = false,
  showRecording = false,
}: AudioGeneratorProps) {
  // Use controlled voice if provided, otherwise use local state
  const [localVoice, setLocalVoice] = useState<TTSVoice>("nova");
  const voice = voiceProp ?? localVoice;
  const setVoice = (v: TTSVoice) => {
    if (onVoiceChange) {
      onVoiceChange(v);
    } else {
      setLocalVoice(v);
    }
  };

  // Use controlled isCustomAudio if provided, otherwise use local state
  const [localIsCustomUpload, setLocalIsCustomUpload] = useState(false);
  const isCustomUpload = isCustomAudioProp ?? localIsCustomUpload;
  const setIsCustomUpload = (value: boolean) => {
    if (onIsCustomAudioChange) {
      onIsCustomAudioChange(value);
    } else {
      setLocalIsCustomUpload(value);
    }
  };

  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Refs to avoid stale closures in recorder.onstop callback
  const onAudioChangeRef = useRef(onAudioChange);
  onAudioChangeRef.current = onAudioChange;
  const onAudioUrlChangeRef = useRef(onAudioUrlChange);
  onAudioUrlChangeRef.current = onAudioUrlChange;
  const folderRef = useRef(folder);
  folderRef.current = folder;
  const filenameRef = useRef(filename);
  filenameRef.current = filename;

  const generateAudio = useGenerateAudio();
  const saveAudio = useSaveAudio();
  const uploadAudio = useUploadAudio();

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

  // Generate a unique suffix for filenames to prevent collisions
  const generateUniqueFilename = (baseFilename: string): string => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lastDot = baseFilename.lastIndexOf('.');
    if (lastDot > 0) {
      const name = baseFilename.substring(0, lastDot);
      const ext = baseFilename.substring(lastDot);
      return `${name}-${uniqueSuffix}${ext}`;
    }
    return `${baseFilename}-${uniqueSuffix}.mp3`;
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter text to generate audio");
      return;
    }

    try {
      const result = await generateAudio.mutateAsync({ text: text.trim(), voice });
      
      // Auto-save to S3 immediately after generation (no preview step)
      const baseFilename = filename || `${text.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`;
      const uniqueFilename = generateUniqueFilename(baseFilename);
      
      const saveResult = await saveAudio.mutateAsync({
        audioBase64: result.audioBase64,
        folder,
        filename: uniqueFilename,
      });
      
      if (onAudioChange) {
        onAudioChange(saveResult.url, false);
      } else {
        onAudioUrlChange(saveResult.url);
        setIsCustomUpload(false);
      }
      setPreviewAudio(null);
      setPreviewBase64(null);
      toast.success("Audio generated & saved!");
    } catch (error) {
      toast.error("Failed to generate audio");
    }
  };

  const handleSave = async () => {
    if (!previewBase64) {
      toast.error("No audio to save. Generate audio first.");
      return;
    }

    try {
      const baseFilename = filename || `${text.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`;
      const uniqueFilename = generateUniqueFilename(baseFilename);
      
      const result = await saveAudio.mutateAsync({
        audioBase64: previewBase64,
        folder,
        filename: uniqueFilename,
      });
      
      if (onAudioChange) {
        onAudioChange(result.url, false);
      } else {
        onAudioUrlChange(result.url);
        setIsCustomUpload(false);
      }
      setPreviewAudio(null);
      setPreviewBase64(null);
      toast.success("Audio saved!");
    } catch (error) {
      toast.error("Failed to save audio");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Audio file must be less than 10MB");
      return;
    }

    if (!file.type.includes("audio/mpeg") && !file.type.includes("audio/mp3")) {
      toast.error("Only MP3 files are allowed");
      return;
    }

    try {
      const baseFilename = filename || 'upload.mp3';
      const uniqueFilename = generateUniqueFilename(baseFilename);
      
      const result = await uploadAudio.mutateAsync({ file, folder, filename: uniqueFilename });
      
      if (onAudioChange) {
        onAudioChange(result.url, true);
      } else {
        onAudioUrlChange(result.url);
        if (onIsCustomAudioChange) {
          onIsCustomAudioChange(true);
        } else {
          setLocalIsCustomUpload(true);
        }
      }
      toast.success("Audio uploaded!");
    } catch (error) {
      toast.error("Failed to upload audio");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // --- Recording ---

  const MAX_RECORDING_SECONDS = 10 * 60; // 10 minutes

  // Uploads recorded blob via multipart form data (avoids base64 bloat / 413 errors)
  // Uses refs to always read the latest props (avoids stale closure from recorder.onstop)
  const handleSaveRecording = async (blob: Blob) => {
    setIsUploadingRecording(true);
    try {
      const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'wav';
      const currentFilename = filenameRef.current;
      const baseFilename = currentFilename
        ? currentFilename.replace(/\.[^.]+$/, `.${ext}`)
        : `recording.${ext}`;
      const uniqueFilename = generateUniqueFilename(baseFilename);
      const file = new File([blob], uniqueFilename, { type: blob.type });

      const result = await uploadAudio.mutateAsync({
        file,
        folder: folderRef.current,
        filename: uniqueFilename,
      });

      const currentOnAudioChange = onAudioChangeRef.current;
      if (currentOnAudioChange) {
        currentOnAudioChange(result.url, true);
      } else {
        onAudioUrlChangeRef.current(result.url);
        setIsCustomUpload(true);
      }
      toast.success("Recording saved!");
    } catch (error) {
      toast.error("Failed to save recording");
    } finally {
      setIsUploadingRecording(false);
    }
  };

  // Keep a stable ref so recorder.onstop always calls the latest version
  const handleSaveRecordingRef = useRef(handleSaveRecording);
  handleSaveRecordingRef.current = handleSaveRecording;

  // Auto-stop ref (needs to call handleStopRecording which is defined below)
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const actualMime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordingChunksRef.current, { type: actualMime });

        // Stop microphone
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        if (blob.size > 0) {
          // Use ref to avoid stale closure - always calls the latest version
          await handleSaveRecordingRef.current(blob);
        }
      };

      recorder.start(1000); // Collect data every second (more reliable for long recordings)
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Auto-stop after max duration
      autoStopTimerRef.current = setTimeout(() => {
        toast.info("Maximum recording time reached (10 minutes)");
        // Stop the recorder directly (handleStopRecording clears timers)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (error) {
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Playback & Clear ---

  const handlePlay = () => {
    const audioSrc = previewAudio || (audioUrl ? `https://dedownloads.s3.amazonaws.com/${audioUrl}` : null);
    if (!audioSrc) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleClearAudio = () => {
    if (onAudioChange) {
      onAudioChange("", false);
    } else {
      onAudioUrlChange("");
      setIsCustomUpload(false);
    }
    setPreviewAudio(null);
    setPreviewBase64(null);
  };

  const hasAudio = audioUrl || previewAudio;
  const isPending = generateAudio.isPending || saveAudio.isPending || uploadAudio.isPending || isUploadingRecording;

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Text Input (optional) */}
      {showTextInput && onTextChange && (
        <div className="space-y-1">
          <Label className="text-xs">{textLabel}</Label>
          <Input
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={textPlaceholder}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Recording {formatRecordingTime(recordingDuration)}
          </span>
          <div className="flex-1" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleStopRecording}
            className="h-7"
          >
            <IconPlayerStop className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      )}

      {/* Uploading recording indicator */}
      {isUploadingRecording && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <IconRefresh className="h-3 w-3 animate-spin" />
          <span className="text-xs text-muted-foreground">Uploading recording...</span>
        </div>
      )}

      {/* Voice Selection & Actions */}
      {!isRecording && !isUploadingRecording && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI generation controls (hidden when hideGeneration is true or custom audio uploaded) */}
          {!hideGeneration && !isCustomUpload && (
            <>
              <Select value={voice} onValueChange={(v) => setVoice(v as TTSVoice)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isPending || !text.trim()}
                className="h-8"
              >
                {(generateAudio.isPending || saveAudio.isPending) ? (
                  <IconRefresh className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <IconWand className="h-3 w-3 mr-1" />
                )}
                {generateAudio.isPending ? 'Generating...' : saveAudio.isPending ? 'Saving...' : 'Generate'}
              </Button>
            </>
          )}

          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,.mp3"
              onChange={handleUpload}
              className="hidden"
              disabled={isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="h-8"
              onClick={handleUploadClick}
            >
              {uploadAudio.isPending ? (
                <IconRefresh className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <IconUpload className="h-3 w-3 mr-1" />
              )}
              Upload
            </Button>
          </div>

          {/* Record button */}
          {showRecording && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="h-8"
              onClick={handleStartRecording}
            >
              <IconMicrophone className="h-3 w-3 mr-1" />
              Record
            </Button>
          )}
        </div>
      )}

      {/* Audio Preview/Status */}
      {hasAudio && !isRecording && !isUploadingRecording && (
        <div className="flex items-center gap-2 p-2 bg-background rounded border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePlay}
          >
            {isPlaying ? (
              <IconPlayerPause className="h-4 w-4" />
            ) : (
              <IconPlayerPlay className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 text-xs">
            {previewAudio ? (
              <span className="text-amber-600">Preview (not saved)</span>
            ) : isCustomUpload ? (
              <span className="text-blue-600 flex items-center">
                <IconCheck className="h-3 w-3 mr-1" />
                Custom Upload
              </span>
            ) : (
              <span className="text-green-600 flex items-center">
                <IconCheck className="h-3 w-3 mr-1" />
                Saved
              </span>
            )}
          </div>

          {previewAudio && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saveAudio.isPending}
              className="h-7 text-xs"
            >
              <IconDeviceFloppy className="h-3 w-3 mr-1" />
              Save
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClearAudio}
          >
            <IconX className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
