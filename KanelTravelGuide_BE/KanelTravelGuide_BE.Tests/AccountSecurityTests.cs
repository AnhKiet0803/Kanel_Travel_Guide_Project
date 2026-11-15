using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Services;

namespace KanelTravelGuide_BE.Tests;

public class AccountSecurityTests
{
    [Fact]
    public void Hash_verifies_the_same_password()
    {
        var stored = PasswordHasher.Hash("User@123");

        Assert.True(PasswordHasher.Verify("User@123", stored));
    }

    [Fact]
    public void Hash_rejects_a_different_password()
    {
        var stored = PasswordHasher.Hash("User@123");

        Assert.False(PasswordHasher.Verify("User@456", stored));
    }

    [Fact]
    public void Reset_token_hash_is_stable_and_hides_the_token()
    {
        var token = PasswordResetTokens.Create();
        var line = PasswordResetTokens.HashLine(token);

        Assert.Equal(line, PasswordResetTokens.HashLine(token));
        Assert.DoesNotContain(token, line);
    }

    [Theory]
    [InlineData("KarnelTravelGuide_20261115.bak", true)]
    [InlineData("../secret.bak", false)]
    [InlineData("notes.txt", false)]
    [InlineData("", false)]
    public void Backup_file_name_must_stay_inside_the_backup_folder(string fileName, bool expected)
    {
        Assert.Equal(expected, BackupFileNames.IsSafe(fileName));
    }
}
