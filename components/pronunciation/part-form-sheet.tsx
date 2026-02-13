"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { IconTrash, IconCheck, IconRefresh, IconAlertCircle } from "@tabler/icons-react";
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

// Generate a unique ID for audio file paths (for new parts before they're saved)
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export function PartFormSheet({ open, onOpenChange, part, lessonId }: PartFormSheetProps) {
  // After a create succeeds, we store the new part ID so the sheet switches to "edit" mode
  const [createdPartId, setCreatedPartId] = useState<string | null>(null);
  const isEditing = part !== null || createdPartId !== null;

  const [step, setStep] = useState<'select-type' | 'edit-content'>('select-type');
  const [partType, setPartType] = useState<PronunciationPartType | null>(null);
  const [tempPartId, setTempPartId] = useState<string>(''); // Temporary ID for new parts' audio folders
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const deletePart = useDeletePart();

  // Ref to skip marking unsaved on initial form population
  const isInitialLoadRef = useRef(true);

  // Track unsaved changes (only for existing parts)
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (!isEditing) return;

    setSaveStatus('unsaved');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isEditing]);

  // Reset form when sheet opens/closes or part changes
  useEffect(() => {
    if (open) {
      isInitialLoadRef.current = true;
      setSaveStatus('idle');
      setCreatedPartId(null);
      if (part) {
        // Editing existing part - use its actual ID
        setTempPartId('');
        setPartType(part.partType);
        setFormData({
          title: part.title || "",
          description: part.description || "",
          isPublished: part.isPublished,
          content: part.content || {},
        });
        setStep('edit-content');
      } else {
        // Creating new part - generate a unique temp ID for audio folders
        setTempPartId(generateTempId());
        setPartType(null);
        setFormData({
          title: "",
          description: "",
          isPublished: false,
          content: {},
        });
        setStep('select-type');
      }
      // Allow a tick for the initial state to settle before tracking unsaved changes
      setTimeout(() => { isInitialLoadRef.current = false; }, 100);
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
        initialContent = { quizType: 'single_word', questions: [] };
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
      const editId = part?.id || createdPartId;
      if (editId) {
        // Update existing part (or a part we just created in this session)
        setSaveStatus('saving');
        await updatePart.mutateAsync({
          id: editId,
          data: {
            title: formData.title || null,
            description: formData.description || null,
            isPublished: formData.isPublished,
            content: formData.content,
          } as UpdatePartPayload,
        });
        setSaveStatus('saved');
        toast.success("Part updated successfully");
      } else {
        // Create new part
        const newPart = await createPart.mutateAsync({
          lessonId: lessonId!,
          partType,
          title: formData.title || null,
          description: formData.description || null,
          isPublished: formData.isPublished,
          content: formData.content,
        } as CreatePartPayload);
        // Switch to edit mode so further saves update instead of creating again
        setCreatedPartId(newPart.id);
        setSaveStatus('saved');
        toast.success("Part created successfully");
      }
    } catch (error) {
      setSaveStatus('error');
      toast.error(isEditing ? "Failed to update part" : "Failed to create part");
    }
  };

  const handleClose = useCallback((openState: boolean) => {
    onOpenChange(openState);
  }, [onOpenChange]);

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
            partId={part?.id || createdPartId || tempPartId}
          />
        );
      case 'listen_repeat':
        return (
          <ListenRepeatForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            partId={part?.id || createdPartId || tempPartId}
          />
        );
      case 'pronunciation_quiz':
        return (
          <PronunciationQuizForm
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            partId={part?.id || createdPartId || tempPartId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-2xl flex flex-col p-0">
          <SheetHeader className="px-6 pt-6">
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

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6">
            {step === 'select-type' ? (
              <div className="grid grid-cols-2 gap-4 mt-6 pb-6">
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
              <div className="space-y-6 mt-6 pb-6">
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
              </div>
            )}
          </div>

          {/* Sticky Footer - always visible */}
          {step === 'edit-content' && (
            <SheetFooter className="border-t px-6 py-4 bg-background flex-row gap-2 items-center">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}

              {/* Auto-save status indicator (only for existing parts) */}
              {isEditing && (
                <div className="flex items-center gap-1.5 text-xs px-2">
                  {saveStatus === 'unsaved' && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Unsaved changes
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <IconRefresh className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <IconCheck className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      Save failed
                    </span>
                  )}
                </div>
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
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {isEditing ? "Close" : "Cancel"}
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Save Now" : "Create"}
              </Button>
            </SheetFooter>
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
