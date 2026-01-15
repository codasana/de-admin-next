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
import { useAdminShadowingLessons } from '@/hooks/useShadowingAdmin'
import { EditLessonSheet } from '@/components/shadowing/edit-lesson-sheet'
import { AddLessonSheet } from '@/components/shadowing/add-lesson-sheet'
import { IconEdit, IconSearch, IconChevronLeft, IconChevronRight, IconX, IconBrandYoutube, IconExternalLink, IconPlus } from "@tabler/icons-react"
import { Loader2 } from 'lucide-react'

export default function ShadowingPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'draft' | 'published' | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'start_here' | 'more_videos' | 'all'>('all')
  
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addLessonOpen, setAddLessonOpen] = useState(false)

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
                onValueChange={(value: 'draft' | 'published' | 'all') => {
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
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
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
                        <Badge 
                          variant={lesson.status === 'published' ? 'default' : 'secondary'}
                        >
                          {lesson.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {lesson.order ?? <span className="text-muted-foreground">-</span>}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(lesson.id)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
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
    </div>
  )
}
