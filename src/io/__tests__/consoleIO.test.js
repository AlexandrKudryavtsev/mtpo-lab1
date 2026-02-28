const ConsoleIO = require('../consoleIO');
const readline = require('readline');

jest.mock('readline', () => ({
    createInterface: jest.fn(() => ({
        question: jest.fn(),
        close: jest.fn()
    }))
}));

describe('ConsoleIO', () => {
    let consoleIO;
    let mockRl;

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'clear').mockImplementation(() => { });

        mockRl = {
            question: jest.fn(),
            close: jest.fn()
        };
        readline.createInterface.mockReturnValue(mockRl);

        consoleIO = new ConsoleIO();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should create readline interface', () => {
            expect(readline.createInterface).toHaveBeenCalledWith({
                input: process.stdin,
                output: process.stdout
            });
        });
    });

    describe('question method', () => {
        test('should ask question and return trimmed answer', async () => {
            const prompt = 'Enter name: ';
            const answer = '  John Doe  ';

            mockRl.question.mockImplementation((prompt, callback) => {
                callback(answer);
            });

            const result = await consoleIO.question(prompt);

            expect(mockRl.question).toHaveBeenCalledWith(prompt, expect.any(Function));
            expect(result).toBe('John Doe');
        });
    });

    describe('showMainMenu', () => {
        test('should display main menu with all options', () => {
            consoleIO.showMainMenu();

            expect(console.clear).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('СИСТЕМА РАСПРЕДЕЛЕНИЯ'));

            const allCalls = console.log.mock.calls.map(call => call[0]).join(' ');
            expect(allCalls).toContain('1. Загрузить данные');
            expect(allCalls).toContain('2. Ввести данные вручную');
            expect(allCalls).toContain('3. Просмотреть текущие данные');
            expect(allCalls).toContain('4. Запустить алгоритм (матрица)');
            expect(allCalls).toContain('5. Запустить алгоритм (списки)');
            expect(allCalls).toContain('6. Сравнить результаты алгоритмов');
            expect(allCalls).toContain('7. Показать статистику и рекомендации');
            expect(allCalls).toContain('8. Сохранить результаты в JSON');
            expect(allCalls).toContain('9. Справка');
            expect(allCalls).toContain('0. Выход');

            expect(console.log.mock.calls.length).toBeGreaterThan(5);
        });

    });

    describe('showHelp', () => {
        test('should display help information', () => {
            consoleIO.showHelp();

            const allCalls = console.log.mock.calls.map(call => call[0]).join(' ');

            expect(allCalls).toContain('СПРАВКА ПО СИСТЕМЕ');

            const hasAlgorithm = allCalls.includes('алгоритм Гейла-Шепли') ||
                allCalls.includes('Алгоритм Гейла-Шепли') ||
                allCalls.includes('Gale-Shapley');

            expect(hasAlgorithm).toBe(true);

            expect(allCalls).toContain('ФОРМАТ ВХОДНЫХ ДАННЫХ');
            expect(allCalls).toContain('Пример абитуриента');
            expect(allCalls).toContain('Пример вуза');
            expect(allCalls).toContain('РЕКОМЕНДАЦИИ');
        });
    });

    describe('showCurrentData', () => {
        test('should show message when no data', () => {
            consoleIO.showCurrentData([], []);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет данных'));
        });

        test('should display applicants and universities', () => {
            const applicants = [
                { id: 'A1', name: 'Иван', scores: 285, priorities: ['U1'] }
            ];
            const universities = [
                { id: 'U1', name: 'МГУ', capacity: 2, priorities: ['A1'] }
            ];

            consoleIO.showCurrentData(applicants, universities);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('A1'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Иван'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('U1'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('МГУ'));
        });
    });

    describe('showMatchingResults', () => {
        test('should display matching results', () => {
            const result = {
                algorithm: 'Gale-Shapley',
                stable: true,
                matching: [
                    {
                        applicant_name: 'Иван',
                        university_name: 'МГУ',
                        priority_index: 0
                    }
                ],
                unmatched: [],
                statistics: {
                    total_applicants: 1,
                    total_places: 1,
                    matched_count: 1,
                    matched_percentage: '100.00',
                    average_priority: '0.00'
                }
            };

            consoleIO.showMatchingResults(result);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('РЕЗУЛЬТАТЫ'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Иван → МГУ'));
        });

        test('should handle empty matching', () => {
            const result = {
                algorithm: 'Gale-Shapley',
                stable: true,
                matching: [],
                unmatched: ['A1'],
                statistics: {
                    total_applicants: 1,
                    total_places: 1,
                    matched_count: 0,
                    matched_percentage: '0.00',
                    average_priority: '0.00'
                }
            };

            consoleIO.showMatchingResults(result);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет распределенных'));
        });
    });

    describe('showComparison', () => {
        test('should display algorithm comparison', () => {
            const comparison = {
                matrix: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                lists: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                same_matching: true
            };

            consoleIO.showComparison(comparison);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('СРАВНЕНИЕ'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('полностью совпадают'));
        });

        test('should show differences when not same', () => {
            const comparison = {
                matrix: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                lists: { matched: 4, unmatched: 1, avgPriority: '0.75' },
                same_matching: false,
                differences: {
                    only_in_first: [{ applicant: 'A1', university: 'U1' }],
                    only_in_second: [{ applicant: 'A2', university: 'U2' }]
                }
            };

            consoleIO.showComparison(comparison);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('различаются'));
        });
    });

    describe('showStatisticsAndRecommendations', () => {
        test('should display statistics and recommendations', () => {
            const matching = [];
            const applicants = [];
            const universities = [];
            const stats = {
                total_applicants: 10,
                total_places: 8,
                matched_count: 8,
                matched_percentage: '80.00',
                competition: '1.25',
                satisfied_first_choice: 5,
                satisfied_first_choice_percentage: '50.00',
                average_priority: '0.75',
                per_university: {}
            };
            const recommendations = [
                { message: 'Test recommendation' }
            ];
            const tips = [
                { message: 'Test tip' }
            ];

            consoleIO.showStatisticsAndRecommendations(
                matching, applicants, universities, stats, recommendations, tips
            );

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ДЕТАЛЬНАЯ СТАТИСТИКА'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test recommendation'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test tip'));
        });
    });

    describe('inputManualData', () => {
        test('should collect manual data from user', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('2')) // кол-во абитуриентов
                .mockImplementationOnce((prompt, callback) => callback('A1')) // ID абитуриента
                .mockImplementationOnce((prompt, callback) => callback('Иван Петров')) // имя
                .mockImplementationOnce((prompt, callback) => callback('285')) // баллы
                .mockImplementationOnce((prompt, callback) => callback('2')) // кол-во вузов в приоритетах
                .mockImplementationOnce((prompt, callback) => callback('U1')) // приоритет 1
                .mockImplementationOnce((prompt, callback) => callback('U2')) // приоритет 2
                .mockImplementationOnce((prompt, callback) => callback('A2')) // ID абитуриента 2
                .mockImplementationOnce((prompt, callback) => callback('Анна Сидорова')) // имя 2
                .mockImplementationOnce((prompt, callback) => callback('270')) // баллы 2
                .mockImplementationOnce((prompt, callback) => callback('1')) // кол-во вузов в приоритетах 2
                .mockImplementationOnce((prompt, callback) => callback('U1')) // приоритет 2-1
                .mockImplementationOnce((prompt, callback) => callback('1')) // кол-во вузов
                .mockImplementationOnce((prompt, callback) => callback('U1')) // ID вуза
                .mockImplementationOnce((prompt, callback) => callback('МГУ')) // название
                .mockImplementationOnce((prompt, callback) => callback('2')) // количество мест
                .mockImplementationOnce((prompt, callback) => callback('2')) // кол-во абитуриентов в приоритетах
                .mockImplementationOnce((prompt, callback) => callback('A1')) // приоритет вуза 1
                .mockImplementationOnce((prompt, callback) => callback('A2')); // приоритет вуза 2

            const result = await consoleIO.inputManualData();

            expect(result).toHaveProperty('applicants');
            expect(result).toHaveProperty('universities');
            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(1);

            expect(result.applicants[0]).toEqual({
                id: 'A1',
                name: 'Иван Петров',
                scores: 285,
                priorities: ['U1', 'U2']
            });

            expect(result.universities[0]).toEqual({
                id: 'U1',
                name: 'МГУ',
                capacity: 2,
                priorities: ['A1', 'A2']
            });
        });

        test('should handle empty inputs gracefully', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('0'))
                .mockImplementationOnce((prompt, callback) => callback('0'));

            const result = await consoleIO.inputManualData();

            expect(result.applicants).toHaveLength(0);
            expect(result.universities).toHaveLength(0);
        });
    });

    describe('close method', () => {
        test('should close readline interface', () => {
            consoleIO.close();
            expect(mockRl.close).toHaveBeenCalled();
        });
    });
});
