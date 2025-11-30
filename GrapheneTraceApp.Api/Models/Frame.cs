using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Frame
    {
        [Key]
        public int FrameID { get; set; }

        [Required]
        [ForeignKey("Measurement")]
        public int MeasurementID { get; set; }

        [Required]
        public string FrameData { get; set; }  // JSON string for 32x32 grid (e.g., array of pressure values)

        public DateTime CapturedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Measurement Measurement { get; set; }
    }
}