import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: {
      email: process.env.OWNER_EMAIL,
      name: 'ECOMMERCE-API',
    },
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
    }
  }
};

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendVerificationCode = async (to, code, channel = 'sms') => {
  try {
    console.log('Sending verification code to:', to);
    console.log('Verification Code:', code);
    console.log('Using channel:', channel);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to,
        channel, // This must be 'sms', 'call', or 'email'
      });

    console.log(`Verification sent: ${verification.sid}`);
    return verification;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};
