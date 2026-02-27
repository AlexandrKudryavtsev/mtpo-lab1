const readline = require('readline');

class ConsoleIO {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    showMainMenu() {
        console.clear();
        console.log('╔════════════════════════════════════════╗');
        console.log('║  СИСТЕМА РАСПРЕДЕЛЕНИЯ АБИТУРИЕНТОВ    ║');
        console.log('║        (алгоритм Гейла-Шепли)          ║');
        console.log('╠════════════════════════════════════════╣');
        console.log('║ 1. Загрузить данные из JSON файла      ║');
        console.log('║ 2. Ввести данные вручную               ║');
        console.log('║ 3. Просмотреть текущие данные          ║');
        console.log('║ 4. Запустить алгоритм (матрица)        ║');
        console.log('║ 5. Запустить алгоритм (списки)         ║');
        console.log('║ 6. Сравнить результаты алгоритмов      ║');
        console.log('║ 7. Показать статистику и рекомендации  ║');
        console.log('║ 8. Сохранить результаты в JSON         ║');
        console.log('║ 9. Справка                             ║');
        console.log('║ 0. Выход                               ║');
        console.log('╚════════════════════════════════════════╝');
    }

    showHelp() {
        console.log('\nСПРАВКА ПО СИСТЕМЕ');
        console.log('═══════════════════════');
        console.log('\nОБ АЛГОРИТМЕ:');
        console.log('Алгоритм Гейла-Шепли (Gale-Shapley) решает задачу стабильного паросочетания.');
        console.log('В нашем случае - распределение абитуриентов по вузам на основе предпочтений.');
        console.log('\nФОРМАТ ВХОДНЫХ ДАННЫХ:');
        console.log('JSON файл должен содержать два массива: "applicants" и "universities"');
        console.log('\nПример абитуриента:');
        console.log('{');
        console.log('  "id": "A1",');
        console.log('  "name": "Иван Петров",');
        console.log('  "scores": 285,');
        console.log('  "priorities": ["U1", "U2", "U3"]');
        console.log('}');
        console.log('\nПример вуза:');
        console.log('{');
        console.log('  "id": "U1",');
        console.log('  "name": "МГУ",');
        console.log('  "capacity": 2,');
        console.log('  "priorities": ["A1", "A2", "A3"]');
        console.log('}');
        console.log('\nРЕКОМЕНДАЦИИ:');
        console.log('• Убедитесь, что все ID уникальны');
        console.log('• Приоритеты должны указывать на существующие ID');
        console.log('• Баллы абитуриентов должны быть положительными числами');
        console.log('• Вместимость вузов должна быть положительной');
    }


    showCurrentData(applicants, universities) {
        console.log('\nТЕКУЩИЕ ДАННЫЕ');
        console.log('══════════════════');

        console.log(`\nАбитуриенты (${applicants.length}):`);
        if (applicants.length === 0) {
            console.log('  Нет данных');
        } else {
            applicants.forEach(app => {
                console.log(`  ${app.id}: ${app.name} (баллы: ${app.scores})`);
                console.log(`     Приоритеты: ${app.priorities.join(' → ')}`);
            });
        }

        console.log(`\n  Вузы (${universities.length}):`);
        if (universities.length === 0) {
            console.log('  Нет данных');
        } else {
            universities.forEach(uni => {
                console.log(`  ${uni.id}: ${uni.name} (мест: ${uni.capacity})`);
                console.log(`     Приоритеты: ${uni.priorities.join(' → ')}`);
            });
        }
    }

    showMatchingResults(result) {
        console.log('\n🎯 РЕЗУЛЬТАТЫ РАСПРЕДЕЛЕНИЯ');
        console.log('═══════════════════════════');
        console.log(`Алгоритм: ${result.algorithm}`);
        console.log(`Стабильность: ${result.stable ? 'Да' : 'Нет'}`);

        console.log('\n📋 Распределение:');
        if (result.matching.length === 0) {
            console.log('  Нет распределенных абитуриентов');
        } else {
            result.matching.forEach(m => {
                const priorityText = m.priority_index === 0 ? '(первый приоритет)' :
                    `${m.priority_index + 1}-й приоритет`;
                console.log(`  ${m.applicant_name} → ${m.university_name} ${priorityText}`);
            });
        }

        if (result.unmatched.length > 0) {
            console.log('\nНераспределенные абитуриенты:');
            result.unmatched.forEach(id => {
                console.log(`  ${id}`);
            });
        }

        console.log('\n📊 Статистика:');
        console.log(`  Всего абитуриентов: ${result.statistics.total_applicants}`);
        console.log(`  Всего мест: ${result.statistics.total_places}`);
        console.log(`  Распределено: ${result.statistics.matched_count} (${result.statistics.matched_percentage}%)`);
        console.log(`  Средний приоритет: ${result.statistics.average_priority}`);
    }

