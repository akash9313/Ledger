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

    // 1. Try parsing the entire line
    const num = Number(trimmed);
    if (!isNaN(num)) {
      sum += num;
      continue;
    }

    // 2. Try parsing the first word of the line (e.g., "1500. cleared" -> "1500.")
    const firstWord = trimmed.split(' ')[0];
    const firstNum = parseFloat(firstWord);
    
    // parseFloat will return a valid number if it starts with one, e.g. "50rupees" -> 50
    // If it's something like "Total 215", firstWord is "Total", parseFloat is NaN.
    if (!isNaN(firstNum)) {
      sum += firstNum;
    } else if (firstWord.toLowerCase() === 'cleared') {
      // Also reset if the line starts with "Cleared", e.g., "Cleared today"
      sum = 0;
    }
  }

  return sum;
};
