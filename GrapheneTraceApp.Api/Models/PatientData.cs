using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class PatientData
    {
        [Key]
        public int PatientDataID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }  // Remains int (not nullable)

        [Required]
        public string FileName { get; set; }  // e.g., "csv1.csv"

        public string? FilePath { get; set; }  // Path to stored CSV file

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Patient Patient { get; set; }
    }
}