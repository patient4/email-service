// This is the serverless function that will send the email for Vercel.
// It should be placed in: /api/send-email.js
const sgMail = require('@sendgrid/mail');

// Set the API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Vercel's official CORS handler.
 * This function wraps the main handler to add the necessary security headers.
 * It allows your frontend website to make requests to this API endpoint.
 * @param {Function} fn - The main handler function.
 */
const allowCors = (fn) => async (req, res) => {
  // Set headers to allow your specific domain.
  // IMPORTANT: This should be your production domain.
  res.setHeader('Access-Control-Allow-Origin', 'https://everflowlogistics.ca');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  // Respond to preflight requests (the browser sends this first)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// This is the main function that sends the email.
const handler = async (req, res) => {
  // Only allow POST requests for the actual submission
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { 
        companyName, contactName, email, phone, 
        serviceType, origin, destination, details 
    } = req.body;

    if (!companyName || !contactName || !email || !phone || !serviceType || !origin || !destination || !details) {
      return res.status(400).json({ message: 'Missing required form fields.' });
    }
    
    // Get emails from environment variables
    const toEmail = process.env.TO_EMAIL_ADDRESS;
    const fromEmail = process.env.FROM_EMAIL_ADDRESS; 

    if (!toEmail || !fromEmail) {
        console.error("Email addresses are not configured in environment variables.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const subject = `New Freight Quote Request from ${companyName}`;
    const textContent = `You have received a new freight quote request with the following details:\n\nCompany Name: ${companyName}\nContact Name: ${contactName}\nContact Email: ${email}\nContact Phone: ${phone}\n---\nService Type: ${serviceType}\nOrigin: ${origin}\nDestination: ${destination}\n---\nShipment Details:\n${details}`;
    const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;"><h2 style="color: #1e3c72;">New Freight Quote Request</h2><p>You have received a new quote request from the EverFlow Logistics website.</p><table style="width: 100%; border-collapse: collapse; margin-top: 20px;"><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Company Name:</td><td style="padding: 12px; border: 1px solid #ddd;">${companyName}</td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Name:</td><td style="padding: 12px; border: 1px solid #ddd;">${contactName}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Email:</td><td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Contact Phone:</td><td style="padding: 12px; border: 1px solid #ddd;">${phone}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service Type:</td><td style="padding: 12px; border: 1px solid #ddd;">${serviceType}</td></tr><tr><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Origin:</td><td style="padding: 12px; border: 1px solid #ddd;">${origin}</td></tr><tr style="background-color: #f2f2f2;"><td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Destination:</td><td style="padding: 12px; border: 1px solid #ddd;">${destination}</td></tr><tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background-color: #e3f2fd;">Shipment Details:</td></tr><tr><td colspan="2" style="padding: 12px; border: 1px solid #ddd;">${details.replace(/\n/g, '<br>')}</td></tr></table></div>`;

    const emailMessage = {
      to: toEmail,
      from: { name: 'EverFlow Logistics Website', email: fromEmail },
      replyTo: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(emailMessage);

    return res.status(200).json({ message: 'Email sent successfully!' });

  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
    return res.status(error.statusCode || 500).json({ message: 'Error sending email.' });
  }
};

// Export the final handler, wrapped in the CORS function.
module.exports = allowCors(handler);
