const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const University = require('../../src/models/University');

let lastError = null;
let createdUniversity = null;

When('я создаю вуз с данными:', function(dataTable) {
  const rows = dataTable.rows();
  const data = rows[0];
  
  try {
    // Преобразуем строку с приоритетами в массив
    const priorities = data[3].split(',').map(p => p.trim());
    
    createdUniversity = new University(
      data[0],
      data[1],
      parseInt(data[2]),
      priorities
    );
    lastError = null;
  } catch (error) {
    lastError = error;
    console.log('Error creating university:', error.message);
  }
});

When('я пытаюсь создать вуз с id {string}', function(id) {
  try {
    createdUniversity = new University(id, "МГУ", 2, ["A1", "A2"]);
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

When('я пытаюсь создать вуз с capacity {int}', function(capacity) {
  try {
    createdUniversity = new University("U1", "МГУ", capacity, ["A1", "A2"]);
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

When('я пытаюсь создать вуз с приоритетами {string}', function(priorities) {
  try {
    const priorityArray = priorities.split(',').map(p => p.trim());
    createdUniversity = new University(
      "U1", 
      "МГУ", 
      2, 
      priorityArray
    );
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});

Then('вуз должен быть создан успешно', function() {
  assert.ok(createdUniversity, 'Вуз должен быть создан');
  assert.strictEqual(lastError, null, 'Не должно быть ошибок');
});

Then('ID вуза должен быть {string}', function(expectedId) {
  assert.strictEqual(createdUniversity.id, expectedId);
});

Then('название вуза должно быть {string}', function(expectedName) {
  assert.strictEqual(createdUniversity.name, expectedName);
});

Then('вместимость вуза должна быть {int}', function(expectedCapacity) {
  assert.strictEqual(createdUniversity.capacity, expectedCapacity);
});

Then('приоритеты вуза должны быть {string}', function(expectedPriorities) {
  const expected = expectedPriorities.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdUniversity.priorities, expected);
});

Then('список принятых вузом должен быть пустым', function() {
  assert.ok(Array.isArray(createdUniversity.accepted));
  assert.strictEqual(createdUniversity.accepted.length, 0);
});

Then('при создании вуза возникает ошибка {string}', function(expectedMessage) {
  assert.ok(lastError, 'Должна быть ошибка');
  assert.strictEqual(lastError.message, expectedMessage);
});

Then('приоритеты вуза должны быть {string}', function(expectedPriorities) {
  const expected = expectedPriorities.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdUniversity.priorities, expected);
});

Then(/^приоритеты вуза должны быть (.+)$/, function(prioritiesString) {
  const expected = prioritiesString.split(',').map(p => p.trim());
  assert.deepStrictEqual(createdUniversity.priorities, expected);
});

When(/^я пытаюсь создать вуз с приоритетами (.+)$/, function(prioritiesString) {
  try {
    const priorityArray = prioritiesString.split(',').map(p => p.trim());
    createdUniversity = new University(
      "U1", 
      "МГУ", 
      2, 
      priorityArray
    );
    lastError = null;
  } catch (error) {
    lastError = error;
  }
});