using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Measurement
    {
        [Key]
        public int MeasurementID { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public int PatientID { get; set; }

        [Required]
        public decimal PeakPressure { get; set; }

        [Required]
        public decimal ContactArea { get; set; }  // Percentage (0-100)

        [Required]
        public decimal LowPressure { get; set; }

        [Required]
        public decimal AvgPressure { get; set; }

        public string? HeatmapData { get; set; }  // JSON string for 32x32 grid

        public string? LineChartData { get; set; }  // JSON string for chart data

        // Added for storing serialized frame data (e.g., JSON string of frames)
        public string? FrameData { get; set; }

        public DateTime MeasuredAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Patient Patient { get; set; }
        public ICollection<Frame> Frames { get; set; } = new List<Frame>();
        public ICollection<KPI> KPIs { get; set; } = new List<KPI>();
        public ICollection<History> Histories { get; set; } = new List<History>();
    }
}
