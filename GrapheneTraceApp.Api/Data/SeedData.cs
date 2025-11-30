using GrapheneTraceApp.Api.Models;
using GrapheneTraceApp.Api.Data;
using static BCrypt.Net.BCrypt;

namespace GrapheneTraceApp.Api.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

            // Ensure database is created
            context.Database.EnsureCreated();

            // Seed admin user if not exists
            if (!context.Users.Any(u => u.Role == "Admin"))
            {
                Console.WriteLine("Creating admin user...");  // Debug log
                var adminUser = new User
                {
                    Email = "admin@example.com",
                    Phone = "345-678-9012",
                    PasswordHash = HashPassword("Admin@123"),
                    Role = "Admin",
                    Name = "Admin User",
                    IsActive = true
                };
                context.Users.Add(adminUser);
                context.SaveChanges();

                var admin = new Admin { UserID = adminUser.UserID };
                context.Admins.Add(admin);
                context.SaveChanges();
                Console.WriteLine("Admin user created successfully.");  // Debug log
            }
            else
            {
                Console.WriteLine("Admin user already exists.");  // Debug log
            }
        }
    }
}