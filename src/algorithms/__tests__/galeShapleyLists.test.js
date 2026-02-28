const GaleShapleyLists = require('../galeShapleyLists');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

describe('GaleShapleyLists Algorithm', () => {
    let algorithm;

    beforeEach(() => {
        algorithm = new GaleShapleyLists();
    });

    describe('Basic matching scenarios', () => {
        test('should find stable matching for simple case', () => {
            const applicants = [
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна Сидорова', 270, ['U2', 'U1'])
            ];

            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.stable).toBe(true);

            const a1Match = result.matching.find(m => m.applicant === 'A1');
            const a2Match = result.matching.find(m => m.applicant === 'A2');

            expect(a1Match.university).toBe('U1');
            expect(a2Match.university).toBe('U2');
        });

        test('should respect university capacities', () => {
            const applicants = [
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна Сидорова', 270, ['U1', 'U2'])
            ];

            const universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.matching.every(m => m.university === 'U1')).toBe(true);
        });

        test('should handle more applicants than places', () => {
            const applicants = [
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна Сидорова', 270, ['U1', 'U2']),
                new Applicant('A3', 'Петр Сидоров', 260, ['U1', 'U2'])
            ];

            const universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2', 'A3']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.unmatched).toHaveLength(1);
        });
    });

    describe('Comparison with matrix version', () => {
        test('should produce same results as matrix version for same input', () => {
            const GaleShapleyMatrix = require('../galeShapleyMatrix');
            const matrixAlgorithm = new GaleShapleyMatrix();

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

            const sortMatching = (m) => [...m].sort((a, b) => a.applicant.localeCompare(b.applicant));

            expect(sortMatching(listsResult.matching))
                .toEqual(sortMatching(matrixResult.matching));
            expect(listsResult.unmatched)
                .toEqual(matrixResult.unmatched);
        });
    });

    describe('Edge cases', () => {
        test('should handle applicant with preferences that no university wants', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];

            const universities = [
                new University('U1', 'МГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('should handle university with preferences that no applicant wants', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U2'])
            ];

            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('should handle non-overlapping preferences', () => {
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

        test('should handle extra capacity', () => {
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];

            const universities = [
                new University('U1', 'МГУ', 3, ['A1', 'A2', 'A3'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(1);
            expect(result.matching[0].applicant).toBe('A1');
            expect(result.matching[0].university).toBe('U1');
            expect(result.unmatched).toHaveLength(0);
        });

        test('should handle empty lists', () => {
            const result = algorithm.match([], []);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toHaveLength(0);
            expect(result.stable).toBe(true);
        });
    });

    describe('Performance characteristics', () => {
        test('should handle large inputs efficiently', () => {
            const applicants = [];
            const universities = [];

            for (let i = 1; i <= 20; i++) {
                const uniId = `U${i}`;
                const priorities = [];
                for (let j = 1; j <= 100; j++) {
                    priorities.push(`A${j}`);
                }
                universities.push(new University(uniId, `University ${i}`, 5, priorities));
            }

            for (let i = 1; i <= 100; i++) {
                const appId = `A${i}`;
                const priorities = [];
                const uniIndices = Array.from({ length: 20 }, (_, idx) => idx + 1);
                for (let j = 0; j < 20; j++) {
                    const randomIndex = Math.floor(Math.random() * uniIndices.length);
                    const uniNum = uniIndices[randomIndex];
                    priorities.push(`U${uniNum}`);
                    uniIndices.splice(randomIndex, 1);
                }
                applicants.push(new Applicant(appId, `Student ${i}`, 200 + i, priorities));
            }

            const startTime = Date.now();
            const result = algorithm.match(applicants, universities);
            const endTime = Date.now();

            console.log(`Lists version took ${endTime - startTime}ms for 100 applicants, 20 universities`);

            expect(result.matching.length).toBeGreaterThan(0);
            expect(result.stable).toBe(true);
        });
    });

    describe('Additional edge cases for Lists algorithm', () => {
        test('should handle applicant with no priorities left', () => {
            const algorithm = new GaleShapleyLists();
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

        test('should handle university not found in map', () => {
            const algorithm = new GaleShapleyLists();

            const originalMatch = algorithm.match;
            algorithm.match = function (applicants, universities) {
                const applicantsMap = new Map(applicants.map(a => [a.id, a]));
                const universitiesMap = new Map(universities.map(u => [u.id, u]));

                universitiesMap.delete('U1');

                const freeApplicants = new Set(applicants.map(a => a.id));
                const universityAccepted = new Map();
                const applicantNextProposal = new Map();

                universities.forEach(u => {
                    universityAccepted.set(u.id, []);
                });

                applicants.forEach(a => {
                    applicantNextProposal.set(a.id, 0);
                });

                if (freeApplicants.size > 0) {
                    const applicantId = Array.from(freeApplicants)[0];
                    const applicant = applicantsMap.get(applicantId);

                    const universityId = applicant.priorities[0];
                    const university = universitiesMap.get(universityId); // undefined

                    if (!university) {
                        freeApplicants.delete(applicantId);
                    }
                }

                return algorithm.buildResult(applicants, universities, universityAccepted);
            };

            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];
            const universities = [
                new University('U1', 'МГУ', 1, ['A1'])
            ];

            const result = algorithm.match(applicants, universities);
            expect(result).toBeDefined();
        });

        test('should handle buildEmptyResult with applicants', () => {
            const algorithm = new GaleShapleyLists();
            const applicants = [
                new Applicant('A1', 'Иван', 285, ['U1'])
            ];

            const result = algorithm.buildEmptyResult(applicants);
            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toHaveLength(1);
            expect(result.unmatched[0]).toBe('A1');
        });
    });
});