    showComparison(comparison) {
        console.log('\n  СРАВНЕНИЕ АЛГОРИТМОВ');
        console.log('══════════════════════════');

        console.log('\n Матричная версия:');
        console.log(`  Распределено: ${comparison.matrix.matched}`);
        console.log(`  Нераспределено: ${comparison.matrix.unmatched}`);
        console.log(`  Средний приоритет: ${comparison.matrix.avgPriority}`);

        console.log('\n Списковая версия:');
        console.log(`  Распределено: ${comparison.lists.matched}`);
        console.log(`  Нераспределено: ${comparison.lists.unmatched}`);
        console.log(`  Средний приоритет: ${comparison.lists.avgPriority}`);

        if (comparison.same_matching) {
            console.log('\n Результаты полностью совпадают');
        } else {
            console.log('\n  Результаты различаются:');
            if (comparison.differences) {
                if (comparison.differences.only_in_first.length > 0) {
                    console.log('  Только в матричной версии:',
                        comparison.differences.only_in_first.map(d => `${d.applicant}→${d.university}`).join(', '));
                }
                if (comparison.differences.only_in_second.length > 0) {
                    console.log('  Только в списковой версии:',
                        comparison.differences.only_in_second.map(d => `${d.applicant}→${d.university}`).join(', '));
                }
            }
        }
    }

    /**
     * Показать статистику и рекомендации
     */
    showStatisticsAndRecommendations(matching, applicants, universities, stats, recommendations, tips) {
        console.log('\n ДЕТАЛЬНАЯ СТАТИСТИКА');
        console.log('═══════════════════════');

        console.log('\n Общая статистика:');
        console.log(`  Всего абитуриентов: ${stats.total_applicants}`);
        console.log(`  Всего мест: ${stats.total_places}`);
        console.log(`  Распределено: ${stats.matched_count} (${stats.matched_percentage}%)`);
        console.log(`  Конкурс: ${stats.competition} чел/место`);
        console.log(`  Получили первый приоритет: ${stats.satisfied_first_choice} (${stats.satisfied_first_choice_percentage}%)`);
        console.log(`  Средний приоритет: ${stats.average_priority}`);

        console.log('\n  Статистика по вузам:');
        Object.values(stats.per_university).forEach(uni => {
            console.log(`  ${uni.name}:`);
            console.log(`    Заполнено: ${uni.filled}/${uni.capacity}`);
            console.log(`    Средний балл: ${uni.average_applicant_score}`);
            console.log(`    Диапазон баллов: ${uni.min_score} - ${uni.max_score}`);
        });

        console.log('\n РЕКОМЕНДАЦИИ');
        console.log('════════════════');

        if (recommendations.length > 0) {
            recommendations.forEach(rec => {
                console.log(`  ${rec.message}`);
            });
        } else {
            console.log('  Нет рекомендаций');
        }

        console.log('\n СОВЕТЫ ПО ВУЗАМ');
        console.log('══════════════════');

        if (tips.length > 0) {
            tips.forEach(tip => {
                console.log(`  ${tip.message}`);
            });
        } else {
            console.log('  Нет советов');
        }
    }

    async inputManualData() {
        const applicants = [];
        const universities = [];

        console.log('\nВВОД ДАННЫХ ВРУЧНУЮ');
        console.log('══════════════════════');

        const appCount = parseInt(await this.question('\nСколько абитуриентов? '));

        for (let i = 0; i < appCount; i++) {
            console.log(`\n--- Абитуриент ${i + 1} ---`);
            const id = await this.question('ID (например, A1): ');
            const name = await this.question('ФИО: ');
            const scores = parseInt(await this.question('Баллы ЕГЭ: '));

            const priorities = [];
            const uniCount = parseInt(await this.question('Сколько вузов в приоритетах? '));

            for (let j = 0; j < uniCount; j++) {
                const uniId = await this.question(`  Приоритет ${j + 1} (ID вуза): `);
                priorities.push(uniId);
            }

            applicants.push({ id, name, scores, priorities });
        }

        const uniCount = parseInt(await this.question('\nСколько вузов? '));

        for (let i = 0; i < uniCount; i++) {
            console.log(`\n--- Вуз ${i + 1} ---`);
            const id = await this.question('ID (например, U1): ');
            const name = await this.question('Название: ');
            const capacity = parseInt(await this.question('Количество мест: '));

            const priorities = [];
            const appCount = parseInt(await this.question('Сколько абитуриентов в приоритетах? '));

            for (let j = 0; j < appCount; j++) {
                const appId = await this.question(`  Приоритет ${j + 1} (ID абитуриента): `);
                priorities.push(appId);
            }

            universities.push({ id, name, capacity, priorities });
        }

        return { applicants, universities };
    }

    /**
     * Закрыть интерфейс
     */
    close() {
        this.rl.close();
    }
}

module.exports = ConsoleIO;
