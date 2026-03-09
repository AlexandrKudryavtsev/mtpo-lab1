const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const Applicant = require('../../src/models/Applicant');

let lastError = null;
let createdApplicant = null;

When('я создаю абитуриента с данными:', function(dataTable) {
  const rows = dataTable.rows();
  const data = rows[0];
  
  try {
    // Преобразуем строку с приоритетами в массив
    const priorities = data[3].split(',').map(p => p.trim());
    
    createdApplicant = new Applicant(
      data[0],
      data[1],
      parseInt(data[2]),
      priorities
    );
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

When('я пытаюсь создать абитуриента с id {string}', function(id) {
  try {
    createdApplicant = new Applicant(id, "Иван", 250, ["U1"]);
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

When('я пытаюсь создать абитуриента с баллами {int}', function(scores) {
  try {
    createdApplicant = new Applicant("A1", "Иван", scores, ["U1"]);
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

Then('абитуриент должен быть создан успешно', function() {
  assert.ok(createdApplicant, 'Абитуриент должен быть создан');
  assert.strictEqual(lastError, null, 'Не должно быть ошибок');
});

Then('ID абитуриента должен быть {string}', function(expectedId) {
  assert.strictEqual(createdApplicant.id, expectedId);
});

Then('имя абитуриента должно быть {string}', function(expectedName) {
  assert.strictEqual(createdApplicant.name, expectedName);
});

Then('баллы абитуриента должны быть {int}', function(expectedScores) {
  assert.strictEqual(createdApplicant.scores, expectedScores);
});

Then('приоритеты абитуриента должны быть {string}', function(expectedPriorities) {
  const expected = expectedPriorities.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdApplicant.priorities, expected);
});

Then('при создании абитуриента возникает ошибка {string}', function(expectedMessage) {
  assert.ok(lastError, 'Должна быть ошибка');
  assert.strictEqual(lastError.message, expectedMessage);
});

// Шаблон для приоритетов с любым количеством элементов
Then('приоритеты абитуриента должны быть {string}', function(expectedPriorities) {
  const expected = expectedPriorities.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdApplicant.priorities, expected);
});

// Альтернативный шаблон для случая, когда приоритеты передаются как отдельные аргументы
Then(/^приоритеты абитуриента должны быть (.+)$/, function(prioritiesString) {
  const expected = prioritiesString.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdApplicant.priorities, expected);
});