const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const University = require('../../src/models/University');

let university = null;
let addResults = [];

Given('существует вуз с параметрами:', function(dataTable) {
  const rows = dataTable.rows();
  const data = rows[0];
  
  const priorities = data[3].split(',').map(p => p.trim());
  
  university = new University(
    data[0],
    data[1],
    parseInt(data[2]),
    priorities
  );
  
  assert.ok(university, 'Вуз должен быть создан');
  addResults = [];
});

When('добавляю абитуриента {string} в вуз {string}', function(applicantId, universityId) {
  const result = university.addApplicant(applicantId);
  addResults.push({ applicantId, success: result });
});

When('пытаюсь добавить абитуриента {string} в вуз {string}', function(applicantId, universityId) {
  const result = university.addApplicant(applicantId);
  addResults.push({ applicantId, success: result });
});

Then('абитуриент должен быть добавлен успешно', function() {
  const lastResult = addResults[addResults.length - 1];
  assert.strictEqual(lastResult.success, true, 'Абитуриент должен быть добавлен');
});

Then('абитуриент не должен быть добавлен повторно', function() {
  const lastResult = addResults[addResults.length - 1];
  assert.strictEqual(lastResult.success, false, 'Абитуриент не должен быть добавлен повторно');
});

Then('абитуриент {string} не должен быть добавлен', function(applicantId) {
  const result = addResults.find(r => r.applicantId === applicantId);
  assert.strictEqual(result.success, false, `Абитуриент ${applicantId} не должен быть добавлен`);
});

Then('в списке принятых должен быть абитуриент {string}', function(applicantId) {
  assert.ok(university.accepted.includes(applicantId), 
    `Абитуриент ${applicantId} должен быть в списке принятых`);
});

Then('в списке принятых должны быть абитуриенты {string} и {string}', function(applicantId1, applicantId2) {
  assert.ok(university.accepted.includes(applicantId1), 
    `Абитуриент ${applicantId1} должен быть в списке принятых`);
  assert.ok(university.accepted.includes(applicantId2), 
    `Абитуриент ${applicantId2} должен быть в списке принятых`);
});

Then('количество принятых должно быть {int}', function(expectedCount) {
  assert.strictEqual(university.accepted.length, expectedCount, 
    `Ожидалось ${expectedCount} принятых, получено ${university.accepted.length}`);
});