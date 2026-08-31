/**
 * Line-by-line Ledger Calculator
 * 
 * Supports:
 * - Positive numbers (e.g. "50", "100 paid") -> +50
 * - Negative numbers (e.g. "-20", "-30 snack") -> -20
 * - "cleared" or "Cleared" -> resets running balance to 0
 */
export const calculateTotal = (text: string): number => {
  if (!text) return 0;
  
  const lines = text.split('\n');
  let sum = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    // Reset calculation if the line is exactly "Cleared" (case-insensitive)
    if (trimmed.toLowerCase() === 'cleared') {
      sum = 0;
      continue;
    }

    // 1. Try parsing the entire line as a number
    const num = Number(trimmed);
    if (!isNaN(num)) {
      sum += num;
      continue;
    }

    // 2. Try parsing the first word of the line (e.g., "150. cash", "-20 coffee")
    const firstWord = trimmed.split(' ')[0];
    const firstNum = parseFloat(firstWord);
    
    if (!isNaN(firstNum)) {
      sum += firstNum;
    } else if (firstWord.toLowerCase() === 'cleared') {
      sum = 0;
    }
  }

  return sum;
};
