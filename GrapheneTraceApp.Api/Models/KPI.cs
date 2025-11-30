using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class KPI
    {
        [Key]
        public int KPIID { get; set; }

        [Required]
        [ForeignKey("Measurement")]
        public int MeasurementID { get; set; }

        [Required]
        public decimal PeakPressure { get; set; }

        [Required]
        public decimal ContactArea { get; set; }  // Percentage (0-100)

        [Required]
        public decimal LowPressure { get; set; }

        [Required]
        public decimal AvgPressure { get; set; }

        // Navigation properties
        public Measurement Measurement { get; set; }
    }
}