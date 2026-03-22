const Applicant = require('../src/models/Applicant');

module.exports.fuzz = function(data) {
    const applicant = new Applicant('A1', 'Test', 250, ['U1', 'U2', 'U3']);
    
    let index = 0;
    if (data.length >= 4) {
        index = data.readInt32LE(0);
        index = Math.abs(index) % 1000;
    }
    
    const result = applicant.getPriorityByIndex(index);
    
    // Если индекс вне диапазона, пытаемся вызвать метод на undefined
    if (result && result.toUpperCase) {
        console.log(`Priority: ${result.toUpperCase()}`);
    } else if (index >= 3) {
        throw new Error(`Index ${index} out of bounds! Priorities length: ${applicant.priorities.length}`);
    }
};