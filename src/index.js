#!/usr/bin/env node

const GaleShapleyMatrix = require('./algorithms/galeShapleyMatrix');
const GaleShapleyLists = require('./algorithms/galeShapleyLists');
const JsonLoader = require('./io/jsonLoader');
const ConsoleIO = require('./io/consoleIO');
const Statistics = require('./utils/statistics');
const Applicant = require('./models/Applicant');
const University = require('./models/University');

class UniversityAdmissionApp {
    constructor() {
        this.io = new ConsoleIO();
        this.jsonLoader = new JsonLoader();
        this.matrixAlgorithm = new GaleShapleyMatrix();
        this.listsAlgorithm = new GaleShapleyLists();
        this.statistics = new Statistics();

        this.applicants = [];
        this.universities = [];
        this.lastResult = null;
    }

    async start() {
        let running = true;

        while (running) {
            this.io.showMainMenu();
            const choice = await this.io.question('\nВыберите пункт меню: ');

            switch (choice) {
                case '1':
                    await this.loadFromFile();
                    break;
                case '2':
                    await this.inputManual();
                    break;
                case '3':
                    this.showCurrentData();
                    break;
                case '4':
                    await this.runMatrixAlgorithm();
                    break;
                case '5':
                    await this.runListsAlgorithm();
                    break;
                case '6':
                    await this.compareAlgorithms();
                    break;
                case '7':
                    await this.showStatistics();
                    break;
                case '8':
                    await this.saveResults();
                    break;
                case '9':
                    this.io.showHelp();
                    await this.io.question('\nНажмите Enter для продолжения...');
                    break;
                case '0':
                    running = false;
                    console.log('\nДо свидания!');
                    break;
                default:
                    console.log('\nНеверный выбор. Попробуйте снова.');
                    await this.io.question('Нажмите Enter для продолжения...');
            }
        }

        this.io.close();
    }

    async loadFromFile() {
        try {
            const filename = await this.io.question('\Введите имя файла (например, data.json): ');

            console.log('Загрузка данных...');
            const data = await this.jsonLoader.loadFromFile(filename);

            this.jsonLoader.validateData(data);

            const models = this.jsonLoader.parseToModels(data);
            this.applicants = models.applicants;
            this.universities = models.universities;

            console.log('Данные успешно загружены!');
            this.io.showCurrentData(this.applicants, this.universities);
        } catch (error) {
            console.error(`\nОшибка: ${error.message}`);
        }

        await this.io.question('\nНажмите Enter для продолжения...');
    }


    async inputManual() {
        try {
            const data = await this.io.inputManualData();

            this.applicants = data.applicants.map(a =>
                new Applicant(a.id, a.name, a.scores, a.priorities)
            );

            this.universities = data.universities.map(u =>
                new University(u.id, u.name, u.capacity, u.priorities)
            );

            console.log('\nДанные успешно введены!');
            this.io.showCurrentData(this.applicants, this.universities);
        } catch (error) {
            console.error(`\nОшибка: ${error.message}`);
        }

        await this.io.question('\nНажмите Enter для продолжения...');
    }

    showCurrentData() {
        this.io.showCurrentData(this.applicants, this.universities);

        if (this.lastResult) {
            console.log('\nПоследний результат:');
            console.log(`  Алгоритм: ${this.lastResult.algorithm}`);
            console.log(`  Распределено: ${this.lastResult.matching.length} абитуриентов`);
        }

        this.io.question('\nНажмите Enter для продолжения...');
    }


    async runMatrixAlgorithm() {
        if (!this.validateData()) return;

        console.log('\nЗапуск матричного алгоритма Гейла-Шепли...');

        const result = this.matrixAlgorithm.match(this.applicants, this.universities);
        this.lastResult = result;

        this.io.showMatchingResults(result);

        await this.io.question('\nНажмите Enter для продолжения...');
    }

    async runListsAlgorithm() {
        if (!this.validateData()) return;

        console.log('\nЗапуск спискового алгоритма Гейла-Шепли...');

        const result = this.listsAlgorithm.match(this.applicants, this.universities);
        this.lastResult = result;

        this.io.showMatchingResults(result);

        await this.io.question('\nНажмите Enter для продолжения...');
    }

    async compareAlgorithms() {
        if (!this.validateData()) return;

        console.log('\nЗапуск обоих алгоритмов для сравнения...');

        const matrixResult = this.matrixAlgorithm.match(this.applicants, this.universities);
        const listsResult = this.listsAlgorithm.match(this.applicants, this.universities);

        const comparison = this.statistics.compareAlgorithms(matrixResult, listsResult);

        this.io.showComparison(comparison);

        await this.io.question('\nНажмите Enter для продолжения...');
    }

    async showStatistics() {
        if (!this.validateData()) return;

        if (!this.lastResult) {
            console.log('\nСначала запустите алгоритм (пункты 4 или 5)');
            await this.io.question('\nНажмите Enter для продолжения...');
            return;
        }

        const stats = {
            ...this.lastResult.statistics,
            per_university: this.statistics.calculateUniversityStats(
                this.lastResult.matching,
                this.applicants,
                this.universities
            )
        };

        const applicantStats = this.statistics.calculateApplicantStats(
            this.lastResult.matching,
            this.applicants,
            this.universities
        );

        const recommendations = this.statistics.generateRecommendations(
            this.lastResult.matching,
            this.applicants,
            this.universities,
            applicantStats
        );

        const competition = this.statistics.calculateCompetition(
            this.applicants,
            this.universities
        );

        const tips = this.statistics.generateUniversityTips(
            this.universities,
            competition
        );

        this.io.showStatisticsAndRecommendations(
            this.lastResult.matching,
            this.applicants,
            this.universities,
            stats,
            recommendations,
            tips
        );

        await this.io.question('\nНажмите Enter для продолжения...');
    }

    async saveResults() {
        if (!this.lastResult) {
            console.log('\nНет результатов для сохранения. Сначала запустите алгоритм.');
            await this.io.question('\nНажмите Enter для продолжения...');
            return;
        }

        try {
            const filename = await this.io.question('\nВведите имя файла для сохранения: ');

            const dataToSave = {
                timestamp: new Date().toISOString(),
                algorithm: this.lastResult.algorithm,
                matching: this.lastResult.matching,
                unmatched: this.lastResult.unmatched,
                statistics: this.lastResult.statistics,
                input_data: {
                    applicants: this.applicants.map(a => a.toJSON()),
                    universities: this.universities.map(u => u.toJSON())
                }
            };

            await this.jsonLoader.saveToFile(filename, dataToSave);
            console.log(`\nРезультаты сохранены в файл ${filename}`);
        } catch (error) {
            console.error(`\nОшибка при сохранении: ${error.message}`);
        }

        await this.io.question('\nНажмите Enter для продолжения...');
    }


    validateData() {
        if (this.applicants.length === 0) {
            console.log('\nНет данных об абитуриентах. Сначала загрузите данные.');
            return false;
        }

        if (this.universities.length === 0) {
            console.log('\nНет данных о вузах. Сначала загрузите данные.');
            return false;
        }

        return true;
    }
}

if (require.main === module) {
    const app = new UniversityAdmissionApp();
    app.start().catch(console.error);
}

module.exports = UniversityAdmissionApp;
