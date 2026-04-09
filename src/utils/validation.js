// Validation regex patterns based on user requirements

/**
 * Only English alphabets and spaces. No numbers, no Nepali.
 */
export const isValidEnglishName = (val) => /^[a-zA-Z\s]*$/.test(val);

/**
 * Only Nepali characters and spaces. No numbers (English or Nepali), no English.
 */
export const isValidNepaliName = (val) => /^[\u0900-\u0963\u0966-\u097F\s]*$/.test(val) && !/[0-9]/.test(val) && !/[०-९]/.test(val);
// Note: \u0966-\u096F are Nepali digits. We want to exclude them.
// Refined Nepali Alpha only:
export const isNepaliAlphaOnly = (val) => /^[\u0900-\u0963\u0970-\u097F\s(),\-]*$/.test(val);

/**
 * Only English alphabets, numbers, and common email special characters.
 */
export const isValidEmailChar = (val) => /^[a-zA-Z0-9.@_\-\+]*$/.test(val);

/**
 * Only Arabic (English) numbers.
 */
export const isEnglishNumber = (val) => /^[0-9]*$/.test(val);
export const isArabicNumber = isEnglishNumber;

/**
 * Only Nepali numbers and special characters: - / , .
 */
export const isNepaliNumberWithSpecial = (val) => /^[०-९\-/,.]*$/.test(val);

/**
 * Validates english and nepali numbers along with ()-/
 */
export const isValidNumberWithSymbols = (val) => /^[\u0966-\u096F0-9\s()/\-]*$/.test(val);

/**
 * Block Nepali characters and Nepali numbers.
 */
export const hasNoNepali = (val) => !/[\u0900-\u097F]/.test(val);

/**
 * Combined helper for real-time input filtering
 */
export const filterInput = (value, reg) => reg.test(value);

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const convertToNepaliDigits = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[0-9]/g, (ch) => NEPALI_DIGITS[parseInt(ch)]);
};
