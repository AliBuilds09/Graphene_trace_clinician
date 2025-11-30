using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Admin
    {
        [Key]
        public int AdminID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }

        // Navigation properties
        public User User { get; set; }
    }
}