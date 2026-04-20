/**
 * Phonetic English → Nepali (Devanagari) transliterator.
 * Strict phonetic:
 * s -> स्
 * sa -> स
 * saa -> सा
 */

const isDevanagariConsonant = (ch) => {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return (code >= 0x0915 && code <= 0x0939) || (code >= 0x0958 && code <= 0x095F);
};

const DEV_DIGRAPHS = {
  'कh': 'ख', 'गh': 'घ', 'चh': 'छ', 'जh': 'झ', 'तh': 'थ', 'दh': 'ध',
  'पh': 'फ', 'बh': 'भ', 'सh': 'श', 'शh': 'ष', 'तr': 'त्र',
  'नg': 'ङ', 'नy': 'ञ',
  'टh': 'ठ', 'डh': 'ढ'
};

// Add uppercase secondary chars
Object.keys(DEV_DIGRAPHS).forEach(key => {
  const char = key[0];
  const sec = key[1];
  if (sec >= 'a' && sec <= 'z') {
    DEV_DIGRAPHS[char + sec.toUpperCase()] = DEV_DIGRAPHS[key];
  }
});

const CONSONANT_MAP = {
  'k': 'क', 'g': 'ग', 'c': 'च', 'j': 'ज', 't': 'त', 'd': 'द', 'n': 'न',
  'p': 'प', 'f': 'फ', 'b': 'ब', 'm': 'म', 'y': 'य', 'r': 'र', 'l': 'ल',
  'v': 'व', 'w': 'व', 's': 'स', 'h': 'ह', 'z': 'ज', 'q': 'क', 'x': 'क्ष',
  'T': 'ट', 'D': 'ड', 'N': 'ण'
};

// Auto-fill the rest of uppercase with lowercase equivalents
['K','G','C','J','P','F','B','M','Y','R','L','V','W','S','H','Z','Q','X'].forEach(upper => {
  CONSONANT_MAP[upper] = CONSONANT_MAP[upper.toLowerCase()];
});

const VOWEL_MATRA_MAP = {
  'a': '', 'A': 'ा',
  'i': 'ि', 'I': 'ी',
  'u': 'ु', 'U': 'ू',
  'e': 'े', 'E': 'ै',
  'o': 'ो', 'O': 'ौ'
};

const VOWEL_FULL_MAP = {
  'a': 'अ', 'A': 'आ',
  'i': 'इ', 'I': 'ई',
  'u': 'उ', 'U': 'ऊ',
  'e': 'ए', 'E': 'ऐ',
  'o': 'ओ', 'O': 'औ'
};

const IMPLICIT_A_COMBO_MAP = {
  'a': 'ा', 'A': 'ा',
  'i': 'ै', 'I': 'ै',
  'u': 'ौ', 'U': 'ौ',
};

const MATRA_COMBO_MAP = {
  'ाa': 'ा', 'ाA': 'ा',
  'िi': 'ी', 'िI': 'ी',
  'ुu': 'ू', 'ुU': 'ू',
  'ेe': 'ी', 'ेE': 'ी',
  'ोo': 'ू', 'ोO': 'ू',
  'ोu': 'ौ', 'ोU': 'ौ',
};

const FULL_VOWEL_COMBO_MAP = {
  'अa': 'आ', 'अA': 'आ',
  'इi': 'ई', 'इI': 'ई',
  'उu': 'ऊ', 'उU': 'ऊ',
  'एe': 'ई', 'एE': 'ई',
  'ओo': 'ऊ', 'ओO': 'ऊ',
  'अi': 'ऐ', 'अI': 'ऐ',
  'अu': 'औ', 'अU': 'औ',
  'ओu': 'औ', 'ओU': 'औ',
};

export const transliterateLive = (text) => {
  if (!text) return '';
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    
    // Check if it's an English letter
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
      const prev = result.length > 0 ? result[result.length - 1] : '';
      const prevPrev = result.length > 1 ? result[result.length - 2] : '';
      
      // 1. Digraphs (e.g. क + h -> ख)
      if (prev === '्' && prevPrev && DEV_DIGRAPHS[prevPrev + c]) {
        result = result.slice(0, -2) + DEV_DIGRAPHS[prevPrev + c] + '्';
        continue;
      }
      
      // 2. Vowels
      if (VOWEL_MATRA_MAP[c] !== undefined) {
        if (prev === '्') {
          // Replace halant with matra (or remove it if matra is empty for 'a')
          result = result.slice(0, -1) + VOWEL_MATRA_MAP[c];
        } else if (isDevanagariConsonant(prev)) {
          // Consonant without halant (implicit 'a' already applied)
          if (IMPLICIT_A_COMBO_MAP[c]) {
            result += IMPLICIT_A_COMBO_MAP[c];
          } else {
            result += VOWEL_FULL_MAP[c];
          }
        } else if (prev && MATRA_COMBO_MAP[prev + c]) {
          result = result.slice(0, -1) + MATRA_COMBO_MAP[prev + c];
        } else if (prev && FULL_VOWEL_COMBO_MAP[prev + c]) {
          result = result.slice(0, -1) + FULL_VOWEL_COMBO_MAP[prev + c];
        } else {
          // Start of word or after non-consonant
          result += VOWEL_FULL_MAP[c];
        }
        continue;
      }
      
      // 3. Consonants
      if (CONSONANT_MAP[c]) {
        result += CONSONANT_MAP[c] + '्';
        continue;
      }
      
      // Fallback
      result += c;
    } else {
      // Numbers, spaces, Devanagari chars, punctuation -> bypass/pass-through
      result += c;
    }
  }
  
  return result;
};

export const transliterateToNepali = (text) => transliterateLive(text);
export const processNepaliFieldInput = (text) => transliterateLive(text);
export const finalizeNepaliFieldInput = (text) => transliterateLive(text);
