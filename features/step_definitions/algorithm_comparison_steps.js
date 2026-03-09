const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');

const Applicant = require('../../src/models/Applicant');
const University = require('../../src/models/University');
const GaleShapleyMatrix = require('../../src/algorithms/galeShapleyMatrix');
const GaleShapleyLists = require('../../src/algorithms/galeShapleyLists');
const JsonLoader = require('../../src/io/jsonLoader');

let matrixAlgorithm = new GaleShapleyMatrix();
let listsAlgorithm = new GaleShapleyLists();
let jsonLoader = new JsonLoader();

let applicants = [];
let universities = [];
let matrixResult = null;
let listsResult = null;
let matrixTime = 0;
let listsTime = 0;
let matrixMemory = 0;
let listsMemory = 0;

const performanceResults = [];

function generateTestData(applicantCount, universityCount) {
  const applicants = [];
  const universities = [];
  
  for (let i = 1; i <= universityCount; i++) {
    const uniId = `U${i}`;
    const priorities = [];
    
    for (let j = 1; j <= applicantCount; j++) {
      priorities.push(`A${j}`);
    }
    
    priorities.sort(() => Math.random() - 0.5);
    
    universities.push(new University(
      uniId,
      `University ${i}`,
      Math.floor(applicantCount / universityCount) + 1,
      priorities
    ));
  }
  
  for (let i = 1; i <= applicantCount; i++) {
    const appId = `A${i}`;
    const priorities = [];
    
    for (let j = 1; j <= universityCount; j++) {
      priorities.push(`U${j}`);
    }
    
    priorities.sort(() => Math.random() - 0.5);
    
    applicants.push(new Applicant(
      appId,
      `Applicant ${i}`,
      Math.floor(Math.random() * 100) + 200,
      priorities
    ));
  }
  
  return { applicants, universities };
}

Given('загружены данные из файла {string} для сравнения', async function(filename) {
  try {
    const filePath = path.join(process.cwd(), filename);
    const data = await jsonLoader.loadFromFile(filePath);
    
    applicants = data.applicants.map(a => 
      new Applicant(a.id, a.name, a.scores, a.priorities)
    );
    
    universities = data.universities.map(u => 
      new University(u.id, u.name, u.capacity, u.priorities)
    );
    
    console.log(`Загружено ${applicants.length} абитуриентов и ${universities.length} вузов`);
  } catch (error) {
    throw new Error(`Ошибка загрузки файла: ${error.message}`);
  }
});

Given('созданы тестовые данные с {int} абитуриентами и {int} вузами', function(applicantCount, universityCount) {
  const data = generateTestData(applicantCount, universityCount);
  applicants = data.applicants;
  universities = data.universities;
  
  console.log(`Сгенерировано ${applicants.length} абитуриентов и ${universities.length} вузов`);
  this.currentSize = applicantCount;
});

Given('все тесты производительности выполнены', function() {
  assert.ok(performanceResults.length > 0, 'Должны быть результаты тестов');
});

When('запускаю матричный алгоритм с профилированием', function() {
  const startTime = Date.now();

  // Замер памяти до
  global.gc?.();
  const startMemory = process.memoryUsage().heapUsed;
  
  matrixResult = matrixAlgorithm.match(applicants, universities);

  // Замер памяти после
  const endMemory = process.memoryUsage().heapUsed;
  matrixTime = Date.now() - startTime;
  matrixMemory = (endMemory - startMemory) / 1024 / 1024; // в MB
  
  console.log(`Матричный алгоритм: ${matrixTime}ms, память: ${matrixMemory.toFixed(2)}MB, распределено ${matrixResult.matching.length} абитуриентов`);
});

