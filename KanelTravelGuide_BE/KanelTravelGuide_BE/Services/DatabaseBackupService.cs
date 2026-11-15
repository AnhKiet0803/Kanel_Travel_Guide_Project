using System.Text.RegularExpressions;
using KanelTravelGuide_BE.Data;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Services;

public class DatabaseBackupService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;

    public DatabaseBackupService(AppDbContext db, IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    public string BackupDirectory => Path.Combine(_environment.ContentRootPath, "App_Data", "backups");

    public async Task<string> BackupAsync()
    {
        Directory.CreateDirectory(BackupDirectory);
        var fileName = $"KarnelTravelGuide_{DateTime.UtcNow:yyyyMMddHHmmss}.bak";
        var path = Path.Combine(BackupDirectory, fileName);
        var database = DatabaseName();
        await _db.Database.ExecuteSqlRawAsync(
            $"BACKUP DATABASE [{database}] TO DISK = {{0}} WITH INIT",
            path);
        return fileName;
    }

    public async Task RestoreAsync(string fileName)
    {
        if (!BackupFileNames.IsSafe(fileName))
        {
            throw new InvalidOperationException("Backup file name is invalid.");
        }

        var path = Path.Combine(BackupDirectory, fileName);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Backup file was not found.", fileName);
        }

        var database = DatabaseName();
        await _db.Database.ExecuteSqlRawAsync(
            $"ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [{database}] FROM DISK = {{0}} WITH REPLACE; ALTER DATABASE [{database}] SET MULTI_USER;",
            path);
    }

    private string DatabaseName()
    {
        var name = _db.Database.GetDbConnection().Database;
        if (!Regex.IsMatch(name, "^[A-Za-z0-9_]+$"))
        {
            throw new InvalidOperationException("Database name is invalid.");
        }

        return name;
    }
}

public static class BackupFileNames
{
    public static bool IsSafe(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return false;
        }

        return fileName == Path.GetFileName(fileName)
            && fileName.EndsWith(".bak", StringComparison.OrdinalIgnoreCase)
            && !fileName.Contains("..", StringComparison.Ordinal);
    }
}
