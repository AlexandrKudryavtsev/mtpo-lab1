const fs = require('fs');
const path = require('path');
const JsonLoader = require('../jsonLoader');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

// Мокаем fs модуль
jest.mock('fs');

describe('JsonLoader', () => {
    let jsonLoader;
    let mockData;

    beforeEach(() => {
        jsonLoader = new JsonLoader();
        jest.clearAllMocks();

        // Тестовые данные
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

    describe('loadFromFile', () => {
        test('should load and parse JSON file correctly', async () => {
            // Мокаем fs.readFile
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, JSON.stringify(mockData));
            });

            const result = await jsonLoader.loadFromFile('test.json');

            expect(result).toHaveProperty('applicants');
            expect(result).toHaveProperty('universities');
            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(2);
            expect(fs.readFile).toHaveBeenCalledWith(
                'test.json',
                'utf8',
                expect.any(Function)
            );
        });

        test('should throw error if file not found', async () => {
            const error = new Error('ENOENT: file not found');
            error.code = 'ENOENT'; // Добавляем code
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('nonexistent.json'))
                .rejects
                .toThrow('Файл не найден');
        });

        test('should throw error if JSON is malformed', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, '{ malformed json');
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });
    });

    describe('validateData', () => {
        test('should validate correct data structure', () => {
            expect(() => {
                jsonLoader.validateData(mockData);
            }).not.toThrow();
        });

        test('should throw error if applicants array missing', () => {
            const invalidData = { universities: [] };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Отсутствует массив абитуриентов');
        });

        test('should throw error if universities array missing', () => {
            const invalidData = { applicants: [] };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Отсутствует массив вузов');
        });

        test('should throw error if applicant has missing required fields', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван' }], // нет scores и priorities
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле scores');
        });

        test('should throw error if university has missing required fields', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ' }] // нет capacity и priorities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: отсутствует поле capacity');
        });

        test('should throw error if priorities contain non-existent IDs', () => {
            const invalidData = {
                applicants: [
                    { id: 'A1', name: 'Иван', scores: 285, priorities: ['U1', 'U99'] } // U99 не существует
                ],
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 2, priorities: ['A1'] }
                ]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: в приоритетах указан несуществующий вуз U99');
        });
    });

    describe('parseToModels', () => {
        test('should convert JSON data to model instances', () => {
            const result = jsonLoader.parseToModels(mockData);

            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(2);
            expect(result.applicants[0]).toBeInstanceOf(Applicant);
            expect(result.universities[0]).toBeInstanceOf(University);

            // Проверяем данные первого абитуриента
            expect(result.applicants[0].id).toBe('A1');
            expect(result.applicants[0].name).toBe('Иван Петров');
            expect(result.applicants[0].scores).toBe(285);

            // Проверяем данные первого вуза
            expect(result.universities[0].id).toBe('U1');
            expect(result.universities[0].name).toBe('МГУ');
            expect(result.universities[0].capacity).toBe(2);
        });
    });

    describe('loadLargeFile', () => {
        test('should handle large files with streams', async () => {
            // Создаем большой объект
            const largeData = {
                applicants: Array(10000).fill().map((_, i) => ({
                    id: `A${i}`,
                    name: `Student ${i}`,
                    scores: 200 + Math.floor(Math.random() * 100),
                    priorities: ['U1', 'U2']
                })),
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 5000, priorities: ['A1', 'A2'] },
                    { id: 'U2', name: 'СПбГУ', capacity: 5000, priorities: ['A2', 'A1'] }
                ]
            };

            // Мокаем createReadStream
            const mockStream = {
                on: jest.fn().mockImplementation(function (event, handler) {
                    if (event === 'data') {
                        // Эмулируем получение данных чанками
                        const chunk1 = JSON.stringify(largeData).slice(0, 1000);
                        const chunk2 = JSON.stringify(largeData).slice(1000);
                        handler(chunk1);
                        handler(chunk2);
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return this;
                })
            };

            fs.createReadStream.mockReturnValue(mockStream);

            const result = await jsonLoader.loadLargeFile('large.json');

            expect(result.applicants).toBeDefined();
            expect(result.universities).toBeDefined();
            expect(fs.createReadStream).toHaveBeenCalledWith('large.json', 'utf8');
        });

        test('should handle stream errors', async () => {
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
                .toThrow('Ошибка чтения файла');
        });
    });

    describe('saveToFile', () => {
        test('should save data to JSON file', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(null);
            });

            const data = {
                matching: [
                    { applicant: 'A1', university: 'U1' }
                ],
                statistics: { matched: 1 }
            };

            await expect(jsonLoader.saveToFile('output.json', data))
                .resolves
                .not.toThrow();

            expect(fs.writeFile).toHaveBeenCalled();
            const writeCall = fs.writeFile.mock.calls[0];
            expect(writeCall[0]).toBe('output.json');

            // Проверяем, что данные валидный JSON
            const savedData = JSON.parse(writeCall[1]);
            expect(savedData.matching[0].applicant).toBe('A1');
        });

        test('should throw error on save failure', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(new Error('Permission denied'));
            });

            await expect(jsonLoader.saveToFile('output.json', {}))
                .rejects
                .toThrow('Ошибка сохранения файла');
        });
    });
});
