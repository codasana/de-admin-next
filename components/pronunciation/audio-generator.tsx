"use client";

import { useState, useRef } from "react";
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

  const generateAudio = useGenerateAudio();
  const saveAudio = useSaveAudio();
  const uploadAudio = useUploadAudio();

  // Generate a unique suffix for filenames to prevent collisions
  const generateUniqueFilename = (baseFilename: string): string => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ext = baseFilename.endsWith('.mp3') ? '' : '.mp3';
    const nameWithoutExt = baseFilename.replace(/\.mp3$/i, '');
    return `${nameWithoutExt}-${uniqueSuffix}${ext || '.mp3'}`;
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter text to generate audio");
      return;
    }

    try {
      const result = await generateAudio.mutateAsync({ text: text.trim(), voice });
      const audioDataUrl = `data:${result.mimeType};base64,${result.audioBase64}`;
      setPreviewAudio(audioDataUrl);
      setPreviewBase64(result.audioBase64);
      toast.success("Audio generated! Click play to preview.");
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
      
      // Use combined callback if available (prevents race conditions)
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
      // Generate unique filename based on the prop filename or a default
      const baseFilename = filename || 'upload.mp3';
      const uniqueFilename = generateUniqueFilename(baseFilename);
      
      const result = await uploadAudio.mutateAsync({ file, folder, filename: uniqueFilename });
      
      // Use combined callback if available (prevents race conditions)
      if (onAudioChange) {
        onAudioChange(result.url, true);
      } else {
        // Fallback to separate callbacks
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
      // Reset file input to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
    // Use combined callback if available (prevents race conditions)
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
  const isPending = generateAudio.isPending || saveAudio.isPending || uploadAudio.isPending;

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

      {/* Voice Selection & Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Hide AI generation controls when custom audio is uploaded */}
        {!isCustomUpload && (
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
              {generateAudio.isPending ? (
                <IconRefresh className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <IconWand className="h-3 w-3 mr-1" />
              )}
              Generate
            </Button>
          </>
        )}

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
      </div>

      {/* Audio Preview/Status */}
      {hasAudio && (
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
