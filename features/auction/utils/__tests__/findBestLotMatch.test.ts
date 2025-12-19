import { findBestLotMatch } from '../findBestLotMatch';
import type { Lot } from '@/entities/lot';

// describe - это группа тестов для одного модуля или функции.
describe('findBestLotMatch', () => {
  // Подготовим тестовые данные (моковые лоты)
  const lots: Lot[] = [
    { id: 1, number: 1, content: 'Сигма', amount: 100, isPlaceholder: false },
    { id: 2, number: 2, content: 'Поход в кино', amount: 500, isPlaceholder: false },
    { id: 3, number: 3, content: 'Спеть песню про еду', amount: 300, isPlaceholder: false },
    { id: 4, number: 4, content: 'Пустой лот-плейсхолдер', amount: 0, isPlaceholder: true },
    { id: 6, number: 6, content: 'Заказ пиццы на стрим', amount: 1500, isPlaceholder: false },
    { id: 5, number: 5, content: 'Очень длинное название лота для проверки', amount: 1000, isPlaceholder: false },
  ];

  // test (или it) - это отдельный тестовый сценарий.
  test('должен находить точное совпадение', () => {
    const donationMessage = 'Сигма';
    const { bestMatch, similarity } = findBestLotMatch(donationMessage, lots);
    
    // expect - это утверждение. Мы ожидаем, что результат будет определенным.
    expect(bestMatch).not.toBeNull(); // Ожидаем, что совпадение найдено
    expect(bestMatch?.id).toBe(1);     // Ожидаем, что это лот с id: 1
    expect(similarity).toBe(1.0);      // Ожидаем 100% схожесть
  });

  test('должен находить совпадение с опечаткой', () => {
    const donationMessage = 'Поход в кено'; // Опечатка в слове "кино"
    const { bestMatch } = findBestLotMatch(donationMessage, lots);
    
    expect(bestMatch).not.toBeNull();
    expect(bestMatch?.id).toBe(2);
  });

  test('должен находить совпадение, игнорируя стоп-слова', () => {
    const donationMessage = 'Спеть на стриме песню про еду'; // "на стриме" - стоп-слова и лишние слова
    const { bestMatch } = findBestLotMatch(donationMessage, lots);
    
    expect(bestMatch).not.toBeNull();
    expect(bestMatch?.id).toBe(3);
  });

  test('должен возвращать null, если схожесть ниже порога', () => {
    const donationMessage = 'Абсолютно другой текст';
    const { bestMatch, similarity } = findBestLotMatch(donationMessage, lots);
    
    expect(bestMatch).toBeNull(); // Ожидаем, что совпадение НЕ найдено
    expect(similarity).toBe(0);   // Ожидаем, что схожесть равна 0 (т.к. она ниже порога)
  });

  test('не должен находить совпадения с лотами-плейсхолдерами', () => {
    const donationMessage = 'Пустой лот';
    const { bestMatch } = findBestLotMatch(donationMessage, lots);
    
    // Даже если текст похож, плейсхолдеры должны игнорироваться
    expect(bestMatch).toBeNull();
  });

  test('должен возвращать null для пустых входных данных', () => {
    expect(findBestLotMatch('', lots).bestMatch).toBeNull();
    expect(findBestLotMatch('что-то', []).bestMatch).toBeNull();
    expect(findBestLotMatch('', []).bestMatch).toBeNull();
  });

  test('должен выбирать наиболее релевантный лот из нескольких похожих', () => {
    const specificLots: Lot[] = [
        { id: 10, number: 10, content: 'Поиграть в Dota 2', amount: 100, isPlaceholder: false },
        { id: 11, number: 11, content: 'Поиграть в CS 2', amount: 100, isPlaceholder: false },
    ];
    const donationMessage = 'го дота';
    const { bestMatch } = findBestLotMatch(donationMessage, specificLots);

    expect(bestMatch?.id).toBe(10);
  });

  test('должен находить совпадение в неправильной раскладке (транслит)', () => {
    const donationMessage = 'Cbuvf'; // "Сигма" в английской раскладке (правильное соответствие клавиш)
    const { bestMatch } = findBestLotMatch(donationMessage, lots);

    expect(bestMatch).not.toBeNull();
    expect(bestMatch?.id).toBe(1);
  });

  test('должен предпочесть более полное совпадение по словам', () => {
    // "пицца" совпадает с "Заказ пиццы на стрим"
    // "кино" совпадает с "Поход в кино"
    // Но в донате есть еще "заказ", что делает первый лот более релевантным.
    const donationMessage = 'заказ пиццы';
    const { bestMatch } = findBestLotMatch(donationMessage, lots);

    expect(bestMatch).not.toBeNull();
    expect(bestMatch?.id).toBe(6);
  });

  test('не должен находить совпадение, если значимых слов нет', () => {
    // Сообщение состоит только из стоп-слов
    const donationMessage = 'на для от и';
    const { bestMatch } = findBestLotMatch(donationMessage, lots);

    expect(bestMatch).toBeNull();
  });
});
