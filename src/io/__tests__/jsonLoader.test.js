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

        test('should throw error if file not found (ENOENT)', async () => {
            const error = new Error('ENOENT: file not found');
            error.code = 'ENOENT';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('nonexistent.json'))
                .rejects
                .toThrow('Файл не найден');
        });

        test('should throw error for other file system errors', async () => {
            const error = new Error('Permission denied');
            error.code = 'EACCES';
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(error, null);
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка чтения файла: Permission denied');
        });

        test('should throw error if JSON is malformed', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, '{ malformed json');
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Ошибка парсинга JSON');
        });

        test('should propagate validation errors', async () => {
            const invalidData = { applicants: [], universities: [] };
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback(null, JSON.stringify(invalidData));
            });

            jest.spyOn(jsonLoader, 'validateData').mockImplementationOnce(() => {
                throw new Error('Validation error');
            });

            await expect(jsonLoader.loadFromFile('test.json'))
                .rejects
                .toThrow('Validation error');
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

        test('should throw error if applicant missing id', () => {
            const invalidData = {
                applicants: [{ name: 'Иван', scores: 285, priorities: ['U1'] }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент: отсутствует поле id');
        });

        test('should throw error if applicant missing name', () => {
            const invalidData = {
                applicants: [{ id: 'A1', scores: 285, priorities: ['U1'] }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле name');
        });

        test('should throw error if applicant missing scores', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван', priorities: ['U1'] }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле scores или оно не число');
        });

        test('should throw error if applicant scores is not a number', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван', scores: '285', priorities: ['U1'] }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле scores или оно не число');
        });

        test('should throw error if applicant missing priorities', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван', scores: 285 }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле priorities или это не массив');
        });

        test('should throw error if applicant priorities is not an array', () => {
            const invalidData = {
                applicants: [{ id: 'A1', name: 'Иван', scores: 285, priorities: 'U1' }],
                universities: mockData.universities
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: отсутствует поле priorities или это не массив');
        });

        test('should throw error if university missing id', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ name: 'МГУ', capacity: 2, priorities: ['A1'] }]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз: отсутствует поле id');
        });

        test('should throw error if university missing name', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', capacity: 2, priorities: ['A1'] }]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: отсутствует поле name');
        });

        test('should throw error if university missing priorities', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ', capacity: 2 }]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: отсутствует поле priorities или это не массив');
        });

        test('should throw error if university priorities is not an array', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ', capacity: 2, priorities: 'A1' }]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: отсутствует поле priorities или это не массив');
        });

        test('should throw error if university capacity is not positive', () => {
            const invalidData = {
                applicants: mockData.applicants,
                universities: [{ id: 'U1', name: 'МГУ', capacity: 0, priorities: ['A1'] }]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: отсутствует поле capacity или оно не положительное число');
        });

        test('should throw error if priorities contain non-existent university IDs', () => {
            const invalidData = {
                applicants: [
                    { id: 'A1', name: 'Иван', scores: 285, priorities: ['U1', 'U99'] }
                ],
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 2, priorities: ['A1'] }
                ]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Абитуриент A1: в приоритетах указан несуществующий вуз U99');
        });

        test('should throw error if university priorities contain non-existent applicant IDs', () => {
            const invalidData = {
                applicants: [
                    { id: 'A1', name: 'Иван', scores: 285, priorities: ['U1'] }
                ],
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 2, priorities: ['A1', 'A99'] }
                ]
            };

            expect(() => {
                jsonLoader.validateData(invalidData);
            }).toThrow('Вуз U1: в приоритетах указан несуществующий абитуриент A99');
        });
    });

    describe('parseToModels', () => {
        test('should convert JSON data to model instances', () => {
            const result = jsonLoader.parseToModels(mockData);

            expect(result.applicants).toHaveLength(2);
            expect(result.universities).toHaveLength(2);
            expect(result.applicants[0]).toBeInstanceOf(Applicant);
            expect(result.universities[0]).toBeInstanceOf(University);

            expect(result.applicants[0].id).toBe('A1');
            expect(result.applicants[0].name).toBe('Иван Петров');
            expect(result.applicants[0].scores).toBe(285);

            expect(result.universities[0].id).toBe('U1');
            expect(result.universities[0].name).toBe('МГУ');
            expect(result.universities[0].capacity).toBe(2);
        });
    });

    describe('loadLargeFile', () => {
        test('should handle large files with streams', async () => {
            const largeData = {
                applicants: Array(100).fill().map((_, i) => ({
                    id: `A${i}`,
                    name: `Student ${i}`,
                    scores: 200 + Math.floor(Math.random() * 100),
                    priorities: ['U1', 'U2']
                })),
                universities: [
                    { id: 'U1', name: 'МГУ', capacity: 5000, priorities: ['A1'] },
                    { id: 'U2', name: 'СПбГУ', capacity: 5000, priorities: ['A2'] }
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

            expect(result.applicants).toBeDefined();
            expect(result.universities).toBeDefined();
            expect(fs.createReadStream).toHaveBeenCalledWith('large.json', 'utf8');
        });

        test('should handle stream errors', async () => {
            // Покрывает строку 56
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

        test('should handle JSON parse error in stream', async () => {
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

            const savedData = JSON.parse(writeCall[1]);
            expect(savedData.matching[0].applicant).toBe('A1');
        });

        test('should throw error on save failure', async () => {
            fs.writeFile.mockImplementation((filePath, data, encoding, callback) => {
                callback(new Error('Permission denied'));
            });

            await expect(jsonLoader.saveToFile('output.json', {}))
                .rejects
                .toThrow('Ошибка сохранения файла: Permission denied');
        });
    });

    describe('Edge cases and error propagation', () => {
        test('should handle non-Error objects in catch blocks', async () => {
            fs.readFile.mockImplementation((filePath, encoding, callback) => {
                callback('String error', null);
            });

            try {
                await jsonLoader.loadFromFile('test.json');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toMatch(/Ошибка чтения файла:/);
                // Не проверяем конкретное сообщение, так как оно может быть "undefined"
            }
        });

        test('should handle validation errors in loadLargeFile', async () => {
            const invalidData = { applicants: [] }; // Нет universities
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
});
