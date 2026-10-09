/**
 * Evaluates mathematical expressions safely (e.g. "500+250", "100*2+50")
 * Supports standard arithmetic +, -, *, /
 */
export function evaluateExpression(expr: string): number {
  if (!expr) return 0;
  
  // Clean expression: remove any disallowed characters
  const sanitized = expr.trim().replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) return 0;

  // Split into tokens: numbers and operators
  const tokens = sanitized.match(/(\d+(?:\.\d+)?|[+\-*/])/g);
  if (!tokens || tokens.length === 0) return 0;

  try {
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
