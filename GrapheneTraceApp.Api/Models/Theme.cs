using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class UserTheme  // Renamed to avoid conflict with Setting.cs
    {
        [Key]
        public int ThemeID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }

        public string ThemeValue { get; set; } = "light";  // "light" or "dark"

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public User User { get; set; }
    }
}