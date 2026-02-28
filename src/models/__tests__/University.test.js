const University = require("../University");

describe('University Model', () => {
    // Boundary Value Analysis
    // Граничные значения для capacity: [1, 0, отрицательные]
    describe('BVA: capacity boundaries', () => {
        test('min valid: 1', () => {
            expect(() => new University('U1', 'МГУ', 1, ['A1'])).not.toThrow();
        });

        test('invalid: 0 (below min)', () => {
            expect(() => new University('U1', 'МГУ', 0, ['A1']))
                .toThrow('Вместимость должна быть положительным числом');
        });

        test('invalid: -1 (negative)', () => {
            expect(() => new University('U1', 'МГУ', -1, ['A1']))
                .toThrow('Вместимость должна быть положительным числом');
        });

        test('typical: 100', () => {
            expect(() => new University('U1', 'МГУ', 100, ['A1'])).not.toThrow();
        });
    });

    // Equivalence Partitioning
    // Классы: валидный массив, пустой, дубликаты, не массив
    describe('EP: priorities array states', () => {
        test('valid: unique priorities', () => {
            expect(() => new University('U1', 'МГУ', 2, ['A1', 'A2'])).not.toThrow();
        });

        test('invalid: empty array', () => {
            expect(() => new University('U1', 'МГУ', 2, []))
                .toThrow('Список приоритетов не может быть пустым');
        });

        test('invalid: duplicates', () => {
            expect(() => new University('U1', 'МГУ', 2, ['A1', 'A1']))
                .toThrow('Приоритеты не могут содержать дубликаты');
        });

        test('invalid: not array', () => {
            expect(() => new University('U1', 'МГУ', 2, 'A1'))
                .toThrow('Список приоритетов не может быть пустым');
        });
    });

    // Statement Testing
    // Покрытие всех строк кода
    describe('Statement: all methods coverage', () => {
        let university;

        beforeEach(() => {
            university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
        });

        test('constructor initializes fields', () => {
            expect(university.id).toBe('U1');
            expect(university.name).toBe('МГУ');
            expect(university.capacity).toBe(2);
            expect(university.priorities).toEqual(['A1', 'A2', 'A3']);
            expect(university.accepted).toEqual([]);
        });

        test('canAccept checks capacity', () => {
            expect(university.canAccept()).toBe(true);
            university.accepted = ['A1', 'A2'];
            expect(university.canAccept()).toBe(false);
        });

        test('addApplicant adds if space available', () => {
            expect(university.addApplicant('A1')).toBe(true);
            expect(university.accepted).toContain('A1');

            expect(university.addApplicant('A1')).toBe(false); // уже есть
            expect(university.accepted.length).toBe(1);
        });

        test('removeApplicant removes if exists', () => {
            university.accepted = ['A1', 'A2'];

            expect(university.removeApplicant('A1')).toBe(true);
            expect(university.accepted).toEqual(['A2']);

            expect(university.removeApplicant('A3')).toBe(false);
        });

        test('getPriorityIndex returns correct index', () => {
            expect(university.getPriorityIndex('A2')).toBe(1);
            expect(university.getPriorityIndex('A4')).toBe(-1);
        });

        test('getWorstAccepted identifies lowest priority', () => {
            university.accepted = ['A2', 'A3']; // A2(1), A3(2)
            expect(university.getWorstAccepted()).toBe('A3');

            university.accepted = ['A1', 'A3']; // A1(0), A3(2)
            expect(university.getWorstAccepted()).toBe('A3');
        });

        test('getWorstAccepted handles empty list', () => {
            expect(university.getWorstAccepted()).toBeNull();
        });

        test('getWorstAccepted handles non-prioritized applicants', () => {
            university.accepted = ['A1', 'X1']; // A1(0), X1(-1)
            expect(university.getWorstAccepted()).toBe('X1');
        });

        test('isBetterThanWorst compares correctly', () => {
            university.accepted = ['A2', 'A3']; // A2(1), A3(2)

            expect(university.isBetterThanWorst('A1')).toBe(true);  // A1(0) лучше
            expect(university.isBetterThanWorst('A4')).toBe(false); // A4(-1) хуже
        });

        test('isBetterThanWorst returns true if capacity available', () => {
            expect(university.isBetterThanWorst('X1')).toBe(true);
        });

        test('replaceWorstWith replaces when better applicant exists', () => {
            university.accepted = ['A2', 'A3']; // A2(1), A3(2)

            const replaced = university.replaceWorstWith('A1'); // A1(0) лучше
            expect(replaced).toBe('A3');
            expect(university.accepted).toContain('A1');
            expect(university.accepted).not.toContain('A3');
        });

        test('replaceWorstWith returns null when not better', () => {
            university.accepted = ['A1', 'A2']; // A1(0), A2(1)

            const replaced = university.replaceWorstWith('A4'); // A4(-1) хуже
            expect(replaced).toBeNull();
            expect(university.accepted).toEqual(['A1', 'A2']);
        });

        test('replaceWorstWith adds if capacity available', () => {
            const replaced = university.replaceWorstWith('A1');
            expect(replaced).toBeNull();
            expect(university.accepted).toContain('A1');
        });

        test('hasApplicant checks priorities', () => {
            expect(university.hasApplicant('A1')).toBe(true);
            expect(university.hasApplicant('A4')).toBe(false);
        });

        test('toJSON serializes correctly', () => {
            university.accepted = ['A1'];
            expect(university.toJSON()).toEqual({
                id: 'U1',
                name: 'МГУ',
                capacity: 2,
                priorities: ['A1', 'A2', 'A3'],
                accepted: ['A1']
            });
        });

        test('fromJSON creates instance', () => {
            const data = {
                id: 'U2',
                name: 'СПбГУ',
                capacity: 3,
                priorities: ['A2', 'A1'],
                accepted: ['A2']
            };

            const restored = University.fromJSON(data);
            expect(restored).toBeInstanceOf(University);
            expect(restored.id).toBe('U2');
            expect(restored.accepted).toEqual(['A2']);
        });
    });

    // Branch Testing
    // Покрытие всех веток условий
    describe('Branch: condition coverage', () => {
        let university;

        beforeEach(() => {
            university = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);
        });

        describe('validateInput branches', () => {
            test('id empty -> throw', () => {
                expect(() => new University('', 'МГУ', 2, ['A1']))
                    .toThrow('ID вуза не может быть пустым');
            });

            test('id non-empty -> ok', () => {
                expect(() => new University('U1', 'МГУ', 2, ['A1'])).not.toThrow();
            });

            test('name empty -> throw', () => {
                expect(() => new University('U1', '', 2, ['A1']))
                    .toThrow('Название вуза не может быть пустым');
            });

            test('name non-empty -> ok', () => {
                expect(() => new University('U1', 'МГУ', 2, ['A1'])).not.toThrow();
            });

            test('capacity <= 0 -> throw', () => {
                expect(() => new University('U1', 'МГУ', 0, ['A1']))
                    .toThrow('Вместимость должна быть положительным числом');
            });

            test('capacity > 0 -> ok', () => {
                expect(() => new University('U1', 'МГУ', 1, ['A1'])).not.toThrow();
            });
        });

        describe('addApplicant branches', () => {
            test('canAccept true AND not already accepted -> true', () => {
                expect(university.addApplicant('A1')).toBe(true);
            });

            test('canAccept false -> false', () => {
                university.accepted = ['A1', 'A2'];
                expect(university.addApplicant('A3')).toBe(false);
            });

            test('already accepted -> false', () => {
                university.addApplicant('A1');
                expect(university.addApplicant('A1')).toBe(false);
            });
        });

        describe('removeApplicant branches', () => {
            test('applicant exists -> true', () => {
                university.accepted = ['A1'];
                expect(university.removeApplicant('A1')).toBe(true);
            });

            test('applicant not exists -> false', () => {
                expect(university.removeApplicant('A1')).toBe(false);
            });
        });

        describe('getWorstAccepted branches', () => {
            test('accepted empty -> null', () => {
                expect(university.getWorstAccepted()).toBeNull();
            });

            test('all accepted have priorities -> returns worst', () => {
                university.accepted = ['A1', 'A2']; // A1(0), A2(1)
                expect(university.getWorstAccepted()).toBe('A2');
            });

            test('mix of prioritized and non-prioritized -> returns non-prioritized', () => {
                university.accepted = ['A1', 'X1']; // A1(0), X1(-1)
                expect(university.getWorstAccepted()).toBe('X1');
            });

            test('all non-prioritized -> returns first', () => {
                university.accepted = ['X1', 'X2', 'X3'];
                expect(university.getWorstAccepted()).toBe('X1');
            });
        });

        describe('isBetterThanWorst branches', () => {
            test('capacity available -> true', () => {
                expect(university.isBetterThanWorst('X1')).toBe(true);
            });

            test('no capacity AND applicant not in priorities -> false', () => {
                university.accepted = ['A1', 'A2'];
                expect(university.isBetterThanWorst('X1')).toBe(false);
            });

            test('no capacity AND worst not in priorities -> true', () => {
                university.accepted = ['X1', 'X2'];
                expect(university.isBetterThanWorst('A1')).toBe(true);
            });

            test('both in priorities AND applicant better -> true', () => {
                university.accepted = ['A2', 'A3']; // A2(1), A3(2)
                expect(university.isBetterThanWorst('A1')).toBe(true); // A1(0)
            });

            test('both in priorities AND applicant worse -> false', () => {
                university.accepted = ['A1', 'A2']; // A1(0), A2(1)
                expect(university.isBetterThanWorst('A3')).toBe(false); // A3(2)
            });
        });

        describe('replaceWorstWith branches', () => {
            test('applicant already accepted -> null', () => {
                university.accepted = ['A1'];
                expect(university.replaceWorstWith('A1')).toBeNull();
            });

            test('capacity available -> null and adds', () => {
                const result = university.replaceWorstWith('A1');
                expect(result).toBeNull();
                expect(university.accepted).toContain('A1');
            });

            test('no capacity AND not better -> null', () => {
                university.accepted = ['A1', 'A2'];
                expect(university.replaceWorstWith('A4')).toBeNull();
            });

            test('no capacity AND better -> replaces', () => {
                university.accepted = ['A2', 'A3']; // A2(1), A3(2)
                const replaced = university.replaceWorstWith('A1'); // A1(0)
                expect(replaced).toBe('A3');
                expect(university.accepted).toContain('A1');
            });

            test('worstId null -> null', () => {
                const emptyUni = new University('U1', 'МГУ', 2, ['A1']);
                emptyUni.getWorstAccepted = jest.fn().mockReturnValue(null);
                expect(emptyUni.replaceWorstWith('A1')).toBeNull();
            });
        });
    });

    // Параметризованные тесты (оптимизация)
    describe('Parameterized (optimized)', () => {
        test.each([
            ['U1', 'МГУ', 1, ['A1'], true],
            ['', 'МГУ', 1, ['A1'], false],
            ['U1', '', 1, ['A1'], false],
            ['U1', 'МГУ', 0, ['A1'], false],
            ['U1', 'МГУ', -1, ['A1'], false],
            ['U1', 'МГУ', 1, [], false],
            ['U1', 'МГУ', 1, ['A1', 'A1'], false]
        ])('validate id:%s name:%s capacity:%d', (id, name, capacity, priorities, valid) => {
            if (valid) {
                expect(() => new University(id, name, capacity, priorities)).not.toThrow();
            } else {
                expect(() => new University(id, name, capacity, priorities)).toThrow();
            }
        });
    });

    // Edge Cases
    // Дополнительные граничные случаи
    describe('Edge cases', () => {
        test('replaceWorstWith handles non-prioritized worst correctly', () => {
            const uni = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            uni.accepted = ['X1', 'X2']; // оба не в приоритетах

            const replaced = uni.replaceWorstWith('A1');
            expect(['X1', 'X2']).toContain(replaced);
            expect(uni.accepted).toContain('A1');
            expect(uni.accepted.length).toBe(2);
        });

        test('sequential replacements work correctly', () => {
            const uni = new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']);

            uni.addApplicant('X1');
            uni.addApplicant('X2');

            uni.replaceWorstWith('A3');
            uni.replaceWorstWith('A1');

            expect(uni.accepted.every(id => id.startsWith('A'))).toBe(true);
            expect(uni.accepted).toContain('A1');
        });
    });
});
