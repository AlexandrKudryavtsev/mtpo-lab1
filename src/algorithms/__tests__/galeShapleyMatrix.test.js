const GaleShapleyMatrix = require('../galeShapleyMatrix');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

describe('GaleShapleyMatrix Algorithm', () => {
    let algorithm;
    let applicants;
    let universities;

    describe('Basic matching scenarios', () => {
        beforeEach(() => {
            algorithm = new GaleShapleyMatrix();

            applicants = [
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна Сидорова', 270, ['U2', 'U1'])
            ];

            universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];
        });

        test('should find stable matching', () => {
            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2', 'U3']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1', 'U3']),
                new Applicant('A3', 'Петр', 260, ['U3', 'U1', 'U2']),
                new Applicant('A4', 'Мария', 250, ['U1', 'U2', 'U3'])
            ];

            universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3', 'A4']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3', 'A4']),
                new University('U3', 'НГУ', 1, ['A3', 'A1', 'A2', 'A4'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(4);
            expect(result.stable).toBe(true);

            const universityCounts = {};
            result.matching.forEach(m => {
                universityCounts[m.university] = (universityCounts[m.university] || 0) + 1;
            });

            expect(universityCounts['U1']).toBe(2);
            expect(universityCounts['U2']).toBe(1);
            expect(universityCounts['U3']).toBe(1);
        });

        test('should respect university capacities', () => {
            const testApplicants = [
                new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна Сидорова', 270, ['U1', 'U2'])
            ];

            const testUniversities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const result = algorithm.match(testApplicants, testUniversities);

            const mguMatches = result.matching.filter(m => m.university === 'U1');
            expect(mguMatches).toHaveLength(2);

            expect(result.matching).toHaveLength(2);

            const spbguMatches = result.matching.filter(m => m.university === 'U2');
            expect(spbguMatches).toHaveLength(0);
        });

        test('should handle more applicants than places', () => {
            applicants.push(
                new Applicant('A3', 'Петр Сидоров', 260, ['U1', 'U2'])
            );

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.unmatched).toHaveLength(1);
        });
    });

    describe('Complex scenarios', () => {
        beforeEach(() => {
            algorithm = new GaleShapleyMatrix();

            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2', 'U3']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1', 'U3']),
                new Applicant('A3', 'Петр', 260, ['U3', 'U1', 'U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3']),
                new University('U3', 'НГУ', 1, ['A3', 'A1', 'A2'])
            ];
        });

        test('should find stable matching', () => {
            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2', 'U3']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1', 'U3']),
                new Applicant('A3', 'Петр', 260, ['U3', 'U1', 'U2']),
                new Applicant('A4', 'Мария', 250, ['U1', 'U3', 'U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A4', 'A3']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3', 'A4']),
                new University('U3', 'НГУ', 1, ['A3', 'A4', 'A1', 'A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(4);
            expect(result.stable).toBe(true);

            const universityCounts = {};
            result.matching.forEach(m => {
                universityCounts[m.university] = (universityCounts[m.university] || 0) + 1;
            });

            expect(universityCounts['U1']).toBe(2);
            expect(universityCounts['U2']).toBe(1);
            expect(universityCounts['U3']).toBe(1);
        });
    });

    describe('Stability checks', () => {
        test('should detect blocking pairs', () => {
            algorithm = new GaleShapleyMatrix();

            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U1', 'U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 1, ['A2', 'A1']),
                new University('U2', 'СПбГУ', 1, ['A1', 'A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.stable).toBe(true);

            const blockingPairs = algorithm.findBlockingPairs(result.matching, applicants, universities);
            expect(blockingPairs).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        beforeEach(() => {
            algorithm = new GaleShapleyMatrix();
        });

        test('should handle empty lists', () => {
            const result = algorithm.match([], []);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toHaveLength(0);
            expect(result.stable).toBe(true);
        });

        test('should handle university with zero capacity', () => {
            applicants = [new Applicant('A1', 'Иван', 285, ['U1'])];

            universities = [new University('U1', 'МГУ', 1, ['A2'])];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(0);
            expect(result.unmatched).toContain('A1');
        });

        test('should handle applicants with no common preferences', () => {
            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 1, ['A1']),
                new University('U2', 'СПбГУ', 1, ['A2'])
            ];

            const result = algorithm.match(applicants, universities);

            expect(result.matching).toHaveLength(2);
            expect(result.matching[0].applicant).toBe('A1');
            expect(result.matching[0].university).toBe('U1');
            expect(result.matching[1].applicant).toBe('A2');
            expect(result.matching[1].university).toBe('U2');
        });
    });

    describe('Performance with different data structures', () => {
        test('should build preference matrix correctly', () => {
            algorithm = new GaleShapleyMatrix();

            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 270, ['U2', 'U1'])
            ];

            universities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1'])
            ];

            const matrix = algorithm.buildPreferenceMatrix(applicants, universities);

            expect(matrix).toHaveProperty('applicantPrefs');
            expect(matrix).toHaveProperty('universityPrefs');
            expect(matrix.applicantPrefs.A1.U1).toBeLessThan(matrix.applicantPrefs.A1.U2);
            expect(matrix.universityPrefs.U1.A1).toBeLessThan(matrix.universityPrefs.U1.A2);
        });
    });
});
