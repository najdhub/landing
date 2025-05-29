// Cloudflare Worker for handling contact form submissions
export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);
    console.log(`---------- New Request ----------`);
    console.log(`Worker received request: ${request.method} ${requestUrl.pathname}${requestUrl.search}`);
    console.log(`Origin header: ${request.headers.get('Origin')}`);
    console.log(`env.ENVIRONMENT variable: ${env.ENVIRONMENT}`); // Log the raw env variable

    // Determine CORS origin based on environment
    const environment = env.ENVIRONMENT || 'development'; // Default to 'development'
    console.log(`Determined environment: ${environment}`);

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
          'https://najd-hub-dev.pages.dev', // Main dev Pages domain
          'https://develop.najd-hub-dev.pages.dev/',
          // Add your specific preview deployment URL if it's fixed or pattern based
        ];
        // Allow any subdomain of najd-hub-dev.pages.dev for preview deployments
        if (origin && origin.endsWith('.najd-hub-dev.pages.dev')) {
            console.log(`Allowing dynamic dev origin: ${origin}`);
            return origin;
        }
        if (allowedDevOrigins.includes(origin)) {
          console.log(`Allowing configured dev origin: ${origin}`);
          return origin;
        }
		
        // Fallback for development if origin doesn't match a known one
        console.log(`Origin ${origin} not in allowedDevOrigins, falling back to https://develop.najd-hub-dev.pages.dev/ for CORS`);
        return 'https://develop.najd-hub-dev.pages.dev/';
      }
    };

    const allowedOrigin = getAllowedOrigin();
    console.log(`CORS allowedOrigin set to: ${allowedOrigin}`);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request.');
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
      console.log(`Method ${request.method} not allowed.`);
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.json();
      console.log('Received formData:', JSON.stringify(formData, null, 2));

      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        console.log('Validation failed: Required fields missing.');
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
        console.log('Validation failed: Invalid email format.');
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
																			  
      const getEmailConfig = () => {
        if (environment === 'production') {
          return {
            toEmail: 'contact@najdcommercialhub.ma',
            fromEmail: 'noreply@najdcommercialhub.ma',
            siteName: 'najdcommercialhub.ma'
          };
        } else {
          return {
            toEmail: 'dev-contact@najdcommercialhub.ma',
            fromEmail: 'noreply@najdcommercialhub.ma', // Still use a valid domain for from
            siteName: `develop.najd-hub-dev.pages.dev (${environment})` // Include actual env
          };
        }
      };

      const emailConfig = getEmailConfig();
      console.log('Using emailConfig:', JSON.stringify(emailConfig, null, 2));

      // Send email using MailChannels
      const adminEmailPayload = {
        personalizations: [{
          to: [{
            email: emailConfig.toEmail,
            name: 'Najd Commercial Hub Team'
          }],
          // Dynamic subject based on environment
          subject: `[${environment.toUpperCase()}] New Contact: ${formData.name} - ${formData.interestType}`
        }],
        from: {
          email: emailConfig.fromEmail, // Use configured fromEmail
          name: `Najd Hub Form (${environment.toUpperCase()})` // Indicate environment in From name
        },
        reply_to: { // Add reply-to for convenience
            email: formData.email,
            name: formData.name
        },
        content: [{
          type: 'text/html',
          value: `
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
          `
        }]
      };
      console.log('Attempting to send admin notification email...');
      console.log('Admin Email Payload:', JSON.stringify(adminEmailPayload, null, 2)); // Log the payload

							  
      const adminMailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
				  
        headers: { 'Content-Type': 'application/json' },
		  
        body: JSON.stringify(adminEmailPayload)
      });

      console.log(`MailChannels admin email response status: ${adminMailResponse.status}`);
      if (!adminMailResponse.ok) {
        const errorText = await adminMailResponse.text();
        console.error('MailChannels admin email error response text:', errorText);
        throw new Error(`Failed to send admin email via MailChannels: ${adminMailResponse.status} - ${errorText}`);
      } else {
        console.log('MailChannels admin email sent successfully (or accepted for delivery).');
      }

      // Send confirmation email to user (only in production)
      if (environment === 'production') {
        console.log('Environment is production. Attempting to send user confirmation email...');
        const confirmationPayload = { /* ... your existing confirmation payload ... */ }; // Keep this as is
        console.log('User Confirmation Payload:', JSON.stringify(confirmationPayload, null, 2));
																																								 
			 
				  
										 
										
			
					 
							  
					
																																																				   
																																																	  
																																																	  
				
																																																																													 
																																																																																											   
				
																																	
																																																		
				
					
																														
																														
				
																																																	
																										  
																						   
																						  
					
					
			 
			
		  

        const confirmationResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
					
          headers: { 'Content-Type': 'application/json' },
			
          body: JSON.stringify(confirmationPayload)
        });
        console.log(`MailChannels user confirmation email response status: ${confirmationResponse.status}`);
        if (!confirmationResponse.ok) {
          const errorTextConf = await confirmationResponse.text();
          console.error('MailChannels user confirmation email error response text:', errorTextConf);
          // Don't throw error for failed confirmation, but log it.
        } else {
          console.log('MailChannels user confirmation email sent successfully (or accepted for delivery).');
        }
      } else {
        console.log('Environment is NOT production. Skipping user confirmation email.');
      }

											  
      const getSuccessMessage = () => { /* ... your existing getSuccessMessage ... */ };
										   
																																										 
				
																																										
		 
		

      console.log('Form processing complete. Sending success response to client.');
      return new Response(JSON.stringify({
        success: true,
        message: getSuccessMessage(),
        environment: environment
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      });

    } catch (error) {
      console.error('!!! Top-level form submission error catch block !!!');
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);

      const errorMessageForClient = environment === 'production'
        ? 'Sorry, there was an error processing your request. Please try again. عذراً، حدث خطأ في معالجة طلبكم. يرجى المحاولة مرة أخرى.'
        : `[DEV MODE] Error: ${error.message}`;

      return new Response(JSON.stringify({
        success: false,
        message: errorMessageForClient,
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