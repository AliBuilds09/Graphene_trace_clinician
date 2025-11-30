using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GrapheneTraceApp.Api.Controllers
{
    [Authorize(Roles = "Admin")]  // Ensure this matches your DB role casing (e.g., "admin" lowercase)
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public IActionResult GetAllUsers()
        {
            try
            {
                var users = _context.Users
                    .Select(u => new
                    {
                        userId = u.UserID,
                        name = u.Name,
                        email = u.Email,
                        phone = u.Phone,
                        role = u.Role
                    })
                    .ToList();

                return Ok(users);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error fetching users: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching users.");
            }
        }

        // GET: api/admin/patients
        [HttpGet("patients")]
        public IActionResult GetPatients()
        {
            try
            {
                var patients = _context.Patients
                    .Include(p => p.User)
                    .Select(p => new
                    {
                        patientId = p.PatientID,
                        age = p.Age,
                        gender = p.Gender,
                        name = p.User != null ? p.User.Name : "N/A",
                        email = p.User != null ? p.User.Email : "N/A",
                        phone = p.User != null ? p.User.Phone : "N/A"
                    })
                    .ToList();

                return Ok(patients);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error fetching patients: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching patients.");
            }
        }

        // GET: api/admin/clinicians
        [HttpGet("clinicians")]
        public IActionResult GetClinicians()
        {
            try
            {
                var clinicians = _context.Clinicians
                    .Include(c => c.User)
                    .Select(c => new
                    {
                        clinicianId = c.ClinicianID,
                        licenseNumber = c.LicenseNumber,
                        hospitalName = c.HospitalName,
                        specialization = c.Specialization,
                        name = c.User != null ? c.User.Name : "N/A",
                        email = c.User != null ? c.User.Email : "N/A",
                        phone = c.User != null ? c.User.Phone : "N/A"
                    })
                    .ToList();

                return Ok(clinicians);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error fetching clinicians: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching clinicians.");
            }
        }

        // PUT: api/admin/user/{userId}
        [HttpPut("user/{userId}")]
        public async System.Threading.Tasks.Task<IActionResult> UpdateUser(int userId, [FromBody] User updatedUser)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound("User not found.");

                user.Name = updatedUser.Name;
                user.Email = updatedUser.Email;
                user.Phone = updatedUser.Phone;
                user.Role = updatedUser.Role;

                await _context.SaveChangesAsync();

                return Ok("User updated successfully.");
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error updating user {userId}: {ex.Message}");
                return StatusCode(500, "Internal server error while updating user.");
            }
        }

        // POST: api/admin/allocate
        [HttpPost("allocate")]
        public async System.Threading.Tasks.Task<IActionResult> AllocatePatient([FromBody] AllocationRequest request)
        {
            try
            {
                // Validation: Check if PatientID and ClinicianID are provided
                if (request.PatientID <= 0 || request.ClinicianID <= 0)
                {
                    return BadRequest("Invalid PatientID or ClinicianID.");
                }

                // Validation: Check if patient exists
                var patient = await _context.Patients.FindAsync(request.PatientID);
                if (patient == null)
                {
                    return NotFound("Patient not found.");
                }

                // Validation: Check if clinician exists
                var clinician = await _context.Clinicians.FindAsync(request.ClinicianID);
                if (clinician == null)
                {
                    return NotFound("Clinician not found.");
                }

                // Validation: Check for existing allocation (prevent duplicates)
                var existingAllocation = await _context.Allocations
                    .FirstOrDefaultAsync(a => a.PatientID == request.PatientID);
                if (existingAllocation != null)
                {
                    return BadRequest("Patient is already allocated to a clinician.");
                }

                // Create and save allocation
                var allocation = new Allocation
                {
                    ClinicianID = request.ClinicianID,
                    PatientID = request.PatientID
                };
                _context.Allocations.Add(allocation);
                await _context.SaveChangesAsync();

                return Ok("Patient allocated successfully.");
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error allocating patient: {ex.Message}");
                return StatusCode(500, $"Internal server error while allocating patient: {ex.Message}");
            }
        }

        // DELETE: api/admin/user/{userId}
        [HttpDelete("user/{userId}")]
        public async System.Threading.Tasks.Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound("User not found.");

                // Free up allocated CSVs by deleting PatientData entries for the patient
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient != null)
                {
                    var allocatedCsvs = await _context.PatientDatas
                        .Where(pd => pd.PatientID == patient.PatientID)
                        .ToListAsync();
                    _context.PatientDatas.RemoveRange(allocatedCsvs);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Freed up {allocatedCsvs.Count} CSVs for patient {patient.PatientID}");
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok("User deleted. Allocated CSVs are now available for new patients.");
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error deleting user {userId}: {ex.Message}");
                return StatusCode(500, "Internal server error while deleting user.");
            }
        }

        // GET: api/admin/history/{patientId}
        [HttpGet("history/{patientId}")]
        public IActionResult GetPatientHistory(int patientId)
        {
            try
            {
                var history = _context.History
                    .Include(h => h.Measurement)  // Added: Include Measurement to populate the data
                    .Where(h => h.PatientID == patientId)
                    .OrderByDescending(h => h.SnapshotAt)  // Added: Order by snapshot time
                    .Select(h => new  // Fixed: Use camelCase aliases to match frontend expectations
                    {
                        historyID = h.HistoryID,
                        snapshotAt = h.SnapshotAt,
                        measurement = h.Measurement != null ? new
                        {
                            peakPressure = h.Measurement.PeakPressure,
                            contactArea = h.Measurement.ContactArea,
                            lowPressure = h.Measurement.LowPressure,
                            avgPressure = h.Measurement.AvgPressure,
                            frameData = h.Measurement.FrameData,
                            heatmapData = h.Measurement.HeatmapData,
                            lineChartData = h.Measurement.LineChartData
                        } : null
                    })
                    .ToList();

                return Ok(history);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error fetching history for patient {patientId}: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching history.");
            }
        }
    }

    public class AllocationRequest
    {
        public int ClinicianID { get; set; }
        public int PatientID { get; set; }
    }
}