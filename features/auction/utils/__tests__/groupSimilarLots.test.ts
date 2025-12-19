import type { Lot } from '@/entities/lot';
import { groupSimilarLots } from '../groupSimilarLots';
import { findBestLotMatch } from '../findBestLotMatch';

// Мокаем зависимость, чтобы контролировать результат сравнения в тестах
jest.mock('../findBestLotMatch', () => ({
  ...jest.requireActual('../findBestLotMatch'),
  findBestLotMatch: jest.fn(),
  SIMILARITY_THRESHOLD: 0.5, // Явно мокаем SIMILARITY_THRESHOLD для предсказуемости тестов
}));

// Создаем типизированный мок для удобства работы в тестах
const mockedFindBestLotMatch = findBestLotMatch as jest.Mock;

describe('groupSimilarLots', () => {
  // Подготовим набор лотов для тестов
  const mockLots: Lot[] = [
    { id: 1, number: 1, amount: 100, content: 'Очень похожий лот номер один', isPlaceholder: false },
    { id: 2, number: 2, amount: 100, content: 'Очень похожий лот номер два', isPlaceholder: false },
    { id: 3, number: 3, amount: 100, content: 'Совершенно другой лот', isPlaceholder: false },
    { id: 4, number: 4, amount: 100, content: 'Еще один совершенно другой лот', isPlaceholder: false },
    { id: 5, number: 5, amount: 100, content: 'Очень похожий лот номер три', isPlaceholder: false },
    { id: 6, number: 6, amount: 100, content: 'Плейсхолдер', isPlaceholder: true },
    { id: 7, number: 7, amount: 100, content: 'ok', isPlaceholder: false }, // Слишком короткий контент
    {
      id: 8,
      number: 8,
      amount: 100,
      content: 'Третья группа лотов, элемент 1',
      isPlaceholder: false,
    },
    {
      id: 9,
      number: 9,
      amount: 100,
      content: 'Третья группа лотов, элемент 2',
      isPlaceholder: false,
    },
    { id: 10, number: 10, amount: 100, content: 'Лот с числом 22, часть А', isPlaceholder: false },
    { id: 11, number: 11, amount: 100, content: 'Лот с числом 22, часть Б', isPlaceholder: false },
    { id: 12, number: 12, amount: 100, content: '22', isPlaceholder: false }, // Контент длиной 2 символа
    { id: 13, number: 13, amount: 100, content: 'А', isPlaceholder: false }, // Контент длиной 1 символ
  ];

  // Сбрасываем моки перед каждым тестом
  beforeEach(() => {
    mockedFindBestLotMatch.mockClear();
  });

  it('должна возвращать пустой объект, если массив лотов пуст', () => {
    expect(groupSimilarLots([])).toEqual({});
  });

  it('должна возвращать пустой объект, если лотов меньше двух', () => {
    expect(groupSimilarLots([mockLots[0]])).toEqual({});
  });

  it('должна возвращать пустой объект, если нет похожих лотов', () => {
    // Всегда возвращаем низкую схожесть
    mockedFindBestLotMatch.mockReturnValue({ similarity: 0.1 });
    const result = groupSimilarLots(mockLots);
    expect(result).toEqual({});
  });

  it('должна игнорировать плейсхолдеры и лоты с коротким контентом', () => {
    mockedFindBestLotMatch.mockReturnValue({ similarity: 0.9 });
    // Передаем только лоты, которые должны быть отфильтрованы
    const result = groupSimilarLots([mockLots[5], mockLots[6]]);
    expect(result).toEqual({});
    // Убедимся, что findBestLotMatch даже не вызывалась
    expect(mockedFindBestLotMatch).not.toHaveBeenCalled();
  });

  it('должна группировать одну группу похожих лотов', () => {
    // Моделируем высокую схожесть только для определенной пары
    mockedFindBestLotMatch.mockImplementation((content, [otherLot]) => {
      if (
        (content.includes('номер один') && otherLot.content.includes('номер два')) ||
        (content.includes('номер два') && otherLot.content.includes('номер один'))
      ) {
        return { similarity: 0.9 };
      }
      return { similarity: 0.1 };
    });

    const result = groupSimilarLots([mockLots[0], mockLots[1], mockLots[2]]);
    expect(result).toEqual({
      1: [1, 2],
    });
  });

  it('должна формировать несколько отдельных групп', () => {
    mockedFindBestLotMatch.mockImplementation((content, [otherLot]) => {
      // Вспомогательный объект, чтобы удовлетворить тип Lot
      const lot1: Lot = {
        content,
        id: 0,
        number: 0,
        amount: 0,
        isPlaceholder: false,
      };
      const lots = [lot1, otherLot];

      const isGroup1 = lots.every(l => l.content.startsWith('Очень похожий лот'));
      const isGroup3 = lots.every(l => l.content.startsWith('Третья группа лотов'));

      if (isGroup1 || isGroup3) {
        return { similarity: 0.9 };
      }
      return { similarity: 0.2 };
    });

    const result = groupSimilarLots(mockLots);

    expect(result).toEqual({
      1: [1, 2, 5],
      8: [8, 9],
    });
  });

  it('должна использовать кастомный порог схожести', () => {
    // Поскольку SIMILARITY_THRESHOLD замокан как 0.5, порог по умолчанию в groupSimilarLots будет 0.5 + 0.2 = 0.7.

    // Для проверки с порогом по умолчанию: схожесть 0.69 (ниже 0.7). Используем mockReturnValueOnce, чтобы не влиять на другие тесты.
    mockedFindBestLotMatch.mockReturnValueOnce({ similarity: 0.69 }).mockReturnValueOnce({ similarity: 0.69 });
    const resultDefault = groupSimilarLots([mockLots[0], mockLots[1]]);
    expect(resultDefault).toEqual({});

    // Для проверки с кастомным порогом: схожесть 0.7 (выше 0.65).
    mockedFindBestLotMatch.mockReturnValueOnce({ similarity: 0.7 }).mockReturnValueOnce({ similarity: 0.7 });
    const resultCustom = groupSimilarLots([mockLots[0], mockLots[1]], 0.65);
    expect(resultCustom).toEqual({
      1: [1, 2],
    });
  });

  it('не должна включать лот в несколько групп', () => {
    // Лот 2 похож на 1, а лот 5 похож на 2
    mockedFindBestLotMatch.mockImplementation((content, [otherLot]) => {
      if (
        (content.includes('один') && otherLot.content.includes('два')) ||
        (content.includes('два') && otherLot.content.includes('три'))
      ) {
        return { similarity: 0.9 };
      }
      return { similarity: 0.1 };
    });

    const result = groupSimilarLots([mockLots[0], mockLots[1], mockLots[4]]); // [1, 2, 5]
    // Лот 1 сгруппируется с 2. Оба будут помечены как обработанные.
    // Когда цикл дойдет до лота 5, он не будет сравниваться с уже обработанным лотом 2.
    expect(result).toEqual({ 1: [1, 2] });
  });

  it('должна группировать лоты, содержащие число "22" в более длинном контенте', () => {
    const lot22A = mockLots.find(l => l.id === 10)!; // 'Лот с числом 22, часть А'
    const lot22B = mockLots.find(l => l.id === 11)!; // 'Лот с числом 22, часть Б'

    mockedFindBestLotMatch.mockImplementation((content, [otherLot]) => {
      if (
        (content.includes('числом 22, часть А') && otherLot.content.includes('числом 22, часть Б')) ||
        (content.includes('числом 22, часть Б') && otherLot.content.includes('числом 22, часть А'))
      ) {
        return { similarity: 0.9 }; // Высокая схожесть для этих двух лотов
      }
      return { similarity: 0.1 }; // Низкая схожесть для остальных
    });

    const result = groupSimilarLots([lot22A, lot22B]);

    expect(result).toEqual({
      [lot22A.id]: [lot22A.id, lot22B.id],
    });
    // Убедимся, что findBestLotMatch была вызвана для этих лотов
    expect(mockedFindBestLotMatch).toHaveBeenCalledWith(lot22A.content, [lot22B]);
  });

  it('не должна обрабатывать лоты с контентом длиной 2 символа или меньше (например, "22" или "А")', () => {
    const lotExact22 = mockLots.find(l => l.id === 12)!; // '22'
    const lotSingleChar = mockLots.find(l => l.id === 13)!; // 'А'

    // Передаем лоты, которые должны быть отфильтрованы
    const result = groupSimilarLots([lotExact22, lotSingleChar]);

    // Ожидаем пустой объект, так как оба лота будут отфильтрованы
    expect(result).toEqual({});

    // Убедимся, что findBestLotMatch даже не вызывалась, так как лоты были отфильтрованы
    expect(mockedFindBestLotMatch).not.toHaveBeenCalled();
  });
});