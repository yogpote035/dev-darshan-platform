const buildIndianE164 = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const mobile = digits.length >= 10 ? digits.slice(-10) : '';
  return /^[6-9]\d{9}$/.test(mobile) ? `+91${mobile}` : null;
};

const getTwilioVerifyConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  return {
    configured: Boolean(accountSid && authToken && serviceSid),
    accountSid,
    authToken,
    serviceSid
  };
};

const twilioRequest = async (path, body) => {
  const { configured, accountSid, authToken, serviceSid } = getTwilioVerifyConfig();
  if (!configured) {
    const error = new Error('Password reset SMS is not configured. Please contact support.');
    error.code = 'SMS_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body).toString()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Unable to send or verify the reset code.');
    error.code = 'TWILIO_VERIFY_ERROR';
    throw error;
  }
  return data;
};

const sendPasswordResetCode = async (phone) => twilioRequest('/Verifications', { To: phone, Channel: 'sms' });
const checkPasswordResetCode = async (phone, code) => twilioRequest('/VerificationCheck', { To: phone, Code: code });

module.exports = { buildIndianE164, getTwilioVerifyConfig, sendPasswordResetCode, checkPasswordResetCode };
