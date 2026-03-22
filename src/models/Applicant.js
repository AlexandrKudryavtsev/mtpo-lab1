class Applicant {
    /**
     * @param {string} id - Уникальный идентификатор
     * @param {string} name - ФИО абитуриента
     * @param {number} scores - Суммарный балл ЕГЭ
     * @param {string[]} priorities - Массив ID вузов в порядке приоритета
     */
    constructor(id, name, scores, priorities) {
        this.validateInput(id, name, scores, priorities);

        this.id = id;
        this.name = name;
        this.scores = scores;
        this.priorities = [...priorities];
    }

    /**
     * Валидация входных данных
     */
    validateInput(id, name, scores, priorities) {
        if (!id || id.trim() === '') {
            throw new Error('ID абитуриента не может быть пустым');
        }

        if (!name || name.trim() === '') {
            throw new Error('Имя абитуриента не может быть пустым');
        }

        if (typeof scores !== 'number' || scores < 0) {
            throw new Error('Баллы не могут быть отрицательными');
        }

        if (!Array.isArray(priorities) || priorities.length === 0) {
            throw new Error('Список приоритетов не может быть пустым');
        }

        // Проверка на дубликаты
        const uniquePriorities = new Set(priorities);
        if (uniquePriorities.size !== priorities.length) {
            throw new Error('Приоритеты не могут содержать дубликаты');
        }
    }

    /**
     * Получить индекс приоритета для вуза (0 - высший приоритет)
     * @param {string} universityId
     * @returns {number} - индекс или -1, если вуз не в списке
     */
    getPriorityIndex(universityId) {
        return this.priorities.indexOf(universityId);
    }

    /**
     * Проверить, указан ли вуз в приоритетах
     * @param {string} universityId
     * @returns {boolean}
     */
    hasUniversity(universityId) {
        return this.priorities.includes(universityId);
    }

    /**
     * Сериализация в JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            scores: this.scores,
            priorities: [...this.priorities]
        };
    }

    /**
     * Создать экземпляр из JSON
     * @param {Object} data
     * @returns {Applicant}
     */
    static fromJSON(data) {
        return new Applicant(
            data.id,
            data.name,
            data.scores,
            data.priorities
        );
    }

    /**
     * выход за границы массива
     * @param {number} index 
     * @returns {string}
     */
    getPriorityByIndex(index) {
        // нет проверки на выход за границы массива
        return this.priorities[index];
    }
}

module.exports = Applicant;