When('запускаю списковый алгоритм с профилированием', function() {
  const startTime = Date.now();
  
  // Замер памяти до
  global.gc?.();
  const startMemory = process.memoryUsage().heapUsed;
  
  listsResult = listsAlgorithm.match(applicants, universities);
  
  // Замер памяти после
  const endMemory = process.memoryUsage().heapUsed;
  listsTime = Date.now() - startTime;
  listsMemory = (endMemory - startMemory) / 1024 / 1024; // в MB
  
  console.log(`Списковый алгоритм: ${listsTime}ms, память: ${listsMemory.toFixed(2)}MB, распределено ${listsResult.matching.length} абитуриентов`);
});

Then('оба алгоритма должны найти одинаковое паросочетание', function() {
  const sortMatching = (matching) => {
    return [...matching].sort((a, b) => {
      if (a.applicant !== b.applicant) {
        return a.applicant.localeCompare(b.applicant);
      }
      return a.university.localeCompare(b.university);
    });
  };
  
  const matrixSorted = sortMatching(matrixResult.matching);
  const listsSorted = sortMatching(listsResult.matching);
  
  assert.strictEqual(
    matrixSorted.length,
    listsSorted.length,
    `Разное количество распределенных: ${matrixSorted.length} vs ${listsSorted.length}`
  );
  
  for (let i = 0; i < matrixSorted.length; i++) {
    assert.strictEqual(
      matrixSorted[i].applicant,
      listsSorted[i].applicant,
      'Абитуриенты не совпадают'
    );
    assert.strictEqual(
      matrixSorted[i].university,
      listsSorted[i].university,
      `Абитуриент ${matrixSorted[i].applicant} распределен в разные вузы`
    );
  }
  
  console.log('Паросочетания совпадают');
});

Then('количество распределенных абитуриентов должно совпадать', function() {
  assert.strictEqual(
    matrixResult.matching.length,
    listsResult.matching.length,
    'Количество распределенных абитуриентов различается'
  );
  
  console.log(`Распределено: ${matrixResult.matching.length}, не распределено: ${matrixResult.unmatched?.length || 0}`);
});

Then('время выполнения не должно превышать {int} секунд', function(maxSeconds) {
  const maxMs = maxSeconds * 1000;
  
  assert.ok(
    matrixTime <= maxMs,
    `Матричный алгоритм: ${matrixTime}ms > ${maxMs}ms`
  );
  
  assert.ok(
    listsTime <= maxMs,
    `Списковый алгоритм: ${listsTime}ms > ${maxMs}ms`
  );
  
  console.log(`Время выполнения в пределах ${maxSeconds} сек`);
});

Then('использование памяти не должно превышать {int} MB', function(maxMemory) {
  assert.ok(
    matrixMemory <= maxMemory,
    `Матричный алгоритм: ${matrixMemory.toFixed(2)}MB > ${maxMemory}MB`
  );
  
  assert.ok(
    listsMemory <= maxMemory,
    `Списковый алгоритм: ${listsMemory.toFixed(2)}MB > ${maxMemory}MB`
  );
  
  console.log(`Использование памяти в пределах ${maxMemory}MB`);
});

Then('вывести результаты сравнения', function() {
  console.log('\nРЕЗУЛЬТАТЫ СРАВНЕНИЯ АЛГОРИТМОВ');
  console.log('================================');
  console.log(`Матричный алгоритм:`);
  console.log(`   Время: ${matrixTime} ms`);
  console.log(`   Память: ${matrixMemory.toFixed(2)} MB`);
  console.log(`   Распределено: ${matrixResult.matching.length}`);
  console.log(`   Средний приоритет: ${matrixResult.statistics?.average_priority || 'N/A'}`);
  
  console.log(`\nСписковый алгоритм:`);
  console.log(`   Время: ${listsTime} ms`);
  console.log(`   Память: ${listsMemory.toFixed(2)} MB`);
  console.log(`   Распределено: ${listsResult.matching.length}`);
  console.log(`   Средний приоритет: ${listsResult.statistics?.average_priority || 'N/A'}`);
  
  if (matrixTime > 0) {
    const timeRatio = (listsTime / matrixTime).toFixed(2);
    const memoryRatio = (listsMemory / matrixMemory).toFixed(2);
    console.log(`\nСоотношение времени (список/матрица): ${timeRatio}`);
    console.log(`Соотношение памяти (список/матрица): ${memoryRatio}`);
  }
  console.log('================================\n');
});

