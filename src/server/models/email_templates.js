const defaultTemplates = {
    'Expert Signup': {
        subject: 'Welcome to Expertise Station - Your Expert Account Details',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Welcome to Expertise Station!</h2>
                <p>Dear <%= name %>,</p>
                <p>Thank you for joining Expertise Station as an expert. Your account has been successfully created.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Your Login Credentials:</h3>
                    <p><strong>Email:</strong> <%= email %></p>
                    <p><strong>Password:</strong> <%= password %></p>
                </div>
                <p style="color: #dc2626;">For security reasons, please change your password after your first login.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Next Steps:</h3>
                    <ol>
                        <li>Log in to your account using the credentials above</li>
                        <li>Complete your expert profile with your expertise and experience</li>
                        <li>Set your availability for sessions</li>
                        <li>Add your audio session pricing</li>
                        <li>Start accepting bookings!</li>
                    </ol>
                </div>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Seeker Signup': {
        subject: 'Welcome to Expertise Station - Your Account Details',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Welcome to Expertise Station!</h2>
                <p>Dear <%= name %>,</p>
                <p>Thank you for joining Expertise Station. Your account has been successfully created.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Your Login Credentials:</h3>
                    <p><strong>Email:</strong> <%= email %></p>
                    <p><strong>Password:</strong> <%= password %></p>
                </div>
                <p style="color: #dc2626;">For security reasons, please change your password after your first login.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Next Steps:</h3>
                    <ol>
                        <li>Log in to your account using the credentials above</li>
                        <li>Complete your profile with your company and experience details</li>
                        <li>Browse our expert directory</li>
                        <li>Book your first session!</li>
                    </ol>
                </div>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Forgot Password': {
        subject: 'Reset Your Expertise Station Password',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Dear <%= name %>,</p>
                <p>We received a request to reset your password for your Expertise Station account.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <a href="<%= resetPasswordLink %>" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #dc2626;">This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Booking Accepted': {
        subject: 'Your Booking Has Been Accepted',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Booking Confirmation</h2>
                <p>Dear <%= name %>,</p>
                <p>Great news! Your booking request has been accepted .</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Booking Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                        <li><strong>Amount:</strong> ₹ <%= amount %></li>
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Important Reminders:</h3>
                    <ol>
                        <li>Add this to your calendar</li>
                        <li>Prepare any questions or topics you'd like to discuss</li>
                        <li>Join the session 5 minutes before the scheduled time</li>
                        <li>Ensure you have a stable internet connection</li>
                    </ol>
                </div>
                <p style="color: #dc2626;">If you need to reschedule or cancel, please do so at least 24 hours before the session.</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Booking Rejected': {
        subject: 'Booking Request Update',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Booking Request Status Update</h2>
                <p>Dear <%= name %>,</p>
                <p>We regret to inform you that your booking request has been declined.</p>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #991b1b; margin-top: 0;">Booking Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                    </ul>
                  
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">What You Can Do:</h3>
                    <ol>
                        <li>Try booking with another expert</li>
                        <li>Choose a different time slot</li>
                        <li>Contact our support team if you need assistance</li>
                    </ol>
                </div>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Booking Rescheduled': {
        subject: 'Your Booking Has Been Rescheduled',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Booking Rescheduled</h2>
                <p>Dear <%= name %>,</p>
                <p>Your booking  has been rescheduled.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">New Booking Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                    </ul>
                </div>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #991b1b; margin-top: 0;">Previous Booking Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= old_appointment_date %></li>
                        <li><strong>Time:</strong> <%= old_start_time %> - <%= old_end_time %></li>
                    </ul>
                </div>
                <p>Please update your calendar accordingly.</p>
                <p style="color: #dc2626;">If the new time doesn't work for you, please contact the expert or our support team.</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'New Booking': {
        subject: 'New Booking Request Received',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">New Booking Request</h2>
                <p>Dear <%= expert_name %>,</p>
                <p>You have received a new booking request.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Booking Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                        <li><strong>Amount:</strong> ₹  <%= amount %></li>
                     
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Please Note:</h3>
                    <p>Please review and respond to this request within 24 hours.</p>
                    <p>You can:</p>
                    <ul>
                        <li>Accept the booking</li>
                        <li>Reject the booking (with a reason)</li>
                        <li>Suggest a different time slot</li>
                    </ul>
                </div>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Session Reminder': {
        subject: 'Reminder: Upcoming Session',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Session Reminder</h2>
                <p>Dear <%= name %>,</p>
                <p>This is a reminder about your upcoming session.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Session Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Preparation Checklist:</h3>
                    <ul>
                        <li>Test your audio equipment</li>
                        <li>Find a quiet location</li>
                        <li>Prepare your questions or topics</li>
                        <li>Join 5 minutes before the scheduled time</li>
                    </ul>
                </div>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Session Completed': {
        subject: 'Session Completed - Thank You!',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Session Completed</h2>
                <p>Dear <%= name %>,</p>
                <p>Thank you for completing your session .</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Session Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                    
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Next Steps:</h3>
                    <p>We value your feedback! Please take a moment to rate your session and provide any comments.</p>
                       </div>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Session Feedback': {
        subject: 'Share Your Session Experience',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Session Feedback Request</h2>
                <p>Dear <%= name %>,</p>
                <p>We hope your session was valuable. Your feedback helps us improve our services and helps other users make informed decisions.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Session Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p>Please take a moment to:</p>
                    <ol>
                        <li>Rate your session (1-5 stars)</li>
                        <li>Share your experience</li>
                        <li>Provide any suggestions for improvement</li>
                    </ol>
                        </div>
                <p>Thank you for helping us maintain the quality of our platform!</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    },
    'Session Feedback Received': {
        subject: 'Session Feedback Received',
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Session Feedback Received</h2>
                <p>Dear <%= name %>,</p>
                <p>You have received feedback for your session with <%= expert_name %>.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">Session Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Date:</strong> <%= appointment_date %></li>
                        <li><strong>Time:</strong> <%= start_time %> - <%= end_time %></li>
                        <li><strong>Session Type:</strong> <%= session_type %></li>
                    </ul>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Feedback Details:</h3>
                    <p><strong>Rating:</strong> <%= rating %>/5 stars</p>
                    <p><strong>Review:</strong> <%= review %></p>
                    <p><strong>Message:</strong> <%= message %></p>
                </div>
                <p>Thank you for providing excellent service!</p>
                <p>Best regards,<br>The Expertise Station Team</p>
            </div>
        `
    }
};

module.exports = defaultTemplates; 