module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/server/**/__tests__/**/*.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/server/routes/'],
  verbose: true,
};
