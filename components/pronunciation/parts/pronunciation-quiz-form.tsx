"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react";
import { AudioGenerator } from "../audio-generator";
import type { 
  PartContent, 
  PronunciationQuizContent, 
  PronunciationQuizQuestion,
  PronunciationReviewItem 
} from "@/types/pronunciation";

interface PronunciationQuizFormProps {
  content: PartContent;
  onChange: (content: PronunciationQuizContent) => void;
  partId?: string;
}

export function PronunciationQuizForm({ content, onChange, partId }: PronunciationQuizFormProps) {
  const quizContent = content as PronunciationQuizContent;
  const questions = quizContent.questions || [];

  const handleAddQuestion = () => {
    const newQuestion: PronunciationQuizQuestion = {
      referenceText: "",
      highlightPhonemes: [],
      review: [{ word: "", audioUrl: "" }],
    };
    onChange({
      ...quizContent,
      questions: [...questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleQuestionChange = (
    qIndex: number, 
    field: keyof PronunciationQuizQuestion, 
    value: string | string[] | PronunciationReviewItem[]
  ) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleReviewChange = (
    qIndex: number, 
    rIndex: number, 
    field: keyof PronunciationReviewItem, 
    value: string
  ) => {
    const newQuestions = [...questions];
    const newReview = [...newQuestions[qIndex].review];
    newReview[rIndex] = { ...newReview[rIndex], [field]: value };
    
    // Sync word with audio text
    if (field === 'word') {
      newReview[rIndex].word = value;
    }
    
    newQuestions[qIndex] = { ...newQuestions[qIndex], review: newReview };
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleAddReview = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].review.push({ word: "", audioUrl: "" });
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleRemoveReview = (qIndex: number, rIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].review = newQuestions[qIndex].review.filter((_, i) => i !== rIndex);
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleAddPhoneme = (qIndex: number, phoneme: string) => {
    if (!phoneme.trim()) return;
    const newQuestions = [...questions];
    const currentPhonemes = newQuestions[qIndex].highlightPhonemes || [];
    if (!currentPhonemes.includes(phoneme.trim())) {
      newQuestions[qIndex].highlightPhonemes = [...currentPhonemes, phoneme.trim()];
      onChange({
        ...quizContent,
        questions: newQuestions,
      });
    }
  };

  const handleRemovePhoneme = (qIndex: number, phoneme: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].highlightPhonemes = (newQuestions[qIndex].highlightPhonemes || [])
      .filter(p => p !== phoneme);
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const audioFolder = `pronunciation/audio/${partId || 'new'}`;

  // Common phonemes for quick access
  const commonPhonemes = [
    { label: 'ih (ship)', value: 'ih' },
    { label: 'iy (sheep)', value: 'iy' },
    { label: 'ae (cat)', value: 'ae' },
    { label: 'ah (cut)', value: 'ah' },
    { label: 'th (think)', value: 'th' },
    { label: 'dh (this)', value: 'dh' },
  ];

  return (
    <div className="space-y-4">
      {/* Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
            <IconPlus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">No questions yet</p>
            <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add First Question
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Question {qIndex + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveQuestion(qIndex, 'up')}
                      disabled={qIndex === 0}
                    >
                      <IconChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveQuestion(qIndex, 'down')}
                      disabled={qIndex === questions.length - 1}
                    >
                      <IconChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Reference Text (what users pronounce) */}
                <div className="space-y-2">
                  <Label className="text-sm">Reference Text (what users say)</Label>
                  <Input
                    value={question.referenceText}
                    onChange={(e) => handleQuestionChange(qIndex, 'referenceText', e.target.value)}
                    placeholder="e.g., ship"
                    className="text-lg font-medium"
                  />
                </div>

                {/* Highlight Phonemes (optional) */}
                <div className="space-y-2">
                  <Label className="text-sm">Highlight Phonemes (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Phonemes to focus on in results. Uses Azure SAPI format (e.g., "ih" for ship, "iy" for sheep)
                  </p>
                  
                  {/* Current phonemes */}
                  <div className="flex flex-wrap gap-2">
                    {(question.highlightPhonemes || []).map((phoneme) => (
                      <Badge key={phoneme} variant="secondary" className="gap-1">
                        {phoneme}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoneme(qIndex, phoneme)}
                          className="ml-1 hover:text-destructive"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Quick add common phonemes */}
                  <div className="flex flex-wrap gap-1">
                    {commonPhonemes.map((p) => (
                      <Button
                        key={p.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAddPhoneme(qIndex, p.value)}
                        disabled={(question.highlightPhonemes || []).includes(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>

                  {/* Custom phoneme input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom phoneme..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhoneme(qIndex, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Review Audio Examples */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Review Audio (example pronunciation)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAddReview(qIndex)}
                      className="h-7 text-xs"
                    >
                      <IconPlus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.review.map((review, rIndex) => (
                      <div key={rIndex} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">Example {rIndex + 1}</Label>
                          {question.review.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveReview(qIndex, rIndex)}
                            >
                              <IconTrash className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={review.word}
                          onChange={(e) => handleReviewChange(qIndex, rIndex, 'word', e.target.value)}
                          placeholder="Label (e.g., ship)"
                          className="mb-2 h-8 text-sm"
                        />
                        <AudioGenerator
                          text={review.word || question.referenceText}
                          audioUrl={review.audioUrl}
                          onAudioUrlChange={(url) => handleReviewChange(qIndex, rIndex, 'audioUrl', url)}
                          folder={audioFolder}
                          filename={`q${qIndex + 1}-review${rIndex + 1}.mp3`}
                          showTextInput={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
