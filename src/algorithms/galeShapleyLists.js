class GaleShapleyLists {
    constructor() {
        this.name = 'Gale-Shapley (Lists)';
    }

    match(applicants, universities) {
        if (!applicants.length || !universities.length) {
            return this.buildEmptyResult(applicants);
        }

        const applicantsMap = new Map(applicants.map(a => [a.id, a]));
        const universitiesMap = new Map(universities.map(u => [u.id, u]));

        const freeApplicants = new Set(applicants.map(a => a.id));
        const universityAccepted = new Map(); // вуз -> [принятые абитуриенты]
        const applicantNextProposal = new Map(); // абитуриент -> индекс следующего вуза

        universities.forEach(u => {
            universityAccepted.set(u.id, []);
        });

        applicants.forEach(a => {
            applicantNextProposal.set(a.id, 0);
        });

        let iterations = 0;
        const maxIterations = applicants.length * universities.length * 2;

        while (freeApplicants.size > 0 && iterations < maxIterations) {
            iterations++;

            const applicantId = Array.from(freeApplicants)[0];
            const applicant = applicantsMap.get(applicantId);

            let proposalIndex = applicantNextProposal.get(applicantId) || 0;

            if (proposalIndex >= applicant.priorities.length) {
                freeApplicants.delete(applicantId);
                continue;
            }

            const universityId = applicant.priorities[proposalIndex];
            applicantNextProposal.set(applicantId, proposalIndex + 1);

            const university = universitiesMap.get(universityId);
            if (!university) continue;

            const universityPrefIndex = university.priorities.indexOf(applicantId);
            if (universityPrefIndex === -1) {
                continue;
            }

            const accepted = universityAccepted.get(universityId) || [];

            if (accepted.length < university.capacity) {
                accepted.push(applicantId);
                accepted.sort((a, b) =>
                    university.priorities.indexOf(a) - university.priorities.indexOf(b)
                );
                universityAccepted.set(universityId, accepted);
                freeApplicants.delete(applicantId);
            } else {
                const worstAcceptedId = accepted[accepted.length - 1];
                const worstRank = university.priorities.indexOf(worstAcceptedId);

                if (universityPrefIndex < worstRank) {
                    accepted.pop();
                    accepted.push(applicantId);
                    accepted.sort((a, b) =>
                        university.priorities.indexOf(a) - university.priorities.indexOf(b)
                    );
                    universityAccepted.set(universityId, accepted);

                    freeApplicants.delete(applicantId);
                    freeApplicants.add(worstAcceptedId);
                }
            }
        }

        return this.buildResult(applicants, universities, universityAccepted);
    }

    buildEmptyResult(applicants) {
        return {
            matching: [],
            unmatched: applicants.map(a => a.id),
            stable: true,
            algorithm: this.name,
            statistics: {
                total_applicants: applicants.length,
                total_places: 0,
                matched_count: 0,
                matched_percentage: "0.00",
                average_priority: "0.00"
            }
        };
    }

    buildResult(applicants, universities, universityAccepted) {
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
            if (!currentUni) continue;

            for (const preferredUni of applicant.priorities) {
                if (preferredUni === currentUni) break;

                const university = universities.find(u => u.id === preferredUni);
                if (!university) continue;

                const accepted = universityMatches[preferredUni] || [];

                for (const acceptedId of accepted) {
                    if (university.priorities.indexOf(applicant.id) <
                        university.priorities.indexOf(acceptedId)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    calculateStatistics(matching, applicants, universities) {
        const totalApplicants = applicants.length;
        const totalPlaces = universities.reduce((sum, u) => sum + u.capacity, 0);
        const matchedCount = matching.length;

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

module.exports = GaleShapleyLists;