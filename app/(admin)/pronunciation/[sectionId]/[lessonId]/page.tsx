"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAdminLesson, useAdminParts, useReorderParts } from "@/hooks/usePronunciationAdmin";
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
  IconArrowLeft,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { LessonFormSheet } from "@/components/pronunciation/lesson-form-sheet";
import { PartFormSheet } from "@/components/pronunciation/part-form-sheet";
import { getPartTypeIcon, getPartTypeLabel } from "@/types/pronunciation";
import type { PronunciationPart } from "@/types/pronunciation";

export default function LessonDetailPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const lessonId = params.lessonId as string;

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAdminLesson(lessonId);
  const { data: parts, isLoading: partsLoading } = useAdminParts(lessonId);
  const reorderParts = useReorderParts();

  const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
  const [partSheetOpen, setPartSheetOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PronunciationPart | null>(null);

  const handleEditLesson = () => {
    setLessonSheetOpen(true);
  };

  const handleAddPart = () => {
    setEditingPart(null);
    setPartSheetOpen(true);
  };

  const handleEditPart = (part: PronunciationPart) => {
    setEditingPart(part);
    setPartSheetOpen(true);
  };

  const handleMovePart = async (index: number, direction: 'up' | 'down') => {
    if (!parts) return;
    
    const sortedParts = [...parts].sort((a, b) => a.order - b.order);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedParts.length) return;

    const newOrder = [...sortedParts];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    try {
      await reorderParts.mutateAsync({
        lessonId,
        orderedIds: newOrder.map(p => p.id)
      });
      toast.success('Part order updated');
    } catch {
      toast.error('Failed to reorder parts');
    }
  };

  if (lessonError) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading lesson: {lessonError.message}</div>
      </div>
    );
  }

  const isLoading = lessonLoading || partsLoading;
  const sortedParts = parts?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <Link 
          href={`/pronunciation/${sectionId}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="h-4 w-4 mr-1" />
          Back to {lesson?.section?.title || 'Section'}
        </Link>

        {lessonLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : lesson ? (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                <Badge variant={lesson.isPublished ? "default" : "secondary"}>
                  {lesson.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              {lesson.description && (
                <p className="text-muted-foreground">{lesson.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Section: {lesson.section?.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEditLesson}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit Lesson
              </Button>
              <Button onClick={handleAddPart}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Parts List */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Parts</h2>
        
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
        ) : sortedParts.length > 0 ? (
          <div className="space-y-3">
            {sortedParts.map((part, index) => (
              <Card 
                key={part.id} 
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleEditPart(part)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePart(index, 'up');
                        }}
                        disabled={index === 0 || reorderParts.isPending}
                      >
                        <IconChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePart(index, 'down');
                        }}
                        disabled={index === sortedParts.length - 1 || reorderParts.isPending}
                      >
                        <IconChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Part Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-2xl">{getPartTypeIcon(part.partType)}</span>
                    </div>

                    {/* Part Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {part.title || `Part ${index + 1}`}
                        </h3>
                        <Badge variant="outline" className="shrink-0">
                          {getPartTypeLabel(part.partType)}
                        </Badge>
                        <Badge variant={part.isPublished ? "default" : "secondary"} className="shrink-0">
                          {part.isPublished ? (
                            <><IconEye className="h-3 w-3 mr-1" /> Published</>
                          ) : (
                            <><IconEyeOff className="h-3 w-3 mr-1" /> Draft</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getPartContentSummary(part)}
                      </p>
                    </div>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPart(part);
                      }}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No parts yet. Add content to this lesson.</p>
              <Button onClick={handleAddPart}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Part
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lesson Form Sheet */}
      {lesson && (
        <LessonFormSheet
          open={lessonSheetOpen}
          onOpenChange={setLessonSheetOpen}
          lesson={lesson}
          sectionId={sectionId}
        />
      )}

      {/* Part Form Sheet */}
      <PartFormSheet
        open={partSheetOpen}
        onOpenChange={setPartSheetOpen}
        part={editingPart}
        lessonId={lessonId}
      />
    </div>
  );
}

// Helper function to get a summary of part content
function getPartContentSummary(part: PronunciationPart): string {
  const content = part.content as Record<string, unknown>;
  
  switch (part.partType) {
    case 'video':
      return content.vimeoVideoId 
        ? `Vimeo ID: ${content.vimeoVideoId}` 
        : 'No video configured';
    
    case 'recognition_quiz':
      const questions = (content.questions as unknown[]) || [];
      return `${questions.length} question${questions.length !== 1 ? 's' : ''}`;
    
    case 'listen_repeat':
      const items = (content.items as unknown[]) || [];
      return `${items.length} item${items.length !== 1 ? 's' : ''}`;
    
    case 'pronunciation_quiz':
      const pqQuestions = (content.questions as unknown[]) || [];
      const contentType = content.contentType || 'word';
      return `${pqQuestions.length} ${contentType}${pqQuestions.length !== 1 ? 's' : ''}`;
    
    default:
      return 'Click to edit';
  }
}
