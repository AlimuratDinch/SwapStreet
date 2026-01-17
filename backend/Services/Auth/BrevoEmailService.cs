using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using backend.Contracts.Auth;
using Task = System.Threading.Tasks.Task;
// 1. Brevo Namespaces
using brevo_csharp.Api;
using brevo_csharp.Client;
using brevo_csharp.Model;

namespace backend.Services.Auth
{
    public class BrevoEmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public BrevoEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            // 2. Get Config (Using flat keys from your .env)
            var apiKey = _config["BREVO_API_KEY"];
            var senderName = _config["EMAIL_SENDER_NAME"] ?? "SwapStreet";
            var senderEmail = _config["EMAIL_SENDER_ADDRESS"];

            // Safety Checks
            if (string.IsNullOrEmpty(apiKey))
                throw new Exception("BREVO_API_KEY is missing in environment variables.");

            if (string.IsNullOrEmpty(senderEmail))
                throw new Exception("EMAIL_SENDER_ADDRESS is missing in environment variables.");

            // 3. Configure the Brevo Client
            if (!brevo_csharp.Client.Configuration.Default.ApiKey.ContainsKey("api-key"))
            {
                brevo_csharp.Client.Configuration.Default.ApiKey.Add("api-key", apiKey);
            }
            else
            {
                brevo_csharp.Client.Configuration.Default.ApiKey["api-key"] = apiKey;
            }

            var apiInstance = new TransactionalEmailsApi();

            // 4. Build the Email Object
            var sendSmtpEmail = new SendSmtpEmail(
                sender: new SendSmtpEmailSender(senderName, senderEmail),
                to: new List<SendSmtpEmailTo> { new SendSmtpEmailTo(to) },
                subject: subject,
                htmlContent: body
            );

            // 5. Send via API
            try
            {
                await apiInstance.SendTransacEmailAsync(sendSmtpEmail);
                Console.WriteLine($"[Brevo] Email sent successfully to {to}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"[Brevo] Error sending email: {e.Message}");
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string firstName, string confirmationLink)
        {
            string subject = "Welcome to SwapStreet! / Bienvenue à SwapStreet!";

            // Generate the HTML using your helper
            string htmlBody = GetWelcomeEmailBody(firstName, confirmationLink);

            // Send it using the worker method above
            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        // 6. HTML Template Helper (With Marc's Green Styling)
        private string GetWelcomeEmailBody(string firstName, string confirmationLink)
        {
            return $@"
            <html>
                <body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333;"">
                    <div style=""max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;"">
                        <h2 style=""color: #2c5034; text-align: center;"">Welcome to SwapStreet! / Bienvenue à SwapStreet!</h2>
                        
                        <p>Hi {firstName},</p>
                        <p>Thanks for joining the community. Please confirm your email address to activate your account.</p>
                        
                        <hr style=""border: 0; border-top: 1px solid #39aa17; margin: 20px 0;"">

                        <p>Bonjour {firstName},</p>
                        <p>Merci d'avoir rejoint la communauté. Veuillez confirmer votre adresse courriel pour activer votre compte.</p>

                        <div style=""text-align: center; margin: 30px 0;"">
                            <a href=""{confirmationLink}"" 
                               style=""background-color: #0efd4a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;"">
                               Confirm Email / Confirmer courriel
                            </a>
                        </div>

                        <p style=""font-size: 12px; color: #888; text-align: center;"">
                            If the button doesn't work, copy this link:<br>
                            <a href=""{confirmationLink}"">{confirmationLink}</a>
                        </p>
                    </div>
                </body>
            </html>";
        }
    }
}