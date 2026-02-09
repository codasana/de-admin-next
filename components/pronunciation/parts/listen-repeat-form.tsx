"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconClock, IconRefresh, IconChevronRight } from "@tabler/icons-react";
import { toast } from "sonner";
import { AudioGenerator } from "../audio-generator";
import { useTranscribeAudio } from "@/hooks/usePronunciationAdmin";
import type { PartContent, ListenRepeatContent, ListenRepeatItem, ListenRepeatSegment, TTSVoice } from "@/types/pronunciation";

interface RawWord {
  word: string;
  start: number;
  end: number;
}

interface ListenRepeatFormProps {
  content: PartContent;
  onChange: (content: ListenRepeatContent) => void;
  partId?: string;
}

export function ListenRepeatForm({ content, onChange, partId }: ListenRepeatFormProps) {
  const listenRepeatContent = content as ListenRepeatContent;
  const items = listenRepeatContent.items || [];
  
  const transcribeAudio = useTranscribeAudio();
  
  // Store raw word timestamps temporarily (per item index)
  const [rawWordsMap, setRawWordsMap] = useState<Record<number, RawWord[]>>({});
  const [showRawWordsMap, setShowRawWordsMap] = useState<Record<number, boolean>>({});

  const handleAddItem = () => {
    onChange({
      ...listenRepeatContent,
      items: [...items, { label: "", text: "", audioUrl: "", voice: "nova", isCustomAudio: false, segments: [] }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const handleItemChange = (
    index: number, 
    field: keyof ListenRepeatItem, 
    value: string | TTSVoice | ListenRepeatSegment[] | boolean
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Clear segments when text or audio changes
    if (field === 'text' || field === 'audioUrl') {
      newItems[index].segments = [];
    }
    
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const handleGetTimestamps = async (index: number) => {
    const item = items[index];
    
    if (!item.audioUrl) {
      toast.error("Please save audio first");
      return;
    }
    
    if (!item.text?.trim()) {
      toast.error("Please enter text first");
      return;
    }

    try {
      const result = await transcribeAudio.mutateAsync({
        audioUrl: item.audioUrl,
        text: item.text,
      });

      // Store raw words temporarily (not saved to DB)
      if (result.rawWords && result.rawWords.length > 0) {
        setRawWordsMap(prev => ({ ...prev, [index]: result.rawWords! }));
        setShowRawWordsMap(prev => ({ ...prev, [index]: true }));
      }

      // Update the item with segments
      const newItems = [...items];
      newItems[index] = { 
        ...newItems[index], 
        segments: result.segments 
      };
      onChange({
        ...listenRepeatContent,
        items: newItems,
      });

      toast.success(`Got timestamps for ${result.segments.length} lines`);
    } catch (error) {
      toast.error("Failed to get timestamps");
    }
  };

  const handleSegmentChange = (itemIndex: number, segmentIndex: number, field: 'start' | 'end', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    const newItems = [...items];
    const newSegments = [...(newItems[itemIndex].segments || [])];
    newSegments[segmentIndex] = { ...newSegments[segmentIndex], [field]: numValue };
    newItems[itemIndex] = { ...newItems[itemIndex], segments: newSegments };
    
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const toggleRawWords = (index: number) => {
    setShowRawWordsMap(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  };

  const audioFolder = `pronunciation/audio/${partId || 'new'}`;

  return (
    <div className="space-y-4">
      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <IconPlus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">No items yet</p>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Item {index + 1}{item.label && <span className="text-muted-foreground font-normal"> — {item.label}</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <IconChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === items.length - 1}
                    >
                      <IconChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Label (optional) */}
                <div className="space-y-1">
                  <Label className="text-xs">Label (optional) (Enter only if required to be displayed)</Label>
                  <Input
                    value={item.label || ""}
                    onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                    placeholder=""
                    className="h-8 text-sm"
                  />
                </div>

                {/* Text - multi-line with line breaks */}
                <div className="space-y-1">
                  <Label className="text-xs">Text (use line breaks for each phrase)</Label>
                  <Textarea
                    value={item.text}
                    onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                    placeholder={`Enter text with line breaks`}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  {item.text && (
                    <p className="text-xs text-muted-foreground">
                      {item.text.split('\n').filter(l => l.trim()).length} lines
                    </p>
                  )}
                </div>

                {/* Audio */}
                <AudioGenerator
                  text={item.text}
                  audioUrl={item.audioUrl}
                  onAudioUrlChange={(url) => handleItemChange(index, 'audioUrl', url)}
                  voice={item.voice || "nova"}
                  onVoiceChange={(v) => handleItemChange(index, 'voice', v)}
                  isCustomAudio={item.isCustomAudio || false}
                  onAudioChange={(url, isCustom) => {
                    // Combined update to prevent race conditions
                    const newItems = [...items];
                    newItems[index] = { 
                      ...newItems[index], 
                      audioUrl: url,
                      isCustomAudio: isCustom,
                      segments: [] // Clear segments when audio changes
                    };
                    onChange({ ...listenRepeatContent, items: newItems });
                  }}
                  folder={audioFolder}
                  filename={`item-${index + 1}.mp3`}
                  showTextInput={false}
                />

                {/* Get Timestamps Button */}
                {item.audioUrl && item.text && (
                  <div className="pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetTimestamps(index)}
                      disabled={transcribeAudio.isPending}
                      className="w-full"
                    >
                      {transcribeAudio.isPending ? (
                        <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <IconClock className="h-4 w-4 mr-2" />
                      )}
                      {item.segments && item.segments.length > 0 
                        ? "Regenerate Timestamps" 
                        : "Get Timestamps from Audio"}
                    </Button>
                  </div>
                )}

                {/* Show Raw Word Timestamps (temporary, for review) */}
                {/*rawWordsMap[index] && rawWordsMap[index].length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div 
                      className="flex items-center gap-2 cursor-pointer select-none"
                      onClick={() => toggleRawWords(index)}
                    >
                      <IconChevronRight className={`h-4 w-4 transition-transform ${showRawWordsMap[index] ? 'rotate-90' : ''}`} />
                      <Label className="text-xs text-orange-600 cursor-pointer">
                        Raw Word Timestamps ({rawWordsMap[index].length} words) - For Review Only
                      </Label>
                    </div>
                    {showRawWordsMap[index] && (
                      <div className="bg-orange-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {rawWordsMap[index].map((word, wIndex) => (
                            <span 
                              key={wIndex}
                              className="text-xs bg-white px-2 py-1 rounded border inline-flex items-center gap-1"
                              title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
                            >
                              <span className="font-medium">{word.word}</span>
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {word.start.toFixed(2)}s
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )*/}

                {/* Show Segments with editable timestamps */}
                {item.segments && item.segments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs text-green-600">Timestamped Segments (editable)</Label>
                    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                      {item.segments.map((segment, sIndex) => (
                        <div 
                          key={sIndex} 
                          className="flex items-center gap-2 text-sm py-1 border-b last:border-0"
                        >
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={segment.start}
                              onChange={(e) => handleSegmentChange(index, sIndex, 'start', e.target.value)}
                              className="w-20 h-7 text-xs font-mono"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={segment.end}
                              onChange={(e) => handleSegmentChange(index, sIndex, 'end', e.target.value)}
                              className="w-20 h-7 text-xs font-mono"
                            />
                          </div>
                          <span className="flex-1 text-sm">{segment.line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
