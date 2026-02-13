"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  IconPlus, 
  IconTrash, 
  IconChevronUp, 
  IconChevronDown, 
  IconChevronRight,
  IconCheck,
  IconVolume,
  IconVolumeOff,
  IconList,
  IconRefresh,
  IconWand,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { AudioGenerator } from "../audio-generator";
import { useGenerateAudio, useSaveAudio } from "@/hooks/usePronunciationAdmin";
import { TTS_VOICES } from "@/types/pronunciation";
import type { 
  PartContent, 
  RecognitionQuizContent, 
  RecognitionQuizQuestion,
  RecognitionQuizOption,
  TTSVoice
} from "@/types/pronunciation";

interface RecognitionQuizFormProps {
  content: PartContent;
  onChange: (content: RecognitionQuizContent) => void;
  partId?: string;
}

export function RecognitionQuizForm({ content, onChange, partId }: RecognitionQuizFormProps) {
  const quizContent = content as RecognitionQuizContent;
  const questions = quizContent.questions || [];

  // Track which questions are expanded (by index). New questions auto-expand.
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Bulk add state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkVoice, setBulkVoice] = useState<TTSVoice>("echo");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const bulkAbortRef = useRef(false);

  const generateAudio = useGenerateAudio();
  const saveAudio = useSaveAudio();

  const allExpanded = questions.length > 0 && expandedQuestions.size === questions.length;

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(questions.map((_, i) => i)));
    }
  }, [allExpanded, questions]);

  const toggleQuestion = useCallback((index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleAddQuestion = () => {
    const newQuestion: RecognitionQuizQuestion = {
      id: questions.length + 1,
      options: [
        { word: "", audioUrl: "", audioText: "", voice: "echo", isCustomAudio: false, isCorrect: true },
        { word: "", audioUrl: "", audioText: "", voice: "echo", isCustomAudio: false, isCorrect: false },
      ],
    };
    const newIndex = questions.length;
    setExpandedQuestions(prev => new Set(prev).add(newIndex));
    onChange({
      ...quizContent,
      questions: [...questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    const renumbered = newQuestions.map((q, i) => ({ ...q, id: i + 1 }));
    setExpandedQuestions(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    onChange({
      ...quizContent,
      questions: renumbered,
    });
  };

  const handleOptionChange = (
    qIndex: number, 
    oIndex: number, 
    field: keyof RecognitionQuizOption, 
    value: string | boolean | TTSVoice | undefined
  ) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIndex].options];
    
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === oIndex;
      });
    } else {
      newOptions[oIndex] = { ...newOptions[oIndex], [field]: value };
    }
    
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
      voice: "echo",
      isCustomAudio: false,
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
    const renumbered = newQuestions.map((q, i) => ({ ...q, id: i + 1 }));
    setExpandedQuestions(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i === index) next.add(newIndex);
        else if (i === newIndex) next.add(index);
        else next.add(i);
      });
      return next;
    });
    onChange({
      ...quizContent,
      questions: renumbered,
    });
  };

  // --- Bulk Add Logic ---

  const parseBulkText = (text: string): { options: { word: string; isCorrect: boolean }[] }[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map(line => {
      const parts = line.split(',').map(p => p.trim()).filter(p => p.length > 0);
      const options = parts.map(p => {
        const isCorrect = p.startsWith('*');
        const word = isCorrect ? p.slice(1).trim() : p;
        return { word, isCorrect };
      });
      // If no option is marked correct, mark the first one
      if (!options.some(o => o.isCorrect) && options.length > 0) {
        options[0].isCorrect = true;
      }
      return { options };
    });
  };

  const generateUniqueFilename = (baseFilename: string): string => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nameWithoutExt = baseFilename.replace(/\.mp3$/i, '');
    return `${nameWithoutExt}-${uniqueSuffix}.mp3`;
  };

  const handleBulkAdd = async () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      toast.error("No questions found. Enter one question per line.");
      return;
    }

    // Validate
    const invalid = parsed.findIndex(q => q.options.length < 2);
    if (invalid >= 0) {
      toast.error(`Line ${invalid + 1} needs at least 2 comma-separated options.`);
      return;
    }

    setBulkProcessing(true);
    bulkAbortRef.current = false;

    // Count total audio items
    const totalAudio = parsed.reduce((sum, q) => sum + q.options.length, 0);
    setBulkProgress({ current: 0, total: totalAudio });

    const startIndex = questions.length;
    const audioFolder = `pronunciation/audio/${partId || 'new'}`;
    let audioCount = 0;

    // Build questions with audio generation
    const newQuestions: RecognitionQuizQuestion[] = [];

    for (let qi = 0; qi < parsed.length; qi++) {
      if (bulkAbortRef.current) break;

      const parsedQ = parsed[qi];
      const qNumber = startIndex + qi + 1;
      const options: RecognitionQuizOption[] = [];

      for (let oi = 0; oi < parsedQ.options.length; oi++) {
        if (bulkAbortRef.current) break;

        const { word, isCorrect } = parsedQ.options[oi];
        let audioUrl = "";

        // Generate & save audio
        try {
          const result = await generateAudio.mutateAsync({ text: word, voice: bulkVoice });
          const filename = generateUniqueFilename(`q${qNumber}-opt${oi + 1}.mp3`);
          const saveResult = await saveAudio.mutateAsync({
            audioBase64: result.audioBase64,
            folder: audioFolder,
            filename,
          });
          audioUrl = saveResult.url;
        } catch {
          // Continue without audio if generation fails
          console.warn(`Failed to generate audio for "${word}"`);
        }

        audioCount++;
        setBulkProgress({ current: audioCount, total: totalAudio });

        options.push({
          word,
          audioUrl,
          audioText: word,
          voice: bulkVoice,
          isCustomAudio: false,
          isCorrect,
        });
      }

      newQuestions.push({
        id: qNumber,
        options,
      });
    }

    if (!bulkAbortRef.current) {
      // Renumber all questions
      const allQuestions = [...questions, ...newQuestions].map((q, i) => ({ ...q, id: i + 1 }));
      onChange({
        ...quizContent,
        questions: allQuestions,
      });

      toast.success(`Added ${newQuestions.length} question${newQuestions.length !== 1 ? 's' : ''} with audio`);
      setBulkText("");
      setShowBulkAdd(false);
    }

    setBulkProcessing(false);
    setBulkProgress({ current: 0, total: 0 });
  };

  const handleCancelBulk = () => {
    bulkAbortRef.current = true;
  };

  const audioFolder = `pronunciation/audio/${partId || 'new'}`;

  const bulkPreview = bulkText.trim() ? parseBulkText(bulkText) : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* Header: label + expand/collapse all */}
        <div className="flex items-center justify-between">
          <Label>Questions ({questions.length})</Label>
          {questions.length > 0 && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <IconList className="h-3.5 w-3.5" />
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        {/* Question list */}
        {questions.length === 0 && !showBulkAdd ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm mb-3">No questions yet</p>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                <IconPlus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkAdd(true)}>
                <IconList className="h-4 w-4 mr-1" />
                Bulk Add
              </Button>
            </div>
          </div>
        ) : (
          <>
            {questions.length > 0 && (
              <div className="space-y-2">
                {questions.map((question, qIndex) => {
                  const isExpanded = expandedQuestions.has(qIndex);
                  
                  return (
                    <div key={qIndex} className="border rounded-lg overflow-hidden">
                      {/* Collapsed header - always visible */}
                      <div 
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleQuestion(qIndex)}
                      >
                        <IconChevronRight 
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                        <span className="font-medium text-sm shrink-0">Q{qIndex + 1}</span>
                        
                        {/* Compact option summary */}
                        <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                          {question.options.map((opt, oIdx) => (
                            <span 
                              key={oIdx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs shrink-0 ${
                                opt.isCorrect 
                                  ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium' 
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {opt.isCorrect && <IconCheck className="h-3 w-3" />}
                              <span className="truncate max-w-[80px]">{opt.word || '(empty)'}</span>
                              {opt.audioUrl ? (
                                <IconVolume className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <IconVolumeOff className="h-3 w-3 text-red-400" />
                              )}
                            </span>
                          ))}
                        </div>

                        {/* Action buttons on the right */}
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveQuestion(qIndex, 'up')}
                            disabled={qIndex === 0}
                          >
                            <IconChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveQuestion(qIndex, 'down')}
                            disabled={qIndex === questions.length - 1}
                          >
                            <IconChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t px-4 py-3 space-y-3">
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
                                        voice={option.voice || "nova"}
                                        onVoiceChange={(v) => handleOptionChange(qIndex, oIndex, 'voice', v)}
                                        isCustomAudio={option.isCustomAudio || false}
                                        onAudioChange={(url, isCustom) => {
                                          const newQuestions = [...questions];
                                          const newOptions = [...newQuestions[qIndex].options];
                                          newOptions[oIndex] = { 
                                            ...newOptions[oIndex], 
                                            audioUrl: url,
                                            isCustomAudio: isCustom
                                          };
                                          newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
                                          onChange({ ...quizContent, questions: newQuestions });
                                        }}
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bulk Add Panel */}
            {showBulkAdd && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Bulk Add Questions</Label>
                  {!bulkProcessing && (
                    <button
                      type="button"
                      onClick={() => { setShowBulkAdd(false); setBulkText(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  One question per line. Comma-separated options. Prefix the correct answer with <code className="bg-muted px-1 rounded font-mono">*</code>
                </p>
                <div className="text-xs text-muted-foreground bg-muted rounded p-2 font-mono leading-relaxed">
                  *ship, sheep<br />
                  *bit, beat<br />
                  *pool, pole
                </div>

                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"*ship, sheep, shop\n*bit, beat, bat\npull, *pool, pole"}
                  rows={6}
                  className="font-mono text-sm"
                  disabled={bulkProcessing}
                />

                {/* Live preview */}
                {bulkPreview.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Preview: {bulkPreview.length} question{bulkPreview.length !== 1 ? 's' : ''} &middot;{' '}
                    {bulkPreview.reduce((s, q) => s + q.options.length, 0)} audio files to generate
                    {bulkPreview.some(q => q.options.length < 2) && (
                      <span className="text-destructive ml-2">
                        (some lines have less than 2 options)
                      </span>
                    )}
                  </div>
                )}

                {/* Voice selection + action */}
                <div className="flex items-center gap-2">
                  <Select value={bulkVoice} onValueChange={(v) => setBulkVoice(v as TTSVoice)} disabled={bulkProcessing}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TTS_VOICES.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1" />

                  {bulkProcessing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <IconRefresh className="h-3 w-3 animate-spin" />
                        Generating audio {bulkProgress.current}/{bulkProgress.total}...
                      </span>
                      <Button type="button" variant="outline" size="sm" onClick={handleCancelBulk} className="h-8">
                        Stop
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBulkAdd}
                      disabled={!bulkText.trim()}
                      className="h-8"
                    >
                      <IconWand className="h-3.5 w-3.5 mr-1" />
                      Add & Generate Audio
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom action buttons */}
            {!showBulkAdd && (
              <div className="flex items-center gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkAdd(true)}>
                  <IconList className="h-4 w-4 mr-1" />
                  Bulk Add
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
