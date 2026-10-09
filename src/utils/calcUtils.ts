/**
 * Evaluates mathematical expressions safely (e.g. "500+250", "100*2+50", "৫০০+২০০", "1,000")
 * Supports standard arithmetic +, -, *, / and Bengali numerals
 */
export function evaluateExpression(expr: string | number): number {
  if (typeof expr === 'number') return isNaN(expr) ? 0 : expr;
  if (!expr) return 0;

  // Convert Bengali numerals to ASCII numerals
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  let str = String(expr).replace(/[০-৯]/g, d => String(bnDigits.indexOf(d)));

  // Remove commas, currency symbols (৳, $, €), and spaces
  str = str.replace(/[,৳$€\s]/g, '').trim();

  // Clean expression: allow only numbers, +, -, *, /, .
  const sanitized = str.replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) return 0;

  try {
    // If it's a simple number (even negative)
    if (/^-?\d+(?:\.\d+)?$/.test(sanitized)) {
      return parseFloat(sanitized) || 0;
    }

    // Split into tokens: numbers and operators, keeping leading negative sign if present
    const tokens: string[] = [];
    let cur = '';

    for (let k = 0; k < sanitized.length; k++) {
      const ch = sanitized[k];
      if ('+-*/'.includes(ch)) {
        if (ch === '-' && (k === 0 || '+-*/'.includes(sanitized[k - 1]))) {
          // Unary minus
          cur += '-';
          continue;
        }
        if (cur) {
          tokens.push(cur);
          cur = '';
        }
        tokens.push(ch);
      } else {
        cur += ch;
      }
    }
    if (cur) tokens.push(cur);

    if (tokens.length === 0) return 0;

    // Phase 1: handle multiplication and division
    const intermediateTokens: (number | string)[] = [];
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok === '*' || tok === '/') {
        const prev = intermediateTokens.pop();
        const next = tokens[i + 1];
        if (typeof prev === 'number' && next && !isNaN(Number(next))) {
          const nextNum = Number(next);
          const res = tok === '*' ? prev * nextNum : (nextNum !== 0 ? prev / nextNum : 0);
          intermediateTokens.push(res);
          i += 2;
          continue;
        }
      }
      if (!isNaN(Number(tok))) {
        intermediateTokens.push(Number(tok));
      } else {
        intermediateTokens.push(tok);
      }
      i++;
    }

    // Phase 2: handle addition and subtraction
    if (intermediateTokens.length === 0) return 0;
    let result = typeof intermediateTokens[0] === 'number' ? intermediateTokens[0] : 0;
    let j = 1;
    while (j < intermediateTokens.length) {
      const op = intermediateTokens[j];
      const next = intermediateTokens[j + 1];
      if (typeof next === 'number') {
        if (op === '+') {
          result += next;
        } else if (op === '-') {
          result -= next;
        }
        j += 2;
      } else {
        j++;
      }
    }

    return isNaN(result) ? 0 : Math.round(result * 100) / 100;
  } catch {
    return parseFloat(sanitized) || 0;
  }
}
