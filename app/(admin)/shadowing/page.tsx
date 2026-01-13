'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconPlus, IconPlayerPlay, IconEdit, IconTrash } from "@tabler/icons-react"

// Dummy shadowing lessons data
const shadowingLessons = [
  {
    id: 1,
    title: "Business Meeting Introduction",
    description: "Practice introducing yourself in a professional setting",
    duration: "2:30",
    difficulty: "Beginner",
    sentences: 12,
  },
  {
    id: 2,
    title: "Restaurant Ordering",
    description: "Learn common phrases for ordering food at restaurants",
    duration: "3:15",
    difficulty: "Beginner",
    sentences: 18,
  },
  {
    id: 3,
    title: "Job Interview Responses",
    description: "Practice answering common interview questions",
    duration: "4:45",
    difficulty: "Intermediate",
    sentences: 24,
  },
  {
    id: 4,
    title: "Travel and Directions",
    description: "Navigate airports, hotels, and ask for directions",
    duration: "3:00",
    difficulty: "Beginner",
    sentences: 15,
  },
  {
    id: 5,
    title: "Phone Conversations",
    description: "Professional phone etiquette and common phrases",
    duration: "2:45",
    difficulty: "Intermediate",
    sentences: 14,
  },
]

export default function ShadowingPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shadowing Lessons</h1>
          <p className="text-muted-foreground">
            Manage and create shadowing content for language learners
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Lessons</CardDescription>
            <CardTitle className="text-3xl">{shadowingLessons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sentences</CardDescription>
            <CardTitle className="text-3xl">
              {shadowingLessons.reduce((acc, lesson) => acc + lesson.sentences, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Duration</CardDescription>
            <CardTitle className="text-3xl">3:15</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>All Lessons</CardTitle>
          <CardDescription>
            Click on a lesson to edit or manage its content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shadowingLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <IconPlayerPlay className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{lesson.duration}</span>
                      <span>•</span>
                      <span>{lesson.sentences} sentences</span>
                      <span>•</span>
                      <span className={
                        lesson.difficulty === "Beginner" 
                          ? "text-green-600" 
                          : "text-yellow-600"
                      }>
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
