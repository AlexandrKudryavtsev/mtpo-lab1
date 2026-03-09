module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    format: ['progress-bar', 'json:reports/cucumber-report.json'],
    paths: ['features/'],
    publishQuiet: true
  }
};