"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PartContent, VideoContent } from "@/types/pronunciation";

interface VideoPartFormProps {
  content: PartContent;
  onChange: (content: VideoContent) => void;
}

export function VideoPartForm({ content, onChange }: VideoPartFormProps) {
  const videoContent = content as VideoContent;

  // Extract Vimeo ID from URL if pasted
  const handleVimeoInput = (value: string) => {
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const match = value.match(vimeoRegex);
    
    onChange({
      ...videoContent,
      vimeoVideoId: match ? match[1] : value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Vimeo Video ID */}
      <div className="space-y-2">
        <Label htmlFor="vimeoId">Vimeo Video ID *</Label>
        <Input
          id="vimeoId"
          value={videoContent.vimeoVideoId || ""}
          onChange={(e) => handleVimeoInput(e.target.value)}
          placeholder="Enter Vimeo ID or paste Vimeo URL"
        />
        <p className="text-xs text-muted-foreground">
          You can paste a full Vimeo URL and we'll extract the ID automatically
        </p>
      </div>

      {/* Video Preview */}
      {videoContent.vimeoVideoId && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`https://player.vimeo.com/video/${videoContent.vimeoVideoId}`}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
