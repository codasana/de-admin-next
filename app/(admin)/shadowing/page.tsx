'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdminShadowingLessons, useProcessLesson, useDeleteLesson } from '@/hooks/useShadowingAdmin'
import { useProcessingJob } from '@/hooks/useShadowingTranscription'
import { EditLessonSheet } from '@/components/shadowing/edit-lesson-sheet'
import { AddLessonSheet } from '@/components/shadowing/add-lesson-sheet'
import { IconEdit, IconSearch, IconChevronLeft, IconChevronRight, IconX, IconBrandYoutube, IconExternalLink, IconPlus, IconTrash } from "@tabler/icons-react"
import { Loader2, CheckCircle2, XCircle, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { ShadowingLessonSummary } from '@/types/shadowing'

export default function ShadowingPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'draft' | 'queue' | 'published' | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'start_here' | 'more_videos' | 'all'>('all')
  
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addLessonOpen, setAddLessonOpen] = useState(false)
  const [processingLessonId, setProcessingLessonId] = useState<number | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [deletingLesson, setDeletingLesson] = useState<ShadowingLessonSummary | null>(null)

  const processMutation = useProcessLesson()
  const deleteMutation = useDeleteLesson()
  const { job: processingJob, isPolling, startPolling, reset: resetPolling, isComplete, isFailed } = useProcessingJob(activeJobId)

  // Separate query for queue lessons (only in dev)
  const { data: queueData, isLoading: queueLoading } = useAdminShadowingLessons({
    page: 1,
    limit: 100, // Show all queued lessons
    status: 'queue',
  })

  const { data, isLoading, error } = useAdminShadowingLessons({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleEdit = (lessonId: number) => {
    setEditingLessonId(lessonId)
    setSheetOpen(true)
  }

  const handleProcess = async (lessonId: number) => {
    setProcessingLessonId(lessonId)
    resetPolling()
    try {
      const result = await processMutation.mutateAsync(lessonId)
      // Start polling the job
      setActiveJobId(result.job.id)
      startPolling()
      toast.success('Processing started!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start processing')
      setProcessingLessonId(null)
    }
  }

  // Reset processing state when job completes or fails
  const handleDismissProgress = () => {
    setProcessingLessonId(null)
    setActiveJobId(null)
    resetPolling()
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingLesson) return
    
    try {
      await deleteMutation.mutateAsync(deletingLesson.id)
      toast.success('Lesson deleted successfully')
      setDeletingLesson(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete lesson')
    }
  }

  // Get status message for display
  const getStatusMessage = (status: string | undefined) => {
    const messages: Record<string, string> = {
      pending: 'Starting...',
      downloading: 'Downloading from YouTube...',
      transcribing: 'Transcribing with Deepgram...',
      processing: 'Processing transcript...',
      creating_lesson: 'Creating lesson...',
      completed: 'Complete!',
      failed: 'Failed',
    }
    return messages[status || ''] || 'Processing...'
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isSearchActive = search.length > 0

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shadowing Lessons</h1>
          <p className="text-muted-foreground">
            View and edit shadowing content for language learners
          </p>
        </div>
        <Button onClick={() => setAddLessonOpen(true)}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by title..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                <IconSearch className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value: 'draft' | 'queue' | 'published' | 'all') => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="queue">Queue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Active Indicator */}
      {isSearchActive && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Showing results for: <span className="font-medium text-foreground">&quot;{search}&quot;</span>
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearSearch}
            className="h-7 px-2"
          >
            <IconX className="h-4 w-4 mr-1" />
            Clear search
          </Button>
        </div>
      )}

      {/* Queue Table */}
      {queueData && queueData.lessons.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                Queue
              </Badge>
              Lessons to Process
            </CardTitle>
            <CardDescription>
              {queueData.pagination.total} lesson{queueData.pagination.total !== 1 ? 's' : ''} waiting to be processed
              (Member requests and team additions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="w-[180px]">Source</TableHead>
                    <TableHead>YouTube</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueData.lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        {lesson.thumbnailUrl ? (
                          <img 
                            src={lesson.thumbnailUrl} 
                            alt={lesson.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                            <IconBrandYoutube className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px]">
                        <div className="truncate">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {lesson.youtubeVideoId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {lesson.isPublic ? (
                            <>
                              <Globe className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-green-600">Public</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 text-amber-600" />
                              <span className="text-xs text-amber-600">Private</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.videoRequests && lesson.videoRequests.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="default">Member</Badge>
                            <div className="text-xs text-muted-foreground">
                              {lesson.videoRequests[0].user.first && lesson.videoRequests[0].user.last
                                ? `${lesson.videoRequests[0].user.first} ${lesson.videoRequests[0].user.last}`
                                : lesson.videoRequests[0].user.email}
                              <br />
                              ID: {lesson.videoRequests[0].user.id}
                              {lesson.videoRequests.length > 1 && (
                                <span className="text-blue-600"> +{lesson.videoRequests.length - 1} more</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Team</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Open in YouTube"
                        >
                          <IconBrandYoutube className="h-5 w-5" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {process.env.NODE_ENV === 'development' && (
                            <>
                              {processingLessonId === lesson.id && isPolling ? (
                                // Show progress status
                                <div className="flex items-center gap-2 text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  <span className="text-blue-600 font-medium">
                                    {getStatusMessage(processingJob?.status)}
                                  </span>
                                </div>
                              ) : processingLessonId === lesson.id && isComplete ? (
                                // Show success
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600 font-medium text-sm">Done!</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismissProgress}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              ) : processingLessonId === lesson.id && isFailed ? (
                                // Show error
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-red-600 font-medium text-sm">Failed</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismissProgress}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              ) : (
                                // Show process button
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleProcess(lesson.id)}
                                  disabled={isPolling}
                                >
                                  Process
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lesson.id)}
                            title="Edit lesson"
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingLesson(lesson)}
                            title="Delete lesson"
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lessons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Lessons</CardTitle>
          <CardDescription>
            {data?.pagination.total ?? 0} lessons found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load lessons. Please try again.
            </div>
          ) : data?.lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lessons found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>US/UK</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="w-[180px]">Source</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium max-w-[250px]">
                        <div className="truncate">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {lesson.youtubeVideoId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {lesson.tags && lesson.tags.length > 0 ? (
                            lesson.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                          {lesson.tags && lesson.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{lesson.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.accent ? (
                          <Badge variant="outline" className={lesson.accent === 'US' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600'}>
                            {lesson.accent}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={lesson.status === 'published' ? 'default' : lesson.status === 'queue' ? 'outline' : 'secondary'}
                        >
                          {lesson.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {lesson.isPublic ? (
                            <>
                              <Globe className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-green-600">Public</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 text-amber-600" />
                              <span className="text-xs text-amber-600">Private</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.videoRequests && lesson.videoRequests.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="default">Member</Badge>
                            <div className="text-xs text-muted-foreground">
                              {lesson.videoRequests[0].user.first && lesson.videoRequests[0].user.last
                                ? `${lesson.videoRequests[0].user.first} ${lesson.videoRequests[0].user.last}`
                                : lesson.videoRequests[0].user.email}
                              <br />
                              ID: {lesson.videoRequests[0].user.id}
                              {lesson.videoRequests.length > 1 && (
                                <span className="text-blue-600"> +{lesson.videoRequests.length - 1} more</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Team</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(lesson.duration)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a
                            href={`https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Open in YouTube"
                          >
                            <IconBrandYoutube className="h-5 w-5" />
                          </a>
                          {lesson.status === 'published' && (
                            <a
                              href={`https://app.deepenglish.com/shadowing/${lesson.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="View published lesson"
                            >
                              <IconExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lesson.id)}
                            title="Edit lesson"
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingLesson(lesson)}
                            title="Delete lesson"
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <EditLessonSheet
        lessonId={editingLessonId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditingLessonId(null)
        }}
      />

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLesson} onOpenChange={(open: boolean) => !open && setDeletingLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this lesson?</p>
              {deletingLesson && (
                <p className="font-medium text-foreground">&ldquo;{deletingLesson.title}&rdquo;</p>
              )}
              {deletingLesson?.videoRequests && deletingLesson.videoRequests.length > 0 && (
                <p className="text-amber-600">
                  ⚠️ This lesson was requested by {deletingLesson.videoRequests.length} user(s). They will lose access.
                </p>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
