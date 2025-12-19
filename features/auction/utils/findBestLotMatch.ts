import type { Lot } from '@/entities/lot';
import levenshtein from 'js-levenshtein';

export const SIMILARITY_THRESHOLD = 0.33; // Порог схожести (33%). Если схожесть ниже, совпадение не засчитывается.
export const AUTOMATIC_ASSIGN_THRESHOLD = 0.95; // Порог для автоматического добавления доната к лоту.

// Список коротких, часто встречающихся слов, которые следует игнорировать при сравнении.
const STOP_WORDS = new Set(['на', 'для', 'от', 'до', 'с', 'у', 'в', 'о', 'по', 'из', 'за', 'и', 'или', 'не', 'да', 'но', 'же', 'бы', 'то', 'вот', 'а', 'как', 'так']);

// Карта для транслитерации русских символов в английские
const rusToEngMap: { [key: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j',
  'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
  'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '``', 'ы': 'y', 'ь': '`', 'э': 'e`', 'ю': 'yu', 'я': 'ya'
};

/**
 * Транслитерация текста с кириллицы на латиницу.
 * @param text - Входной текст.
 * @returns Транслитерированный текст.
 */
const transliterate = (text: string): string => {
  const lowerText = text.toLowerCase();
  return lowerText.split('').map(char => rusToEngMap[char] || char).join('');
};

/**
 * Конвертирует текст из английской раскладки в русскую и наоборот.
 * @param text - Входной текст.
 * @returns Текст в другой раскладке.
 */
const convertLayout = (text: string): string => {
  const keyboardMap: { [key: string]: string } = {
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
    'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э',
    'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю', '/': '.', '`': 'ё'
  };

  // Создаем обратную карту для конвертации из русской в английскую
  const reverseKeyboardMap: { [key: string]: string } = {};
  for (const enChar in keyboardMap) {
    reverseKeyboardMap[keyboardMap[enChar]] = enChar;
  }

  return text.split('').map((char) => {
    const lowerChar = char.toLowerCase();
    const isUpperCase = char !== lowerChar;
    let convertedChar = lowerChar;

    if (keyboardMap[lowerChar]) {
      convertedChar = keyboardMap[lowerChar];
    } else if (reverseKeyboardMap[lowerChar]) {
      convertedChar = reverseKeyboardMap[lowerChar]
    } else {
      return char; // Возвращаем исходный символ, если его нет в картах
    }

    if (isUpperCase) {
      return convertedChar.toUpperCase();
    }
    return convertedChar;
  }).join('');
};

/**
 * Находит наиболее подходящий лот для доната на основе совпадения текста.
 * Использует расстояние Левенштейна для нечеткого поиска.
 * @param donationMessage - Сообщение из доната.
 * @param lots - Список всех лотов.
 * @returns Объект с наиболее подходящим лотом и степенью схожести.
 */
export const findBestLotMatch = (donationMessage: string, lots: Lot[]): { bestMatch: Lot | null, similarity: number } => {
  if (!donationMessage || !lots) return { bestMatch: null, similarity: 0 };

  let bestMatch: Lot | null = null;
  let highestSimilarity = 0;

  const getSignificantWords = (text: string): string[] => {
    const allWords = text
      .toLowerCase()
      .replace(/[^а-яa-z0-9]+/g, ' ')
      .split(/\s+/);

    const significant = allWords.filter(word => word && word.length > 1 && !STOP_WORDS.has(word));
 
    // Если после фильтрации не осталось слов, но изначально слова были, возвращаем исходные (без стоп-слов, но с короткими)
    return significant.length > 0 ? significant : allWords.filter(word => word && !STOP_WORDS.has(word));
  };

  const messageWords = getSignificantWords(donationMessage);
  if (messageWords.length === 0) {
    return { bestMatch: null, similarity: 0 };
  }

  const filledLots = lots.filter(lot => !lot.isPlaceholder);

  for (const lot of filledLots) {
    const lotWords = getSignificantWords(lot.content);
    if (lotWords.length === 0) continue;

    let matches = 0;

    const lowerCaseMessage = donationMessage.trim().toLowerCase();
    const lowerCaseLotContent = lot.content.trim().toLowerCase();

    // Проверка на прямое вхождение
    if (lowerCaseLotContent.includes(lowerCaseMessage) || lowerCaseMessage.includes(lowerCaseLotContent)) {
      // Если уже есть идеальное совпадение, нет смысла искать дальше.
      // Но если мы нашли другое идеальное совпадение, мы его не заменяем.
      if (highestSimilarity < 1.0) {
        highestSimilarity = 1.0;
        bestMatch = lot;
      }
      continue;
    }

    // Сравнение по словам с учетом транслитерации и раскладки
    for (const msgWord of messageWords) {
      // Генерируем варианты для слова из доната
      const msgWordVariations = [
        msgWord,
        transliterate(msgWord) ,
        convertLayout(msgWord)
      ].filter((v, i, a) => a.indexOf(v) === i); // Оставляем только уникальные варианты

      for (const lotWord of lotWords) {
        // Генерируем варианты для слова из лота
        const lotWordVariations = [
          lotWord,
          transliterate(lotWord),
          convertLayout(lotWord)
        ].filter((v, i, a) => a.indexOf(v) === i); // Уникальные варианты

        if (msgWordVariations.some(msgVariant => lotWordVariations.some(lotVariant => {
          const distance = levenshtein(msgVariant, lotVariant);
          const maxLength = Math.max(msgVariant.length, lotVariant.length);
          const wordSimilarity = maxLength > 0 ? 1 - distance / maxLength : 0;
          return wordSimilarity >= 0.7; // Порог схожести для отдельных слов, можно настроить
        }))) {
          matches++;
          break; // Нашли совпадение для слова из доната, переходим к следующему
        }
      }
    }

    // Расчет схожести на основе коэффициента Сёренсена-Дайса.
    // Он лучше подходит для сравнения наборов слов разной длины.
    const totalWords = messageWords.length + lotWords.length;
    const similarity = totalWords > 0 ? (2 * matches) / totalWords : 0;

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = lot;
    }
  }

  // Возвращаем результат, только если он проходит порог или является идеальным совпадением
  if (highestSimilarity >= SIMILARITY_THRESHOLD) {
    return { bestMatch, similarity: highestSimilarity };
  }

  return { bestMatch: null, similarity: 0 };
};