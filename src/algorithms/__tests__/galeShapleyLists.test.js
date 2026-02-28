const GaleShapleyLists = require('../galeShapleyLists');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

describe('GaleShapleyLists Algorithm', () => {
    let algorithm;

    beforeEach(() => {
        algorithm = new GaleShapleyLists();
    });

    // Boundary Value Analysis
    // Граничные случаи: пустые списки, 1 элемент, много элементов
    describe('BVA: input size boundaries', () => {
        test('empty applicants and universities', () => {
            const result = algorithm.match([], []);
            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toHaveLength(0);
            expect(result.stable).toBe(true);
        });

        test('single applicant, single university with matching preferences', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A1'])];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(1);
            expect(result.matching[0].applicant).toBe('A1');
            expect(result.matching[0].university).toBe('U1');
        });

        test('single applicant, no matching preferences', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A2'])];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('many applicants (100) with many universities (20)', () => {
            const applicants = [];
            const universities = [];

            for (let i = 1; i <= 20; i++) {
                universities.push(new University(`U${i}`, `Uni ${i}`, 5,
                    Array.from({ length: 100 }, (_, j) => `A${j + 1}`)));
            }

            for (let i = 1; i <= 100; i++) {
                const priorities = Array.from({ length: 20 }, (_, j) => `U${j + 1}`)
                    .sort(() => Math.random() - 0.5);
                applicants.push(new Applicant(`A${i}`, `Student ${i}`, 200 + i, priorities));
            }

            const result = algorithm.match(applicants, universities);
            expect(result.matching.length).toBeGreaterThan(0);
            expect(result.stable).toBe(true);
        });
    });

    // Equivalence Partitioning
    // Классы: идеальное совпадение, конфликт интересов, нехватка мест
    describe('EP: preference patterns', () => {
        test('perfect match: each applicant gets first choice', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1']),
                new University('U2', 'СПбГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(2);
            expect(result.matching.every(m => m.priority_index === 0)).toBe(true);
        });

        test('conflict: both applicants want same university', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(1);
            expect(result.matching[0].applicant).toBe('A1');
            expect(result.unmatched).toContain('A2');
        });

        test('cyclic preferences: classic stable marriage', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2', 'A1']),
                new University('U2', 'СПбГУ', 1, ['A1', 'A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(2);
            expect(result.stable).toBe(true);

            const a1Match = result.matching.find(m => m.applicant === 'A1');
            const a2Match = result.matching.find(m => m.applicant === 'A2');
            expect(a1Match.university).not.toBe(a2Match.university);
        });

        test('more applicants than places', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(2);
            expect(result.unmatched).toHaveLength(1);
        });

        test('more places than applicants', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 3, ['A1']),
                new University('U2', 'СПбГУ', 2, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(1);
            expect(result.matching[0].university).toBe('U1');
        });
    });

    // Statement Testing
    // Покрытие всех строк кода алгоритма
    describe('Statement: algorithm code coverage', () => {
        test('main loop with successful proposals', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1']),
                new University('U2', 'СПбГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toBeDefined();
            expect(result.unmatched).toBeDefined();
            expect(result.statistics).toBeDefined();
        });

        test('proposal rejection and replacement path', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.unmatched).toContain('A3');
        });

        test('applicant runs out of priorities', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2']),
                new University('U2', 'СПбГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('university not found in map', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U99'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('applicant not in university priorities', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('buildEmptyResult called when no universities', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const result = algorithm.match(applicants, []);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
            expect(result.statistics.total_places).toBe(0);
        });

        test('checkStability with unmatched applicants', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.stable).toBe(true);
            expect(result.unmatched).toContain('A2');
        });
    });

    // Branch Testing
    // Покрытие всех ветвлений в алгоритме
    describe('Branch: algorithm branches', () => {
        test('branch: applicants empty -> buildEmptyResult', () => {
            const result = algorithm.match([], [new University('U1', 'МГУ', 1, ['A1'])]);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: universities empty -> buildEmptyResult', () => {
            const result = algorithm.match([new Applicant('A1', 'Иван', 285, ['U1'])], []);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: applicant runs out of priorities -> remove from free set', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.unmatched).toContain('A1');
        });

        test('branch: university not found -> skip proposal', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U2', 'СПбГУ', 1, ['A1'])
            ];

            expect(() => algorithm.match(applicants, universities)).not.toThrow();
        });

        test('branch: applicant not in university priorities -> continue', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: university has capacity -> accept directly', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(1);
        });

        test('branch: university full and applicant better -> replace', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(2);
        });

        test('branch: university full and applicant worse -> keep in queue', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.unmatched).toContain('A3');
        });
    });

    // Comparison with Matrix version
    // Сравнение результатов двух реализаций
    describe('Comparison with matrix version', () => {
        let matrixAlgorithm;

        beforeEach(() => {
            const GaleShapleyMatrix = require('../galeShapleyMatrix');
            matrixAlgorithm = new GaleShapleyMatrix();
        });

        test('both algorithms produce identical results for classic case', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2', 'U3']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1', 'U3']),
                new Applicant('A3', 'Петр', 260, ['U3', 'U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2', 'A3']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3']),
                new University('U3', 'НГУ', 1, ['A3', 'A1', 'A2'])
            ];

            const matrixResult = matrixAlgorithm.match(applicants, universities);
            const listsResult = algorithm.match(applicants, universities);

            const sortMatching = (m) => [...m].sort((a, b) =>
                a.applicant.localeCompare(b.applicant)
            );

            expect(sortMatching(listsResult.matching))
                .toEqual(sortMatching(matrixResult.matching));
            expect(listsResult.unmatched).toEqual(matrixResult.unmatched);
        });

        test('both handle capacity constraints identically', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3'])
            ];

            const matrixResult = matrixAlgorithm.match(applicants, universities);
            const listsResult = algorithm.match(applicants, universities);

            expect(listsResult.matching.length).toBe(matrixResult.matching.length);
            expect(listsResult.unmatched).toEqual(matrixResult.unmatched);
        });
    });

    // Edge Cases
    // Дополнительные граничные случаи
    describe('Edge cases', () => {
        test('applicant with no priorities left after multiple rejections', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2']),
                new University('U2', 'СПбГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.unmatched).toContain('A1');
        });

        test('non-overlapping preference lists', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2']),
                new University('U2', 'СПбГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toHaveLength(2);
        });

        test('max iterations reached (protection against infinite loop)', () => {
            const applicants = [];
            const universities = [];

            for (let i = 1; i <= 10; i++) {
                applicants.push(new Applicant(`A${i}`, `Student ${i}`, 200 + i,
                    Array.from({ length: 5 }, (_, j) => `U${j + 1}`)));
            }

            for (let i = 1; i <= 5; i++) {
                universities.push(new University(`U${i}`, `Uni ${i}`, 2,
                    Array.from({ length: 10 }, (_, j) => `A${j + 1}`)));
            }

            expect(() => algorithm.match(applicants, universities)).not.toThrow();
        });
    });

    // Параметризованные тесты (оптимизация)
    describe('Parameterized (optimized)', () => {
        test.each([
            [
                [['A1', ['U1']], ['A2', ['U2']]],
                [['U1', 1, ['A1']], ['U2', 1, ['A2']]],
                2, 0
            ],
            [
                [['A1', ['U1']], ['A2', ['U1']]],
                [['U1', 1, ['A1', 'A2']]],
                1, 1
            ],
            [
                [['A1', ['U1', 'U2']], ['A2', ['U2', 'U1']]],
                [['U1', 1, ['A2', 'A1']], ['U2', 1, ['A1', 'A2']]],
                2, 0
            ]
        ])('scenario with %j', (appConfigs, uniConfigs, expectedMatched, expectedUnmatched) => {
            const applicants = appConfigs.map(([id, priorities]) => {
                return new Applicant(id, `Name${id}`, 200, priorities);
            });

            const universities = uniConfigs.map(([id, capacity, priorities]) => {
                return new University(id, `Uni${id}`, capacity, priorities);
            });

            const result = algorithm.match(applicants, universities);
            expect(result.matching.length).toBe(expectedMatched);
            expect(result.unmatched.length).toBe(expectedUnmatched);
        });
    });

    // Доп.
    describe('Additional coverage', () => {
        test('calculateStatistics with zero matches', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A2'])];

            const result = algorithm.match(applicants, universities);
            expect(result.statistics.matched_count).toBe(0);
            expect(result.statistics.average_priority).toBe("0.00");
        });

        test('buildResult with missing applicant/university references', () => {
            // ситуация, где в accepted есть ID, которых нет в исходных массивах
            const algorithm = new GaleShapleyLists();
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A1'])];

            const universityAccepted = new Map();
            universityAccepted.set('U1', ['A1', 'A2']); // A2 не существует

            const result = algorithm.buildResult(applicants, universities, universityAccepted);
            expect(result.matching).toHaveLength(1); // проигнорирует A2
        });
    });
});
