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
        public async System.Threading.Tasks.Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound("User not found.");

                // Only update the provided fields (partial update)
                if (!string.IsNullOrEmpty(request.Name)) user.Name = request.Name;
                if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
                if (!string.IsNullOrEmpty(request.Phone)) user.Phone = request.Phone;
                // Role is not updated here, as it's disabled in the frontend

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

                string role = user.Role?.ToLower(); // Case-insensitive role check
                Console.WriteLine($"Attempting to delete user {userId} with role: '{role}'");

                // Get related entities based on role
                var patient = role == "patient" ? await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId) : null;
                var clinician = role == "clinician" ? await _context.Clinicians.FirstOrDefaultAsync(c => c.UserID == userId) : null;

                // Step 1: Delete from Allocations Table
                try
                {
                    var allocations = new List<Allocation>();
                    if (patient != null)
                        allocations.AddRange(await _context.Allocations.Where(a => a.PatientID == patient.PatientID).ToListAsync());
                    if (clinician != null)
                        allocations.AddRange(await _context.Allocations.Where(a => a.ClinicianID == clinician.ClinicianID).ToListAsync());
                    _context.Allocations.RemoveRange(allocations);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {allocations.Count} allocations for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting allocations for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete allocations: {ex.Message}");
                }

                // Step 2: Delete from Measurements Table (before History, as History references it)
                try
                {
                    var measurements = new List<Measurement>();
                    if (patient != null)
                    {
                        var patientHistories = await _context.History.Where(h => h.PatientID == patient.PatientID).ToListAsync();
                        foreach (var h in patientHistories)
                        {
                            if (h.Measurement != null) measurements.Add(h.Measurement);
                        }
                    }
                    _context.Measurements.RemoveRange(measurements);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {measurements.Count} measurements for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting measurements for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete measurements: {ex.Message}");
                }

                // Step 3: Delete from History Table
                try
                {
                    var histories = patient != null ? await _context.History.Where(h => h.PatientID == patient.PatientID).ToListAsync() : new List<History>();
                    _context.History.RemoveRange(histories);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {histories.Count} history records for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting history for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete history: {ex.Message}");
                }

                // Step 4: Delete from PatientDatas Table
                try
                {
                    var patientDatas = patient != null ? await _context.PatientDatas.Where(pd => pd.PatientID == patient.PatientID).ToListAsync() : new List<PatientData>();
                    _context.PatientDatas.RemoveRange(patientDatas);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {patientDatas.Count} PatientData records for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting PatientData for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete PatientData: {ex.Message}");
                }

                // Step 5: Delete from Alerts Table (for patients)
                try
                {
                    var alerts = patient != null ? await _context.Alerts.Where(a => a.PatientID == patient.PatientID).ToListAsync() : new List<Alert>();
                    _context.Alerts.RemoveRange(alerts);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {alerts.Count} alerts for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting alerts for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete alerts: {ex.Message}");
                }

                // Step 6: Delete from Settings Table (for all users)
                try
                {
                    var settings = await _context.Settings.Where(s => s.UserID == userId).ToListAsync();
                    _context.Settings.RemoveRange(settings);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {settings.Count} settings for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting settings for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete settings: {ex.Message}");
                }

                // Step 7: Delete from Messages Table (for all users, as sender or receiver)
                try
                {
                    var messages = await _context.Messages.Where(m => m.SenderID == userId || m.ReceiverID == userId).ToListAsync();
                    _context.Messages.RemoveRange(messages);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Deleted {messages.Count} messages for user {userId}");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting messages for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete messages: {ex.Message}");
                }

                // Step 8: Delete from Patients or Clinicians Table
                try
                {
                    if (patient != null)
                    {
                        _context.Patients.Remove(patient);
                        Console.WriteLine($"Deleted patient {patient.PatientID} for user {userId}");
                    }
                    else if (clinician != null)
                    {
                        _context.Clinicians.Remove(clinician);
                        Console.WriteLine($"Deleted clinician {clinician.ClinicianID} for user {userId}");
                    }
                    await _context.SaveChangesAsync();
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting patient/clinician for user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete patient/clinician: {ex.Message}");
                }

                // Step 9: Delete from Users Table
                try
                {
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Successfully deleted user {userId}");
                    return Ok("User and all related data deleted successfully.");
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine($"Error deleting user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
                    return StatusCode(500, $"Failed to delete user: {ex.Message}");
                }
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Unexpected error deleting user {userId}: {ex.Message}. Inner: {ex.InnerException?.Message}");
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

        // DELETE: api/admin/history/{historyId}
        [HttpDelete("history/{historyId}")]
        public async System.Threading.Tasks.Task<IActionResult> DeleteHistory(int historyId)
        {
            try
            {
                var history = await _context.History.FindAsync(historyId);
                if (history == null)
                    return NotFound("History not found.");

                // Delete associated measurement if it exists
                if (history.Measurement != null)
                {
                    _context.Measurements.Remove(history.Measurement);
                }

                _context.History.Remove(history);
                await _context.SaveChangesAsync();

                return Ok("History deleted successfully.");
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error deleting history {historyId}: {ex.Message}");
                return StatusCode(500, "Internal server error while deleting history.");
            }
        }

        // GET: api/admin/allocations
        [HttpGet("allocations")]
        public IActionResult GetAllocations()
        {
            try
            {
                var allocations = _context.Allocations
                    .Include(a => a.Patient).ThenInclude(p => p.User)
                    .Include(a => a.Clinician).ThenInclude(c => c.User)
                    .Select(a => new
                    {
                        allocationId = a.AllocationID,
                        patientId = a.PatientID,
                        clinicianId = a.ClinicianID,
                        patientName = a.Patient.User.Name,
                        clinicianName = a.Clinician.User.Name
                    })
                    .ToList();

                return Ok(allocations);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine($"Error fetching allocations: {ex.Message}");
                return StatusCode(500, "Internal server error while fetching allocations.");
            }
        }
    }

    // DTO for partial user updates
    public class UpdateUserRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        // Role is intentionally omitted to prevent changes
    }

    public class AllocationRequest
    {
        public int ClinicianID { get; set; }
        public int PatientID { get; set; }
    }
}