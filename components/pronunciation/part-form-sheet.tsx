"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCreatePart, useUpdatePart, useDeletePart } from "@/hooks/usePronunciationAdmin";
import { IconTrash } from "@tabler/icons-react";
import { PART_TYPE_CONFIGS } from "@/types/pronunciation";
import type { 
  PronunciationPart, 
  PronunciationPartType,
  CreatePartPayload, 
  UpdatePartPayload,
  PartContent,
} from "@/types/pronunciation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VideoPartForm } from "./parts/video-form";
import { RecognitionQuizForm } from "./parts/recognition-quiz-form";
import { ListenRepeatForm } from "./parts/listen-repeat-form";
import { PronunciationQuizForm } from "./parts/pronunciation-quiz-form";

interface PartFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PronunciationPart | null;
  lessonId: string | null;
}

export function PartFormSheet({ open, onOpenChange, part, lessonId }: PartFormSheetProps) {
  const isEditing = part !== null;

  const [step, setStep] = useState<'select-type' | 'edit-content'>('select-type');
  const [partType, setPartType] = useState<PronunciationPartType | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    isPublished: boolean;
    content: PartContent;
  }>({
    title: "",
    description: "",
    isPublished: false,
    content: {},
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const deletePart = useDeletePart();

  // Reset form when sheet opens/closes or part changes
  useEffect(() => {
    if (open) {
      if (part) {
        setPartType(part.partType);
        setFormData({
          title: part.title || "",
          description: part.description || "",
          isPublished: part.isPublished,
          content: part.content || {},
        });
        setStep('edit-content');
      } else {
        setPartType(null);
        setFormData({
          title: "",
          description: "",
          isPublished: false,
          content: {},
        });
        setStep('select-type');
      }
    }
  }, [open, part]);

  const handleSelectType = (type: PronunciationPartType) => {
    setPartType(type);
    // Initialize content based on type
    let initialContent: PartContent = {};
    switch (type) {
      case 'video':
        initialContent = { vimeoVideoId: '' };
        break;
      case 'recognition_quiz':
        initialContent = { questions: [] };
        break;
      case 'listen_repeat':
        initialContent = { items: [] };
        break;
      case 'pronunciation_quiz':
        initialContent = { questions: [] };
        break;
    }
    setFormData(prev => ({ ...prev, content: initialContent }));
    setStep('edit-content');
  };

  const handleSubmit = async () => {
    if (!partType) {
      toast.error("Part type is required");
      return;
    }

    if (!lessonId && !isEditing) {
      toast.error("Lesson is required");
      return;
    }

    try {
      if (isEditing && part) {
        await updatePart.mutateAsync({
          id: part.id,
          data: {
            title: formData.title || null,
            description: formData.description || null,
            isPublished: formData.isPublished,
            content: formData.content,
          } as UpdatePartPayload,
        });
        toast.success("Part updated successfully");
      } else {
        await createPart.mutateAsync({
          lessonId: lessonId!,
          partType,
          title: formData.title || null,
          description: formData.description || null,
          isPublished: formData.isPublished,
          content: formData.content,
        } as CreatePartPayload);
        toast.success("Part created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update part" : "Failed to create part");
    }
  };

  const handleDelete = async () => {
    if (!part) return;

    try {
      await deletePart.mutateAsync(part.id);
      toast.success("Part deleted successfully");
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete part");
    }
  };

  const isPending = createPart.isPending || updatePart.isPending;

  const renderPartTypeContent = () => {
    if (!partType) return null;

    switch (partType) {
      case 'video':
        return (
          <VideoPartForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          />
        );
      case 'recognition_quiz':
        return (
          <RecognitionQuizForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            partId={part?.id}
          />
        );
      case 'listen_repeat':
        return (
          <ListenRepeatForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            partId={part?.id}
          />
        );
      case 'pronunciation_quiz':
        return (
          <PronunciationQuizForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            partId={part?.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {step === 'select-type' 
                ? "Select Part Type" 
                : isEditing 
                  ? "Edit Part" 
                  : "Create Part"}
            </SheetTitle>
            <SheetDescription>
              {step === 'select-type'
                ? "Choose the type of content for this part."
                : isEditing
                  ? "Update the part content below."
                  : "Configure the content for this part."}
            </SheetDescription>
          </SheetHeader>

          {step === 'select-type' ? (
            <div className="grid grid-cols-2 gap-4 mt-6 mx-4">
              {PART_TYPE_CONFIGS.map((config) => (
                <button
                  key={config.type}
                  onClick={() => handleSelectType(config.type)}
                  className="p-6 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <h3 className="font-medium">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 mt-6 mx-4">
              {/* Part Type Badge */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-2xl">
                  {PART_TYPE_CONFIGS.find(c => c.type === partType)?.icon}
                </span>
                <div>
                  <div className="font-medium">
                    {PART_TYPE_CONFIGS.find(c => c.type === partType)?.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {PART_TYPE_CONFIGS.find(c => c.type === partType)?.description}
                  </div>
                </div>
              </div>

              {/* Title (optional) */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Custom title for this part..."
                />
              </div>

              {/* Part-specific content */}
              {renderPartTypeContent()}

              {/* Published Toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this part visible to users
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isPublished: checked }))
                  }
                />
              </div>

              <SheetFooter className="gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isPending}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <div className="flex-1" />
                {!isEditing && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('select-type')}
                  >
                    Back
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this part and all its content.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePart.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
