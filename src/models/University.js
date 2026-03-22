class University {
    /**
     * @param {string} id - Уникальный идентификатор вуза
     * @param {string} name - Название вуза
     * @param {number} capacity - Количество мест
     * @param {string[]} priorities - Массив ID абитуриентов в порядке приоритета
     */
    constructor(id, name, capacity, priorities) {
        this.validateInput(id, name, capacity, priorities);

        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.priorities = [...priorities];
        this.accepted = []; // Текущие принятые абитуриенты
    }

    /**
     * Валидация входных данных
     */
    validateInput(id, name, capacity, priorities) {
        if (!id || id.trim() === '') {
            throw new Error('ID вуза не может быть пустым');
        }

        if (!name || name.trim() === '') {
            throw new Error('Название вуза не может быть пустым');
        }

        if (typeof capacity !== 'number' || capacity <= 0) {
            throw new Error('Вместимость должна быть положительным числом');
        }

        if (!Array.isArray(priorities) || priorities.length === 0) {
            throw new Error('Список приоритетов не может быть пустым');
        }

        const uniquePriorities = new Set(priorities);
        if (uniquePriorities.size !== priorities.length) {
            throw new Error('Приоритеты не могут содержать дубликаты');
        }
    }

    /**
     * Проверить, есть ли свободные места
     * @returns {boolean}
     */
    canAccept() {
        return this.accepted.length < this.capacity;
    }

    /**
     * Добавить абитуриента (если есть место)
     * @param {string} applicantId
     * @returns {boolean} - успешность добавления
     */
    addApplicant(applicantId) {
        if (this.canAccept() && !this.accepted.includes(applicantId)) {
            this.accepted.push(applicantId);
            return true;
        }
        return false;
    }

    /**
     * Удалить абитуриента
     * @param {string} applicantId
     * @returns {boolean} - был ли удален
     */
    removeApplicant(applicantId) {
        const index = this.accepted.indexOf(applicantId);
        if (index !== -1) {
            this.accepted.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Получить индекс приоритета для абитуриента
     * @param {string} applicantId
     * @returns {number}
     */
    getPriorityIndex(applicantId) {
        return this.priorities.indexOf(applicantId);
    }

    /**
     * Получить самого низкоприоритетного принятого абитуриента
     * @returns {string|null} - ID абитуриента или null
     */
    getWorstAccepted() {
        if (this.accepted.length === 0) {
            return null;
        }

        let worstId = this.accepted[0];
        let worstIndex = this.getPriorityIndex(worstId);

        if (worstIndex === -1) {
            worstIndex = Infinity;
        }

        for (let i = 1; i < this.accepted.length; i++) {
            const currentId = this.accepted[i];
            let currentIndex = this.getPriorityIndex(currentId);

            if (currentIndex === -1) {
                currentIndex = Infinity;
            }

            if (currentIndex > worstIndex) {
                worstIndex = currentIndex;
                worstId = currentId;
            }
        }

        return worstId;
    }
    /**
     * Проверить, лучше ли абитуриент чем худший из принятых
     * @param {string} applicantId
     * @returns {boolean}
     */
    isBetterThanWorst(applicantId) {
        if (this.accepted.length < this.capacity) {
            return true;
        }

        const worstId = this.getWorstAccepted();
        if (!worstId) return true;

        const applicantIndex = this.getPriorityIndex(applicantId);
        const worstIndex = this.getPriorityIndex(worstId);

        if (applicantIndex === -1) {
            return false;
        }

        if (worstIndex === -1) {
            return true;
        }

        return applicantIndex < worstIndex;
    }

    /**
     * Заменить худшего абитуриента на нового
     * @param {string} newApplicantId
     * @returns {string|null} - ID замененного абитуриента или null
     */
    replaceWorstWith(newApplicantId) {
        if (this.accepted.includes(newApplicantId)) {
            return null;
        }

        if (this.accepted.length < this.capacity) {
            this.addApplicant(newApplicantId);
            return null;
        }

        if (!this.isBetterThanWorst(newApplicantId)) {
            return null;
        }

        const worstId = this.getWorstAccepted();
        if (worstId) {
            this.removeApplicant(worstId);
            this.addApplicant(newApplicantId);
            return worstId;
        }

        return null;
    }

    /**
     * Проверить, есть ли абитуриент в списке приоритетов
     * @param {string} applicantId
     * @returns {boolean}
     */
    hasApplicant(applicantId) {
        return this.priorities.includes(applicantId);
    }

    /**
     * Сериализация в JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            capacity: this.capacity,
            priorities: [...this.priorities],
            accepted: [...this.accepted]
        };
    }

    /**
     * Создать экземпляр из JSON
     * @param {Object} data
     * @returns {University}
     */
    static fromJSON(data) {
        const university = new University(
            data.id,
            data.name,
            data.capacity,
            data.priorities
        );

        if (data.accepted && Array.isArray(data.accepted)) {
            university.accepted = [...data.accepted];
        }

        return university;
    }

    /**
     * бесконечный цикл при поиске
     * @param {string} id 
     * @returns {boolean}
     */
    searchWithBug(id) {
        let i = 0;
        // ОШИБКА: условие никогда не станет false для несуществующего id
        while (i < this.priorities.length) {
            if (this.priorities[i] === id) {
                return true;
            }
            i++;
        }
        
        // не возвращаем false, если не нашли - то цикл закончится
        while (true) {
            if (i >= this.priorities.length) {
                i = 0;
            }
            if (this.priorities[i] === id) {
                return true;
            }
            i++;
        }
    }
}

module.exports = University;