const Applicant = require("../Applicant");

describe('Applicant Model', () => {
    // Boundary Value Analysis
    // Граничные значения для scores: [0, отрицательные]
    describe('BVA: scores boundaries', () => {
        test('min valid: 0', () => {
            expect(() => new Applicant('A1', 'Иван', 0, ['U1'])).not.toThrow();
        });

        test('invalid: -1 (below min)', () => {
            expect(() => new Applicant('A1', 'Иван', -1, ['U1']))
                .toThrow('Баллы не могут быть отрицательными');
        });

        test('typical: 285', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1'])).not.toThrow();
        });
    });

    // Equivalence Partitioning
    // Классы: валидный массив, пустой, дубликаты, не массив
    describe('EP: priorities array states', () => {
        test('valid: unique priorities', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1', 'U2'])).not.toThrow();
        });

        test('invalid: empty array', () => {
            expect(() => new Applicant('A1', 'Иван', 285, []))
                .toThrow('Список приоритетов не может быть пустым');
        });

        test('invalid: duplicates', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1', 'U1']))
                .toThrow('Приоритеты не могут содержать дубликаты');
        });

        test('invalid: not array', () => {
            expect(() => new Applicant('A1', 'Иван', 285, 'U1'))
                .toThrow('Список приоритетов не может быть пустым');
        });
    });

    // Statement Testing
    // Покрытие всех строк кода
    describe('Statement: all methods coverage', () => {
        let applicant;

        beforeEach(() => {
            applicant = new Applicant('A1', 'Иван', 285, ['U1', 'U2']);
        });

        test('constructor initializes fields', () => {
            expect(applicant.id).toBe('A1');
            expect(applicant.name).toBe('Иван');
            expect(applicant.scores).toBe(285);
            expect(applicant.priorities).toEqual(['U1', 'U2']);
        });

        test('getPriorityIndex returns correct index', () => {
            expect(applicant.getPriorityIndex('U2')).toBe(1);
            expect(applicant.getPriorityIndex('U3')).toBe(-1);
        });

        test('hasUniversity checks inclusion', () => {
            expect(applicant.hasUniversity('U1')).toBe(true);
            expect(applicant.hasUniversity('U3')).toBe(false);
        });

        test('toJSON serializes correctly', () => {
            expect(applicant.toJSON()).toEqual({
                id: 'A1',
                name: 'Иван',
                scores: 285,
                priorities: ['U1', 'U2']
            });
        });

        test('fromJSON creates instance', () => {
            const data = { id: 'A2', name: 'Анна', scores: 270, priorities: ['U2'] };
            const restored = Applicant.fromJSON(data);
            expect(restored).toBeInstanceOf(Applicant);
            expect(restored.id).toBe('A2');
        });
    });

    // Branch Testing
    // Покрытие всех веток условий
    describe('Branch: validateInput conditions', () => {
        test('branch id empty -> throw', () => {
            expect(() => new Applicant('', 'Иван', 285, ['U1']))
                .toThrow('ID абитуриента не может быть пустым');
        });

        test('branch name empty -> throw', () => {
            expect(() => new Applicant('A1', '', 285, ['U1']))
                .toThrow('Имя абитуриента не может быть пустым');
        });

        test('branch scores negative -> throw', () => {
            expect(() => new Applicant('A1', 'Иван', -5, ['U1']))
                .toThrow('Баллы не могут быть отрицательными');
        });

        test('branch scores non-negative -> ok', () => {
            expect(() => new Applicant('A1', 'Иван', 0, ['U1'])).not.toThrow();
        });

        test('branch priorities empty -> throw', () => {
            expect(() => new Applicant('A1', 'Иван', 285, []))
                .toThrow('Список приоритетов не может быть пустым');
        });

        test('branch priorities non-empty -> ok', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1'])).not.toThrow();
        });

        test('branch priorities duplicates -> throw', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1', 'U1']))
                .toThrow('Приоритеты не могут содержать дубликаты');
        });

        test('branch priorities unique -> ok', () => {
            expect(() => new Applicant('A1', 'Иван', 285, ['U1', 'U2'])).not.toThrow();
        });
    });

    // Параметризованные тесты (оптимизация)
    describe('Parameterized (optimized)', () => {
        test.each([
            ['A1', 'Иван', 285, ['U1'], true],
            ['', 'Иван', 285, ['U1'], false],
            ['A1', '', 285, ['U1'], false],
            ['A1', 'Иван', -1, ['U1'], false],
            ['A1', 'Иван', 285, [], false],
            ['A1', 'Иван', 285, ['U1', 'U1'], false]
        ])('validate id:%s name:%s scores:%d', (id, name, scores, priorities, valid) => {
            if (valid) {
                expect(() => new Applicant(id, name, scores, priorities)).not.toThrow();
            } else {
                expect(() => new Applicant(id, name, scores, priorities)).toThrow();
            }
        });
    });
});
