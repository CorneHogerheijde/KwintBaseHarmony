using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KwintBaseHarmony.Models;

public enum UserRole
{
    Student,
    Educator
}

[Table("Users")]
public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(255)]
    public string Email { get; set; } = "";

    public string? PasswordHash { get; set; }

    [StringLength(50)]
    public string? ExternalProvider { get; set; }

    [StringLength(255)]
    public string? ExternalProviderId { get; set; }

    [Required]
    public UserRole Role { get; set; } = UserRole.Student;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Composition> Compositions { get; set; } = new List<Composition>();
}
