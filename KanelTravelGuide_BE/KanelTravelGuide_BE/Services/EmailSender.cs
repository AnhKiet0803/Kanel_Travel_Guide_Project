using System.Net;
using System.Net.Mail;

namespace KanelTravelGuide_BE.Services;

public class EmailOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = "noreply@karnel.local";
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
    public bool UseSsl { get; set; } = true;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host);
}

public interface IEmailSender
{
    bool IsConfigured { get; }
    string FrontendBaseUrl { get; }
    Task SendAsync(string to, string subject, string body);
}

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _options = configuration.GetSection("Email").Get<EmailOptions>() ?? new EmailOptions();
    }

    public bool IsConfigured => _options.IsConfigured;

    public string FrontendBaseUrl => string.IsNullOrWhiteSpace(_options.FrontendBaseUrl)
        ? "http://localhost:5173"
        : _options.FrontendBaseUrl.TrimEnd('/');

    public async Task SendAsync(string to, string subject, string body)
    {
        using var message = new MailMessage(_options.From, to, subject, body);
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
        if (!string.IsNullOrWhiteSpace(_options.User))
        {
            client.Credentials = new NetworkCredential(_options.User, _options.Password);
        }

        await client.SendMailAsync(message);
    }
}
