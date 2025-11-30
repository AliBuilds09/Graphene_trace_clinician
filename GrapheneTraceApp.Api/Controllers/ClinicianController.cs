using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using System.IO;
using System.Linq;
using System.Security.Claims; // Added for JWT claims

namespace GrapheneTraceApp.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicianController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClinicianController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper to parse CSV into frames (reused from PatientController)
        private async Task<List<FrameData>> ParseCsv(string filePath)
        {
            var frames = new List<FrameData>();
            try
            {
                if (!System.IO.File.Exists(filePath))
                {
                    Console.WriteLine($"CSV file not found: {filePath}");
                    return frames;
                }
                var lines = await System.IO.File.ReadAllLinesAsync(filePath);
                for (int i = 0; i < lines.Length; i += 32)
                {
                    var frameValues = new List<double>();
                    for (int j = 0; j < 32 && i + j < lines.Length; j++)
                    {
                        var parts = lines[i + j].Split(',');
                        if (parts.Length != 32) continue;
                        var values = parts.Select(p => double.TryParse(p, out var v) ? v : 0).ToList();
                        frameValues.AddRange(values);
                    }
                    if (frameValues.Count == 1024)
                    {
                        var peak = frameValues.Max();
                        var low = frameValues.Min();
                        var avg = frameValues.Average();
                        var contactArea = frameValues.Count(v => v > 0) / 1024.0 * 100;
                        frames.Add(new FrameData { Values = frameValues, PeakPressure = peak, LowPressure = low, AvgPressure = avg, ContactArea = contactArea });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing CSV {filePath}: {ex.Message}");
            }
            return frames;
        }

        public class FrameData
        {
            public List<double> Values { get; set; }
            public double PeakPressure { get; set; }
            public double LowPressure { get; set; }
            public double AvgPressure { get; set; }
            public double ContactArea { get; set; }
        }

        // GET: api/clinician/dashboard/{userId} - Enhanced with patient data from Allocations table, alerts, and high-pressure detection
        [HttpGet("dashboard/{userId}")]
        public async Task<IActionResult> GetDashboard(int userId)
        {
            try
            {
                Console.WriteLine($"Fetching clinician dashboard for userId: {userId}");

                var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                if (clinician == null)
                {
                    Console.WriteLine("Clinician not found for userId: " + userId);
                    return NotFound("Clinician not found");
                }
                Console.WriteLine($"Clinician found: ID={clinician.ClinicianID}, Name={clinician.Name}");

                var clinicianData = new
                {
                    clinician.ClinicianID,
                    Name = clinician.Name ?? "N/A",
                    Phone = clinician.Phone ?? "N/A",
                    Email = clinician.Email ?? "N/A",
                    clinician.LicenseNumber,
                    clinician.HospitalName,
                    clinician.Specialization
                };

                // Query Allocations table to get allocated patients
                var allocations = await _context.Allocations
                    .Where(a => a.ClinicianID == clinician.ClinicianID)
                    .Include(a => a.Patient)
                    .ToListAsync();

                Console.WriteLine($"Allocations found: {allocations.Count}");
                foreach (var alloc in allocations)
                {
                    Console.WriteLine(string.Format("Allocation: ClinicianID={0}, PatientID={1}, Patient Name={2}", alloc.ClinicianID, alloc.PatientID, alloc.Patient?.Name ?? "Null"));
                }

                var allocatedPatients = new List<object>();
                var alerts = new List<object>();

                foreach (var allocation in allocations)
                {
                    if (allocation.Patient == null)
                    {
                        Console.WriteLine($"Patient is null for allocation: {allocation.AllocationID}");
                        continue;
                    }

                    var patient = allocation.Patient;
                    Console.WriteLine($"Processing patient: ID={patient.PatientID}, Name={patient.Name}");

                    // Get latest measurement
                    var latestMeasurement = await _context.Measurements
                        .Where(m => m.PatientID == patient.PatientID)
                        .OrderByDescending(m => m.MeasuredAt)
                        .FirstOrDefaultAsync();

                    Console.WriteLine(string.Format("Latest measurement for patient {0}: {1}", patient.PatientID, latestMeasurement != null ? "Found" : "Not found"));

                    // Get CSV data
                    var patientDatas = await _context.PatientDatas
                        .Where(pd => pd.PatientID == patient.PatientID)
                        .Select(pd => new { pd.FileName, pd.FilePath })
                        .ToListAsync();

                    var csvData = new List<object>();
                    foreach (var pd in patientDatas)
                    {
                        var frames = await ParseCsv(pd.FilePath);
                        if (frames.Count > 0)
                        {
                            csvData.Add(new { FileName = pd.FileName, Frames = frames, RefreshMs = 3000 });
                        }
                    }

                    allocatedPatients.Add(new
                    {
                        patient.PatientID,
                        Name = patient.Name ?? "Unknown",
                        patient.Age,
                        patient.Gender,
                        LatestMeasurement = latestMeasurement != null ? new
                        {
                            latestMeasurement.PeakPressure,
                            latestMeasurement.ContactArea,
                            latestMeasurement.LowPressure,
                            latestMeasurement.AvgPressure
                        } : null,
                        CsvData = csvData
                    });

                    // Generate alert if peak pressure > 100 (threshold)
                    if (latestMeasurement != null && latestMeasurement.PeakPressure > 420)
                    {
                        alerts.Add(new
                        {
                            Message = $"your patient <strong>{patient.Name ?? "Unknown"}</strong> pressure is <span style='color:red'>{latestMeasurement.PeakPressure} mmHg</span> at <strong>{latestMeasurement.MeasuredAt}</strong>",
                            IsCritical = true,
                            CreatedAt = latestMeasurement.MeasuredAt
                        });
                    }
                }

                // Add a test alert if no real alerts (to ensure table shows something)
                if (alerts.Count == 0)
                {
                    alerts.Add(new
                    {
                        Message = "Test alert: No high pressure detected in allocated patients.",
                        IsCritical = false,
                        CreatedAt = DateTime.Now
                    });
                }

                Console.WriteLine($"Final allocatedPatients count: {allocatedPatients.Count}");
                Console.WriteLine($"Final alerts count: {alerts.Count}");

                return Ok(new { Clinician = clinicianData, AllocatedPatients = allocatedPatients, Alerts = alerts });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboard: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/clinician/allocated-patients/{userId} - New endpoint for Compare page dropdown
        [HttpGet("allocated-patients/{userId}")]
        public async Task<IActionResult> GetAllocatedPatients(int userId)
        {
            try
            {
                var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                if (clinician == null) return NotFound("Clinician not found");

                var allocations = await _context.Allocations
                    .Where(a => a.ClinicianID == clinician.ClinicianID)
                    .Include(a => a.Patient)
                    .Select(a => new
                    {
                        a.Patient.PatientID,
                        Name = a.Patient.Name ?? "Unknown"
                    })
                    .ToListAsync();

                return Ok(allocations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllocatedPatients: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/clinician/patient-dashboard/{patientId} - For popup dashboard
        [HttpGet("patient-dashboard/{patientId}")]
        public async Task<IActionResult> GetPatientDashboard(int patientId)
        {
            try
            {
                var patient = _context.Patients.FirstOrDefault(p => p.PatientID == patientId);
                if (patient == null) return NotFound("Patient not found");

                var latestMeasurement = await _context.Measurements
                    .Where(m => m.PatientID == patientId)
                    .OrderByDescending(m => m.MeasuredAt)
                    .FirstOrDefaultAsync();

                var patientDatas = await _context.PatientDatas
                    .Where(pd => pd.PatientID == patientId)
                    .Select(pd => new { pd.FileName, pd.FilePath })
                    .ToListAsync();

                var csvData = new List<object>();
                foreach (var pd in patientDatas)
                {
                    var frames = await ParseCsv(pd.FilePath);
                    if (frames.Count > 0)
                    {
                        csvData.Add(new { FileName = pd.FileName, Frames = frames, RefreshMs = 3000 });
                    }
                }

                return Ok(new
                {
                    Patient = new { patient.PatientID, Name = patient.Name ?? "Unknown", patient.Age, patient.Gender },
                    LatestMeasurement = latestMeasurement != null ? new
                    {
                        latestMeasurement.PeakPressure,
                        latestMeasurement.ContactArea,
                        latestMeasurement.LowPressure,
                        latestMeasurement.AvgPressure
                    } : null,
                    CsvData = csvData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPatientDashboard: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/clinician/patient-history/{patientId} - For popup history and Compare page
        [HttpGet("patient-history/{patientId}")]
        public IActionResult GetPatientHistory(int patientId)
        {
            try
            {
                var history = _context.History
                    .Include(h => h.Measurement)
                    .Where(h => h.PatientID == patientId)
                    .OrderByDescending(h => h.SnapshotAt)
                    .ToList();

                var historyData = history.Select(h => {
                    decimal adjustedLowPressure = 0; // Default to 0 if no values > 0
                    if (h.Measurement != null && !string.IsNullOrEmpty(h.Measurement.FrameData))
                    {
                        try
                        {
                            // Parse FrameData JSON (list of frames, each with values)
                            var frames = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(h.Measurement.FrameData);
                            if (frames != null)
                            {
                                var allValues = new List<double>();
                                foreach (var frame in frames)
                                {
                                    if (frame.ContainsKey("values") && frame["values"] is System.Text.Json.JsonElement valuesElement)
                                    {
                                        var values = System.Text.Json.JsonSerializer.Deserialize<List<double>>(valuesElement.GetRawText());
                                        if (values != null)
                                        {
                                            allValues.AddRange(values);
                                        }
                                    }
                                }
                                // Find the minimum value > 0
                                var positiveValues = allValues.Where(v => v > 0).ToList();
                                if (positiveValues.Any())
                                {
                                    adjustedLowPressure = (decimal)positiveValues.Min();
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error parsing FrameData for history {h.HistoryID}: {ex.Message}");
                            // Fallback to original lowPressure
                            adjustedLowPressure = h.Measurement.LowPressure;
                        }
                    }

                    // Fix for LineChartData: If null/empty, generate from FrameData
                    string lineChartDataJson = h.Measurement?.LineChartData ?? "[]";
                    if (string.IsNullOrEmpty(lineChartDataJson) || lineChartDataJson == "[]")
                    {
                        try
                        {
                            if (!string.IsNullOrEmpty(h.Measurement?.FrameData))
                            {
                                var frames = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(h.Measurement.FrameData);
                                if (frames != null && frames.Any())
                                {
                                    var peakPressures = frames
                                        .Select(f => {
                                            if (f.ContainsKey("peakPressure") && f["peakPressure"] is System.Text.Json.JsonElement peakElement)
                                            {
                                                return peakElement.GetDouble();
                                            }
                                            return 0.0;
                                        })
                                        .ToList();
                                    if (peakPressures.Any())
                                    {
                                        var options = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
                                        lineChartDataJson = System.Text.Json.JsonSerializer.Serialize(peakPressures, options);
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error generating LineChartData for history {h.HistoryID}: {ex.Message}");
                            lineChartDataJson = "[]"; // Fallback to empty array
                        }
                    }

                    return new
                    {
                        h.HistoryID,
                        h.SnapshotAt,
                        Measurement = h.Measurement != null ? new
                        {
                            h.Measurement.PeakPressure,
                            h.Measurement.ContactArea,
                            LowPressure = adjustedLowPressure, // Updated: Use the lowest pressure > 0
                            h.Measurement.AvgPressure,
                            FrameData = h.Measurement.FrameData,
                            HeatmapData = h.Measurement.HeatmapData,
                            LineChartData = lineChartDataJson // Updated: Ensure it's always valid JSON
                        } : null
                    };
                });

                return Ok(historyData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPatientHistory: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/clinician/patient-history/{historyId} - New endpoint for deleting patient history
        [HttpDelete("patient-history/{historyId}")]
        [Authorize]
        public async Task<IActionResult> DeletePatientHistory(int historyId)
        {
            try
            {
                // Get the current user's ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user token");
                }

                // Find the clinician
                var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                if (clinician == null)
                {
                    return Forbid("Clinician not found");
                }

                // Find the history item
                var historyItem = await _context.History
                    .Include(h => h.Measurement)
                    .FirstOrDefaultAsync(h => h.HistoryID == historyId);
                if (historyItem == null)
                {
                    return NotFound("History item not found");
                }

                // Check if the clinician is allocated to the patient
                var isAllocated = await _context.Allocations
                    .AnyAsync(a => a.ClinicianID == clinician.ClinicianID && a.PatientID == historyItem.PatientID);
                if (!isAllocated)
                {
                    return Forbid("You are not authorized to delete this patient's history");
                }

                // Delete the history item (and associated measurement if it exists)
                if (historyItem.Measurement != null)
                {
                    _context.Measurements.Remove(historyItem.Measurement);
                }
                _context.History.Remove(historyItem);
                await _context.SaveChangesAsync();

                return Ok("History deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeletePatientHistory: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/clinician/user/{userId} - New endpoint to fetch user details (e.g., name for greeting)
        [HttpGet("user/{userId}")]
        public IActionResult GetUser(int userId)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.UserID == userId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                return Ok(new { name = user.Name ?? "User" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUser: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/clinician/patient/{patientId} - Existing method
        [HttpGet("patient/{patientId}")]
        public IActionResult GetPatientData(int patientId)
        {
            try
            {
                var measurements = _context.Measurements.Where(m => m.PatientID == patientId).ToList();
                return Ok(measurements);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPatientData: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}