using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Setting
    {
        [Key]
        public int SettingID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }

        public string Theme { get; set; } = "light";  // "light" or "dark"

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public User User { get; set; }
    }
}