using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Clinician
    {
        [Key]
        public int ClinicianID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }

        [Required]
        public string LicenseNumber { get; set; }

        [Required]
        public string HospitalName { get; set; }

        public string? Specialization { get; set; }

        // Navigation properties
        public User User { get; set; }
        public ICollection<Allocation> Allocations { get; set; } = new List<Allocation>();
    }
}