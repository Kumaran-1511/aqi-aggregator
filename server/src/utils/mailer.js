const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[Mailer] Configured SMTP transporter with', process.env.SMTP_HOST);
  } else {
    // Generate test account automatically for local development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[Mailer] Ethereal test mailer created (${testAccount.user})`);
    } catch (e) {
      console.log('[Mailer] Notice: using console mailer for alert notifications:', e.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`[Mailer Mock] Email to ${opts.to}: ${opts.subject}`);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  return transporter;
}

async function sendAQIAlertEmail({ to, stationName, aqi, threshold, category, dominantPollutant }) {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: process.env.ALERT_SENDER_EMAIL || '"AQI Real-Time Alerts" <alerts@aqi-system.local>',
      to,
      subject: `⚠️ Air Quality Alert: AQI ${aqi} (${category}) near ${stationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #ef4444; margin-top: 0;">⚠️ Air Quality Threshold Exceeded</h2>
          <p>This is an automated alert from your <strong>Real-Time AQI Monitor</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Location/Station:</strong> ${stationName}</p>
            <p><strong>Current AQI:</strong> <span style="font-size: 20px; font-weight: bold; color: #dc2626;">${aqi}</span></p>
            <p><strong>Your Configured Threshold:</strong> ${threshold}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Primary Pollutant:</strong> ${dominantPollutant.toUpperCase()}</p>
          </div>
          <p style="color: #475569; font-size: 14px;">Recommendation: Reduce prolonged outdoor exertion. Sensitive groups should wear N95 masks and keep indoor air purifiers running.</p>
        </div>
      `
    });

    if (nodemailer.getTestMessageUrl && info) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log(`[Mailer] Ethereal Alert Preview URL: ${url}`);
    }
    return info;
  } catch (err) {
    console.error('[Mailer] Error sending alert email:', err.message);
  }
}

module.exports = { getTransporter, sendAQIAlertEmail };
