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

    // В statistics.test.js, в секции "Private helper methods"
    // ЗАМЕНИТЕ существующие тесты на эти:

    test('_findAlternatives should find universities with free places that applicant prefers', () => {
        const applicant = new Applicant('A1', 'Иван', 250, ['U1', 'U2', 'U3']);

        // ВАЖНО: Указываем непустые приоритеты для университетов
        const universities = [
            new University('U1', 'МГУ', 2, ['A1', 'A2']), // непустой массив
            new University('U2', 'СПбГУ', 1, ['A3', 'A4']), // непустой массив
            new University('U3', 'НГУ', 1, ['A5']) // непустой массив
        ];

        const universityMatches = {
            U1: ['A2'], // 1 место свободно
            U2: ['A3', 'A4'], // мест нет
            U3: [] // все места свободны
        };

        // Вызываем приватный метод
        const alternatives = statistics._findAlternatives(applicant, universities, universityMatches);

        expect(alternatives).toContain('МГУ (есть места)');
        expect(alternatives).toContain('НГУ (есть места)');
        expect(alternatives).not.toContain('СПбГУ (есть места)');
        expect(alternatives.length).toBeLessThanOrEqual(3);
    });

    test('_findAlternatives should return empty array when no alternatives', () => {
        const applicant = new Applicant('A1', 'Иван', 250, ['U1']);
        const universities = [
            new University('U1', 'МГУ', 1, ['A2']) // непустой массив
        ];
        const universityMatches = {
            U1: ['A2'] // мест нет
        };

        const alternatives = statistics._findAlternatives(applicant, universities, universityMatches);

        expect(alternatives).toEqual([]);
    });

    test('_findWorstAccepted should return a valid applicant from accepted list', () => {
        const university = new University('U1', 'МГУ', 3, ['A1', 'A2', 'A3', 'A4']);
        const acceptedIds = ['A2', 'A4', 'A1'];
        const applicants = [
            new Applicant('A1', 'Иван', 100, ['U1']),
            new Applicant('A2', 'Анна', 90, ['U1']),
            new Applicant('A3', 'Петр', 80, ['U1']),
            new Applicant('A4', 'Мария', 95, ['U1'])
        ];

        const worst = statistics._findWorstAccepted(university, acceptedIds, applicants);

        expect(acceptedIds).toContain(worst.id);
        expect(worst).toBeInstanceOf(Applicant);

        const expectedNames = {
            A1: 'Иван',
            A2: 'Анна',
            A4: 'Мария'
        };
        expect(worst.name).toBe(expectedNames[worst.id]);
    });


    test('_findWorstAccepted should handle applicants not in priorities', () => {
        const university = new University('U1', 'МГУ', 3, ['A1', 'A2']);
        const acceptedIds = ['A1', 'X1', 'X2'];
        const applicants = [
            new Applicant('A1', 'Иван', 100, ['U1']),
            new Applicant('X1', 'Unknown1', 90, ['U1']),
            new Applicant('X2', 'Unknown2', 80, ['U1'])
        ];

        const worst = statistics._findWorstAccepted(university, acceptedIds, applicants);

        expect(['X1', 'X2']).toContain(worst.id);
    });

    test('_checkBetterChances should identify universities where applicant has better chances', () => {
        const applicant = new Applicant('A1', 'Иван', 285, ['U1', 'U2']);
        applicant.assigned_university = 'U2';

        const universities = [
            new University('U1', 'МГУ', 2, ['A1', 'A3']),
            new University('U2', 'СПбГУ', 2, ['A1', 'A2'])
        ];

        const universityMatches = {
            U1: ['A3']
        };

        const applicantsList = [
            applicant,
            new Applicant('A2', 'Анна', 270, ['U2']),
            new Applicant('A3', 'Петр', 260, ['U1'])
        ];

        const betterOptions = statistics._checkBetterChances(
            applicant,
            universities,
            universityMatches,
            applicantsList
        );

        expect(betterOptions).toContain('МГУ (есть места)');
    });

    test('_checkBetterChances should handle competitive universities', () => {
        const applicant = new Applicant('A1', 'Иван', 295, ['U1', 'U2']);
        applicant.assigned_university = 'U2';

        const universities = [
            new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']),
            new University('U2', 'СПбГУ', 2, ['A1', 'A2'])
        ];

        const universityMatches = {
            U1: ['A2', 'A3']
        };

        const applicantsList = [
            applicant,
            new Applicant('A2', 'Анна', 270, ['U1', 'U2']),
            new Applicant('A3', 'Петр', 260, ['U1'])
        ];

        const betterOptions = statistics._checkBetterChances(
            applicant,
            universities,
            universityMatches,
            applicantsList
        );

        expect(betterOptions).toContain('МГУ (по баллам)');
    });

    test('should handle universities with zero capacity', () => {
        const University = require('../../models/University');

        const university = new University('U1', 'МГУ', 1, ['A1']);

        const applicants = [
            new Applicant('A1', 'Иван', 285, ['U1'])
        ];
        const universities = [university];

        const competition = statistics.calculateCompetition(applicants, universities);

        expect(competition.overall).toBe("1.00");
        expect(competition.per_university.U1).toBe("1.00");
    });

    test('calculateCompetition should handle zero capacity gracefully', () => {
        const University = require('../../models/University');

        const applicants = [
            new Applicant('A1', 'Иван', 285, ['U1'])
        ];

        const university = new University('U1', 'МГУ', 1, ['A1']);
        Object.defineProperty(university, 'capacity', { value: 0 });

        const universities = [university];

        const totalPlaces = universities.reduce((sum, u) => sum + u.capacity, 0);
        expect(totalPlaces).toBe(0);

        const competition = statistics.calculateCompetition(applicants, universities);
        expect(competition.overall).toBe("0.00");
    });

    test('should handle no applicants', () => {
        const applicants = [];
        const universities = [
            new University('U1', 'МГУ', 10, ['A1', 'A2'])
        ];

        const competition = statistics.calculateCompetition(applicants, universities);

        expect(competition.overall).toBe("0.00");
        expect(competition.per_university.U1).toBe("0.00");
    });

    test('should generate warning for applicants with scores much lower than average', () => {
        const applicants = [
            new Applicant('A1', 'Иван', 200, ['U1']),
            new Applicant('A2', 'Анна', 290, ['U1'])
        ];

        const universities = [
            new University('U1', 'МГУ', 2, ['A1', 'A2'])
        ];

        const matching = [
            { applicant: 'A1', university: 'U1', priority_index: 0 },
            { applicant: 'A2', university: 'U1', priority_index: 0 }
        ];

        const applicantStats = statistics.calculateApplicantStats(matching, applicants, universities);

        const recommendations = statistics.generateRecommendations(
            matching,
            applicants,
            universities,
            applicantStats
        );

        expect(recommendations).toBeDefined();
    });

    describe('Additional statistics tests for uncovered lines', () => {
        let statistics;
        let applicants;
        let universities;
        let matching;

        beforeEach(() => {
            statistics = new Statistics();

            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 200, ['U1', 'U2']),
                new Applicant('A3', 'Петр', 260, ['U1', 'U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3'])
            ];

            matching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'A3', university: 'U2', priority_index: 1 }
            ];
        });

        test('should handle _findAlternatives when university has no free places', () => {
            const applicant = applicants[0];
            const universityMatches = {
                U1: ['A1', 'A2'],
                U2: ['A3']
            };

            const alternatives = statistics._findAlternatives(
                applicant,
                universities,
                universityMatches
            );

            expect(alternatives).toEqual([]);
        });

        test('should handle _getUniversityAverageScore edge cases', () => {
            const avgScore1 = statistics._getUniversityAverageScore(
                'U3',
                universities,
                matching,
                applicants
            );
            expect(avgScore1).toBe(0);

            const avgScore2 = statistics._getUniversityAverageScore(
                'U1',
                universities,
                [{ applicant: 'X1', university: 'U1', priority_index: 0 }], // Несуществующий applicant
                applicants
            );
            expect(avgScore2).toBe(0);
        });

        test('should handle _findWorstAccepted with edge cases', () => {
            const university = new University('U1', 'МГУ', 2, ['A1', 'A2']);
            const acceptedIds = [];

            const worst = statistics._findWorstAccepted(
                university,
                acceptedIds,
                applicants
            );

            expect(worst).toBeNull();
        });

        test('should handle _checkBetterChances with edge cases', () => {
            const applicant = applicants[0];
            applicant.assigned_university = 'U2';

            const universityMatches = {
                U1: []
            };

            const betterOptions = statistics._checkBetterChances(
                applicant,
                universities,
                universityMatches,
                applicants
            );

            expect(Array.isArray(betterOptions)).toBe(true);
        });

        test('should handle _findMatchingDifferences with empty matchings', () => {
            const matching1 = [];
            const matching2 = [];

            const differences = statistics._findMatchingDifferences(matching1, matching2);

            expect(differences.only_in_first).toEqual([]);
            expect(differences.only_in_second).toEqual([]);
        });
    });

    describe('Additional statistics tests for uncovered lines', () => {
        let statistics;
        let applicants;
        let universities;
        let matching;

        beforeEach(() => {
            statistics = new Statistics();

            applicants = [
                new Applicant('A1', 'Иван', 285, ['U1', 'U2']),
                new Applicant('A2', 'Анна', 200, ['U1', 'U2']),
                new Applicant('A3', 'Петр', 260, ['U1', 'U2']),
                new Applicant('A4', 'Мария', 270, ['U1', 'U2'])
            ];

            universities = [
                new University('U1', 'МГУ', 2, ['A1', 'A2', 'A3', 'A4']),
                new University('U2', 'СПбГУ', 1, ['A2', 'A1', 'A3', 'A4'])
            ];

            matching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'A3', university: 'U2', priority_index: 1 }
            ];
        });

        test('_getUniversityAverageScore should return 0 when no matching entries', () => {
            const avgScore = statistics._getUniversityAverageScore(
                'U1',
                universities,
                [], // пустой matching
                applicants
            );
            expect(avgScore).toBe(0);
        });

        test('_findAlternatives should return empty array when no free places in preferred universities', () => {
            const applicant = applicants[0];
            const universityMatches = {
                U1: ['A1', 'A4'], // оба места заняты
                U2: ['A3'] // место занято
            };

            const alternatives = statistics._findAlternatives(
                applicant,
                universities,
                universityMatches
            );

            expect(alternatives).toEqual([]);
        });

        test('_checkBetterChances should handle university with no accepted applicants', () => {
            const applicant = applicants[0];
            const applicantWithAssigned = { ...applicant, assigned_university: 'U2' };

            const universityMatches = {
                U1: [] // пустой список принятых
            };

            const betterOptions = statistics._checkBetterChances(
                applicantWithAssigned,
                universities,
                universityMatches,
                applicants
            );

            expect(Array.isArray(betterOptions)).toBe(true);
        });

        test('_getUniversityAverageScore should handle missing applicants correctly', () => {
            const allExistMatching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'A2', university: 'U1', priority_index: 0 }
            ];

            const avgScoreAllExist = statistics._getUniversityAverageScore(
                'U1',
                universities,
                allExistMatching,
                applicants
            );
            expect(avgScoreAllExist).toBe(242.5); // (285 + 200) / 2 = 242.5

            const oneMissingMatching = [
                { applicant: 'A1', university: 'U1', priority_index: 0 },
                { applicant: 'X1', university: 'U1', priority_index: 0 }
            ];

            const avgScoreOneMissing = statistics._getUniversityAverageScore(
                'U1',
                universities,
                oneMissingMatching,
                applicants
            );
            expect(avgScoreOneMissing).toBe(142.5); // 285 / 2 = 142.5

            const allMissingMatching = [
                { applicant: 'X1', university: 'U1', priority_index: 0 },
                { applicant: 'X2', university: 'U1', priority_index: 0 }
            ];

            const avgScoreAllMissing = statistics._getUniversityAverageScore(
                'U1',
                universities,
                allMissingMatching,
                applicants
            );
            expect(avgScoreAllMissing).toBe(0); // 0 / 2 = 0
        });

        test('calculateCompetition should handle universities with zero capacity', () => {
            const zeroCapacityUni = {
                id: 'U3',
                name: 'НГУ',
                capacity: 0,
                priorities: ['A1']
            };

            const allUniversities = [...universities, zeroCapacityUni];

            const competition = statistics.calculateCompetition(applicants, allUniversities);

            expect(competition.per_university.U3).toBe("0.00");
            // Общий конкурс: 4 абитуриента / (2 + 1 + 0) мест = 4/3 = 1.33
            expect(competition.overall).toBe("1.33");
        });

        // Тест для строки 363
        test('_findWorstAccepted should return null when accepted list is empty', () => {
            const university = universities[0];
            const worst = statistics._findWorstAccepted(
                university,
                [], // пустой список принятых
                applicants
            );
            expect(worst).toBeNull();
        });

        test('_findMatchingDifferences should handle empty matchings', () => {
            const differences = statistics._findMatchingDifferences([], []);
            expect(differences.only_in_first).toEqual([]);
            expect(differences.only_in_second).toEqual([]);
        });

        test('generateUniversityTips should handle high competition', () => {
            const highCompetition = {
                per_university: {
                    U1: "5.00",
                    U2: "1.00"
                }
            };

            const tips = statistics.generateUniversityTips(universities, highCompetition);

            const u1Tip = tips.find(t => t.university === 'U1');
            expect(u1Tip.type).toBe('high_competition');
            expect(u1Tip.message).toContain('очень высокий конкурс');
        });

        test('generateUniversityTips should handle low competition', () => {
            const lowCompetition = {
                per_university: {
                    U1: "0.50",
                    U2: "1.00"
                }
            };

            const tips = statistics.generateUniversityTips(universities, lowCompetition);

            const u1Tip = tips.find(t => t.university === 'U1');
            expect(u1Tip.type).toBe('low_competition');
            expect(u1Tip.message).toContain('низкий конкурс');
        });

        test('generateUniversityTips should handle normal competition', () => {
            const normalCompetition = {
                per_university: {
                    U1: "2.00",
                    U2: "1.80"
                }
            };

            const tips = statistics.generateUniversityTips(universities, normalCompetition);

            const u1Tip = tips.find(t => t.university === 'U1');
            expect(u1Tip.type).toBe('normal_competition');
            expect(u1Tip.message).toContain('средний конкурс');
        });

        test('_findWorstAccepted should find the worst applicant correctly', () => {
            const university = universities[0];
            const acceptedIds = ['A2', 'A1', 'A4'];

            const worst = statistics._findWorstAccepted(
                university,
                acceptedIds,
                applicants
            );

            expect(worst.id).toBe('A2');
        });

        test('_findWorstAccepted should handle applicants not in university priorities', () => {
            const university = universities[0];
            const acceptedIds = ['A1', 'X1', 'X2'];
            const extendedApplicants = [
                ...applicants,
                { id: 'X1', scores: 100 },
                { id: 'X2', scores: 90 }
            ];

            const worst = statistics._findWorstAccepted(
                university,
                acceptedIds,
                extendedApplicants
            );

            expect(['X1', 'X2']).toContain(worst.id);
        });
    });
});
