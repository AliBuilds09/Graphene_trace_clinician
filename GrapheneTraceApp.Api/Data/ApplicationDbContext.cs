using Microsoft.EntityFrameworkCore;
using GrapheneTraceApp.Api.Models;

namespace GrapheneTraceApp.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // DbSets for all models
        public DbSet<User> Users { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Clinician> Clinicians { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Allocation> Allocations { get; set; }
        public DbSet<Measurement> Measurements { get; set; }
        public DbSet<History> History { get; set; }
        public DbSet<Alert> Alerts { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<PatientData> PatientDatas { get; set; }
        public DbSet<Frame> Frames { get; set; }
        public DbSet<KPI> KPIs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Map History model to "History" table (singular)
            modelBuilder.Entity<History>().ToTable("History");

            // Configure Message relationships (self-referencing to User)
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverID)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Allocation relationships (prevent cascade cycles)
            modelBuilder.Entity<Allocation>()
                .HasOne(a => a.Clinician)
                .WithMany(c => c.Allocations)
                .HasForeignKey(a => a.ClinicianID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Allocation>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Allocations)
                .HasForeignKey(a => a.PatientID)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique index for Allocation
            modelBuilder.Entity<Allocation>()
                .HasIndex(a => new { a.ClinicianID, a.PatientID })
                .IsUnique();

            // Cascade deletes for freeing CSVs
            modelBuilder.Entity<User>()
                .HasOne(u => u.Patient)
                .WithOne(p => p.User)
                .HasForeignKey<Patient>(p => p.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Patient>()
                .HasMany(p => p.PatientDatas)
                .WithOne(pd => pd.Patient)
                .HasForeignKey(pd => pd.PatientID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}