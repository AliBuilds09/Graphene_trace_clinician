using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
	public class Allocation
	{
		[Key]
		public int AllocationID { get; set; }

		[Required]
		[ForeignKey("Clinician")]
		public int ClinicianID { get; set; }

		[Required]
		[ForeignKey("Patient")]
		public int PatientID { get; set; }

		public DateTime AllocatedAt { get; set; } = DateTime.Now;

		// Navigation properties
		public Clinician Clinician { get; set; }
		public Patient Patient { get; set; }
	}
}