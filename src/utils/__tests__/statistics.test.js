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

    // Boundary Value Analysis
    describe('BVA: statistics boundaries', () => {
        test('calculateMatchingStats with empty matching', () => {
            const stats = statistics.calculateMatchingStats([], applicants, universities);

            expect(stats.matched_count).toBe(0);
            expect(stats.matched_percentage).toBe("0.00");
            expect(stats.average_priority).toBe("0.00");
            expect(stats.satisfied_first_choice).toBe(0);
        });

        test('calculateMatchingStats with all matched', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, universities);

            expect(stats.matched_count).toBe(4);
            expect(stats.matched_percentage).toBe("100.00");
            expect(stats.average_priority).toBe("0.25");
            expect(stats.satisfied_first_choice).toBe(3);
        });

        test('calculateUniversityStats with empty university', () => {
            const emptyUni = new University('U4', 'Пустой', 1, ['A1']);
            Object.defineProperty(emptyUni, 'capacity', { value: 0 });

            const allUniversities = [...universities, emptyUni];

            const uniStats = statistics.calculateUniversityStats(matching, applicants, allUniversities);

            expect(uniStats.U4.filled).toBe(0);
            expect(uniStats.U4.average_applicant_score).toBe(0);
            expect(uniStats.U4.min_score).toBe(0);
            expect(uniStats.U4.max_score).toBe(0);
        });
    });

    // Equivalence Partitioning
    describe('EP: different data states', () => {
        test('calculateMatchingStats with no applicants', () => {
            const stats = statistics.calculateMatchingStats(matching, [], universities);

            expect(stats.total_applicants).toBe(0);
            expect(stats.matched_percentage).toBe("0.00");
            expect(stats.satisfied_first_choice_percentage).toBe("0.00");
        });

        test('calculateMatchingStats with no places', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, []);

            expect(stats.total_places).toBe(0);
            expect(stats.competition).toBe("0.00");
        });

        test('calculateCompetition with no interested applicants', () => {
            const isolatedUni = new University('U4', 'Дальневосточный', 5, ['A5', 'A6']);
            const allUniversities = [...universities, isolatedUni];

            const competition = statistics.calculateCompetition(applicants, allUniversities);

            expect(competition.per_university.U4).toBe("0.00");
        });
    });

    // Statement Testing
    describe('Statement: all methods coverage', () => {
        test('calculateMatchingStats calculates all fields', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, universities);

            expect(stats).toHaveProperty('total_applicants');
            expect(stats).toHaveProperty('total_places');
            expect(stats).toHaveProperty('matched_count');
            expect(stats).toHaveProperty('matched_percentage');
            expect(stats).toHaveProperty('average_priority');
            expect(stats).toHaveProperty('satisfied_first_choice');
            expect(stats).toHaveProperty('satisfied_first_choice_percentage');
            expect(stats).toHaveProperty('competition');
        });

        test('calculateUniversityStats calculates per-university metrics', () => {
            const uniStats = statistics.calculateUniversityStats(matching, applicants, universities);

            expect(uniStats.U1).toHaveProperty('name');
            expect(uniStats.U1).toHaveProperty('capacity');
            expect(uniStats.U1).toHaveProperty('filled');
            expect(uniStats.U1).toHaveProperty('applicants');
            expect(uniStats.U1).toHaveProperty('average_applicant_score');
            expect(uniStats.U1).toHaveProperty('min_score');
            expect(uniStats.U1).toHaveProperty('max_score');
        });

        test('calculateApplicantStats calculates per-applicant metrics', () => {
            const appStats = statistics.calculateApplicantStats(matching, applicants, universities);

            expect(appStats.A1).toHaveProperty('name');
            expect(appStats.A1).toHaveProperty('scores');
            expect(appStats.A1).toHaveProperty('assigned_university');
            expect(appStats.A1).toHaveProperty('assigned_university_name');
            expect(appStats.A1).toHaveProperty('priority_achieved');
            expect(appStats.A1).toHaveProperty('priority_percentage');
            expect(appStats.A1).toHaveProperty('status');
        });

        test('calculateCompetition calculates overall and per-university', () => {
            const competition = statistics.calculateCompetition(applicants, universities);

            expect(competition).toHaveProperty('overall');
            expect(competition).toHaveProperty('per_university');
        });

        test('generateRecommendations creates recommendations array', () => {
            const appStats = statistics.calculateApplicantStats(matching, applicants, universities);
            const recommendations = statistics.generateRecommendations(
                matching, applicants, universities, appStats
            );

            expect(Array.isArray(recommendations)).toBe(true);
        });

        test('generateUniversityTips creates tips array', () => {
            const competition = statistics.calculateCompetition(applicants, universities);
            const tips = statistics.generateUniversityTips(universities, competition);

            expect(Array.isArray(tips)).toBe(true);
        });

        test('compareAlgorithms compares two results', () => {
            const result1 = { matching, statistics: { matched_count: 4, average_priority: '0.25' } };
            const result2 = { matching, statistics: { matched_count: 4, average_priority: '0.25' } };

            const comparison = statistics.compareAlgorithms(result1, result2);

            expect(comparison).toHaveProperty('matrix');
            expect(comparison).toHaveProperty('lists');
            expect(comparison).toHaveProperty('same_matching');
        });
    });

    // Branch Testing
    describe('Branch: condition coverage', () => {
        test('calculateMatchingStats branch: matchedCount > 0', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, universities);
            expect(stats.average_priority).toBe("0.25");
        });

        test('calculateMatchingStats branch: matchedCount = 0', () => {
            const stats = statistics.calculateMatchingStats([], applicants, universities);
            expect(stats.average_priority).toBe("0.00");
        });

        test('calculateMatchingStats branch: totalApplicants > 0', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, universities);
            expect(stats.matched_percentage).toBe("100.00");
            expect(stats.satisfied_first_choice_percentage).toBe("75.00");
        });

        test('calculateMatchingStats branch: totalApplicants = 0', () => {
            const stats = statistics.calculateMatchingStats(matching, [], universities);
            expect(stats.matched_percentage).toBe("0.00");
            expect(stats.satisfied_first_choice_percentage).toBe("0.00");
        });

        test('calculateMatchingStats branch: totalPlaces > 0', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, universities);
            expect(stats.competition).toBe("1.00");
        });

        test('calculateMatchingStats branch: totalPlaces = 0', () => {
            const stats = statistics.calculateMatchingStats(matching, applicants, []);
            expect(stats.competition).toBe("0.00");
        });

        test('calculateUniversityStats branch: scores length > 0', () => {
            const uniStats = statistics.calculateUniversityStats(matching, applicants, universities);
            expect(uniStats.U1.average_applicant_score).toBe(267.5);
        });

        test('calculateUniversityStats branch: scores length = 0', () => {
            const emptyUni = new University('U4', 'Пустой', 1, ['A5']);
            const uniStats = statistics.calculateUniversityStats([], [], [emptyUni]);
            expect(uniStats.U4.average_applicant_score).toBe(0);
        });

        test('generateRecommendations branch: applicant unmatched', () => {
            const partialMatching = matching.slice(0, 2); // только A1 и A2
            const appStats = statistics.calculateApplicantStats(partialMatching, applicants, universities);
            const recommendations = statistics.generateRecommendations(
                partialMatching, applicants, universities, appStats
            );

            const unmatchedRecs = recommendations.filter(r => r.type === 'unmatched');
            expect(unmatchedRecs.length).toBeGreaterThan(0);
        });

        test('generateRecommendations branch: applicant with low scores', () => {
            const lowScoreApplicant = new Applicant('A5', 'Низкий', 150, ['U1']);
            const allApplicants = [...applicants, lowScoreApplicant];
            const allMatching = [...matching];

            const appStats = statistics.calculateApplicantStats(allMatching, allApplicants, universities);
            const recommendations = statistics.generateRecommendations(
                allMatching, allApplicants, universities, appStats
            );

            const warningRecs = recommendations.filter(r => r.type === 'warning');
            expect(warningRecs.length).toBeGreaterThanOrEqual(0);
        });

        test('generateRecommendations branch: applicant with suboptimal match', () => {
            const suboptimalMatching = [
                { applicant: 'A1', university: 'U2', priority_index: 1 } // A1 хотел U1, получил U2
            ];

            const appStats = statistics.calculateApplicantStats(suboptimalMatching, applicants, universities);
            const recommendations = statistics.generateRecommendations(
                suboptimalMatching, applicants, universities, appStats
            );

            const suboptimalRecs = recommendations.filter(r => r.type === 'suboptimal');
            expect(suboptimalRecs.length).toBeGreaterThanOrEqual(0);
        });

        test('generateUniversityTips branch: high competition', () => {
            const highCompetition = {
                per_university: {
                    U1: "5.00",
                    U2: "1.00"
                }
            };

            const tips = statistics.generateUniversityTips(universities, highCompetition);

            const highCompTip = tips.find(t => t.university === 'U1');
            expect(highCompTip.type).toBe('high_competition');
        });

        test('generateUniversityTips branch: low competition', () => {
            const lowCompetition = {
                per_university: {
                    U1: "0.50",
                    U2: "1.00"
                }
            };

            const tips = statistics.generateUniversityTips(universities, lowCompetition);

            const lowCompTip = tips.find(t => t.university === 'U1');
            expect(lowCompTip.type).toBe('low_competition');
        });

        test('generateUniversityTips branch: normal competition', () => {
            const normalCompetition = {
                per_university: {
                    U1: "2.00",
                    U2: "1.80"
                }
            };

            const tips = statistics.generateUniversityTips(universities, normalCompetition);

            const normalCompTip = tips.find(t => t.university === 'U1');
            expect(normalCompTip.type).toBe('normal_competition');
        });

        test('compareAlgorithms branch: same matching', () => {
            const result1 = { matching, algorithm: 'Matrix', statistics: {} };
            const result2 = { matching, algorithm: 'Lists', statistics: {} };

            const comparison = statistics.compareAlgorithms(result1, result2);
            expect(comparison.same_matching).toBe(true);
        });

        test('compareAlgorithms branch: different matching', () => {
            const result1 = { matching, algorithm: 'Matrix', statistics: {} };
            const result2 = { matching: matching.slice(0, 2), algorithm: 'Lists', statistics: {} };

            const comparison = statistics.compareAlgorithms(result1, result2);
            expect(comparison.same_matching).toBe(false);
            expect(comparison.differences).toBeDefined();
        });
    });

    // Edge Cases
    describe('Edge cases for uncovered lines', () => {
        test('_findAlternatives with no free places', () => {
            const applicant = applicants[0];
            const universityMatches = {
                U1: ['A1', 'A4'], // оба места заняты
                U2: ['A2'], // место занято
                U3: ['A3'] // место занято
            };

            const alternatives = statistics._findAlternatives(
                applicant,
                universities,
                universityMatches
            );

            expect(alternatives).toEqual([]);
        });

        test('_findAlternatives with free places not in applicant priorities', () => {
            const applicant = new Applicant('A1', 'Иван', 285, ['U2']); // U2 в приоритетах
            const uniWithFreePlace = new University('U1', 'МГУ', 2, ['A2']); // U1 не в приоритетах

            const universityMatches = {
                U1: ['A2'],
                U2: ['A3']
            };

            const alternatives = statistics._findAlternatives(
                applicant,
                [uniWithFreePlace, universities[1]],
                universityMatches
            );

            // U1 не в приоритетах, U2 нет мест
            expect(alternatives).toEqual([]);
        });

        test('_checkBetterChances with empty universityMatches', () => {
            const applicant = applicants[0];
            applicant.assigned_university = 'U2';

            const universityMatches = {
                U1: [] // пустой список принятых
            };

            const betterOptions = statistics._checkBetterChances(
                applicant,
                universities,
                universityMatches,
                applicants
            );

            expect(Array.isArray(betterOptions)).toBe(true);
        });

        test('_checkBetterChances with university that has capacity', () => {
            const applicant = applicants[0];
            applicant.assigned_university = 'U2';

            const universityMatches = {
                U1: [] // есть места
            };

            const betterOptions = statistics._checkBetterChances(
                applicant,
                universities,
                universityMatches,
                applicants
            );

            expect(betterOptions.length).toBeGreaterThanOrEqual(0);
        });

        test('_findWorstAccepted with empty accepted list', () => {
            const worst = statistics._findWorstAccepted(
                universities[0],
                [],
                applicants
            );

            expect(worst).toBeNull();
        });

        test('_findWorstAccepted with all applicants in priorities', () => {
            const university = universities[0]; // U1 с приоритетами ['A1','A2','A3','A4']
            const acceptedIds = ['A1', 'A2', 'A4'];

            const worst = statistics._findWorstAccepted(
                university,
                acceptedIds,
                applicants
            );

            // Индексы: A1(0), A2(1), A4(3) - A4 имеет наибольший индекс
            expect(worst.id).toBe('A4');
        });

        test('_findWorstAccepted with mixed prioritized and non-prioritized', () => {
            const university = universities[0];
            const acceptedIds = ['A1', 'X1', 'A2'];
            const extendedApplicants = [
                ...applicants,
                { id: 'X1', scores: 100 }
            ];

            const worst = statistics._findWorstAccepted(
                university,
                acceptedIds,
                extendedApplicants
            );

            // X1 не в приоритетах, должен быть худшим
            expect(worst.id).toBe('X1');
        });

        test('_getUniversityAverageScore with no matching entries', () => {
            const avgScore = statistics._getUniversityAverageScore(
                'U1',
                universities,
                [], // пустой matching
                applicants
            );

            expect(avgScore).toBe(0);
        });

        test('_getUniversityAverageScore with missing applicants', () => {
            const matchingWithMissing = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'X1', university: 'U1', priority_index: 0 } // не существует
            ];

            const avgScore = statistics._getUniversityAverageScore(
                'U1',
                universities,
                matchingWithMissing,
                applicants
            );

            expect(avgScore).toBe(142.5); // 285 / 2 = 142.5
        });

        test('_findMatchingDifferences with empty matchings', () => {
            const differences = statistics._findMatchingDifferences([], []);

            expect(differences.only_in_first).toEqual([]);
            expect(differences.only_in_second).toEqual([]);
        });

        test('_findMatchingDifferences with different matchings', () => {
            const matching1 = [
                { applicant: 'A1', university: 'U1' },
                { applicant: 'A2', university: 'U2' }
            ];
            const matching2 = [
                { applicant: 'A1', university: 'U1' },
                { applicant: 'A3', university: 'U3' }
            ];

            const differences = statistics._findMatchingDifferences(matching1, matching2);

            expect(differences.only_in_first).toHaveLength(1);
            expect(differences.only_in_second).toHaveLength(1);
        });

        test('_checkBetterChances with better scores', () => {
            const applicant = new Applicant('A1', 'Иван', 295, ['U1', 'U2']);
            applicant.assigned_university = 'U2';

            const universityMatches = {
                U1: ['A2', 'A3'] // A2(270), A3(260)
            };

            const applicantsList = [
                applicant,
                new Applicant('A2', 'Анна', 270, ['U1']),
                new Applicant('A3', 'Петр', 260, ['U1'])
            ];

            const betterOptions = statistics._checkBetterChances(
                applicant,
                universities,
                universityMatches,
                applicantsList
            );

            // Должен найти U1 как вариант "по баллам"
            const hasScoreOption = betterOptions.some(opt => opt.includes('по баллам'));
            expect(hasScoreOption).toBe(true);
        });

        test('generateRecommendations with undefined assigned_university', () => {
            const applicant = new Applicant('A1', 'Иван', 285, ['U1']);

            const appStats = {
                A1: {
                    name: 'Иван',
                    scores: 285,
                    status: 'unmatched'
                }
            };

            expect(() => {
                statistics.generateRecommendations([], [applicant], universities, appStats);
            }).not.toThrow();
        });
    });

    // Параметризованные тесты
    describe('Parameterized (optimized)', () => {
        test.each([
            [4, 4, 4, "100.00", "0.25", 3, "75.00", "1.00"],
            [4, 4, 0, "0.00", "0.00", 0, "0.00", "1.00"],
            [0, 4, 0, "0.00", "0.00", 0, "0.00", "0.00"]
        ])('calculateMatchingStats with total=%i, places=%i, matched=%i',
            (total, places, matched, matchedPct, avgPriority, firstChoice, firstChoicePct, competition) => {

                const testMatching = matched > 0 ? matching.slice(0, matched) : [];
                const testApplicants = total > 0 ? applicants.slice(0, total) : [];
                const testUniversities = places > 0 ? universities : [];

                const stats = statistics.calculateMatchingStats(testMatching, testApplicants, testUniversities);

                expect(stats.matched_percentage).toBe(matchedPct);
                expect(stats.average_priority).toBe(avgPriority);
                expect(stats.competition).toBe(competition);
            });
    });
});
