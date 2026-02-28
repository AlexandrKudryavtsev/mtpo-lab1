const University = require("../University");

describe('University Model', () => {
    describe('Constructor and Validation', () => {
        test('should create a valid university with correct properties', () => {
            const university = new University('U1', 'МГУ', 100, ['A1', 'A2']);

            expect(university.id).toBe('U1');
            expect(university.name).toBe('МГУ');
            expect(university.capacity).toBe(100);
            expect(university.priorities).toEqual(['A1', 'A2']);
            expect(university.accepted).toEqual([]);
        });

        test('should throw error if capacity is not positive', () => {
            expect(() => {
                new University('U1', 'МГУ', 0, ['A1']);
            }).toThrow('Вместимость должна быть положительным числом');

            expect(() => {
                new University('U1', 'МГУ', -5, ['A1']);
            }).toThrow('Вместимость должна быть положительным числом');
        });

        test('should throw error if priorities contain duplicates', () => {
            expect(() => {
                new University('U1', 'МГУ', 100, ['A1', 'A1', 'A2']);
            }).toThrow('Приоритеты не могут содержать дубликаты');
        });
    });

    describe('Admission management', () => {
        let university;

        beforeEach(() => {
            university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
        });

        test('canAccept should check if there is free capacity', () => {
            expect(university.canAccept()).toBe(true);

            university.accepted = ['A1'];
            expect(university.canAccept()).toBe(true);

            university.accepted = ['A1', 'A2'];
            expect(university.canAccept()).toBe(false);
        });

        test('addApplicant should add applicant if capacity available', () => {
            const result = university.addApplicant('A1');

            expect(result).toBe(true);
            expect(university.accepted).toContain('A1');
            expect(university.accepted.length).toBe(1);
        });

        test('addApplicant should fail if no capacity', () => {
            university.accepted = ['A1', 'A2'];

            const result = university.addApplicant('A3');

            expect(result).toBe(false);
            expect(university.accepted).not.toContain('A3');
        });

        test('removeApplicant should remove applicant', () => {
            university.accepted = ['A1', 'A2'];

            const result = university.removeApplicant('A1');

            expect(result).toBe(true);
            expect(university.accepted).toEqual(['A2']);
        });

        test('removeApplicant should return false if applicant not found', () => {
            university.accepted = ['A1', 'A2'];

            const result = university.removeApplicant('A3');

            expect(result).toBe(false);
            expect(university.accepted).toEqual(['A1', 'A2']);
        });

        test('getWorstAccepted should return the lowest priority applicant', () => {
            university.accepted = ['A2', 'A1'];

            const worst = university.getWorstAccepted();

            expect(worst).toBe('A2');
        });

        test('isBetterThanWorst should compare applicant with worst accepted', () => {
            university.accepted = ['A2', 'A3']; // A1 лучше чем A2 и A3

            expect(university.isBetterThanWorst('A1')).toBe(true);
            expect(university.isBetterThanWorst('A4')).toBe(false);
        });

        test('replaceWorstWith should swap applicants', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
            university.accepted = ['A2', 'A3'];

            const replaced = university.replaceWorstWith('A1');

            expect(replaced).toBe('A3');
            expect(university.accepted).toContain('A1');
            expect(university.accepted).not.toContain('A3');
            expect(university.accepted).toContain('A2');
            expect(university.accepted.length).toBe(2);
        });
    });

    describe('Priority utilities', () => {
        test('getPriorityIndex should return correct index', () => {
            const university = new University('U1', 'МГУ', 100, ['A1', 'A2', 'A3']);

            expect(university.getPriorityIndex('A2')).toBe(1);
            expect(university.getPriorityIndex('A4')).toBe(-1);
        });

        test('hasApplicant should check if applicant is in priorities', () => {
            const university = new University('U1', 'МГУ', 100, ['A1', 'A2']);

            expect(university.hasApplicant('A1')).toBe(true);
            expect(university.hasApplicant('A3')).toBe(false);
        });
    });

    describe('Serialization', () => {
        test('toJSON should return plain object', () => {
            const university = new University('U1', 'МГУ', 100, ['A1', 'A2']);
            university.accepted = ['A1'];

            const json = university.toJSON();

            expect(json).toEqual({
                id: 'U1',
                name: 'МГУ',
                capacity: 100,
                priorities: ['A1', 'A2'],
                accepted: ['A1']
            });
        });

        test('fromJSON should create University from parsed JSON', () => {
            const data = {
                id: 'U1',
                name: 'МГУ',
                capacity: 100,
                priorities: ['A1', 'A2'],
                accepted: ['A1']
            };

            const university = University.fromJSON(data);

            expect(university).toBeInstanceOf(University);
            expect(university.id).toBe('U1');
            expect(university.accepted).toEqual(['A1']);
        });
    });

    describe('Edge cases with missing priorities', () => {
        let university;

        beforeEach(() => {
            university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
        });

        test('getWorstAccepted should handle applicants not in priorities', () => {
            university.accepted = ['A1', 'X1'];

            const worst = university.getWorstAccepted();
            expect(worst).toBe('X1');
        });

        test('isBetterThanWorst should return false for applicant not in priorities when full', () => {
            university.accepted = ['A2', 'A3'];

            expect(university.isBetterThanWorst('X1')).toBe(false);
        });

        test('isBetterThanWorst should return true for applicant in priorities when worst is not in priorities', () => {
            university.accepted = ['X1', 'X2'];

            expect(university.isBetterThanWorst('A1')).toBe(true);
        });

        test('replaceWorstWith should not replace if new applicant not in priorities when full with valid applicants', () => {
            university.accepted = ['A2', 'A3'];

            const replaced = university.replaceWorstWith('X1');

            expect(replaced).toBeNull();
            expect(university.accepted).toEqual(['A2', 'A3']);
        });
    });

    describe('Complex scenarios', () => {
        test('should handle multiple replacements correctly', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3', 'A4']);

            // Добавляем двух абитуриентов
            university.addApplicant('A3');
            university.addApplicant('A4');
            expect(university.accepted).toEqual(['A3', 'A4']);

            // Пробуем заменить A3 (худший) на A1 (лучший)
            const replaced1 = university.replaceWorstWith('A1');
            // Должен заменить A4, так как A3 имеет индекс 2, A4 - индекс 3
            expect(replaced1).toBe('A4');
            expect(university.accepted).toContain('A1');
            expect(university.accepted).toContain('A3');

            // Пробуем заменить A2 (индекс 1) на A1 (уже есть)
            const replaced2 = university.replaceWorstWith('A2');
            expect(replaced2).toBe('A3');
            expect(university.accepted).toEqual(['A1', 'A2']);
        });
    });


    describe('Diagnostic tests for worst accepted', () => {
        test('should identify worst accepted correctly', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
            university.accepted = ['A2', 'A3'];

            const worst = university.getWorstAccepted();

            expect(worst).toBe('A3');
        });
    });

    describe('Diagnostic tests for worst accepted', () => {
        test('should identify worst accepted correctly', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
            university.accepted = ['A2', 'A3'];

            const worst = university.getWorstAccepted();

            expect(worst).toBe('A3');
        });
    });

    test('replaceWorstWith should not replace if new applicant not in priorities', () => {
        const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
        university.accepted = ['A2', 'A3'];

        const replaced = university.replaceWorstWith('X1');

        expect(replaced).toBeNull();
        expect(university.accepted).toEqual(['A2', 'A3']);
    });

    describe('Edge cases for getWorstAccepted', () => {
        let university;

        beforeEach(() => {
            university = new University('U1', 'МГУ', 3, ['A1', 'A2', 'A3']);
        });

        test('should handle empty accepted list', () => {
            expect(university.getWorstAccepted()).toBeNull();
        });

        test('should handle mix of prioritized and non-prioritized applicants', () => {
            university.accepted = ['A1', 'X1', 'X2'];

            const worst = university.getWorstAccepted();

            expect(['X1', 'X2']).toContain(worst);
        });

        test('should correctly compare when all accepted have no priorities', () => {
            university.accepted = ['X1', 'X2', 'X3'];

            expect(university.getWorstAccepted()).toBe('X1');
        });

        test('should handle when some have priorities and some do not', () => {
            university.accepted = ['X1', 'A2', 'X2'];

            const worst = university.getWorstAccepted();

            expect(['X1', 'X2']).toContain(worst);
            expect(worst).not.toBe('A2');
        });
    });

    describe('Complex replacement scenarios', () => {
        test('should not replace if new applicant equals worst in priority', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
            university.accepted = ['A2', 'A3'];

            const replaced = university.replaceWorstWith('A3');

            expect(replaced).toBeNull();
            expect(university.accepted).toEqual(['A2', 'A3']);
        });

        test('should not replace if new applicant not in priorities and all accepted are prioritized', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            university.accepted = ['A1', 'A2'];

            const replaced = university.replaceWorstWith('X1');

            expect(replaced).toBeNull();
            expect(university.accepted).toEqual(['A1', 'A2']);
        });

        test('should replace non-prioritized applicant with prioritized one', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            university.accepted = ['X1', 'X2'];

            const replaced = university.replaceWorstWith('A1');

            expect(['X1', 'X2']).toContain(replaced);
            expect(university.accepted).toContain('A1');
            expect(university.accepted.length).toBe(2);
        });

        test('should handle multiple replacements in sequence', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3', 'A4']);

            university.addApplicant('X1');
            university.addApplicant('X2');

            let replaced = university.replaceWorstWith('A4');
            expect(['X1', 'X2']).toContain(replaced);
            expect(university.accepted).toContain('A4');

            replaced = university.replaceWorstWith('A1');
            expect(replaced).not.toBeNull();
            expect(university.accepted).toContain('A1');
            expect(university.accepted.length).toBe(2);

            expect(university.accepted.every(id => id.startsWith('A'))).toBe(true);
        });
    });

    describe('isBetterThanWorst edge cases', () => {
        test('should return true if there is capacity regardless of priority', () => {
            const university = new University('U1', 'МГУ', 3, ['A1', 'A2']);
            university.accepted = ['A1'];

            expect(university.isBetterThanWorst('X1')).toBe(true);
        });

        test('should handle case when worst accepted is not in priorities', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            university.accepted = ['A1', 'X1'];

            expect(university.isBetterThanWorst('A2')).toBe(true);
            expect(university.isBetterThanWorst('X2')).toBe(false);
        });

        test('should handle case when new applicant not in priorities', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            university.accepted = ['A1', 'A2'];

            expect(university.isBetterThanWorst('X1')).toBe(false);
        });
    });
});
