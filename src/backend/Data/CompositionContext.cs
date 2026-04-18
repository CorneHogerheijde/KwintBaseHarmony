using Microsoft.EntityFrameworkCore;
using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Data;

/// <summary>
/// Entity Framework DbContext for Composition, Layer, and Note entities.
/// Configured for PostgreSQL with proper relationships and indices.
/// </summary>
public class CompositionContext : DbContext
{
    public CompositionContext(DbContextOptions<CompositionContext> options)
        : base(options)
    {
    }

    public DbSet<Composition> Compositions { get; set; } = null!;
    public DbSet<Layer> Layers { get; set; } = null!;
    public DbSet<Note> Notes { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composition configuration
        modelBuilder.Entity<Composition>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.StudentId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Difficulty)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.CompletionPercentage)
                .HasPrecision(5, 1);

            // Index for efficient student queries
            entity.HasIndex(e => e.StudentId)
                .HasDatabaseName("IX_Compositions_StudentId");

            // Index for pagination and sorting by creation
            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_Compositions_CreatedAt");

            // Relationships
            entity.HasMany(e => e.Layers)
                .WithOne(l => l.Composition)
                .HasForeignKey(l => l.CompositionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Layer configuration
        modelBuilder.Entity<Layer>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.LayerNumber)
                .IsRequired();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Concept)
                .HasMaxLength(500);

            entity.Property(e => e.UserNotes)
                .HasMaxLength(1000);

            // Composite index for efficient layer lookups
            entity.HasIndex(e => new { e.CompositionId, e.LayerNumber })
                .HasDatabaseName("IX_Layers_CompositionId_LayerNumber")
                .IsUnique();

            // Relationships
            entity.HasMany(e => e.Notes)
                .WithOne(n => n.Layer)
                .HasForeignKey(n => n.LayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Note configuration
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Pitch)
                .IsRequired();

            entity.Property(e => e.DurationMs)
                .IsRequired();

            entity.Property(e => e.TimingMs)
                .IsRequired();

            entity.Property(e => e.Velocity)
                .IsRequired()
                .HasDefaultValue(100);

            // Index for efficient note queries within a layer
            entity.HasIndex(e => e.LayerId)
                .HasDatabaseName("IX_Notes_LayerId");

            // Index for timing-based queries (e.g., notes in playback order)
            entity.HasIndex(e => new { e.LayerId, e.TimingMs })
                .HasDatabaseName("IX_Notes_LayerId_TimingMs");
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(e => e.Email)
                .HasDatabaseName("IX_Users_Email")
                .IsUnique();

            entity.Property(e => e.PasswordHash)
                .IsRequired();

            entity.Property(e => e.Role)
                .IsRequired()
                .HasConversion<string>();

            // Compositions owned by this user
            entity.HasMany(e => e.Compositions)
                .WithOne(c => c.User)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
