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

    // Boundary Value Analysis
    describe('BVA: question method boundaries', () => {
        test('empty input returns empty string', async () => {
            mockRl.question.mockImplementation((prompt, callback) => {
                callback('');
            });

            const result = await consoleIO.question('Prompt: ');
            expect(result).toBe('');
        });

        test('input with spaces returns trimmed string', async () => {
            mockRl.question.mockImplementation((prompt, callback) => {
                callback('  test  ');
            });

            const result = await consoleIO.question('Prompt: ');
            expect(result).toBe('test');
        });

        test('input with special characters', async () => {
            mockRl.question.mockImplementation((prompt, callback) => {
                callback('test!@#$%');
            });

            const result = await consoleIO.question('Prompt: ');
            expect(result).toBe('test!@#$%');
        });
    });

    // Equivalence Partitioning
    describe('EP: display methods with different data states', () => {
        test('showCurrentData with empty arrays', () => {
            consoleIO.showCurrentData([], []);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет данных'));
        });

        test('showCurrentData with populated arrays', () => {
            const applicants = [
                {
                    id: 'A1',
                    name: 'Иван',
                    scores: 285,
                    priorities: ['U1', 'U2'],
                    join: Array.prototype.join
                }
            ];
            const universities = [
                {
                    id: 'U1',
                    name: 'МГУ',
                    capacity: 2,
                    priorities: ['A1'],
                    join: Array.prototype.join
                }
            ];

            consoleIO.showCurrentData(applicants, universities);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('A1'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Иван'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('U1'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('МГУ'));
        });

        test('showMatchingResults with empty matching', () => {
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

        test('showMatchingResults with populated matching', () => {
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
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Иван -> МГУ'));
        });
    });

    // Statement Testing
    describe('Statement: all methods coverage', () => {
        test('constructor creates readline interface', () => {
            expect(readline.createInterface).toHaveBeenCalledWith({
                input: process.stdin,
                output: process.stdout
            });
        });

        test('question method resolves with trimmed answer', async () => {
            mockRl.question.mockImplementation((prompt, callback) => {
                callback('  answer  ');
            });

            const result = await consoleIO.question('Prompt: ');
            expect(result).toBe('answer');
            expect(mockRl.question).toHaveBeenCalledWith('Prompt: ', expect.any(Function));
        });

        test('showMainMenu displays all options', () => {
            consoleIO.showMainMenu();

            expect(console.clear).toHaveBeenCalled();
            const calls = console.log.mock.calls.map(call => call[0]).join(' ');

            const expectedOptions = [
                '1. Загрузить данные',
                '2. Ввести данные вручную',
                '3. Просмотреть текущие данные',
                '4. Запустить алгоритм (матрица)',
                '5. Запустить алгоритм (списки)',
                '6. Сравнить результаты алгоритмов',
                '7. Показать статистику и рекомендации',
                '8. Сохранить результаты в JSON',
                '9. Справка',
                '0. Выход'
            ];

            expectedOptions.forEach(option => {
                expect(calls).toContain(option);
            });
        });

        test('showHelp displays help information', () => {
            consoleIO.showHelp();

            const calls = console.log.mock.calls.map(call => call[0]).join(' ');

            expect(calls).toContain('СПРАВКА ПО СИСТЕМЕ');
            expect(calls).toContain('Алгоритм Гейла-Шепли');
            expect(calls).toContain('ФОРМАТ ВХОДНЫХ ДАННЫХ');
            expect(calls).toContain('РЕКОМЕНДАЦИИ');
        });

        test('showComparison displays algorithm comparison', () => {
            const comparison = {
                matrix: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                lists: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                same_matching: true
            };

            consoleIO.showComparison(comparison);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('СРАВНЕНИЕ'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('полностью совпадают'));
        });

        test('showComparison with differences', () => {
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

        test('showStatisticsAndRecommendations displays all sections', () => {
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
            const recommendations = [{ message: 'Test recommendation' }];
            const tips = [{ message: 'Test tip' }];

            consoleIO.showStatisticsAndRecommendations(
                [], [], [], stats, recommendations, tips
            );

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ДЕТАЛЬНАЯ СТАТИСТИКА'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test recommendation'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test tip'));
        });

        test('close method closes readline', () => {
            consoleIO.close();
            expect(mockRl.close).toHaveBeenCalled();
        });
    });

    // Branch Testing
    describe('Branch: conditional logic coverage', () => {
        test('showCurrentData branch: applicants empty', () => {
            const universities = [{
                id: 'U1',
                name: 'МГУ',
                capacity: 2,
                priorities: ['A1'],
                join: Array.prototype.join
            }];

            consoleIO.showCurrentData([], universities);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Абитуриенты (0)'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет данных'));
        });

        test('showCurrentData branch: universities empty', () => {
            const applicants = [{
                id: 'A1',
                name: 'Иван',
                scores: 285,
                priorities: ['U1'],
                join: Array.prototype.join
            }];

            consoleIO.showCurrentData(applicants, []);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Вузы (0)'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет данных'));
        });

        test('showMatchingResults branch: has unmatched applicants', () => {
            const result = {
                algorithm: 'Test',
                stable: true,
                matching: [{
                    applicant_name: 'Иван',
                    university_name: 'МГУ',
                    priority_index: 0
                }],
                unmatched: ['A2'],
                statistics: {
                    total_applicants: 2,
                    total_places: 1,
                    matched_count: 1,
                    matched_percentage: '50.00',
                    average_priority: '0.00'
                }
            };

            consoleIO.showMatchingResults(result);
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нераспределенные'));
        });

        test('showMatchingResults branch: no unmatched applicants', () => {
            const result = {
                algorithm: 'Test',
                stable: true,
                matching: [{
                    applicant_name: 'Иван',
                    university_name: 'МГУ',
                    priority_index: 0
                }],
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
            expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Нераспределенные'));
        });

        test('showComparison branch: differences object missing entirely', () => {
            const comparison = {
                matrix: { matched: 5, unmatched: 0, avgPriority: '0.5' },
                lists: { matched: 4, unmatched: 1, avgPriority: '0.75' },
                same_matching: false
                // differences отсутствует
            };

            expect(() => consoleIO.showComparison(comparison)).not.toThrow();
        });

        test('showStatisticsAndRecommendations branch: empty recommendations', () => {
            const stats = {
                total_applicants: 0,
                total_places: 0,
                matched_count: 0,
                matched_percentage: '0.00',
                competition: '0.00',
                satisfied_first_choice: 0,
                satisfied_first_choice_percentage: '0.00',
                average_priority: '0.00',
                per_university: {}
            };

            consoleIO.showStatisticsAndRecommendations(
                [], [], [], stats, [], []
            );

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет рекомендаций'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Нет советов'));
        });
    });

    // Decision Table Testing
    describe('Decision Table: inputManualData combinations', () => {
        test('valid input with multiple applicants and universities', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('Иван Петров'))
                .mockImplementationOnce((prompt, callback) => callback('285'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('U2'))
                .mockImplementationOnce((prompt, callback) => callback('A2'))
                .mockImplementationOnce((prompt, callback) => callback('Анна Сидорова'))
                .mockImplementationOnce((prompt, callback) => callback('270'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('МГУ'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('A2'));

            const result = await consoleIO.inputManualData();

            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(1);
            expect(result.applicants[0]).toEqual({
                id: 'A1',
                name: 'Иван Петров',
                scores: 285,
                priorities: ['U1', 'U2']
            });
        });

        test('zero applicants and universities', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('0'))
                .mockImplementationOnce((prompt, callback) => callback('0'));

            const result = await consoleIO.inputManualData();
            expect(result.applicants).toHaveLength(0);
            expect(result.universities).toHaveLength(0);
        });

        test('invalid number input falls back to NaN', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('abc'))
                .mockImplementationOnce((prompt, callback) => callback('0'));

            const result = await consoleIO.inputManualData();
            expect(result.applicants).toHaveLength(0);
            expect(result.universities).toHaveLength(0);
        });
    });

    // Параметризованные тесты
    describe('Parameterized (optimized)', () => {
        test.each([
            ['test', 'test'],
            ['  spaced  ', 'spaced'],
            ['', ''],
            ['123', '123'],
            ['!@#', '!@#']
        ])('question trims "%s" to "%s"', async (input, expected) => {
            mockRl.question.mockImplementation((prompt, callback) => {
                callback(input);
            });

            const result = await consoleIO.question('Prompt: ');
            expect(result).toBe(expected);
        });
    });

    // Edge Cases
    describe('Edge cases for uncovered lines', () => {
        test('inputManualData handles missing applicant priorities count', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('Иван'))
                .mockImplementationOnce((prompt, callback) => callback('285'))
                .mockImplementationOnce((prompt, callback) => callback('0')) // 0 priorities
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('МГУ'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'));

            const result = await consoleIO.inputManualData();

            expect(result.applicants[0].priorities).toEqual([]);
            expect(result.universities[0].priorities).toEqual(['A1']);
        });

        test('inputManualData handles missing university priorities count', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('Иван'))
                .mockImplementationOnce((prompt, callback) => callback('285'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('МГУ'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('')); // пустой ввод

            const result = await consoleIO.inputManualData();
            expect(result).toBeDefined();
            expect(result.universities[0].priorities).toEqual([]);
        });

        test('inputManualData handles non-numeric priority count', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('Иван'))
                .mockImplementationOnce((prompt, callback) => callback('285'))
                .mockImplementationOnce((prompt, callback) => callback('abc')) // не число
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('МГУ'))
                .mockImplementationOnce((prompt, callback) => callback('2'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'));

            const result = await consoleIO.inputManualData();
            expect(result.applicants[0].priorities).toEqual([]);
        });

        test('inputManualData handles missing applicant name', async () => {
            mockRl.question
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('A1'))
                .mockImplementationOnce((prompt, callback) => callback('')) // пустое имя
                .mockImplementationOnce((prompt, callback) => callback('285'))
                .mockImplementationOnce((prompt, callback) => callback('1'))
                .mockImplementationOnce((prompt, callback) => callback('U1'))
                .mockImplementationOnce((prompt, callback) => callback('0'));

            const result = await consoleIO.inputManualData();
            expect(result.applicants[0].name).toBe('');
        });
    });
});
