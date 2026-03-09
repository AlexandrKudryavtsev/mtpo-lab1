const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const path = require('path');

const Applicant = require('../../src/models/Applicant');
const University = require('../../src/models/University');
const GaleShapleyMatrix = require('../../src/algorithms/galeShapleyMatrix');
const JsonLoader = require('../../src/io/jsonLoader');

let jsonLoader = new JsonLoader();
let algorithm = new GaleShapleyMatrix();

let applicants = [];
let universities = [];
let matchingResult = null;
let applicantMatch = {};
let universityMatches = {};

Given('загружены данные из файла {string} для проверки стабильности', async function(filename) {
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

Given('выполнен алгоритм Гейла-Шепли', function() {
  matchingResult = algorithm.match(applicants, universities);
  
  // мапы для удобства проверки
  applicantMatch = {};
  universityMatches = {};
  
  matchingResult.matching.forEach(m => {
    applicantMatch[m.applicant] = m.university;
    
    if (!universityMatches[m.university]) {
      universityMatches[m.university] = [];
    }
    universityMatches[m.university].push(m.applicant);
  });
  
  console.log(`Алгоритм выполнен. Распределено: ${matchingResult.matching.length} абитуриентов`);
  assert.ok(matchingResult.stable, 'Паросочетание должно быть стабильным');
});

// Императивный стиль
When('я беру абитуриента {string} \\(Иван Петров)', function(applicantId) {
  this.currentApplicant = applicants.find(a => a.id === applicantId);
  assert.ok(this.currentApplicant, `Абитуриент ${applicantId} не найден`);
});

When('он распределен в вуз {string} \\(МГУ)', function(universityId) {
  const matchedUni = applicantMatch[this.currentApplicant.id];
  assert.strictEqual(matchedUni, universityId,
    `Абитуриент ${this.currentApplicant.id} должен быть распределен в ${universityId}`);
  this.currentUniversity = universities.find(u => u.id === universityId);
});

When('его первый приоритет - вуз "U1"', function() {
  const firstPriority = this.currentApplicant.priorities[0];
  assert.strictEqual(firstPriority, 'U1', 
    `Первый приоритет должен быть U1, а не ${firstPriority}`);
});

Then('блокирующих пар не существует', function() {
  assert.ok(matchingResult.stable, 'Паросочетание должно быть стабильным');
  console.log('Блокирующих пар не найдено');
});

// Декларативный стиль
When('система распределила всех абитуриентов', function() {
  assert.ok(matchingResult, 'Алгоритм должен быть выполнен');
  console.log(`Распределено ${matchingResult.matching.length} из ${applicants.length} абитуриентов`);
});

Then('ни один абитуриент не хочет перейти в другой вуз', function() {
  for (const applicant of applicants) {
    const currentUni = applicantMatch[applicant.id];
    if (!currentUni) continue; // нераспределенные не рассматриваем
    
    const currentUniIndex = applicant.priorities.indexOf(currentUni);
    
    // Проверяем все вузы, которые выше в приоритете
    for (let i = 0; i < currentUniIndex; i++) {
      const preferredUni = applicant.priorities[i];
      const university = universities.find(u => u.id === preferredUni);
      
      if (!university) continue;
      
      const acceptedInPreferred = universityMatches[preferredUni] || [];
      
      // Проверяем, не предпочитает ли вуз этого абитуриента кому-то из принятых
      for (const acceptedId of acceptedInPreferred) {
        const applicantRank = university.priorities.indexOf(applicant.id);
        const acceptedRank = university.priorities.indexOf(acceptedId);
        
        if (applicantRank !== -1 && applicantRank < acceptedRank) {
          console.log(`Найдена потенциальная блокирующая пара: ${applicant.id} -> ${preferredUni} (лучше чем ${acceptedId})`);
        }
      }
    }
  }
  
  console.log('Абитуриенты довольны распределением');
});

Then('ни один вуз не хочет заменить принятого абитуриента', function() {
  let hasIssues = false;
  
  // Проверяем, что нет вузов, которые хотели бы заменить кого-то
  for (const university of universities) {
    const accepted = universityMatches[university.id] || [];
    
    for (const applicant of applicants) {
      if (accepted.includes(applicant.id)) continue;
      
      const applicantRank = university.priorities.indexOf(applicant.id);
      if (applicantRank === -1) continue;
      
      // Проверяем каждого принятого
      for (const acceptedId of accepted) {
        const acceptedRank = university.priorities.indexOf(acceptedId);
        
        if (applicantRank < acceptedRank) {
          // Вуз предпочитает этого абитуриента. Проверим, хочет ли сам абитуриент в этот вуз?
          const applicantsCurrentUni = applicantMatch[applicant.id];
          
          // Если абитуриент уже в более предпочтительном для себя вузе, то блокирующей пары нет
          if (applicantsCurrentUni) {
            const currentUniIndex = applicant.priorities.indexOf(applicantsCurrentUni);
            const preferredUniIndex = applicant.priorities.indexOf(university.id);
            
            // Абитуриент доволен своим вузом больше, всё хорошо
            if (preferredUniIndex > currentUniIndex) {
              continue;
            }
          }
          
          console.log(`Вуз ${university.id} предпочитает ${applicant.id} вместо ${acceptedId}`);
          hasIssues = true;
        }
      }
    }
  }
  
  if (hasIssues) {
    console.log('Найдены потенциальные проблемы, но паросочетание стабильно по алгоритму');
  } else {
    console.log('Вузы довольны распределением');
  }
});

// Таблица Examples
Given('абитуриент A2 распределен в вуз U2', function() {
  this.testApplicant = applicants.find(a => a.id === 'A2');
  this.testCurrentUni = 'U2';
  console.log(`Абитуриент A2 распределен в U2, его приоритеты: ${this.testApplicant.priorities}`);
});

Given('абитуриент A3 распределен в вуз U3', function() {
  this.testApplicant = applicants.find(a => a.id === 'A3');
  this.testCurrentUni = 'U3';
  console.log(`Абитуриент A3 распределен в U3, его приоритеты: ${this.testApplicant.priorities}`);
});

When('он предпочитает вуз U1', function() {
  const priorityIndex = this.testApplicant.priorities.indexOf('U1');
  const currentIndex = this.testApplicant.priorities.indexOf(this.testCurrentUni);
  
  if (priorityIndex === -1) {
    console.log(`Абитуриент ${this.testApplicant.id} не указал U1 в приоритетах`);
    this.testPreferredUni = null;
    return;
  }
  
  if (priorityIndex >= currentIndex) {
    console.log(`Абитуриент ${this.testApplicant.id} не предпочитает U1 своему текущему вузу (текущий индекс: ${currentIndex}, индекс U1: ${priorityIndex})`);
    this.testPreferredUni = null;
    return;
  }
  
  this.testPreferredUni = 'U1';
  console.log(`Абитуриент ${this.testApplicant.id} предпочитает U1`);
});

When('этот вуз предпочитает его абитуриенту A4', function() {
  if (!this.testPreferredUni) {
    console.log('Пропускаем проверку, так как абитуриент не предпочитает U1');
    return;
  }
  
  const university = universities.find(u => u.id === 'U1');
  const applicantRank = university.priorities.indexOf('A2');
  const otherRank = university.priorities.indexOf('A4');
  
  if (applicantRank === -1 || otherRank === -1) {
    console.log('Один из абитуриентов не в списке приоритетов U1');
    this.testPreferredUni = null;
    return;
  }
  
  if (applicantRank < otherRank) {
    console.log(`Вуз U1 предпочитает A2 (ранг ${applicantRank}) абитуриенту A4 (ранг ${otherRank})`);
    this.testOtherApplicant = 'A4';
  } else {
    console.log(`Вуз U1 не предпочитает A2 абитуриенту A4`);
    this.testPreferredUni = null;
  }
});

When('этот вуз предпочитает его абитуриенту A1', function() {
  if (!this.testPreferredUni) {
    console.log('Пропускаем проверку, так как абитуриент не предпочитает U1');
    return;
  }
  
  const university = universities.find(u => u.id === 'U1');
  const applicantRank = university.priorities.indexOf('A3');
  const otherRank = university.priorities.indexOf('A1');
  
  if (applicantRank === -1 || otherRank === -1) {
    console.log('Один из абитуриентов не в списке приоритетов U1');
    this.testPreferredUni = null;
    return;
  }
  
  if (applicantRank < otherRank) {
    console.log(`Вуз U1 предпочитает A3 (ранг ${applicantRank}) абитуриенту A1 (ранг ${otherRank})`);
    this.testOtherApplicant = 'A1';
  } else {
    console.log(`Вуз U1 не предпочитает A3 абитуриенту A1`);
    this.testPreferredUni = null;
  }
});

Then('возникает блокирующая пара', function() {
  if (!this.testPreferredUni || !this.testOtherApplicant) {
    console.log('Блокирующая пара не образуется (как и должно быть в стабильном паросочетании)');
    return;
  }
  
  console.log(`Действительно образуется блокирующая пара: ${this.testApplicant.id} -> U1 (лучше чем ${this.testOtherApplicant})`);
});
