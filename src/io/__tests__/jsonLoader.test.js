const fs = require('fs');
const path = require('path');
const JsonLoader = require('../jsonLoader');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

jest.mock('fs');

describe('JsonLoader', () => {
    let jsonLoader;
    let mockData;

    beforeEach(() => {
        jsonLoader = new JsonLoader();
        jest.clearAllMocks();

        mockData = {
            applicants: [
                { id: 'A1', name: 'Иван Петров', scores: 285, priorities: ['U1', 'U2'] },
                { id: 'A2', name: 'Анна Сидорова', scores: 270, priorities: ['U2', 'U1'] }
            ],
            universities: [
                { id: 'U1', name: 'МГУ', capacity: 2, priorities: ['A1', 'A2'] },
                { id: 'U2', name: 'СПбГУ', capacity: 1, priorities: ['A2', 'A1'] }
            ]
        };
    });

    // Boundary Value Analysis
    // Граничные значения: пустой файл, минимальный файл, большой файл
    describe('BVA: file size boundaries', () => {
        test('empty file should throw parse error', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, '');
            });

            await expect(jsonLoader.loadFromFile('empty.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });

        test('minimal valid file with one applicant and one university', async () => {
            const minimalData = {
                applicants: [{ id: 'A1', name: 'Иван', scores: 285, priorities: ['U1'] }],
                universities: [{ id: 'U1', name: 'МГУ', capacity: 1, priorities: ['A1'] }]
            };

            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, JSON.stringify(minimalData));
            });

            const result = await jsonLoader.loadFromFile('minimal.json');
            expect(result.applicants).toHaveLength(1);
            expect(result.universities).toHaveLength(1);
        });

        test('large file with stream processing', async () => {
            const largeData = {
                applicants: Array(1000).fill().map((_, i) => ({
                    id: `A${i}`,
                    name: `Student ${i}`,
                    scores: 200 + Math.floor(Math.random() * 100),
                    priorities: ['U1', 'U2']
                })),
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 500, priorities: ['A1'] },
                    { id: 'U2', name: 'СПбГУ', capacity: 500, priorities: ['A2'] }
                ]
            };

            const jsonString = JSON.stringify(largeData);
            const chunks = [];
            for (let i = 0; i < jsonString.length; i += 1000) {
                chunks.push(jsonString.slice(i, i + 1000));
            }

            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        chunks.forEach(chunk => handler(chunk));
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            const result = await jsonLoader.loadLargeFile('large.json');
            expect(result.applicants).toHaveLength(1000);
            expect(result.universities).toHaveLength(2);
        });
    });

    // Equivalence Partitioning
    // Классы: валидные данные, невалидные структуры, отсутствующие поля
    describe('EP: data validation classes', () => {
        test('valid: complete and correct data', () => {
            expect(() => jsonLoader.validateData(mockData)).not.toThrow();
        });

        test('invalid: missing applicants array', () => {
            const invalidData = { universities: mockData.universities };
            expect(() => jsonLoader.validateData(invalidData))
                .toThrow('Отсутствует массив абитуриентов');
        });

        test('invalid: missing universities array', () => {
            const invalidData = { applicants: mockData.applicants };
            expect(() => jsonLoader.validateData(invalidData))
                .toThrow('Отсутствует массив вузов');
        });

        test('invalid: applicant missing required fields', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван' }], // нет scores и priorities
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(invalidData))
                .toThrow('Абитуриент A1: отсутствует поле scores или оно не число');
        });

        test('invalid: university missing required fields', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ' }] // нет capacity и priorities
            };
            expect(() => jsonLoader.validateData(invalidData))
                .toThrow('Вуз U1: отсутствует поле capacity или оно не положительное число');
        });

        test('invalid: non-existent IDs in priorities', () => {
            const invalidData = {
                applicants: [
                    { id: 'A1', name: 'Иван', scores: 285, priorities: ['U99'] }
                ],
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(invalidData))
                .toThrow('Абитуриент A1: в приоритетах указан несуществующий вуз U99');
        });
    });

    // Statement Testing
    // Покрытие всех строк кода
    describe('Statement: all methods coverage', () => {
        test('loadFromFile success path', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, JSON.stringify(mockData));
            });

            const result = await jsonLoader.loadFromFile('test.json');
            expect(result).toEqual(mockData);
        });

        test('loadFromFile handles file not found (ENOENT)', async () => {
            const error = new Error('ENOENT: file not found');
            error.code = 'ENOENT';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('nonexistent.json'))
                .rejects
                .toThrow('Файл не найден');
        });

        test('loadFromFile handles other file system errors', async () => {
            const error = new Error('Permission denied');
            error.code = 'EACCES';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка чтения файла: Permission denied');
        });

        test('loadFromFile handles malformed JSON', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, '{ malformed json');
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });

        test('loadLargeFile handles malformed JSON', async () => {
            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        handler('{ malformed json');
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            await expect(jsonLoader.loadLargeFile('large.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });

        test('loadLargeFile handles stream data accumulation', async () => {
            const jsonString = JSON.stringify(mockData);
            const chunks = [
                jsonString.slice(0, 10),
                jsonString.slice(10, 20),
                jsonString.slice(20)
            ];

            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        chunks.forEach(chunk => handler(chunk));
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            const result = await jsonLoader.loadLargeFile('large.json');
            expect(result).toEqual(mockData);
        });

        test('loadLargeFile handles stream errors', async () => {
            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'error') {
                        handler(new Error('Stream error'));
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            await expect(jsonLoader.loadLargeFile('large.json'))
                .rejects
                .toThrow('Ошибка чтения файла: Stream error');
        });

        test('saveToFile writes data successfully', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(null);
            });

            const data = { test: 'data' };
            await expect(jsonLoader.saveToFile('output.json', data))
                .resolves
                .not.toThrow();

            expect(fs.writeFile).toHaveBeenCalled();
            const savedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
            expect(savedData).toEqual(data);
        });

        test('saveToFile handles write errors', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(new Error('Permission denied'));
            });

            await expect(jsonLoader.saveToFile('output.json', {}))
                .rejects
                .toThrow('Ошибка сохранения файла: Permission denied');
        });

        test('parseToModels converts JSON to model instances', () => {
            const result = jsonLoader.parseToModels(mockData);

            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(2);
            expect(result.applicants[0]).toBeInstanceOf(Applicant);
            expect(result.universities[0]).toBeInstanceOf(University);
            expect(result.applicants[0].id).toBe('A1');
            expect(result.universities[0].id).toBe('U1');
        });
    });

    // Branch Testing
    // Покрытие всех веток условий
    describe('Branch: conditional logic coverage', () => {
        test('loadFromFile branch: error.code === ENOENT', async () => {
            const error = new Error('File not found');
            error.code = 'ENOENT';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Файл не найден');
        });

        test('loadFromFile branch: error.code !== ENOENT', async () => {
            const error = new Error('Other error');
            error.code = 'EACCES';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка чтения файла: Other error');
        });

        test('validateData branch: missing applicants', () => {
            const data = { universities: [] };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Отсутствует массив абитуриентов');
        });

        test('validateData branch: missing universities', () => {
            const data = { applicants: [] };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Отсутствует массив вузов');
        });

        test('validateData branch: applicant missing id', () => {
            const data = {
                applicants: [{ name: 'Иван', scores: 285, priorities: ['U1'] }],
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Абитуриент: отсутствует поле id');
        });

        test('validateData branch: applicant missing name', () => {
            const data = {
                applicants: [{ id: 'A1', scores: 285, priorities: ['U1'] }],
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Абитуриент A1: отсутствует поле name');
        });

        test('validateData branch: applicant scores not a number', () => {
            const data = {
                applicants: [{ id: 'A1', name: 'Иван', scores: '285', priorities: ['U1'] }],
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Абитуриент A1: отсутствует поле scores или оно не число');
        });

        test('validateData branch: applicant priorities not an array', () => {
            const data = {
                applicants: [{ id: 'A1', name: 'Иван', scores: 285, priorities: 'U1' }],
                universities: mockData.universities
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Абитуриент A1: отсутствует поле priorities или это не массив');
        });

        test('validateData branch: university missing id', () => {
            const data = {
                applicants: mockData.applicants,
                universities: [{ name: 'МГУ', capacity: 2, priorities: ['A1'] }]
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Вуз: отсутствует поле id');
        });

        test('validateData branch: university capacity not positive', () => {
            const data = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ', capacity: 0, priorities: ['A1'] }]
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Вуз U1: отсутствует поле capacity или оно не положительное число');
        });

        test('validateData branch: university priorities not an array', () => {
            const data = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ', capacity: 2, priorities: 'A1' }]
            };
            expect(() => jsonLoader.validateData(data))
                .toThrow('Вуз U1: отсутствует поле priorities или это не массив');
        });

        test('loadLargeFile branch: JSON parse error', async () => {
            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        handler('{ malformed json');
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            await expect(jsonLoader.loadLargeFile('large.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });

        test('loadLargeFile branch: validation error after parse', async () => {
            const invalidData = { applicants: [] }; // нет universities
            const jsonString = JSON.stringify(invalidData);

            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        handler(jsonString);
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            await expect(jsonLoader.loadLargeFile('large.json'))
                .rejects
                .toThrow('Отсутствует массив вузов');
        });
    });

    // Edge Cases
    // Дополнительные граничные случаи
    describe('Edge cases', () => {
        test('handle non-Error objects in catch blocks', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback('String error', null);
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка чтения файла:');
        });

        test('validateData with duplicate validation', () => {
            // Уже валидные данные, проверяем повторную валидацию
            expect(() => jsonLoader.validateData(mockData)).not.toThrow();
        });

        test('saveToFile with large data', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(null);
            });

            const largeData = { data: 'x'.repeat(10000) };
            await expect(jsonLoader.saveToFile('large.json', largeData))
                .resolves
                .not.toThrow();
        });
    });

    // Параметризованные тесты
    describe('Parameterized (optimized)', () => {
        test.each([
            ['applicant missing id', { applicants: [{ name: 'Иван' }], universities: [] }, 'Абитуриент: отсутствует поле id'],
            ['applicant missing name', { applicants: [{ id: 'A1' }], universities: [] }, 'Абитуриент A1: отсутствует поле name'],
            ['applicant scores not number', { applicants: [{ id: 'A1', name: 'Иван', scores: '285' }], universities: [] }, 'Абитуриент A1: отсутствует поле scores или оно не число'],
            ['university missing id', { applicants: [], universities: [{ name: 'МГУ' }] }, 'Вуз: отсутствует поле id'],
            ['university capacity zero', { applicants: [], universities: [{ id: 'U1', name: 'МГУ', capacity: 0 }] }, 'Вуз U1: отсутствует поле capacity или оно не положительное число']
        ])('validateData error: %s', (name, data, expectedError) => {
            expect(() => jsonLoader.validateData(data)).toThrow(expectedError);
        });
    });

    // Assumption examples
    describe('Assumptions in tests', () => {
        let originalEnv;

        beforeEach(() => {
            originalEnv = process.env.NODE_ENV;
        });

        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });

        test('should verify assumptions about test environment', () => {
            // Assumption 1: в тестовом окружении
            expect(process.env.NODE_ENV).toBe('test');

            // Assumption 2: fs замокан
            expect(jest.isMockFunction(fs.readFile)).toBe(true);

            const error = new Error('ENOENT: file not found');
            error.code = 'ENOENT';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            expect(jsonLoader.loadFromFile('test.json')).rejects.toThrow('Файл не найден');
        });

        test('should verify assumptions about data structure', () => {
            // Assumption: данные имеют правильную структуру
            expect(Array.isArray(mockData.applicants)).toBe(true);
            expect(Array.isArray(mockData.universities)).toBe(true);

            expect(() => jsonLoader.validateData(mockData)).not.toThrow();
        });

        test('should handle non-Error objects with assumption about error handling', () => {
            // Assumption: можем обработать нестандартные ошибки
            const nonErrorObject = 'String error';
            expect(typeof nonErrorObject).toBe('string');

            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(nonErrorObject, null);
            });

            expect(jsonLoader.loadFromFile('test.json')).rejects.toThrow();
        });

        test('should skip large file test in CI environment with assumption', () => {
            // Assumption: в CI ли мы
            const isCI = process.env.CI === 'true';

            if (isCI) {
                console.warn('Skipping large file test in CI environment');
                return;
            }

            // Assumption: метод loadLargeFile существует
            expect(typeof jsonLoader.loadLargeFile).toBe('function');
        });
    });
});
