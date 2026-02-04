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
import { useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/hooks/usePronunciationAdmin";
import { IconTrash } from "@tabler/icons-react";
import type { PronunciationLesson, CreateLessonPayload, UpdateLessonPayload } from "@/types/pronunciation";
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

interface LessonFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: PronunciationLesson | null;
  sectionId: string | null;
}

export function LessonFormSheet({ open, onOpenChange, lesson, sectionId }: LessonFormSheetProps) {
  const isEditing = lesson !== null;

  const [formData, setFormData] = useState<CreateLessonPayload | UpdateLessonPayload>({
    sectionId: "",
    title: "",
    description: "",
    isPublished: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // Reset form when sheet opens/closes or lesson changes
  useEffect(() => {
    if (open) {
      if (lesson) {
        setFormData({
          sectionId: lesson.sectionId,
          title: lesson.title,
          description: lesson.description || "",
          isPublished: lesson.isPublished,
        });
      } else {
        setFormData({
          sectionId: sectionId || "",
          title: "",
          description: "",
          isPublished: false,
        });
      }
    }
  }, [open, lesson, sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!isEditing && !formData.sectionId) {
      toast.error("Section is required");
      return;
    }

    try {
      if (isEditing && lesson) {
        await updateLesson.mutateAsync({
          id: lesson.id,
          data: formData as UpdateLessonPayload,
        });
        toast.success("Lesson updated successfully");
      } else {
        await createLesson.mutateAsync(formData as CreateLessonPayload);
        toast.success("Lesson created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update lesson" : "Failed to create lesson");
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;

    try {
      await deleteLesson.mutateAsync(lesson.id);
      toast.success("Lesson deleted successfully");
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
  };

  const isPending = createLesson.isPending || updateLesson.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit Lesson" : "Create Lesson"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Update the lesson details below."
                : "Add a new lesson to this section."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6 mx-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Lesson 1, Lesson 2, etc."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this lesson..."
                rows={3}
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published">Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make this lesson visible to users
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.isPublished || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublished: checked }))
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lesson "{lesson?.title}" and all its parts.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLesson.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
