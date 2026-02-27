class Statistics {
    /**
     * Рассчитывает общую статистику по matching
     */
    calculateMatchingStats(matching, applicants, universities) {
        const totalApplicants = applicants.length;
        const totalPlaces = universities.reduce((sum, u) => sum + u.capacity, 0);
        const matchedCount = matching.length;

        // Средний приоритет
        const avgPriority = matchedCount > 0
            ? (matching.reduce((sum, m) => sum + m.priority_index, 0) / matchedCount).toFixed(2)
            : "0.00";

        // Сколько получили первый приоритет
        const firstChoiceCount = matching.filter(m => m.priority_index === 0).length;
        const firstChoicePercentage = totalApplicants > 0
            ? ((firstChoiceCount / totalApplicants) * 100).toFixed(2)
            : "0.00";

        // Конкурс (отношение желающих к местам)
        const competition = totalPlaces > 0
            ? (totalApplicants / totalPlaces).toFixed(2)
            : "0.00";

        return {
            total_applicants: totalApplicants,
            total_places: totalPlaces,
            matched_count: matchedCount,
            matched_percentage: totalApplicants > 0
                ? ((matchedCount / totalApplicants) * 100).toFixed(2)
                : "0.00",
            average_priority: avgPriority,
            satisfied_first_choice: firstChoiceCount,
            satisfied_first_choice_percentage: firstChoicePercentage,
            competition: competition
        };
    }

    /**
     * Рассчитывает статистику по каждому вузу
     */
    calculateUniversityStats(matching, applicants, universities) {
        const stats = {};

        const universityMatches = {};
        matching.forEach(m => {
            if (!universityMatches[m.university]) {
                universityMatches[m.university] = [];
            }
            universityMatches[m.university].push(m.applicant);
        });

        universities.forEach(uni => {
            const acceptedIds = universityMatches[uni.id] || [];
            const acceptedApplicants = acceptedIds
                .map(id => applicants.find(a => a.id === id))
                .filter(a => a);

            const scores = acceptedApplicants.map(a => a.scores);
            const avgScore = scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : 0;

            stats[uni.id] = {
                name: uni.name,
                capacity: uni.capacity,
                filled: acceptedIds.length,
                applicants: acceptedIds,
                average_applicant_score: Number(avgScore.toFixed(2)),
                min_score: scores.length > 0 ? Math.min(...scores) : 0,
                max_score: scores.length > 0 ? Math.max(...scores) : 0
            };
        });

        return stats;
    }

    /**
     * Рассчитывает статистику по каждому абитуриенту
     */
    calculateApplicantStats(matching, applicants, universities) {
        const stats = {};

        const applicantMatch = {};
        matching.forEach(m => {
            applicantMatch[m.applicant] = m;
        });

        applicants.forEach(app => {
            const match = applicantMatch[app.id];

            if (match) {
                const university = universities.find(u => u.id === match.university);
                const priorityPercentage = (match.priority_index / app.priorities.length) * 100;

                stats[app.id] = {
                    name: app.name,
                    scores: app.scores,
                    assigned_university: match.university,
                    assigned_university_name: university ? university.name : 'Unknown',
                    priority_achieved: match.priority_index,
                    priority_percentage: Number(priorityPercentage.toFixed(2)),
                    status: 'matched'
                };
            } else {
                stats[app.id] = {
                    name: app.name,
                    scores: app.scores,
                    assigned_university: null,
                    assigned_university_name: null,
                    priority_achieved: null,
                    priority_percentage: null,
                    status: 'unmatched'
                };
            }
        });

        return stats;
    }

    /**
     * Рассчитывает конкурс по вузам
     */
    calculateCompetition(applicants, universities) {
        const competition = {
            overall: "0.00",
            per_university: {}
        };

        const totalApplicants = applicants.length;
        const totalPlaces = universities.reduce((sum, u) => sum + u.capacity, 0);

        competition.overall = totalPlaces > 0
            ? (totalApplicants / totalPlaces).toFixed(2)
            : "0.00";

        universities.forEach(uni => {
            let interested = 0;
            applicants.forEach(app => {
                if (app.priorities.includes(uni.id)) {
                    interested++;
                }
            });

            competition.per_university[uni.id] = uni.capacity > 0
                ? (interested / uni.capacity).toFixed(2)
                : "0.00";
        });

        return competition;
    }

    /**
     * Генерирует рекомендации для абитуриентов
     */
    generateRecommendations(matching, applicants, universities, applicantStats) {
        const recommendations = [];

        const universityMatches = {};
        matching.forEach(m => {
            if (!universityMatches[m.university]) {
                universityMatches[m.university] = [];
            }
            universityMatches[m.university].push(m.applicant);
        });

        applicants.forEach(applicant => {
            const stats = applicantStats[applicant.id];
            const isMatched = stats.status === 'matched';

            if (!isMatched) {
                const alternatives = this._findAlternatives(applicant, universities, universityMatches);

                let message = `Абитуриент ${applicant.name} не распределен. `;
                if (alternatives.length > 0) {
                    message += `Рекомендуем рассмотреть: ${alternatives.join(', ')}.`;
                } else {
                    message += 'К сожалению, нет подходящих альтернатив.';
                }

                recommendations.push({
                    applicant: applicant.id,
                    type: 'unmatched',
                    message,
                    alternatives
                });

                if (applicant.scores < 220) {
                    recommendations.push({
                        applicant: applicant.id,
                        type: 'warning',
                        message: `${applicant.name} имеет низкие баллы (${applicant.scores}). Рекомендуем рассмотреть вузы с меньшим конкурсом.`,
                        alternatives: []
                    });
                }
            } else {
                if (stats.priority_achieved > 0) {
                    const betterChances = this._checkBetterChances(applicant, universities, universityMatches, applicants);

                    if (betterChances.length > 0) {
                        recommendations.push({
                            applicant: applicant.id,
                            type: 'suboptimal',
                            message: `${applicant.name} получил ${stats.priority_achieved + 1}-й приоритет. ` +
                                `Возможно, стоит рассмотреть: ${betterChances.join(', ')}.`,
                            alternatives: betterChances
                        });
                    }
                }

                const avgScore = this._getUniversityAverageScore(applicant.assigned_university, universities, matching, applicants);
                if (avgScore > 0 && applicant.scores < avgScore * 0.8) {
                    recommendations.push({
                        applicant: applicant.id,
                        type: 'warning',
                        message: `${applicant.name} имеет баллы (${applicant.scores}) значительно ниже ` +
                            `среднего по вузу (${avgScore.toFixed(0)}). Риск непоступления.`,
                        alternatives: []
                    });
                }
            }
        });

        return recommendations;
    }

    /**
     * Генерирует советы по вузам
     */
    generateUniversityTips(universities, competition) {
        const tips = [];

        universities.forEach(uni => {
            const comp = parseFloat(competition.per_university[uni.id]);

            if (comp > 3) {
                tips.push({
                    university: uni.id,
                    type: 'high_competition',
                    message: `${uni.name}: очень высокий конкурс (${comp.toFixed(2)} чел/место). ` +
                        'Рекомендуем иметь запасные варианты.'
                });
            } else if (comp < 1.5 && comp > 0) {
                tips.push({
                    university: uni.id,
                    type: 'low_competition',
                    message: `${uni.name}: низкий конкурс (${comp.toFixed(2)} чел/место). ` +
                        'Хорошие шансы на поступление.'
                });
            } else {
                tips.push({
                    university: uni.id,
                    type: 'normal_competition',
                    message: `${uni.name}: средний конкурс (${comp.toFixed(2)} чел/место). ` +
                        'Реальные шансы на поступление.'
                });
            }
        });

        return tips;
    }

    /**
     * Сравнивает результаты двух алгоритмов
     */
    compareAlgorithms(result1, result2) {
        const comparison = {
            matrix: {
                name: result1.algorithm,
                matched: result1.matching.length,
                unmatched: result1.unmatched ? result1.unmatched.length : 0,
                avgPriority: result1.statistics?.average_priority || "0.00"
            },
            lists: {
                name: result2.algorithm,
                matched: result2.matching.length,
                unmatched: result2.unmatched ? result2.unmatched.length : 0,
                avgPriority: result2.statistics?.average_priority || "0.00"
            }
        };

        const sortMatching = (m) => [...m].sort((a, b) =>
            a.applicant.localeCompare(b.applicant) ||
            a.university.localeCompare(b.university)
        );

        const sorted1 = sortMatching(result1.matching);
        const sorted2 = sortMatching(result2.matching);

        comparison.same_matching = JSON.stringify(sorted1) === JSON.stringify(sorted2);

        if (!comparison.same_matching) {
            comparison.differences = this._findMatchingDifferences(result1.matching, result2.matching);
        }

        return comparison;
    }

    _findAlternatives(applicant, universities, universityMatches) {
        const alternatives = [];

        universities.forEach(uni => {
            if ((universityMatches[uni.id] || []).length < uni.capacity) {
                if (applicant.priorities.includes(uni.id)) {
                    alternatives.push(`${uni.name} (есть места)`);
                }
            }
        });

        return alternatives.slice(0, 3);
    }

    _checkBetterChances(applicant, universities, universityMatches, applicants) {
        const betterOptions = [];
        const currentPriority = applicant.priorities.indexOf(
            applicant.assigned_university
        );

        for (let i = 0; i < currentPriority; i++) {
            const preferredUniId = applicant.priorities[i];
            const university = universities.find(u => u.id === preferredUniId);

            if (university) {
                const accepted = universityMatches[preferredUniId] || [];
                if (accepted.length < university.capacity) {
                    betterOptions.push(`${university.name} (есть места)`);
                } else {
                    const worstAccepted = this._findWorstAccepted(university, accepted, applicants);
                    if (worstAccepted && applicant.scores > worstAccepted.scores) {
                        betterOptions.push(`${university.name} (по баллам)`);
                    }
                }
            }
        }

        return betterOptions.slice(0, 3);
    }

    _findWorstAccepted(university, acceptedIds, applicants) {
        let worst = null;
        let worstScore = Infinity;

        acceptedIds.forEach(id => {
            const app = applicants.find(a => a.id === id);
            if (app && app.scores < worstScore) {
                worstScore = app.scores;
                worst = app;
            }
        });

        return worst;
    }

    _getUniversityAverageScore(universityId, universities, matching, applicants) {
        const uniMatching = matching.filter(m => m.university === universityId);
        if (uniMatching.length === 0) return 0;

        let totalScore = 0;
        uniMatching.forEach(m => {
            const app = applicants.find(a => a.id === m.applicant);
            if (app) {
                totalScore += app.scores;
            }
        });

        return totalScore / uniMatching.length;
    }

    _findMatchingDifferences(matching1, matching2) {
        const diff = {
            only_in_first: [],
            only_in_second: []
        };

        const map1 = new Map(matching1.map(m => [m.applicant, m.university]));
        const map2 = new Map(matching2.map(m => [m.applicant, m.university]));

        for (const [applicant, university] of map1) {
            if (map2.get(applicant) !== university) {
                diff.only_in_first.push({ applicant, university });
            }
        }

        for (const [applicant, university] of map2) {
            if (map1.get(applicant) !== university) {
                diff.only_in_second.push({ applicant, university });
            }
        }

        return diff;
    }
}

module.exports = Statistics;
