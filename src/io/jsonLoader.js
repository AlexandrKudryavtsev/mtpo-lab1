const fs = require('fs');
const path = require('path');
const Applicant = require('../models/Applicant');
const University = require('../models/University');

class JsonLoader {
    /**
     * Загружает данные из JSON файла
     * @param {string} filePath - путь к файлу
     * @returns {Promise<Object>} - загруженные данные
     */
    async loadFromFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        reject(new Error(`Файл не найден: ${filePath}`));
                    } else {
                        reject(new Error(`Ошибка чтения файла: ${err.message}`));
                    }
                    return;
                }


                try {
                    const jsonData = JSON.parse(data);
                    this.validateData(jsonData);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(new Error(`Ошибка парсинга JSON: ${parseErr.message}`));
                }
            });
        });
    }

    /**
     * Загружает большие файлы с использованием потока
     * @param {string} filePath - путь к файлу
     * @returns {Promise<Object>} - загруженные данные
     */
    async loadLargeFile(filePath) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, 'utf8');
            let data = '';

            stream.on('data', chunk => {
                data += chunk;
            });

            stream.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    this.validateData(jsonData);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(new Error(`Ошибка парсинга JSON: ${parseErr.message}`));
                }
            });

            stream.on('error', err => {
                reject(new Error(`Ошибка чтения файла: ${err.message}`));
            });
        });
    }

    /**
     * Валидация структуры данных
     * @param {Object} data - данные для валидации
     * @throws {Error} - если данные некорректны
     */
    validateData(data) {
        if (!data.applicants || !Array.isArray(data.applicants)) {
            throw new Error('Отсутствует массив абитуриентов');
        }

        if (!data.universities || !Array.isArray(data.universities)) {
            throw new Error('Отсутствует массив вузов');
        }

        data.applicants.forEach(applicant => {
            if (!applicant.id) {
                throw new Error('Абитуриент: отсутствует поле id');
            }
            if (!applicant.name) {
                throw new Error(`Абитуриент ${applicant.id}: отсутствует поле name`);
            }
            if (typeof applicant.scores !== 'number') {
                throw new Error(`Абитуриент ${applicant.id}: отсутствует поле scores или оно не число`);
            }
            if (!Array.isArray(applicant.priorities)) {
                throw new Error(`Абитуриент ${applicant.id}: отсутствует поле priorities или это не массив`);
            }
        });

        data.universities.forEach(university => {
            if (!university.id) {
                throw new Error('Вуз: отсутствует поле id');
            }
            if (!university.name) {
                throw new Error(`Вуз ${university.id}: отсутствует поле name`);
            }
            if (typeof university.capacity !== 'number' || university.capacity <= 0) {
                throw new Error(`Вуз ${university.id}: отсутствует поле capacity или оно не положительное число`);
            }
            if (!Array.isArray(university.priorities)) {
                throw new Error(`Вуз ${university.id}: отсутствует поле priorities или это не массив`);
            }
        });

        const applicantIds = new Set(data.applicants.map(a => a.id));
        const universityIds = new Set(data.universities.map(u => u.id));

        data.applicants.forEach(applicant => {
            applicant.priorities.forEach(uniId => {
                if (!universityIds.has(uniId)) {
                    throw new Error(`Абитуриент ${applicant.id}: в приоритетах указан несуществующий вуз ${uniId}`);
                }
            });
        });

        data.universities.forEach(university => {
            university.priorities.forEach(appId => {
                if (!applicantIds.has(appId)) {
                    throw new Error(`Вуз ${university.id}: в приоритетах указан несуществующий абитуриент ${appId}`);
                }
            });
        });
    }

    /**
     * Преобразует JSON данные в модели
     * @param {Object} data - данные для преобразования
     * @returns {Object} - объект с массивами моделей
     */
    parseToModels(data) {
        const applicants = data.applicants.map(appData =>
            Applicant.fromJSON(appData)
        );

        const universities = data.universities.map(uniData =>
            University.fromJSON(uniData)
        );

        return { applicants, universities };
    }

    /**
     * Сохраняет данные в JSON файл
     * @param {string} filePath - путь к файлу
     * @param {Object} data - данные для сохранения
     * @returns {Promise<void>}
     */
    async saveToFile(filePath, data) {
        return new Promise((resolve, reject) => {
            const jsonData = JSON.stringify(data, null, 2);

            fs.writeFile(filePath, jsonData, 'utf8', (err) => {
                if (err) {
                    reject(new Error(`Ошибка сохранения файла: ${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = JsonLoader;
