const crypto = require('crypto');

exports.generateChecksum = (data, saltKey, saltIndex) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const base64Payload = Buffer.from(payload).toString('base64');
  
  const string = base64Payload + '/pg/v1/pay' + saltKey;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  
  return {
    checksum: sha256 + '###' + saltIndex,
    base64Payload
  };
};

exports.verifySignature = (payload, checksum, saltKey, saltIndex) => {
  const string = JSON.stringify(payload) + saltKey;
  const calculatedChecksum = crypto.createHash('sha256').update(string).digest('hex') + 
    '###' + saltIndex;
  return checksum === calculatedChecksum;
};