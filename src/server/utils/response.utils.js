const createResponse = (success, data = null, message = '') => ({
  success,
  data,
  message
});

module.exports = {
  createResponse
};