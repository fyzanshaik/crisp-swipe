import { memo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Search, Plus, Clock, Target, Filter } from "lucide-react";
import { toast } from "sonner";
import { recruiterApi } from "@/lib/recruiter-api";
import type { Question } from "./types";

interface QuestionBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedDifficulty: 'easy' | 'medium' | 'hard';
  expectedType: 'mcq' | 'short_answer' | 'code';
  onQuestionSelected: (question: Question) => void;
}

const QuestionCard = memo<{
  question: Question;
  onSelect: () => void;
  isSelected: boolean;
}>(({ question, onSelect, isSelected }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'MCQ';
      case 'short_answer': return 'Short Answer';
      case 'code': return 'Coding';
      default: return type;
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="px-2 py-1 rounded bg-muted text-xs">
            {getTypeLabel(question.type)}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{question.timeLimit}s</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{question.points}pts</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm font-medium line-clamp-3">
          {question.questionText}
        </p>
        
        {question.options && question.options.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {question.options.slice(0, 4).map((option, idx) => (
              <div key={idx} className="bg-muted/30 px-2 py-1 rounded text-xs truncate">
                {String.fromCharCode(65 + idx)}) {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

QuestionCard.displayName = "QuestionCard";

const questionBankCache = new Map<string, { questions: Question[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; 

export const QuestionBankModal = memo<QuestionBankModalProps>(
  ({ open, onOpenChange, expectedDifficulty, expectedType, onQuestionSelected }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [filters, setFilters] = useState({
      difficulty: expectedDifficulty,
      type: expectedType,
      category: ''
    });

    const handleClose = useCallback(() => {
      setSelectedQuestion(null);
      setSearchTerm('');
      onOpenChange(false);
    }, [onOpenChange]);

    const fetchQuestions = useCallback(async () => {
      console.log('🏦 fetchQuestions called with filters:', filters);
      
      const cacheKey = `${filters.difficulty}-${filters.type}-${filters.category || 'all'}`;
      const cachedData = questionBankCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log('📋 Using cached questions for:', cacheKey);
        setQuestions(cachedData.questions);
        return;
      }
      
      setLoading(true);
      try {
        console.log('🌐 Fetching fresh questions for:', cacheKey);
        const result = await recruiterApi.getQuestions({
          type: filters.type,
          difficulty: filters.difficulty,
          category: filters.category || undefined
        });
        
        const transformedQuestions = result.questions.map(q => ({
          ...q,
          category: q.category || undefined,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer || undefined,
          expectedKeywords: q.expectedKeywords || undefined
        }));
        
        questionBankCache.set(cacheKey, {
          questions: transformedQuestions,
          timestamp: Date.now()
        });
        
        console.log('💾 Cached questions for:', cacheKey, `(${transformedQuestions.length} questions)`);
        setQuestions(transformedQuestions);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        toast.error("Failed to load questions from bank");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }, [filters]);

    useEffect(() => {
      if (open) {
        setFilters({
          difficulty: expectedDifficulty,
          type: expectedType,
          category: ''
        });
      }
    }, [open, expectedDifficulty, expectedType]);

    useEffect(() => {
      if (open) {
        fetchQuestions();
      }
    }, [open, fetchQuestions]);

    const filteredQuestions = questions.filter(q => 
      searchTerm === '' || 
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.category && q.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelectQuestion = useCallback(() => {
      if (selectedQuestion) {
        onQuestionSelected(selectedQuestion);
        handleClose();
      }
    }, [selectedQuestion, onQuestionSelected, handleClose]);

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Question Bank
            </DialogTitle>
            <DialogDescription>
              Select a {expectedDifficulty} {expectedType === 'mcq' ? 'MCQ' : expectedType === 'short_answer' ? 'short answer' : 'coding'} question
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 border-b">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search questions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search questions by text or category..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as 'mcq' | 'short_answer' | 'code' }))}
                  className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="mcq">MCQ</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="code">Code</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions List - Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No questions match your search.' : 'No questions available for the selected filters.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                {filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onSelect={() => setSelectedQuestion(question)}
                    isSelected={selectedQuestion?.id === question.id}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-background">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} available
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSelectQuestion}
                  disabled={!selectedQuestion}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Select Question
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

QuestionBankModal.displayName = "QuestionBankModal";
