class GaleShapleyMatrix {
    constructor() {
        this.name = 'Gale-Shapley (Matrix)';
    }

    /**
     * Основной метод алгоритма
     * @param {Array<Applicant>} applicants - массив абитуриентов
     * @param {Array<University>} universities - массив вузов
     * @returns {Object} - результат паросочетания
     */
    match(applicants, universities) {
        if (!applicants.length || !universities.length) {
            return {
                matching: [],
                unmatched: applicants.map(a => a.id),
                stable: true,
                algorithm: this.name
            };
        }

        const prefs = this.buildPreferenceMatrix(applicants, universities);

        const freeQueue = [];
        const universityAccepted = new Map(); // вуз -> массив принятых абитуриентов
        const applicantNextProposal = new Map(); // абитуриент -> индекс следующего вуза

        applicants.forEach(a => {
            freeQueue.push(a.id);
            applicantNextProposal.set(a.id, 0);
        });

        universities.forEach(u => {
            universityAccepted.set(u.id, []);
        });

        let iterations = 0;
        const maxIterations = applicants.length * universities.length * 2;


        while (freeQueue.length > 0 && iterations < maxIterations) {
            iterations++;


            const applicantId = freeQueue.shift();

            const applicant = applicants.find(a => a.id === applicantId);
            if (!applicant) continue;

            let proposalIndex = applicantNextProposal.get(applicantId) || 0;

            if (proposalIndex >= applicant.priorities.length) {
                continue;
            }

            const universityId = applicant.priorities[proposalIndex];

            applicantNextProposal.set(applicantId, proposalIndex + 1);

            const university = universities.find(u => u.id === universityId);
            if (!university) {
                freeQueue.push(applicantId);
                continue;
            }

            const uniPrefs = prefs.universityPrefs[universityId];
            if (!uniPrefs || uniPrefs[applicantId] === undefined) {
                freeQueue.push(applicantId);
                continue;
            }

            const accepted = universityAccepted.get(universityId) || [];
            const applicantRank = uniPrefs[applicantId];


            if (accepted.length < university.capacity) {
                accepted.push(applicantId);
                accepted.sort((a, b) => uniPrefs[a] - uniPrefs[b]);
                universityAccepted.set(universityId, accepted);
            } else {
                const worstAcceptedId = accepted[accepted.length - 1];
                const worstRank = uniPrefs[worstAcceptedId];


                if (applicantRank < worstRank) {
                    console.log(`${applicantId} is better than ${worstAcceptedId}, replacing`);
                    accepted.pop();
                    accepted.push(applicantId);
                    accepted.sort((a, b) => uniPrefs[a] - uniPrefs[b]);
                    universityAccepted.set(universityId, accepted);

                    console.log(`${worstAcceptedId} is now free`);
                    freeQueue.push(worstAcceptedId);

                    console.log(`${universityId} accepted now:`, accepted.map(id => `${id}(rank=${uniPrefs[id]})`));
                } else {
                    console.log(`${applicantId} is worse than worst accepted, putting back in queue`);
                    freeQueue.push(applicantId);
                }
            }

        }

        return this.buildResult(applicants, universities, universityAccepted, prefs);
    }

    /**
     * Формирует результат в нужном формате
     * @param {Array} applicants 
     * @param {Array} universities 
     * @param {Map} universityAccepted 
     * @returns {Object}
     */
    buildResult(applicants, universities, universityAccepted, prefs) {
        const matching = [];
        const matchedApplicants = new Set();

        for (const [uniId, accepted] of universityAccepted) {
            const university = universities.find(u => u.id === uniId);
            if (!university) continue;

            accepted.forEach(applicantId => {
                const applicant = applicants.find(a => a.id === applicantId);
                if (!applicant) return;

                const priorityIndex = applicant.priorities.indexOf(uniId);

                matching.push({
                    applicant: applicantId,
                    applicant_name: applicant.name,
                    university: uniId,
                    university_name: university.name,
                    priority_index: priorityIndex
                });

                matchedApplicants.add(applicantId);
            });
        }

        const unmatched = applicants
            .filter(a => !matchedApplicants.has(a.id))
            .map(a => a.id);

        const stable = this.checkStability(matching, applicants, universities);

        return {
            matching,
            unmatched,
            stable,
            algorithm: this.name,
            statistics: this.calculateStatistics(matching, applicants, universities)
        };
    }

