import { useEffect, useState, useRef } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutocomplete, AutocompleteSuggestion } from '@/hooks/useAutocomplete';

interface AutocompleteDropdownProps {
  query: string;
  onSelect: (text: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const AutocompleteDropdown = ({
  query,
  onSelect,
  isOpen,
  onOpenChange,
  inputRef,
}: AutocompleteDropdownProps) => {
  const { getSuggestions } = useAutocomplete();
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      onOpenChange(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const results = getSuggestions(query, 6);
      setSuggestions(results);
      onOpenChange(results.length > 0);
      setSelectedIndex(-1);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, getSuggestions, onOpenChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            onSelect(suggestions[selectedIndex].text);
            onOpenChange(false);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    const input = inputRef?.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, suggestions, selectedIndex, onSelect, onOpenChange, inputRef]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef?.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange, inputRef]);

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      >
        <ul className="py-1" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.text}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`
                flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                ${index === selectedIndex 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-muted'
                }
              `}
              onClick={() => {
                onSelect(suggestion.text);
                onOpenChange(false);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.source === 'recent' ? (
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm text-foreground truncate">
                {highlightMatch(suggestion.text, query)}
              </span>
              {suggestion.source === 'recent' && (
                <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                  Recent
                </span>
              )}
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Highlight matching portion of text
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, index)}
      <strong className="font-semibold text-primary">
        {text.slice(index, index + query.length)}
      </strong>
      {text.slice(index + query.length)}
    </>
  );
}
