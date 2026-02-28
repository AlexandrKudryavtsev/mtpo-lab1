const GaleShapleyMatrix = require('../galeShapleyMatrix');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

describe('GaleShapleyMatrix Algorithm', () => {
    let algorithm;

    beforeEach(() => {
        algorithm = new GaleShapleyMatrix();
    });

    // Boundary Value Analysis
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
    });

    // Equivalence Partitioning
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
    });

    // Statement Testing
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

        test('buildPreferenceMatrix creates correct structures', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const matrix = algorithm.buildPreferenceMatrix(applicants, universities);
            expect(matrix.applicantPrefs.A1.U1).toBe(0);
            expect(matrix.applicantPrefs.A1.U2).toBe(1);
            expect(matrix.universityPrefs.U1.A1).toBe(0);
        });

        test('findBlockingPairs returns empty array for stable matching', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(applicants, universities);
            const blockingPairs = algorithm.findBlockingPairs(
                result.matching,
                applicants,
                universities
            );
            expect(blockingPairs).toHaveLength(0);
        });
    });

    // Branch Testing
    describe('Branch: algorithm branches', () => {
        test('branch: applicants empty', () => {
            const result = algorithm.match([], [new University('U1', 'МГУ', 1, ['A1'])]);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: universities empty', () => {
            const result = algorithm.match([new Applicant('A1', 'Иван', 285, ['U1'])], []);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: applicant has no more priorities', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: university not found', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U99'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: applicant not in university priorities', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
        });

        test('branch: university has capacity -> accept', () => {
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
                new Applicant('A2', 'Анна', 270, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(1);
            expect(result.matching[0].applicant).toBe('A2');
        });

        test('branch: university full and applicant worse -> keep in queue', () => {
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
    });

    // Edge Cases
    describe('Edge cases', () => {
        test('applicant with priorities that lead to no matches', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U3'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('calculateStatistics with zero matches', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A2'])];

            const result = algorithm.match(applicants, universities);
            expect(result.statistics.matched_count).toBe(0);
            expect(result.statistics.average_priority).toBe("0.00");
        });

        test('checkStability should return true for Gale-Shapley output', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result.stable).toBe(true);
        });

        test('findBlockingPairs should detect blocking pairs in unstable matching', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A1', 'A2']) // Оба вуза предпочитают A1
            ];

            // Создаем нестабильное паросочетание: A2 в U1, A1 в U2
            const unstableMatching = [
                { applicant: 'A2', university: 'U1', priority_index: 0 },
                { applicant: 'A1', university: 'U2', priority_index: 1 }
            ];

            const blockingPairs = algorithm.findBlockingPairs(unstableMatching, applicants, universities);

            // A1 и U1 должны быть блокирующей парой:
            // A1 предпочитает U1 (индекс 0) больше чем U2 (индекс 1)
            // U1 предпочитает A1 (индекс 0) больше чем A2 (индекс 1)
            expect(blockingPairs.length).toBeGreaterThan(0);

            const blockingPair = blockingPairs.find(bp =>
                bp.applicant === 'A1' && bp.university === 'U1'
            );
            expect(blockingPair).toBeDefined();
        });

        test('buildResult handles missing university', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A1'])];

            const universityAccepted = new Map();
            universityAccepted.set('U1', ['A1']);
            universityAccepted.set('U99', ['A1']); // Несуществующий вуз

            const prefs = algorithm.buildPreferenceMatrix(applicants, universities);
            const result = algorithm.buildResult(applicants, universities, universityAccepted, prefs);

            expect(result.matching).toHaveLength(1); // Игнорируем U99
        });

        test('buildResult with missing applicant', () => {
            const applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];
            const universities = [new University('U1', 'МГУ', 1, ['A1'])];

            const universityAccepted = new Map();
            universityAccepted.set('U1', ['A1', 'A99']); // A99 не существует

            const prefs = algorithm.buildPreferenceMatrix(applicants, universities);
            const result = algorithm.buildResult(applicants, universities, universityAccepted, prefs);

            expect(result.matching).toHaveLength(1); // Игнорируем A99
        });

        test('checkStability handles various scenarios', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U1', 'U2'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            // Случай 1: стабильное паросочетание
            const stableMatching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'A2', university: 'U2', priority_index: 0 }
            ];
            expect(algorithm.checkStability(stableMatching, applicants, universities)).toBe(true);

            // Случай 2: нестабильное паросочетание
            const unstableMatching = [
                { applicant: 'A1', university: 'U2', priority_index: 1 },
                { applicant: 'A2', university: 'U1', priority_index: 0 }
            ];
            expect(algorithm.checkStability(unstableMatching, applicants, universities)).toBe(false);

            // Случай 3: с нераспределенными абитуриентами
            const partialMatching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 }
            ];
            expect(algorithm.checkStability(partialMatching, applicants, universities)).toBe(true);
        });
    });

    // Параметризованные тесты
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
});
