// Cloudflare Worker for handling contact form submissions
export default {
  async fetch(request, env, ctx) {
    console.log('Worker received request:', request.method, request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow all origins for testing
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.json();
      
      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Required fields missing' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid email format' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Send email using MailChannels (free with Cloudflare Workers)
      const emailPayload = {
        personalizations: [{
          to: [{ email: 'your-email@domain.com', name: 'Your Company' }], // Replace with your email
          subject: 'New Contact Form Submission - Najd Commercial Hub'
        }],
        from: { 
          email: 'noreply@yourdomain.com', // Must be your domain
          name: 'Najd Commercial Hub Contact Form' 
        },
        content: [{
          type: 'text/html',
          value: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone}</p>
            <p><strong>Interest Type:</strong> ${formData.interestType || 'Not specified'}</p>
            <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${formData.message || 'No message provided'}</p>
            <hr>
            <p><small>Submitted from Najd Commercial Hub website</small></p>
          `
        }]
      };

      // Send via MailChannels
      const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (!mailResponse.ok) {
        throw new Error('Failed to send email');
      }

      // Optionally send confirmation email to user
      const confirmationPayload = {
        personalizations: [{
          to: [{ email: formData.email, name: formData.name }],
          subject: 'Thank you for your interest in Najd Commercial Hub'
        }],
        from: { 
          email: 'noreply@yourdomain.com',
          name: 'Najd Commercial Hub' 
        },
        content: [{
          type: 'text/html',
          value: `
            <h2>Thank you for your inquiry!</h2>
            <p>Dear ${formData.name},</p>
            <p>We have received your request for the Najd Commercial Hub Investment Portfolio. Our team will review your inquiry and contact you shortly.</p>
            <p>We appreciate your interest in our commercial development project.</p>
            <br>
            <p>Best regards,<br>Najd Commercial Hub Team</p>
          `
        }]
      };

      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(confirmationPayload)
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Thank you! Your request has been submitted successfully.' 
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Form submission error:', error);
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Sorry, there was an error processing your request. Please try again.' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};