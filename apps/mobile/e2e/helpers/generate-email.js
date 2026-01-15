// Generate unique email for registration tests
const timestamp = Date.now();
const random = Math.floor(Math.random() * 10000);
output.testEmail = `test+${timestamp}${random}@cgraph.dev`;
