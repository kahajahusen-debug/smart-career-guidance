/**
 * Shared Formatters for Smart Career Guidance System
 * Consistent India-specific salary and currency formatting
 */

export function formatSalary(salaryStr) {
  if (!salaryStr || typeof salaryStr !== 'string') return 'Competitive (₹ LPA)';
  const trimmed = salaryStr.trim();
  if (trimmed.startsWith('₹')) return trimmed;

  // Handle legacy USD seed values ($90,000 - $140,000 / yr, etc.)
  if (trimmed.includes('$')) {
    const usdMap = {
      '90,000': '6.5',
      '140,000': '16',
      '105,000': '8.5',
      '155,000': '20',
      '100,000': '7.5',
      '150,000': '18',
      '85,000': '5.5',
      '125,000': '14',
      '95,000': '6.5',
      '145,000': '16',
      '65,000': '4.5',
      '110,000': '12',
      '165,000': '25',
      '80,000': '5.5',
      '70,000': '4.5',
      '130,000': '12'
    };

    // If matches $XX,000 - $YY,000
    const match = trimmed.match(/\$([\d,]+)\s*-\s*\$([\d,]+)/);
    if (match) {
      const low = usdMap[match[1]] || '6';
      const high = usdMap[match[2]] || '15';
      return `₹${low} - ₹${high} LPA (approx.)`;
    }

    return trimmed.replace(/\$/g, '₹');
  }

  return trimmed;
}

export function formatScore(score) {
  if (score === null || score === undefined || isNaN(score)) return 'Not Calculated';
  return `${Math.round(score)}%`;
}
