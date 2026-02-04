"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { AudioGenerator } from "../audio-generator";
import type { 
  PartContent, 
  RecognitionQuizContent, 
  RecognitionQuizQuestion,
  RecognitionQuizOption 
} from "@/types/pronunciation";

interface RecognitionQuizFormProps {
  content: PartContent;
  onChange: (content: RecognitionQuizContent) => void;
  partId?: string;
}

export function RecognitionQuizForm({ content, onChange, partId }: RecognitionQuizFormProps) {
  const quizContent = content as RecognitionQuizContent;
  const questions = quizContent.questions || [];

  const handleAddQuestion = () => {
    const newQuestion: RecognitionQuizQuestion = {
      id: questions.length + 1,
      options: [
        { word: "", audioUrl: "", audioText: "", isCorrect: true },
        { word: "", audioUrl: "", audioText: "", isCorrect: false },
      ],
    };
    onChange({
      ...quizContent,
      questions: [...questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Re-number questions
    const renumbered = newQuestions.map((q, i) => ({ ...q, id: i + 1 }));
    onChange({
      ...quizContent,
      questions: renumbered,
    });
  };

  const handleOptionChange = (
    qIndex: number, 
    oIndex: number, 
    field: keyof RecognitionQuizOption, 
    value: string | boolean
  ) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIndex].options];
    
    // If setting isCorrect to true, set others to false
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === oIndex;
      });
    } else {
      newOptions[oIndex] = { ...newOptions[oIndex], [field]: value };
    }
    
    // Sync word with audioText if word changes
    if (field === 'word') {
      newOptions[oIndex].audioText = value as string;
    }
    
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({
      word: "",
      audioUrl: "",
      audioText: "",
      isCorrect: false,
    });
    onChange({
      ...quizContent,
      questions: newQuestions,
    });
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
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
    // Re-number
    const renumbered = newQuestions.map((q, i) => ({ ...q, id: i + 1 }));
    onChange({
      ...quizContent,
      questions: renumbered,
    });
  };

  const audioFolder = `pronunciation/audio/${partId || 'new'}`;

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

                {/* Options - the correct answer's audio will be played to the user */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Answer Options</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAddOption(qIndex)}
                      className="h-7 text-xs"
                    >
                      <IconPlus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex} 
                        className={`p-3 rounded-lg border ${
                          option.isCorrect 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-2">
                            <Checkbox
                              checked={option.isCorrect}
                              onCheckedChange={(checked) => 
                                handleOptionChange(qIndex, oIndex, 'isCorrect', !!checked)
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={option.word}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, 'word', e.target.value)}
                                placeholder="Word (e.g., ship)"
                                className="flex-1"
                              />
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <AudioGenerator
                              text={option.audioText || option.word}
                              audioUrl={option.audioUrl}
                              onAudioUrlChange={(url) => handleOptionChange(qIndex, oIndex, 'audioUrl', url)}
                              folder={audioFolder}
                              filename={`q${qIndex + 1}-opt${oIndex + 1}.mp3`}
                              showTextInput={false}
                            />
                          </div>
                        </div>
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
