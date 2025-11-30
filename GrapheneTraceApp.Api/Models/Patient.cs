using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Patient
    {
        [Key]
        public int PatientID { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }

        public int? Age { get; set; }


        public string? Gender { get; set; }  // "Male", "Female", "Other"

        // Navigation properties
        public User User { get; set; }
        public ICollection<Allocation> Allocations { get; set; } = new List<Allocation>();
        public ICollection<Measurement> Measurements { get; set; } = new List<Measurement>();
        public ICollection<History> Histories { get; set; } = new List<History>();
        public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
        public ICollection<PatientData> PatientDatas { get; set; } = new List<PatientData>();  // Added for CSV allocation
    }
}
