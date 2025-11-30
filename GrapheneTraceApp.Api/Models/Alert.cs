using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Alert
    {
        [Key]
        public int AlertID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [Required]
        public decimal PressureValue { get; set; }

        [Required]
        public string Message { get; set; }

        public bool IsCritical { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Patient Patient { get; set; }
    }
}