// Cloudflare Worker for handling contact form submissions
export default {
  async fetch(request, env, ctx) {
    console.log('Worker received request:', request.method, request.url);
    
    // Determine CORS origin based on environment
    const getAllowedOrigin = () => {
      const environment = env.ENVIRONMENT || 'development';
      
      if (environment === 'production') {
        return 'https://najdcommercialhub.ma';
      } else {
        // Development environment - allow both local and Pages dev URLs
        const origin = request.headers.get('Origin');
        const allowedDevOrigins = [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080',
          'https://najd-hub-dev.pages.dev'
        ];
        
        if (allowedDevOrigins.includes(origin)) {
          return origin;
        }
        
        // Fallback for development
        return 'https://najd-hub-dev.pages.dev';
      }
    };

    const allowedOrigin = getAllowedOrigin();
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
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
            'Access-Control-Allow-Origin': allowedOrigin
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
            'Access-Control-Allow-Origin': allowedOrigin
          }
        });
      }

      // Get environment-specific configuration
      const environment = env.ENVIRONMENT || 'development';
      const getEmailConfig = () => {
        if (environment === 'production') {
          return {
            toEmail: 'contact@najdcommercialhub.ma', // UPDATE: Replace with your actual email
            fromEmail: 'noreply@najdcommercialhub.ma',
            siteName: 'najdcommercialhub.ma'
          };
        } else {
          return {
            toEmail: 'dev-contact@najdcommercialhub.ma', // UPDATE: Replace with your dev email
            fromEmail: 'noreply@najdcommercialhub.ma',
            siteName: 'najd-hub-dev.pages.dev (Development)'
          };
        }
      };

      const emailConfig = getEmailConfig();

      // Send email using MailChannels
      const emailPayload = {
        personalizations: [{
          to: [{ 
            email: emailConfig.toEmail,
            name: 'Najd Commercial Hub Team' 
          }],
          subject: `[${environment.toUpperCase()}] New Contact Form Submission - Najd Commercial Hub`
        }],
        from: { 
          email: emailConfig.fromEmail,
          name: 'Najd Commercial Hub Contact Form' 
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: ${environment === 'production' ? '#2c5f2d' : '#d97706'}; color: white; padding: 10px; text-align: center;">
                <h3>ENVIRONMENT: ${environment.toUpperCase()}</h3>
              </div>
              
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone}</p>
              <p><strong>Interest Type:</strong> ${formData.interestType || 'Not specified'}</p>
              <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
              <p><strong>Message:</strong></p>
              <p>${formData.message || 'No message provided'}</p>
              <hr>
              <p><small>Submitted from ${emailConfig.siteName}</small></p>
            </div>
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
        const errorText = await mailResponse.text();
        console.error('MailChannels error:', errorText);
        throw new Error(`Failed to send email: ${mailResponse.status}`);
      }

      // Send confirmation email to user (only in production)
      if (environment === 'production') {
        const confirmationPayload = {
          personalizations: [{
            to: [{ email: formData.email, name: formData.name }],
            subject: 'شكراً لاهتمامكم بمركز نجد التجاري - Thank you for your interest in Najd Commercial Hub'
          }],
          from: { 
            email: emailConfig.fromEmail,
            name: 'Najd Commercial Hub' 
          },
          content: [{
            type: 'text/html',
            value: `
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
            `
          }]
        };

        const confirmationResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(confirmationPayload)
        });

        if (!confirmationResponse.ok) {
          console.error('Failed to send confirmation email:', await confirmationResponse.text());
        }
      }

      // Environment-specific success messages
      const getSuccessMessage = () => {
        if (environment === 'production') {
          return 'Thank you! Your request has been submitted successfully. شكراً! تم إرسال طلبكم بنجاح.';
        } else {
          return `[DEV MODE] Form submitted successfully! Check ${emailConfig.toEmail} for the test email.`;
        }
      };

      return new Response(JSON.stringify({ 
        success: true, 
        message: getSuccessMessage(),
        environment: environment // Helpful for debugging
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      });

    } catch (error) {
      console.error('Form submission error:', error);
      
      const environment = env.ENVIRONMENT || 'development';
      const errorMessage = environment === 'production' 
        ? 'Sorry, there was an error processing your request. Please try again. عذراً، حدث خطأ في معالجة طلبكم. يرجى المحاولة مرة أخرى.'
        : `[DEV MODE] Error: ${error.message}`;
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: errorMessage,
        environment: environment
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      });
    }
  }
};