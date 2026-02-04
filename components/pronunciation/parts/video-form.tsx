"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PartContent, VideoContent } from "@/types/pronunciation";

interface VideoPartFormProps {
  content: PartContent;
  onChange: (content: VideoContent) => void;
}

export function VideoPartForm({ content, onChange }: VideoPartFormProps) {
  const videoContent = content as VideoContent;

  const handleChange = (field: keyof VideoContent, value: string) => {
    onChange({
      ...videoContent,
      [field]: value,
    });
  };

  // Extract Vimeo ID from URL if pasted
  const handleVimeoInput = (value: string) => {
    // Check if it's a Vimeo URL
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const match = value.match(vimeoRegex);
    
    if (match) {
      handleChange('vimeoVideoId', match[1]);
    } else {
      handleChange('vimeoVideoId', value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Title */}
      <div className="space-y-2">
        <Label htmlFor="videoTitle">Video Title (optional)</Label>
        <Input
          id="videoTitle"
          value={videoContent.title || ""}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Title shown above the video..."
        />
      </div>

      {/* Video Description */}
      <div className="space-y-2">
        <Label htmlFor="videoDescription">Description (optional)</Label>
        <Textarea
          id="videoDescription"
          value={videoContent.description || ""}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description shown below the title..."
          rows={2}
        />
      </div>

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
