"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAdminSection, useAdminLessons, useReorderLessons } from "@/hooks/usePronunciationAdmin";
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
  IconArrowLeft,
  IconListDetails,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionFormSheet } from "@/components/pronunciation/section-form-sheet";
import { LessonFormSheet } from "@/components/pronunciation/lesson-form-sheet";
import type { PronunciationLesson } from "@/types/pronunciation";

export default function SectionDetailPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { data: section, isLoading: sectionLoading, error: sectionError } = useAdminSection(sectionId);
  const { data: lessons, isLoading: lessonsLoading } = useAdminLessons(sectionId);
  const reorderLessons = useReorderLessons();

  const [sectionSheetOpen, setSectionSheetOpen] = useState(false);
  const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<PronunciationLesson | null>(null);

  const handleEditSection = () => {
    setSectionSheetOpen(true);
  };

  const handleAddLesson = () => {
    setEditingLesson(null);
    setLessonSheetOpen(true);
  };

  const handleEditLesson = (lesson: PronunciationLesson, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingLesson(lesson);
    setLessonSheetOpen(true);
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lessons) return;
    
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedLessons.length) return;

    const newOrder = [...sortedLessons];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    try {
      await reorderLessons.mutateAsync({
        sectionId,
        orderedIds: newOrder.map(l => l.id)
      });
      toast.success('Lesson order updated');
    } catch {
      toast.error('Failed to reorder lessons');
    }
  };

  if (sectionError) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading section: {sectionError.message}</div>
      </div>
    );
  }

  const isLoading = sectionLoading || lessonsLoading;
  const sortedLessons = lessons?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <Link 
          href="/pronunciation" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="h-4 w-4 mr-1" />
          Back to Sections
        </Link>

        {sectionLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : section ? (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {section.imageUrl ? (
                <img
                  src={`https://dedownloads.s3.amazonaws.com/${section.imageUrl}`}
                  alt={section.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                  <IconListDetails className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{section.title}</h1>
                  <Badge variant={section.isPublished ? "default" : "secondary"}>
                    {section.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {section.description && (
                  <p className="text-muted-foreground">{section.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEditSection}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit Section
              </Button>
              <Button onClick={handleAddLesson}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Lessons</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedLessons.length > 0 ? (
          <div className="space-y-3">
            {sortedLessons.map((lesson, index) => (
              <Link key={lesson.id} href={`/pronunciation/${sectionId}/${lesson.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleMoveLesson(index, 'up', e)}
                          disabled={index === 0 || reorderLessons.isPending}
                        >
                          <IconChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleMoveLesson(index, 'down', e)}
                          disabled={index === sortedLessons.length - 1 || reorderLessons.isPending}
                        >
                          <IconChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Lesson Number */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{lesson.title}</h3>
                          <Badge variant={lesson.isPublished ? "default" : "secondary"} className="shrink-0">
                            {lesson.isPublished ? (
                              <><IconEye className="h-3 w-3 mr-1" /> Published</>
                            ) : (
                              <><IconEyeOff className="h-3 w-3 mr-1" /> Draft</>
                            )}
                          </Badge>
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.parts?.length || 0} part{(lesson.parts?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEditLesson(lesson, e)}
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
              <p className="text-muted-foreground mb-4">No lessons yet. Create your first lesson to get started.</p>
              <Button onClick={handleAddLesson}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section Form Sheet */}
      {section && (
        <SectionFormSheet
          open={sectionSheetOpen}
          onOpenChange={setSectionSheetOpen}
          section={section}
        />
      )}

      {/* Lesson Form Sheet */}
      <LessonFormSheet
        open={lessonSheetOpen}
        onOpenChange={setLessonSheetOpen}
        lesson={editingLesson}
        sectionId={sectionId}
      />
    </div>
  );
}
