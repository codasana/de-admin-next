"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  IconPlus, 
  IconTrash, 
  IconChevronUp, 
  IconChevronDown, 
  IconChevronRight,
  IconClock, 
  IconRefresh,
  IconCheck,
  IconX,
  IconList,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { AudioGenerator } from "../audio-generator";
import { useTranscribeAudio } from "@/hooks/usePronunciationAdmin";
import type { 
  PartContent, 
  ListenRepeatContent, 
  ListenRepeatItem, 
  ListenRepeatSegment, 
  RawWordTimestamp, 
  TTSVoice 
} from "@/types/pronunciation";

interface ListenRepeatFormProps {
  content: PartContent;
  onChange: (content: ListenRepeatContent) => void;
  partId?: string;
}

export function ListenRepeatForm({ content, onChange, partId }: ListenRepeatFormProps) {
  const listenRepeatContent = content as ListenRepeatContent;
  const items = listenRepeatContent.items || [];
  
  const transcribeAudio = useTranscribeAudio();

  // Collapsible state
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  // Track which raw words sections are expanded (UI state only)
  const [showRawWordsMap, setShowRawWordsMap] = useState<Record<number, boolean>>({});

  // Refs for auto-timestamp (read latest content without stale closures)
  const contentRef = useRef(listenRepeatContent);
  contentRef.current = listenRepeatContent;

  const allExpanded = items.length > 0 && expandedItems.size === items.length;

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(items.map((_, i) => i)));
    }
  }, [allExpanded, items]);

  const toggleItem = useCallback((index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleAddItem = () => {
    const newIndex = items.length;
    setExpandedItems(prev => new Set(prev).add(newIndex));
    onChange({
      ...listenRepeatContent,
      items: [...items, { label: "", text: "", audioUrl: "", voice: "echo", isCustomAudio: false, segments: [] }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setExpandedItems(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const handleItemChange = (
    index: number, 
    field: keyof ListenRepeatItem, 
    value: string | TTSVoice | ListenRepeatSegment[] | RawWordTimestamp[] | boolean
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Clear segments and rawWords when text or audio changes
    if (field === 'text' || field === 'audioUrl') {
      newItems[index].segments = [];
      newItems[index].rawWords = [];
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
    setExpandedItems(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i === index) next.add(newIndex);
        else if (i === newIndex) next.add(index);
        else next.add(i);
      });
      return next;
    });
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  // Get timestamps - reads from refs to avoid stale closures when called from onAudioChange
  const handleGetTimestamps = async (index: number, overrideAudioUrl?: string, overrideText?: string) => {
    const latestContent = contentRef.current;
    const latestItems = latestContent.items || [];
    const item = latestItems[index];

    const audioUrl = overrideAudioUrl || item?.audioUrl;
    const text = overrideText || item?.text;
    
    if (!audioUrl) {
      toast.error("Please save audio first");
      return;
    }
    
    if (!text?.trim()) {
      toast.error("Please enter text first");
      return;
    }

    try {
      const result = await transcribeAudio.mutateAsync({
        audioUrl,
        text,
      });

      // Read latest content to avoid overwriting concurrent changes
      const currentContent = contentRef.current;
      const currentItems = [...(currentContent.items || [])];
      const currentItem = currentItems[index];

      // Only update if audio hasn't changed since we started
      if (currentItem && currentItem.audioUrl === audioUrl) {
        currentItems[index] = { 
          ...currentItem, 
          segments: result.segments,
          rawWords: result.rawWords || []
        };
        onChange({
          ...currentContent,
          items: currentItems,
        });

        if (result.rawWords && result.rawWords.length > 0) {
          setShowRawWordsMap(prev => ({ ...prev, [index]: true }));
        }

        toast.success(`Got timestamps for ${result.segments.length} lines`);
      }
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
      <div className="space-y-2">
        {/* Header: label + expand/collapse all */}
        <div className="flex items-center justify-between">
          <Label>Items ({items.length})</Label>
          {items.length > 0 && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <IconList className="h-3.5 w-3.5" />
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        {/* Item list */}
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm mb-3">No items yet</p>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((item, index) => {
                const isExpanded = expandedItems.has(index);
                const hasText = !!item.text?.trim();
                const hasAudio = !!item.audioUrl;
                const hasTimestamps = !!(item.segments && item.segments.length > 0);

                return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {/* Collapsed header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleItem(index)}
                    >
                      <IconChevronRight
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="font-medium text-sm shrink-0">
                        {index + 1}.
                      </span>
                      {(item.label || item.text?.trim()) && (
                        <span className="text-sm text-muted-foreground truncate max-w-[160px]">
                          {item.label || (item.text!.trim().split(/\s+/).slice(0, 3).join(' ') + (item.text!.trim().split(/\s+/).length > 3 ? '...' : ''))}
                        </span>
                      )}

                      {/* Status badges */}
                      <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-end mr-1">
                        <StatusBadge ok={hasText} label="Text" />
                        <StatusBadge ok={hasAudio} label="Audio" />
                        <StatusBadge ok={hasTimestamps} label="Timestamps" />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <IconChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === items.length - 1}
                        >
                          <IconChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3">
                        {/* Label (optional) */}
                        <div className="space-y-1">
                          <Label className="text-xs">Label (optional)</Label>
                          <Input
                            value={item.label || ""}
                            onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                            placeholder=""
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Text */}
                        <div className="space-y-1">
                          <Label className="text-xs">Text (use line breaks for each phrase)</Label>
                          <Textarea
                            value={item.text}
                            onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                            placeholder="Enter text with line breaks"
                            rows={4}
                            className="font-mono text-sm"
                          />
                          {item.text && (
                            <p className="text-xs text-muted-foreground">
                              {item.text.split('\n').filter(l => l.trim()).length} lines
                            </p>
                          )}
                        </div>

                        {/* Audio - no AI generation, with recording */}
                        <AudioGenerator
                          text={item.text}
                          audioUrl={item.audioUrl}
                          onAudioUrlChange={(url) => handleItemChange(index, 'audioUrl', url)}
                          voice={item.voice || "echo"}
                          onVoiceChange={(v) => handleItemChange(index, 'voice', v)}
                          isCustomAudio={item.isCustomAudio || false}
                          onAudioChange={(url, isCustom) => {
                            const newItems = [...items];
                            newItems[index] = { 
                              ...newItems[index], 
                              audioUrl: url,
                              isCustomAudio: isCustom,
                              segments: [],
                              rawWords: []
                            };
                            onChange({ ...listenRepeatContent, items: newItems });

                            // Auto-trigger timestamps if audio and text are ready
                            if (url && newItems[index].text?.trim()) {
                              // Small delay to let the state commit first
                              setTimeout(() => {
                                handleGetTimestamps(index, url, newItems[index].text);
                              }, 200);
                            }
                          }}
                          folder={audioFolder}
                          filename={`item-${index + 1}.mp3`}
                          showTextInput={false}
                          hideGeneration
                          showRecording
                        />

                        {/* Get Timestamps Button (manual trigger / regenerate) */}
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

                        {/* Raw Word Timestamps (collapsible) */}
                        {item.rawWords && item.rawWords.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <div 
                              className="flex items-center gap-2 cursor-pointer select-none"
                              onClick={() => toggleRawWords(index)}
                            >
                              <IconChevronRight className={`h-4 w-4 transition-transform ${showRawWordsMap[index] ? 'rotate-90' : ''}`} />
                              <Label className="text-xs text-orange-600 cursor-pointer">
                                Raw Word Timestamps ({item.rawWords.length} words)
                              </Label>
                            </div>
                            {showRawWordsMap[index] && (
                              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                                <div className="flex flex-wrap gap-1">
                                  {item.rawWords.map((word, wIndex) => (
                                    <span 
                                      key={wIndex}
                                      className="text-xs bg-white dark:bg-background px-2 py-1 rounded border inline-flex items-center gap-1"
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
                        )}

                        {/* Timestamped Segments (editable) */}
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

                        {/* Enable Recording Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <Label htmlFor={`recording-${index}`} className="text-xs">Enable Recording</Label>
                            <p className="text-xs text-muted-foreground">
                              Allow users to record and compare their voice
                            </p>
                          </div>
                          <Switch
                            id={`recording-${index}`}
                            checked={item.enableRecording || false}
                            onCheckedChange={(checked) => handleItemChange(index, 'enableRecording', checked)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom: Add Item */}
            <div className="flex items-center gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <IconPlus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Compact status badge: green check or red x */
function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] shrink-0 ${
        ok
          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? <IconCheck className="h-3 w-3" /> : <IconX className="h-3 w-3" />}
      {label}
    </span>
  );
}
