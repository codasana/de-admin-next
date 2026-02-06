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
import { useCreateSection, useUpdateSection, useDeleteSection, useUploadImage } from "@/hooks/usePronunciationAdmin";
import { IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import type { PronunciationSection, CreateSectionPayload, UpdateSectionPayload } from "@/types/pronunciation";
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

interface SectionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: PronunciationSection | null;
}

export function SectionFormSheet({ open, onOpenChange, section }: SectionFormSheetProps) {
  const isEditing = section !== null;

  const [formData, setFormData] = useState<CreateSectionPayload | UpdateSectionPayload>({
    title: "",
    description: "",
    imageUrl: "",
    isPublished: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const uploadImage = useUploadImage();

  // Reset form when sheet opens/closes or section changes
  useEffect(() => {
    if (open) {
      if (section) {
        setFormData({
          title: section.title,
          description: section.description || "",
          imageUrl: section.imageUrl || "",
          isPublished: section.isPublished,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          imageUrl: "",
          isPublished: false,
        });
      }
    }
  }, [open, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      if (isEditing && section) {
        await updateSection.mutateAsync({
          id: section.id,
          data: formData as UpdateSectionPayload,
        });
        toast.success("Section updated successfully");
      } else {
        await createSection.mutateAsync(formData as CreateSectionPayload);
        toast.success("Section created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update section" : "Failed to create section");
    }
  };

  const handleDelete = async () => {
    if (!section) return;

    try {
      await deleteSection.mutateAsync(section.id);
      toast.success("Section deleted successfully");
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image type. Allowed: jpg, png, webp");
      return;
    }

    try {
      const result = await uploadImage.mutateAsync({
        file,
        folder: "pronunciation/sections",
      });
      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const isPending = createSection.isPending || updateSection.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>{isEditing ? "Edit Section" : "Create Section"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Update the section details below."
                : "Add a new section to your pronunciation course."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-6 mt-6 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Week 1, Week 2, etc."
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
                  placeholder="Optional description for this section..."
                  rows={3}
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Section Image</Label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={`https://dedownloads.s3.amazonaws.com/${formData.imageUrl}`}
                      alt="Section"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadImage.isPending}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <IconUpload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploadImage.isPending ? "Uploading..." : "Click to upload image"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max 2MB, jpg/png/webp
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this section visible to users
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
            </div>

            {/* Sticky Footer */}
            <SheetFooter className="border-t px-6 py-4 bg-background flex-row gap-2">
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
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the section "{section?.title}" and all its lessons and
              parts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSection.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
