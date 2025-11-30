using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class History
    {
        [Key]
        public int HistoryID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [Required]
        [ForeignKey("Measurement")]
        public int MeasurementID { get; set; }

        public DateTime SnapshotAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Patient Patient { get; set; }
        public Measurement Measurement { get; set; }
    }
}