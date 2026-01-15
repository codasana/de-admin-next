'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useShadowingTranscription } from '@/hooks/useShadowingTranscription'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { IconBrandYoutube } from '@tabler/icons-react'

interface AddLessonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Starting...',
  downloading: 'Downloading video from YouTube...',
  transcribing: 'Transcribing audio with Deepgram...',
  processing: 'Processing transcript...',
  creating_lesson: 'Creating shadowing lesson...',
  completed: 'Lesson created successfully!',
  failed: 'Failed to create lesson',
}

export function AddLessonSheet({ open, onOpenChange }: AddLessonSheetProps) {
  const [url, setUrl] = useState('')
  
  const {
    job,
    isCreating,
    createError,
    createJob,
    reset,
    isProcessing,
    isComplete,
    isFailed,
  } = useShadowingTranscription()

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      // Small delay to let animation complete
      const timeout = setTimeout(() => {
        setUrl('')
        reset()
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [open, reset])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return
    
    createJob({ url: url.trim() })
  }

  const handleClose = () => {
    if (isProcessing) {
      // Don't close while processing
      return
    }
    onOpenChange(false)
  }

  const getStatusColor = () => {
    if (isComplete) return 'text-green-600'
    if (isFailed) return 'text-red-600'
    return 'text-blue-600'
  }

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (isFailed) return <XCircle className="h-5 w-5 text-red-600" />
    return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <IconBrandYoutube className="h-5 w-5 text-red-600" />
            Add New Shadowing Lesson
          </SheetTitle>
          <SheetDescription>
            Enter a YouTube URL to automatically transcribe and create a new shadowing lesson.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-6 py-4">
          {/* Form - only show when not processing */}
          {!job && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  Supports youtube.com/watch, youtu.be, and shorts URLs
                </p>
              </div>

              {createError && !job && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating || !url.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Create Lesson'
                )}
              </Button>
            </form>
          )}

          {/* Processing Status */}
          {job && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  {getStatusIcon()}
                  <div>
                    <p className={`font-medium ${getStatusColor()}`}>
                      {STATUS_MESSAGES[job.status] || job.progress || 'Processing...'}
                    </p>
                    {job.title && (
                      <p className="text-sm text-muted-foreground truncate">
                        {job.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-2">
                  {['downloading', 'transcribing', 'processing', 'creating_lesson', 'completed'].map((step, index) => {
                    const stepIndex = ['downloading', 'transcribing', 'processing', 'creating_lesson', 'completed'].indexOf(job.status)
                    const currentIndex = index
                    const isActive = job.status === step
                    const isComplete = currentIndex < stepIndex || job.status === 'completed'
                    const isFailed = job.status === 'failed'

                    return (
                      <div 
                        key={step} 
                        className={`flex items-center gap-2 text-sm ${
                          isActive ? 'text-blue-600 font-medium' : 
                          isComplete ? 'text-green-600' : 
                          'text-muted-foreground'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-blue-600 animate-pulse' :
                          isComplete ? 'bg-green-600' :
                          'bg-muted-foreground/30'
                        }`} />
                        {step === 'downloading' && 'Download from YouTube'}
                        {step === 'transcribing' && 'Transcribe with Deepgram'}
                        {step === 'processing' && 'Process transcript'}
                        {step === 'creating_lesson' && 'Create lesson'}
                        {step === 'completed' && 'Done!'}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Error Message */}
              {isFailed && job.error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{job.error}</p>
                </div>
              )}

              {/* Success Info */}
              {isComplete && job.result && (
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Lesson Created Successfully!
                  </h4>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <p><strong>Title:</strong> {job.result.title}</p>
                    <p><strong>Duration:</strong> {job.result.durationMinutes}</p>
                    <p><strong>Words:</strong> {job.result.stats.totalWords}</p>
                    <p><strong>Segments:</strong> {job.result.stats.segments}</p>
                    <p><strong>WPM:</strong> {job.result.stats.wpmBasedOnSpeakingTime} (speaking)</p>
                  </div>
                  <p className="mt-3 text-xs text-green-600 dark:text-green-400">
                    The lesson has been created as a draft. Edit it to add tags and publish.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-end gap-2">
          {isProcessing ? (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              {isComplete ? 'Done' : 'Cancel'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
