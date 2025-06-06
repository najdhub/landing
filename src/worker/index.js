// Cloudflare Worker for handling contact form submissions
// Uses MailChannels Email API with API Key and Domain Lockdown

export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);
    console.log(`---------- New Request ----------`);
    console.log(`Worker received request: ${request.method} ${requestUrl.pathname}${requestUrl.search}`);
    console.log(`Origin header: ${request.headers.get('Origin')}`);
    console.log(`env.ENVIRONMENT variable: ${env.ENVIRONMENT}`);

    const environment = env.ENVIRONMENT || 'development'; // Default to 'development'
    console.log(`Determined environment: ${environment}`);

    // Retrieve API Key from secrets
    const MAILCHANNELS_API_KEY = env.MAILCHANNELS_API_KEY;

    if (!MAILCHANNELS_API_KEY) {
      console.error("CRITICAL: MAILCHANNELS_API_KEY secret is not set in Worker environment!");
      const clientErrorMessage = environment === 'production'
        ? 'Server configuration error. Please contact support.' // Generic for prod
        : '[DEV MODE] Server configuration error: MAILCHANNELS_API_KEY is missing in Worker secrets.';
      // For OPTIONS requests, we still need to respond with CORS headers even on early exit
      const headers = { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*', // Best effort for origin
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key'
      };
      return new Response(JSON.stringify({ success: false, message: clientErrorMessage, environment: environment }), {
        status: 500,
        headers: headers
      });
    }

    const getAllowedOrigin = () => {
      if (environment === 'production') {
        return 'https://najdcommercialhub.ma';
      } else {
        const origin = request.headers.get('Origin');
        const allowedDevOrigins = [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080',
          'https://najd-hub-dev.pages.dev',
          'https://develop.najd-hub-dev.pages.dev',
          // Add specific preview deployment URLs if needed, or rely on the endsWith check
        ];
        // Allow any *.najd-hub-dev.pages.dev for preview deployments
        if (origin && origin.endsWith('.najd-hub-dev.pages.dev')) {
            console.log(`Allowing dynamic dev origin: ${origin}`);
            return origin;
        }
        if (allowedDevOrigins.includes(origin)) {
          console.log(`Allowing configured dev origin: ${origin}`);
          return origin;
        }
        console.log(`Origin ${origin} not in allowedDevOrigins, falling back to https://develop.najd-hub-dev.pages.dev for CORS`);
        return 'https://develop.najd-hub-dev.pages.dev';
      }
    };

    const allowedOrigin = getAllowedOrigin();
    console.log(`CORS allowedOrigin set to: ${allowedOrigin}`);

    // Handle CORS preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request.');
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key', // Allow X-Api-Key if you ever planned to send it from client (not recommended)
                                                                    // More importantly, allow Content-Type for the POST.
          'Access-Control-Max-Age': '86400', // 1 day
        }
      });
    }

    // Handle actual POST request
    if (request.method !== 'POST') {
      console.log(`Method ${request.method} not allowed.`);
      return new Response('Method not allowed', { 
        status: 405, 
        headers: { 'Access-Control-Allow-Origin': allowedOrigin } // Good to include CORS on error responses too
      });
    }

    try {
      const formData = await request.json();
      console.log('Received formData:', JSON.stringify(formData, null, 2));

      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        console.log('Validation failed: Required fields missing.');
        return new Response(JSON.stringify({ success: false, message: 'Required fields missing' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin }
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        console.log('Validation failed: Invalid email format.');
        return new Response(JSON.stringify({ success: false, message: 'Invalid email format' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin }
        });
      }

      const getEmailConfig = () => {
        if (environment === 'production') {
          return {
            toEmail: env.PROD_ADMIN_EMAIL || 'contact@najdcommercialhub.ma',
            fromEmail: env.PROD_FROM_EMAIL || 'noreply@najdcommercialhub.ma',
            siteName: 'najdcommercialhub.ma'
          };
        } else { // DEVELOPMENT
          return {
            toEmail: env.DEV_ADMIN_EMAIL || 'dev-contact@najdcommercialhub.ma',
            fromEmail: env.DEV_FROM_EMAIL || 'noreply@najdcommercialhub.ma',
            siteName: `develop.najd-hub-dev.pages.dev (${environment})`
          };
        }
      };
      const emailConfig = getEmailConfig();
      console.log('Using emailConfig:', JSON.stringify(emailConfig, null, 2));

      // --- Payload for Admin Notification Email ---
      const adminEmailSubject = `[${environment.toUpperCase()}] New Contact: ${formData.name} - ${formData.interestType}`;
      const adminEmailHtmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 15px;">
              <div style="background-color: ${environment === 'production' ? '#2c5f2d' : '#d97706'}; color: white; padding: 10px; text-align: center; margin-bottom: 15px;">
                <h3>CONTACT FORM SUBMISSION (${environment.toUpperCase()})</h3>
              </div>
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
              <p><strong>Phone:</strong> ${formData.phone}</p>
              <p><strong>Interest Type:</strong> ${formData.interestType || 'Not specified'}</p>
              <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
              <p><strong>Message:</strong></p>
              <blockquote style="border-left: 3px solid #eee; padding-left: 10px; margin-left: 0;">${formData.message || 'No message provided'}</blockquote>
              <hr style="margin: 20px 0;">
              <p><small>Submitted from ${request.headers.get('Origin') || 'Unknown Origin'} via ${emailConfig.siteName}</small></p>
              <p><small>User Agent: ${request.headers.get('User-Agent') || 'N/A'}</small></p>
              <p><small>CF Ray ID: ${request.headers.get('cf-ray') || 'N/A'}</small></p>
            </div>
          `;

      const adminEmailPayload = {
        personalizations: [{
          to: [{ email: emailConfig.toEmail, name: 'Najd Commercial Hub Team' }]
        }],
        from: {
          email: emailConfig.fromEmail,
          name: `Najd Hub Form (${environment.toUpperCase()})`
        },
        reply_to: {
            email: formData.email,
            name: formData.name
        },
        subject: adminEmailSubject, // Subject at the top level
        content: [{
          type: 'text/html',
          value: adminEmailHtmlBody
        }]
      };
      console.log('Attempting to send admin notification email via MailChannels...');
      console.log('Admin Email Payload:', JSON.stringify(adminEmailPayload, null, 2));

      const adminMailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': MAILCHANNELS_API_KEY
        },
        body: JSON.stringify(adminEmailPayload)
      });

      console.log(`MailChannels admin email response status: ${adminMailResponse.status}`);
      const adminMailResponseText = await adminMailResponse.text();
      console.log('MailChannels admin email response text:', adminMailResponseText);

      if (!adminMailResponse.ok) {
        throw new Error(`Failed to send admin email via MailChannels: ${adminMailResponse.status} - ${adminMailResponseText}`);
      } else {
        console.log('MailChannels admin email sent successfully (or accepted for delivery).');
      }

      // --- Send Confirmation Email to User (only in production) ---
      if (environment === 'production') {
        console.log('Environment is production. Attempting to send user confirmation email...');
        const userConfirmationSubject = 'شكراً لاهتمامكم بمركز نجد التجاري - Thank you for your interest in Najd Commercial Hub';
        const userConfirmationHtmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c5f2d;">شكراً لاستفسارك! - Thank you for your inquiry!</h2>
                <p>عزيزي/عزيزتي ${formData.name} - Dear ${formData.name},</p>
                <p>لقد تلقينا طلبكم للحصول على محفظة الاستثمار لمركز نجد التجاري. سيقوم فريقنا بمراجعة استفساركم والتواصل معكم قريباً.</p>
                <p>We have received your request for the Najd Commercial Hub Investment Portfolio. Our team will review your inquiry and contact you shortly.</p>
                <p>نقدر اهتمامكم بمشروع التطوير التجاري الخاص بنا.</p>
                <p>We appreciate your interest in our commercial development project.</p>
                <br>
                <p>مع أطيب التحيات،<br>فريق مركز نجد التجاري</p>
                <p>Best regards,<br>Najd Commercial Hub Team</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  <strong>مركز نجد التجاري | Najd Commercial Hub</strong><br>
                  Website: <a href="https://najdcommercialhub.ma">najdcommercialhub.ma</a>
                </p>
              </div>
            `;

        const confirmationPayload = {
          personalizations: [{
            to: [{ email: formData.email, name: formData.name }]
          }],
          from: {
            email: emailConfig.fromEmail, // From your official production email
            name: 'Najd Commercial Hub'
          },
          subject: userConfirmationSubject, // Subject at the top level
          content: [{
            type: 'text/html',
            value: userConfirmationHtmlBody
          }]
        };
        console.log('User Confirmation Payload:', JSON.stringify(confirmationPayload, null, 2));

        const confirmationResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': MAILCHANNELS_API_KEY
          },
          body: JSON.stringify(confirmationPayload)
        });
        console.log(`MailChannels user confirmation email response status: ${confirmationResponse.status}`);
        const userMailResponseText = await confirmationResponse.text();
        console.log('MailChannels user confirmation email response text:', userMailResponseText);

        if (!confirmationResponse.ok) {
          console.error('Failed to send user confirmation email via MailChannels:', userMailResponseText);
          // Don't throw an error here; admin email success is primary.
        } else {
          console.log('MailChannels user confirmation email sent successfully (or accepted for delivery).');
        }
      } else {
        console.log('Environment is NOT production. Skipping user confirmation email.');
      }

      // --- Define Success Message ---
      const getSuccessMessage = () => {
        if (environment === 'production') {
          return 'Thank you! Your request has been submitted successfully. شكراً! تم إرسال طلبكم بنجاح.';
        } else {
          return `[DEV MODE - MailChannels w/APIKey] Form submitted! Admin email attempt to ${emailConfig.toEmail}. Check logs for MailChannels response.`;
        }
      };

      console.log('Form processing complete. Sending success response to client.');
      return new Response(JSON.stringify({ success: true, message: getSuccessMessage(), environment: environment }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin }
      });

    } catch (error) {
      console.error('!!! Top-level form submission error catch block !!!');
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      // console.error('Error Stack:', error.stack); // Enable for more detailed debugging if needed

      const errorMessageForClient = environment === 'production'
        ? 'Sorry, there was an error processing your request. Please try again. عذراً، حدث خطأ في معالجة طلبكم. يرجى المحاولة مرة أخرى.'
        : `[DEV MODE - MailChannels w/APIKey] Error: ${error.message}`;

      return new Response(JSON.stringify({ success: false, message: errorMessageForClient, environment: environment }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin }
      });
    }
  }
};