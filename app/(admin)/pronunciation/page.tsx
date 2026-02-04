"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminSections, useReorderSections } from "@/hooks/usePronunciationAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  IconPlus, 
  IconChevronUp, 
  IconChevronDown,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconChevronRight,
  IconBook,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionFormSheet } from "@/components/pronunciation/section-form-sheet";
import type { PronunciationSection } from "@/types/pronunciation";

export default function PronunciationPage() {
  const { data: sections, isLoading, error } = useAdminSections();
  const reorderSections = useReorderSections();

  const [sectionSheetOpen, setSectionSheetOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PronunciationSection | null>(null);

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionSheetOpen(true);
  };

  const handleEditSection = (section: PronunciationSection, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSection(section);
    setSectionSheetOpen(true);
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sections) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newOrder = [...sections];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    try {
      await reorderSections.mutateAsync({
        orderedIds: newOrder.map(s => s.id)
      });
      toast.success('Section order updated');
    } catch {
      toast.error('Failed to reorder sections');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading sections: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pronunciation Course</h1>
          <p className="text-muted-foreground">Manage sections and their content</p>
        </div>
        <Button onClick={handleAddSection}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sections && sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Link key={section.id} href={`/pronunciation/${section.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer my-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMoveSection(index, 'up', e)}
                        disabled={index === 0 || reorderSections.isPending}
                      >
                        <IconChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMoveSection(index, 'down', e)}
                        disabled={index === sections.length - 1 || reorderSections.isPending}
                      >
                        <IconChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Section Image */}
                    {section.imageUrl ? (
                      <img
                        src={`https://dedownloads.s3.amazonaws.com/${section.imageUrl}`}
                        alt={section.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <IconBook className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Section Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{section.title}</h3>
                        <Badge variant={section.isPublished ? "default" : "secondary"} className="shrink-0">
                          {section.isPublished ? (
                            <><IconEye className="h-3 w-3 mr-1" /> Published</>
                          ) : (
                            <><IconEyeOff className="h-3 w-3 mr-1" /> Draft</>
                          )}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm text-muted-foreground truncate">{section.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.lessons?.length || 0} lesson{(section.lessons?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditSection(section, e)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <IconChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No sections yet. Create your first section to get started.</p>
            <Button onClick={handleAddSection}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section Form Sheet */}
      <SectionFormSheet
        open={sectionSheetOpen}
        onOpenChange={setSectionSheetOpen}
        section={editingSection}
      />
    </div>
  );
}
