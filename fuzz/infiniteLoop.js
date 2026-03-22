const University = require('../src/models/University');

module.exports.fuzz = function(data) {
    const university = new University('U1', 'Test University', 5, ['A1', 'A2', 'A3']);
    
    // Генерируем ID для поиска
    let searchId = 'X999';
    if (data.length > 0) {
        searchId = 'X' + (data[0] % 1000);
    }
    
    const timeout = setTimeout(() => {
        console.log('ОБНАРУЖЕН БЕСКОНЕЧНЫЙ ЦИКЛ!');
        console.log(`Входные данные: поиск ID = "${searchId}"`);
        process.exit(1);
    }, 2000);
    
    const result = university.searchWithBug(searchId);
    
    clearTimeout(timeout);
    
    if (result) {
        console.log(`Найден: ${searchId}`);
    }
};
