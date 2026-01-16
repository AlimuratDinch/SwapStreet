using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Contracts.Auth;
using Microsoft.Extensions.Logging;

namespace backend.Services.Auth
{
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendEmailAsync(string to, string subject, string body)
        {
            _logger.LogInformation("--------------------------------------------------");
            _logger.LogInformation($"[MOCK EMAIL] To: {to}");
            _logger.LogInformation($"[MOCK EMAIL] Subject: {subject}");
            _logger.LogInformation($"[MOCK EMAIL] Body: {body}");
            _logger.LogInformation("--------------------------------------------------");

            return Task.CompletedTask;
        }


        public Task SendWelcomeEmailAsync(string toEmail, string firstName, string confirmationLink)
        {
            _logger.LogInformation("\n---------------- [MOCK WELCOME EMAIL] ----------------");
            _logger.LogInformation($"To: {toEmail}");
            _logger.LogInformation($"Hi {firstName}, Welcome to SwapStreet!");
            _logger.LogInformation($"CLICK THIS LINK TO CONFIRM:");
            _logger.LogInformation(confirmationLink);
            _logger.LogInformation("-----------------------------------------------------\n");

            return Task.CompletedTask;
        }

    }
}