import { useState, useEffect, useRef } from 'react';
import { parseVerilog } from '../core/parser';
import type { ParsedDesign, ParseError } from '../types';

const DEBOUNCE_MS = 300;

export interface UseParserResult {
  design: ParsedDesign | null;
  errors: ParseError[];
  isParsing: boolean;
}

export function useParser(content: string): UseParserResult {
  const [design, setDesign] = useState<ParsedDesign | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cancel any pending debounce
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    if (!content.trim()) {
      setDesign(null);
      setErrors([]);
      setIsParsing(false);
      return;
    }

    setIsParsing(true);

    timerRef.current = setTimeout(() => {
      try {
        const result = parseVerilog(content);
        setDesign(result);
        setErrors(result.errors);
      } catch (err) {
        setDesign(null);
        setErrors([
          {
            message: err instanceof Error ? err.message : String(err),
            loc: { line: 1, column: 0, offset: 0 },
            severity: 'error',
          },
        ]);
      } finally {
        setIsParsing(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content]);

  return { design, errors, isParsing };
}
