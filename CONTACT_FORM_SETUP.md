# Contact Form Email Setup

The contact form is now configured to send emails to **darainqamar10@gmail.com** when users submit the form.

## Setup Instructions

### Option 1: Using Resend (Recommended)

1. Sign up for a free account at [Resend](https://resend.com)
2. Get your API key from the Resend dashboard
3. Add to your `.env` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev  # Or your verified domain email
FROM_NAME=CollabSpace Contact Form
```

**Note:** For production, you'll need to verify your domain with Resend. For testing, you can use `onboarding@resend.dev` (Resend's test email).

### Option 2: Using SMTP (Alternative)

If you prefer to use SMTP (Gmail, SendGrid, etc.), add these to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=CollabSpace Contact Form
```

**Note:** For Gmail, you'll need to generate an "App Password" in your Google Account settings.

## Development Mode

If no email service is configured, the form will still work in development mode and log the email content to the console. In production, it will return an error if email is not configured.

## Testing

1. Fill out the contact form
2. Submit the form
3. Check your email at **darainqamar10@gmail.com**
4. The email will include:
   - Name
   - Email (as reply-to)
   - Subject
   - Message content
   - User ID

