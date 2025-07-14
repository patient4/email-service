// Vercel Serverless Function
// File Path: /api/send-email.js

const sgMail = require('@sendgrid/mail');

// --- Configuration ---
// Securely read secrets from Vercel Environment Variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TO_EMAIL_ADDRESS = process.env.TO_EMAIL_ADDRESS;
const FROM_EMAIL_ADDRESS = process.env.FROM_EMAIL_ADDRESS;

// --- Set API Key ---
// We only set the API key if it exists, to avoid errors during development.
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not found in environment variables. Email sending will be disabled.");
}

// --- Main Function Handler ---
export default async function handler(req, res) {
  
  // --- Set CORS Headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://everflowlogistics.ca');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- Handle preflight OPTIONS request ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Only allow POST requests ---
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  // --- Check if email sending is configured ---
  if (!SENDGRID_API_KEY || !TO_EMAIL_ADDRESS || !FROM_EMAIL_ADDRESS) {
      console.error("One or more environment variables for email are not set.");
      return res.status(500).json({ message: "Server configuration error: Email service is not configured." });
  }

  // --- Extract form data ---
  const {
    companyName, contactName, email, phone,
    serviceType, origin, destination, details
  } = req.body;

  // --- Basic Validation ---
  if (!companyName || !contactName || !email || !details) {
    return res.status(400).json({ message: 'Missing required form fields.' });
  }

  // --- Email Content ---
  const subject = `New Freight Quote Request from ${companyName}`;
  const textContent = `You have received a new freight quote request with the following details:\n\nCompany Name: ${companyName}\nContact Name: ${contactName}\nContact Email: ${email}\nContact Phone: ${phone}\n---\nService Type: ${serviceType}\nOrigin: ${origin}\nDestination: ${destination}\n---\nShipment Details:\n${details}`;
  const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;"><h2 style="color: #1e3c72;">New Freight Quote Request</h2><p>You have received a new quote request from the EverFlow Logistics website.</p><table style="width: 100%; border-collapse: collapse; margin-top: 20px;"><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Company Name:</td><td style="padding: 12px; border: 1px solid #ddd;">${companyName}</td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Name:</td><td style="padding: 12px; border: 1px solid #ddd;">${contactName}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Email:</td><td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Phone:</td><td style="padding: 12px; border: 1px solid #ddd;">${phone}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service Type:</td><td style="padding: 12px; border: 1px solid #ddd;">${serviceType}</td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Origin:</td><td style="padding: 12px; border: 1px solid #ddd;">${origin}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Destination:</td><td style="padding: 12px; border: 1px solid #ddd;">${destination}</td></tr><tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background-color: #e3f2fd;">Shipment Details:</td></tr><tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd;">${details.replace(/\n/g, '<br>')}</td></tr></table></div>`;
  
  const emailMessage = {
      to: TO_EMAIL_ADDRESS,
      from: { name: 'EverFlow Logistics Website', email: FROM_EMAIL_ADDRESS },
      replyTo: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
  };

  // --- Send the email ---
  try {
    await sgMail.send(emailMessage);
    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
    return res.status(500).json({ message: 'Error sending email.' });
  }
}
