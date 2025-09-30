import { memo, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  language?: string;
}

export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  placeholder = '// Write your code here...',
  disabled = false,
  language = 'javascript',
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('crisp-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#e4e4e7',
        'editorLineNumber.foreground': '#71717a',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editor.selectionBackground': '#3f3f46',
        'editor.inactiveSelectionBackground': '#27272a',
        'editorCursor.foreground': '#a1a1aa',
        'editor.lineHighlightBackground': '#18181b',
        'editorWidget.background': '#18181b',
        'editorWidget.border': '#27272a',
        'editorSuggestWidget.background': '#18181b',
        'editorSuggestWidget.border': '#27272a',
        'editorSuggestWidget.selectedBackground': '#27272a',
        'editorHoverWidget.background': '#18181b',
        'editorHoverWidget.border': '#27272a',
      },
    });

    monaco.editor.setTheme('crisp-theme');
  };

  const handleChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  useEffect(() => {
    if (editorRef.current && !value && placeholder) {
      const editor = editorRef.current;
      editor.setValue(placeholder);
    }
  }, [placeholder, value]);

  return (
    <div className="border-2 rounded-lg overflow-hidden bg-[#0a0a0a]">
      <Editor
        height="400px"
        language={language}
        value={value || placeholder}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: disabled,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: false,
          contextmenu: true,
          selectOnLineNumbers: true,
          matchBrackets: 'always',
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'top',
          wordBasedSuggestions: 'matchingDocuments',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
        loading={
          <div className="flex items-center justify-center h-[400px] bg-[#0a0a0a]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading editor...</p>
            </div>
          </div>
        }
      />
    </div>
  );
});