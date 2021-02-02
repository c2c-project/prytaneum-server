import mailgun from 'mailgun-js';
import env from 'config/env';

const mg = mailgun({
    apiKey: env.MAILGUN_API_KEY,
    domain: env.MAILGUN_DOMAIN,
});

/**
 * @description internal function to use mg api to send email
 * @param {string} to email adress being sent to
 * @param {string} subject subject of the email
 * @param {string} text body of the email
 * @param {Date} deliveryTime Time that the email should be sent out (If the date is in the past it will be sent immediately)
 * @param {string} recipientVariables stringified recipient variables for email template
 * @param {string} customAPIKey? optional custom API key for mailgun
 * @param {string} customDomain? optional custom domain for mailgun
 * @returns {Promise<string | mailgun.messages.SendResponse>}
 */
const sendEmail = async (
    to: string | Array<string>,
    subject: string,
    text: string,
    deliveryTime: Date,
    recipientVariables: string,
    customAPIKey?: string,
    customDomain?: string
    // eslint-disable-next-line consistent-return
): Promise<string | mailgun.messages.SendResponse> => {
    // in development mode, don't send an email, instead we will test this on the staging server
    // TODO allow user to pass through custom api key and domain
    let customMailgun: mailgun.Mailgun | undefined;
    if (customAPIKey && customDomain) {
        customMailgun = mailgun({ apiKey: customAPIKey, domain: customDomain });
    }
    if (env.NODE_ENV === 'test') {
        return new Promise<string>((resolve) => resolve('success'));
    }
    if (env.NODE_ENV === 'development') {
        return new Promise<string>((resolve) => resolve('success'));
    }
    if (customMailgun) {
        return customMailgun.messages().send({
            to,
            from: `Prytaneum <${env.MAILGUN_FROM_EMAIL as string}>`,
            subject,
            text,
            'recipient-variables': recipientVariables,
            'o:deliverytime': deliveryTime.toUTCString(),
        });
    }
    return mg.messages().send({
        to,
        from: `Prytaneum <${env.MAILGUN_FROM_EMAIL as string}>`,
        subject,
        text,
        'recipient-variables': recipientVariables,
        'o:deliverytime': deliveryTime.toUTCString(),
    });
};

// function sendEmail(...args: any) {}

// eslint-disable-next-line
function sendPasswordReset(...args: any) {}

// eslint-disable-next-line
function sendEmailVerification(...args: any) {}

export default {
    sendPasswordReset,
    sendEmail,
    sendEmailVerification,
    mg,
};
