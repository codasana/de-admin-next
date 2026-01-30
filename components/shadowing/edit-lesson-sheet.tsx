'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAdminShadowingLesson, useUpdateShadowingLesson } from '@/hooks/useShadowingAdmin'
import type { UpdateShadowingLessonPayload } from '@/types/shadowing'
import { Loader2, X, Globe, Lock } from 'lucide-react'

// Master list of tags
const AVAILABLE_TAGS = ['People', 'Mind', 'Nature', 'Laughs', 'Big Ideas', 'Growth', 'Cooking', 'Language', 'Movies', 'Commercials']

interface EditLessonSheetProps {
  lessonId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLessonSheet({ lessonId, open, onOpenChange }: EditLessonSheetProps) {
  const { data: lesson, isLoading } = useAdminShadowingLesson(lessonId)
  const updateMutation = useUpdateShadowingLesson()
  
  const [formData, setFormData] = useState<UpdateShadowingLessonPayload>({})
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [videoContentJson, setVideoContentJson] = useState('')
  const [metadataJson, setMetadataJson] = useState('')

  // Reset form when lesson changes
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        youtubeVideoId: lesson.youtubeVideoId,
        description: lesson.description || '',
        tags: lesson.tags || [],
        duration: lesson.duration,
        thumbnailUrl: lesson.thumbnailUrl || '',
        status: lesson.status,
        order: lesson.order,
        category: lesson.category,
        isPublic: lesson.isPublic,
        accent: lesson.accent,
      })
      setSelectedTags(lesson.tags || [])
      setVideoContentJson(lesson.videoContent ? JSON.stringify(lesson.videoContent, null, 2) : '')
      setMetadataJson(lesson.metadata ? JSON.stringify(lesson.metadata, null, 2) : '{}')
    }
  }, [lesson])

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  // Get available tags that haven't been selected yet
  const availableTags = AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag))

  // Check if video content is empty (needed for validation)
  const hasVideoContent = lesson?.videoContent && 
    lesson.videoContent.content && 
    Array.isArray(lesson.videoContent.content) && 
    lesson.videoContent.content.length > 0

  const handleSave = async () => {
    if (!lessonId) return

    // Prevent publishing if no video content
    if (formData.status === 'published' && !hasVideoContent) {
      return // Should not happen due to UI restriction, but safety check
    }

    const updateData: UpdateShadowingLessonPayload = {
      ...formData,
      tags: selectedTags,
    }

    try {
      await updateMutation.mutateAsync({ id: lessonId, data: updateData })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update lesson:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Edit Shadowing Lesson</SheetTitle>
          <SheetDescription>
            Make changes to the shadowing lesson. Click save when done.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lesson ? (
          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid gap-4 py-4">
              {/* Basic Fields */}
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="youtubeVideoId">YouTube Video ID</Label>
                <Input
                  id="youtubeVideoId"
                  value={formData.youtubeVideoId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeVideoId: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Tags with dropdown and badges */}
              <div className="grid gap-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {availableTags.length > 0 && (
                  <Select onValueChange={handleAddTag} value="">
                    <SelectTrigger>
                      <SelectValue placeholder="Add a tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'queue' | 'published') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="queue">Queue</SelectItem>
                      <SelectItem value="published" disabled={!hasVideoContent}>
                        Published {!hasVideoContent && '(needs content)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!hasVideoContent && formData.status !== 'published' && (
                    <p className="text-xs text-muted-foreground">
                      Cannot publish until video content is processed
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'start_here' | 'more_videos') => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start_here">Start Here</SelectItem>
                      <SelectItem value="more_videos">More Videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Accent Selector */}
              <div className="grid gap-2">
                <Label htmlFor="accent">Accent</Label>
                <Select
                  value={formData.accent || 'none'}
                  onValueChange={(value: 'US' | 'UK' | 'none') => 
                    setFormData(prev => ({ ...prev, accent: value === 'none' ? null : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select accent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="US">US (American)</SelectItem>
                    <SelectItem value="UK">UK (British)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility Toggle */}
              <div className="grid gap-2">
                <Label>Visibility</Label>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {formData.isPublic ? (
                      <Globe className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {formData.isPublic ? 'Public' : 'Private'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.isPublic 
                          ? 'Visible to all users in the library' 
                          : 'Only visible to the member who requested it'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPublic ?? true}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isPublic: checked }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.1"
                  value={formData.duration ?? ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                />
              </div>

              {/* JSON Fields - Read Only */}
              <div className="grid gap-2">
                <Label htmlFor="videoContent">Video Content (JSON) - Read Only</Label>
                <Textarea
                  id="videoContent"
                  rows={10}
                  className="font-mono text-xs bg-muted"
                  value={videoContentJson}
                  readOnly
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadata">Metadata (JSON) - Read Only</Label>
                <Textarea
                  id="metadata"
                  rows={6}
                  className="font-mono text-xs bg-muted"
                  value={metadataJson}
                  readOnly
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
