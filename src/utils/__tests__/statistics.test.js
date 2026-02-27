const Statistics = require('../statistics');
const Applicant = require('../../models/Applicant');
const University = require('../../models/University');

describe('Statistics Calculator', () => {
    let statistics;
    let applicants;
    let universities;
    let matching;

    beforeEach(() => {
        statistics = new Statistics();

        applicants = [
            new Applicant('A1', 'Иван Петров', 285, ['U1', 'U2', 'U3']),
            new Applicant('A2', 'Анна Сидорова', 270, ['U2', 'U1', 'U3']),
            new Applicant('A3', 'Петр Сидоров', 260, ['U3', 'U1', 'U2']),
            new Applicant('A4', 'Мария Иванова', 250, ['U1', 'U2', 'U3'])
        ];

        universities = [
            new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3', 'A4']),
            new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3', 'A4']),
            new University('U3', 'НГУ', 1, ['A3', 'A1', 'A2', 'A4'])
        ];

        matching = [
            { applicant: 'A1', university: 'U1', priority_index: 0 },
            { applicant: 'A2', university: 'U2', priority_index: 0 },
            { applicant: 'A3', university: 'U3', priority_index: 0 },
            { applicant: 'A4', university: 'U1', priority_index: 1 }
        ];
    });

    describe('Basic statistics', () => {
        test('should calculate matching statistics correctly', () => {
            const stats = statistics.calculateMatchingStats(
                matching,
                applicants,
                universities
            );

            expect(stats).toEqual({
                total_applicants: 4,
                total_places: 4,
                matched_count: 4,
                matched_percentage: "100.00",
                average_priority: "0.25",
                satisfied_first_choice: 3,
                satisfied_first_choice_percentage: "75.00",
                competition: "1.00"
            });
        });

        test('should handle empty matching', () => {
            const stats = statistics.calculateMatchingStats([], applicants, universities);

            expect(stats.matched_count).toBe(0);
            expect(stats.matched_percentage).toBe("0.00");
            expect(stats.average_priority).toBe("0.00");
            expect(stats.satisfied_first_choice).toBe(0);
        });
    });

    describe('University statistics', () => {
        test('should calculate per-university statistics', () => {
            const uniStats = statistics.calculateUniversityStats(
                matching,
                applicants,
                universities
            );

            expect(uniStats).toHaveProperty('U1');
            expect(uniStats).toHaveProperty('U2');
            expect(uniStats).toHaveProperty('U3');

            expect(uniStats.U1).toEqual({
                name: 'МГУ',
                capacity: 2,
                filled: 2,
                applicants: ['A1', 'A4'],
                average_applicant_score: 267.5, // (285 + 250) / 2
                min_score: 250,
                max_score: 285
            });

            expect(uniStats.U2.filled).toBe(1);
            expect(uniStats.U2.average_applicant_score).toBe(270);
        });
    });

    describe('Applicant statistics', () => {
        test('should calculate per-applicant statistics', () => {
            const appStats = statistics.calculateApplicantStats(
                matching,
                applicants,
                universities
            );

            expect(appStats).toHaveProperty('A1');
            expect(appStats).toHaveProperty('A2');
            expect(appStats).toHaveProperty('A3');
            expect(appStats).toHaveProperty('A4');

            expect(appStats.A1).toEqual({
                name: 'Иван Петров',
                scores: 285,
                assigned_university: 'U1',
                assigned_university_name: 'МГУ',
                priority_achieved: 0,
                priority_percentage: 0,
                status: 'matched'
            });

            expect(appStats.A4.priority_achieved).toBe(1);
            expect(appStats.A4.priority_percentage).toBe(33.33); // 1 из 3 = 33.33%
        });

        test('should handle unmatched applicants', () => {
            const unmatchedMatching = matching.slice(0, 2);

            const appStats = statistics.calculateApplicantStats(
                unmatchedMatching,
                applicants,
                universities
            );

            expect(appStats.A3.status).toBe('unmatched');
            expect(appStats.A3.assigned_university).toBeNull();
            expect(appStats.A4.status).toBe('unmatched');
        });
    });

    describe('Competition analysis', () => {
        test('should calculate competition ratios', () => {
            const competition = statistics.calculateCompetition(applicants, universities);

            // 4 места на 4 абитуриентов
            expect(competition).toEqual({
                overall: "1.00",
                per_university: {
                    U1: "2.00",
                    U2: "4.00",
                    U3: "4.00"
                }
            });
        });

        test('should calculate competition based on preferences, not just anyone', () => {
            const newApplicants = [
                new Applicant('A1', 'Иван', 285, ['U1']),
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U2'])
            ];

            const newUniversities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A3'])
            ];

            const competition = statistics.calculateCompetition(newApplicants, newUniversities);

            expect(competition.per_university.U1).toBe("2.00"); // 2 хотят, 1 место
            expect(competition.per_university.U2).toBe("1.00"); // 1 хочет, 1 место
        });
    });

    describe('Recommendations', () => {
        test('should generate recommendations for unmatched applicants', () => {
            // A1, A2 распределены
            const unmatchedMatching = matching.slice(0, 2);
            const appStats = statistics.calculateApplicantStats(
                unmatchedMatching,
                applicants,
                universities
            );

            const recommendations = statistics.generateRecommendations(
                unmatchedMatching,
                applicants,
                universities,
                appStats
            );

            // Для A3 и A4
            expect(recommendations).toHaveLength(2);

            // Рекомендация A3
            const recForA3 = recommendations.find(r => r.applicant === 'A3');
            expect(recForA3).toBeDefined();
            expect(recForA3.message).toContain('рассмотреть');
            expect(recForA3.alternatives).toBeInstanceOf(Array);
        });

        test('should suggest alternative universities based on scores', () => {
            const newApplicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 200, ['U1', 'U2']) // Низкие баллы
            ];

            const newUniversities = [
                new University('U1', 'МГУ', 1, ['A1', 'A2']),
                new University('U2', 'СПбГУ', 1, ['A1', 'A2'])
            ];

            const result = { matching: [], unmatched: ['A1', 'A2'] }; // Никто не распределен
            const appStats = statistics.calculateApplicantStats(
                result.matching,
                newApplicants,
                newUniversities
            );

            const recommendations = statistics.generateRecommendations(
                result.matching,
                newApplicants,
                newUniversities,
                appStats
            );

            console.log('Recommendations:', JSON.stringify(recommendations, null, 2));

            // Находим все рекомендации для A2
            const recsForA2 = recommendations.filter(r => r.applicant === 'A2');

            // Должна быть рекомендация о нераспределении
            const unmatchedRec = recsForA2.find(r => r.type === 'unmatched');
            expect(unmatchedRec).toBeDefined();

            // Должна быть рекомендация о низких баллах
            const warningRec = recsForA2.find(r => r.type === 'warning');
            expect(warningRec).toBeDefined();
            expect(warningRec.message).toContain('низкие баллы');
        });

        test('should provide tips for popular universities', () => {
            const competition = statistics.calculateCompetition(applicants, universities);

            const tips = statistics.generateUniversityTips(universities, competition);

            expect(tips).toHaveLength(3);

            const u1Tip = tips.find(t => t.university === 'U1');
            expect(u1Tip.message).toContain('2.00');

            const u2Tip = tips.find(t => t.university === 'U2');
            expect(u2Tip.message).toContain('4.00'); // Высокий конкурс
        });
    });

    describe('Performance comparison', () => {
        test('should compare two algorithm results', () => {
            const matrixResult = {
                algorithm: 'Gale-Shapley (Matrix)',
                matching: matching,
                statistics: {
                    matched_count: 4,
                    average_priority: 0.25
                }
            };

            const listsResult = {
                algorithm: 'Gale-Shapley (Lists)',
                matching: matching,
                statistics: {
                    matched_count: 4,
                    average_priority: 0.25
                }
            };

            const comparison = statistics.compareAlgorithms(matrixResult, listsResult);

            expect(comparison).toHaveProperty('same_matching');
            expect(comparison.same_matching).toBe(true);
            expect(comparison).toHaveProperty('matrix');
            expect(comparison).toHaveProperty('lists');
        });

        test('should detect differences in results', () => {
            const matrixResult = {
                algorithm: 'Gale-Shapley (Matrix)',
                matching: matching,
                statistics: { matched_count: 4 }
            };

            const listsResult = {
                algorithm: 'Gale-Shapley (Lists)',
                matching: matching.slice(0, 3), // Только 3 matching
                statistics: { matched_count: 3 }
            };

            const comparison = statistics.compareAlgorithms(matrixResult, listsResult);

            expect(comparison.same_matching).toBe(false);
            expect(comparison.differences).toBeDefined();
        });
    });
});
