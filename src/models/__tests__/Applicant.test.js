const Applicant = require("../Applicant");

describe('Applicant Model', () => {
    describe('Constructor and Validation', () => {
        test('should create a valid applicant with correct properties', () => {
            const applicant = new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']);

            expect(applicant.id).toBe('A1');
            expect(applicant.name).toBe('Иван Петров');
            expect(applicant.scores).toBe(285);
            expect(applicant.priorities).toEqual(['U1', 'U2']);
        });

        test('should throw error if id is empty', () => {
            expect(() => {
                new Applicant('', 'Иван Петров', 285, ['U1']);
            }).toThrow('ID абитуриента не может быть пустым');
        });

        test('should throw error if scores is negative', () => {
            expect(() => {
                new Applicant('A1', 'Иван Петров', -10, ['U1']);
            }).toThrow('Баллы не могут быть отрицательными');
        });

        test('should throw error if priorities array is empty', () => {
            expect(() => {
                new Applicant('A1', 'Иван Петров', 285, []);
            }).toThrow('Список приоритетов не может быть пустым');
        });

        test('should throw error if priorities contain duplicates', () => {
            expect(() => {
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U1', 'U2']);
            }).toThrow('Приоритеты не могут содержать дубликаты');
        });
    });

    describe('Getters and utility methods', () => {
        test('getPriorityIndex should return correct index for university', () => {
            const applicant = new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2', 'U3']);

            expect(applicant.getPriorityIndex('U2')).toBe(1);
            expect(applicant.getPriorityIndex('U4')).toBe(-1);
        });

        test('hasUniversity should check if university is in priorities', () => {
            const applicant = new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']);

            expect(applicant.hasUniversity('U1')).toBe(true);
            expect(applicant.hasUniversity('U3')).toBe(false);
        });

        test('toJSON should return plain object for serialization', () => {
            const applicant = new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']);
            const json = applicant.toJSON();

            expect(json).toEqual({
                id: 'A1',
                name: 'Иван Петров',
                scores: 285,
                priorities: ['U1', 'U2']
            });
        });
    });

    describe('Static factory methods', () => {
        test('fromJSON should create Applicant from parsed JSON', () => {
            const data = {
                id: 'A1',
                name: 'Иван Петров',
                scores: 285,
                priorities: ['U1', 'U2']
            };

            const applicant = Applicant.fromJSON(data);

            expect(applicant).toBeInstanceOf(Applicant);
            expect(applicant.id).toBe('A1');
            expect(applicant.scores).toBe(285);
        });

        test('fromJSON should validate data', () => {
            const invalidData = {
                id: 'A1',
                name: 'Иван Петров',
                scores: -5,
                priorities: ['U1']
            };

            expect(() => {
                Applicant.fromJSON(invalidData);
            }).toThrow('Баллы не могут быть отрицательными');
        });
    });
});