    /**
     * Строит матрицы предпочтений для быстрого доступа
     * @param {Array} applicants 
     * @param {Array} universities 
     * @returns {Object} - матрицы предпочтений
     */
    buildPreferenceMatrix(applicants, universities) {
        const applicantPrefs = {};
        const universityPrefs = {};

        // абитуриенты: карта предпочтений вуз -> индекс
        applicants.forEach(applicant => {
            applicantPrefs[applicant.id] = {};
            applicant.priorities.forEach((uniId, index) => {
                applicantPrefs[applicant.id][uniId] = index;
            });
        });

        // вузы: карта предпочтений абитуриент -> индекс
        universities.forEach(university => {
            universityPrefs[university.id] = {};
            university.priorities.forEach((appId, index) => {
                universityPrefs[university.id][appId] = index;
            });
        });

        return { applicantPrefs, universityPrefs };
    }

    /**
     * Проверяет стабильность паросочетания
     * @param {Array} matching 
     * @param {Array} applicants 
     * @param {Array} universities 
     * @returns {boolean}
     */
    checkStability(matching, applicants, universities) {
        const applicantMatch = {};
        const universityMatches = {};

        matching.forEach(m => {
            applicantMatch[m.applicant] = m.university;
            if (!universityMatches[m.university]) {
                universityMatches[m.university] = [];
            }
            universityMatches[m.university].push(m.applicant);
        });

        for (const applicant of applicants) {
            const currentUni = applicantMatch[applicant.id];
            if (!currentUni) continue; // Не распределен

            for (const preferredUni of applicant.priorities) {
                if (preferredUni === currentUni) break;

                const university = universities.find(u => u.id === preferredUni);
                if (!university) continue;

                const accepted = universityMatches[preferredUni] || [];

                for (const acceptedId of accepted) {
                    const uniPrefs = university.priorities;
                    if (uniPrefs.indexOf(applicant.id) < uniPrefs.indexOf(acceptedId)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Находит блокирующие пары (для тестирования)
     * @param {Array} matching 
     * @param {Array} applicants 
     * @param {Array} universities 
     * @returns {Array}
     */
    findBlockingPairs(matching, applicants, universities) {
        const blockingPairs = [];
        const applicantMatch = {};

        matching.forEach(m => {
            applicantMatch[m.applicant] = m.university;
        });

        for (const applicant of applicants) {
            const currentUni = applicantMatch[applicant.id];
            if (!currentUni) continue;

            for (const preferredUni of applicant.priorities) {
                if (preferredUni === currentUni) break;

                const university = universities.find(u => u.id === preferredUni);
                if (!university) continue;

                const accepted = matching
                    .filter(m => m.university === preferredUni)
                    .map(m => m.applicant);

                for (const acceptedId of accepted) {
                    if (university.priorities.indexOf(applicant.id) <
                        university.priorities.indexOf(acceptedId)) {
                        blockingPairs.push({
                            applicant: applicant.id,
                            university: preferredUni,
                            displaced: acceptedId
                        });
                    }
                }
            }
        }

        return blockingPairs;
    }

    /**
     * Рассчитывает статистику
     * @param {Array} matching 
     * @param {Array} applicants 
     * @param {Array} universities 
     * @returns {Object}
     */
    calculateStatistics(matching, applicants, universities) {
        const totalApplicants = applicants.length;
        const totalPlaces = universities.reduce((sum, u) => sum + u.capacity, 0);
        const matchedCount = matching.length;

        // Средний приоритет
        const avgPriority = matching.reduce((sum, m) => sum + m.priority_index, 0) / matchedCount || 0;

        return {
            total_applicants: totalApplicants,
            total_places: totalPlaces,
            matched_count: matchedCount,
            matched_percentage: ((matchedCount / totalApplicants) * 100).toFixed(2),
            average_priority: avgPriority.toFixed(2)
        };
    }
}

module.exports = GaleShapleyMatrix;
