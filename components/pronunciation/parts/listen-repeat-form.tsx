"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { AudioGenerator } from "../audio-generator";
import type { PartContent, ListenRepeatContent, ListenRepeatItem } from "@/types/pronunciation";

interface ListenRepeatFormProps {
  content: PartContent;
  onChange: (content: ListenRepeatContent) => void;
  partId?: string;
}

export function ListenRepeatForm({ content, onChange, partId }: ListenRepeatFormProps) {
  const listenRepeatContent = content as ListenRepeatContent;
  const items = listenRepeatContent.items || [];

  const handleAddItem = () => {
    onChange({
      ...listenRepeatContent,
      items: [...items, { text: "", audioUrl: "" }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange({
      ...listenRepeatContent,
      items: newItems,
    });
  };

  const handleItemChange = (index: number, field: keyof ListenRepeatItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
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
                  <span className="text-sm font-medium">Item {index + 1}</span>
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

                {/* Text - used both for display and TTS */}
                <div className="space-y-1">
                  <Label className="text-xs">Text (displayed & used for audio)</Label>
                  <Textarea
                    value={item.text}
                    onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                    placeholder="Enter the phrase or sentence..."
                    rows={2}
                  />
                </div>

                {/* Audio */}
                <AudioGenerator
                  text={item.text}
                  audioUrl={item.audioUrl}
                  onAudioUrlChange={(url) => handleItemChange(index, 'audioUrl', url)}
                  folder={audioFolder}
                  filename={`item-${index + 1}.mp3`}
                  showTextInput={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