Then('добавить результат в сводную таблицу', function() {
  performanceResults.push({
    size: this.currentSize || applicants.length,
    matrix: {
      time: matrixTime,
      memory: matrixMemory,
      matched: matrixResult.matching.length
    },
    lists: {
      time: listsTime,
      memory: listsMemory,
      matched: listsResult.matching.length
    }
  });
});

Then('вывести сводную таблицу результатов', function() {
  console.log('\n' + '='.repeat(100));
  console.log('СВОДНАЯ ТАБЛИЦА ПРОИЗВОДИТЕЛЬНОСТИ');
  console.log('='.repeat(100));
  
  // Заголовок таблицы
  console.log(
    '| ' + 'Размер'.padEnd(8) +
    ' | ' + 'Матричный алгоритм'.padEnd(30) +
    ' | ' + 'Списковый алгоритм'.padEnd(30) + ' |'
  );
  console.log(
    '|' + '-'.repeat(10) +
    '|' + '-'.repeat(32) +
    '|' + '-'.repeat(32) + '|'
  );
  console.log(
    '| ' + 'N'.padEnd(8) +
    ' | ' + 'Время(ms)  Память(MB)  Распр.'.padEnd(28) +
    ' | ' + 'Время(ms)  Память(MB)  Распр.'.padEnd(28) + ' |'
  );
  console.log(
    '|' + '-'.repeat(10) +
    '|' + '-'.repeat(32) +
    '|' + '-'.repeat(32) + '|'
  );
  
  performanceResults.sort((a, b) => a.size - b.size);
  
  performanceResults.forEach(r => {
    const matrixStr = 
      `${r.matrix.time.toString().padStart(8)}ms ` +
      `${r.matrix.memory.toFixed(1).padStart(6)}MB ` +
      `${r.matrix.matched.toString().padStart(6)}`;
    
    const listsStr = 
      `${r.lists.time.toString().padStart(8)}ms ` +
      `${r.lists.memory.toFixed(1).padStart(6)}MB ` +
      `${r.lists.matched.toString().padStart(6)}`;
    
    console.log(
      '| ' + r.size.toString().padEnd(8) +
      ' | ' + matrixStr.padEnd(28) +
      ' | ' + listsStr.padEnd(28) + ' |'
    );
  });
  
  console.log('='.repeat(100));
  
  console.log('\nАНАЛИЗ СЛОЖНОСТИ');
  console.log('-'.repeat(50));
  
  if (performanceResults.length >= 3) {
    const r1 = performanceResults[0];
    const r2 = performanceResults[1];
    const r3 = performanceResults[2];
    
    const sizeRatio1 = r2.size / r1.size;
    
    const matrixTimeRatio1 = r2.matrix.time / r1.matrix.time;
    const matrixTimeRatio2 = r3.matrix.time / r2.matrix.time;
    
    const listsTimeRatio1 = r2.lists.time / r1.lists.time;
    const listsTimeRatio2 = r3.lists.time / r2.lists.time;
    
    console.log(`Теоретическая сложность O(n²): при увеличении размера в ${sizeRatio1.toFixed(1)} раз, время должно расти в ~${(sizeRatio1 * sizeRatio1).toFixed(1)} раз`);
    console.log(`\nМатричный алгоритм:`);
    console.log(`  Рост времени: ${matrixTimeRatio1.toFixed(2)}x и ${matrixTimeRatio2.toFixed(2)}x`);
    console.log(`  Соответствие O(n²): ${(matrixTimeRatio1 / (sizeRatio1 * sizeRatio1)).toFixed(2)}x от теоретического`);
    
    console.log(`\nСписковый алгоритм:`);
    console.log(`  Рост времени: ${listsTimeRatio1.toFixed(2)}x и ${listsTimeRatio2.toFixed(2)}x`);
    console.log(`  Соответствие O(n²): ${(listsTimeRatio1 / (sizeRatio1 * sizeRatio1)).toFixed(2)}x от теоретического`);
  }
});

