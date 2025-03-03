const otpGenerator = require("otp-generator");

function generateOTP() {
  const OTP = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  }).toString(); 
  console.log('Generated OTP in generator:', OTP, 'Type:', typeof OTP);
  return OTP;
}

module.exports = generateOTP;
