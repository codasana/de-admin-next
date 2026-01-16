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
import { useQueueLesson } from '@/hooks/useShadowingAdmin'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { IconBrandYoutube } from '@tabler/icons-react'

interface AddLessonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddLessonSheet({ open, onOpenChange }: AddLessonSheetProps) {
  const [url, setUrl] = useState('')
  const queueMutation = useQueueLesson()

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setUrl('')
        queueMutation.reset()
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return
    
    queueMutation.mutate({ url: url.trim() })
  }

  const handleClose = () => {
    onOpenChange(false)
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
            Enter a YouTube URL to queue a new shadowing lesson. You can process it later from the table.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-6 py-4">
          {/* Success State */}
          {queueMutation.isSuccess && queueMutation.data?.lesson ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Lesson Queued Successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {queueMutation.data.lesson.title}
                  </p>
                </div>
              </div>
              
              {queueMutation.data.lesson.thumbnailUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={queueMutation.data.lesson.thumbnailUrl} 
                    alt={queueMutation.data.lesson.title}
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                The lesson has been added to the queue. It will be processed soon.
              </p>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={queueMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Supports youtube.com/watch, youtu.be, and shorts URLs
                </p>
              </div>

              {queueMutation.isError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">
                    {queueMutation.error instanceof Error 
                      ? queueMutation.error.message 
                      : 'Failed to queue lesson'}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={queueMutation.isPending || !url.trim()}
              >
                {queueMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add to Queue'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {queueMutation.isSuccess ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