Then('проверить соответствие сложности O(n^2)', function() {
  if (performanceResults.length < 3) {
    console.log('Недостаточно данных для проверки сложности (нужно минимум 3 замера)');
    return;
  }
  
  performanceResults.sort((a, b) => a.size - b.size);
  
  const r1 = performanceResults[0];
  const r2 = performanceResults[1];
  const r3 = performanceResults[2];
  
  // Защита от деления на ноль
  if (r1.matrix.time === 0 || r2.matrix.time === 0 || r3.matrix.time === 0) {
    console.log('Время выполнения некоторых тестов равно 0ms - невозможно точно оценить сложность');
    console.log('   Для более точных результатов увеличьте размер данных');
    return;
  }
  
  const sizeRatio1 = r2.size / r1.size;
  const sizeRatio2 = r3.size / r2.size;
  
  const matrixRatio1 = r2.matrix.time / r1.matrix.time;
  const matrixRatio2 = r3.matrix.time / r2.matrix.time;
  
  const listsRatio1 = r2.lists.time / r1.lists.time;
  const listsRatio2 = r3.lists.time / r2.lists.time;
  
  console.log('\nАНАЛИЗ СООТВЕТСТВИЯ СЛОЖНОСТИ O(n²)');
  console.log('='.repeat(60));
  console.log(`Размеры данных: ${r1.size} → ${r2.size} → ${r3.size}`);
  console.log(`Коэффициенты роста: ${sizeRatio1.toFixed(2)}x, ${sizeRatio2.toFixed(2)}x`);
  
  console.log(`\nМатричный алгоритм:`);
  console.log(`   Рост времени: ${matrixRatio1.toFixed(2)}x, ${matrixRatio2.toFixed(2)}x`);
  console.log(`   Ожидаемый рост O(n²): ${(sizeRatio1 * sizeRatio1).toFixed(2)}x, ${(sizeRatio2 * sizeRatio2).toFixed(2)}x`);
  
  console.log(`\nСписковый алгоритм:`);
  console.log(`   Рост времени: ${listsRatio1.toFixed(2)}x, ${listsRatio2.toFixed(2)}x`);
  console.log(`   Ожидаемый рост O(n²): ${(sizeRatio1 * sizeRatio1).toFixed(2)}x, ${(sizeRatio2 * sizeRatio2).toFixed(2)}x`);
  
  console.log('='.repeat(60));
});

Then('проверить сложность алгоритмов', function() {
  if (performanceResults.length < 3) {
    console.log('Недостаточно данных для проверки сложности');
    return;
  }
  
  console.log('\nПРОВЕРКА СЛОЖНОСТИ АЛГОРИТМОВ');
  console.log('='.repeat(50));
  
  performanceResults.sort((a, b) => a.size - b.size).forEach((r, index) => {
    if (index > 0) {
      const prev = performanceResults[index - 1];
      const sizeRatio = r.size / prev.size;
      
      console.log(`\nРост с ${prev.size} до ${r.size} (в ${sizeRatio.toFixed(2)} раз):`);
      
      if (prev.matrix.time > 0 && r.matrix.time > 0) {
        const matrixRatio = r.matrix.time / prev.matrix.time;
        console.log(`  Матричный: ${matrixRatio.toFixed(2)}x (O(n^2) ожидается ${(sizeRatio * sizeRatio).toFixed(2)}x)`);
      }
      
      if (prev.lists.time > 0 && r.lists.time > 0) {
        const listsRatio = r.lists.time / prev.lists.time;
        console.log(`  Списковый: ${listsRatio.toFixed(2)}x (O(n^2) ожидается ${(sizeRatio * sizeRatio).toFixed(2)}x)`);
      }
    }
  });
  
  console.log('\nПроверка завершена');
});