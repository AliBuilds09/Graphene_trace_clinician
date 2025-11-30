using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using System.IO;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace GrapheneTraceApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public PatientController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Helper to parse CSV into frames (with error handling)
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
                Console.WriteLine($"Parsing {filePath}, total lines: {lines.Length}");
                for (int i = 0; i < lines.Length; i += 32)
                {
                    var frameValues = new List<double>();
                    for (int j = 0; j < 32 && i + j < lines.Length; j++)
                    {
                        var parts = lines[i + j].Split(',');
                        if (parts.Length != 32)
                        {
                            Console.WriteLine($"Invalid row {i + j}: expected 32 values, got {parts.Length}");
                            continue;
                        }
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
                Console.WriteLine($"Parsed {frames.Count} frames from {filePath}");
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

        // POST: api/patient/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == model.EmailOrPhone || u.Phone == model.EmailOrPhone);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
                return BadRequest("Invalid credentials");

            // Generate JWT token
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                userId = user.UserID,
                role = user.Role
            });
        }

        // POST: api/patient/register-patient
        [HttpPost("register-patient")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterPatient([FromBody] PatientRegistrationModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _context.Users.AnyAsync(u => u.Email == model.Email || u.Phone == model.Phone)) return BadRequest("User already exists");

            var user = new User { Name = model.Name, Email = model.Email, Phone = model.Phone, PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password), Role = "patient" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Populate new columns in Patients table
            var patient = new Patient { UserID = user.UserID, Age = model.Age, Gender = model.Gender, Name = model.Name, Phone = model.Phone, Email = model.Email };
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            // Allocate up to 3 unique CSVs to the new patient
            await AllocateCsvsToPatient(patient.PatientID, 3);

            return Ok("Patient registered successfully");
        }

        // Helper to allocate a specific number of unique CSVs to a patient
        private async Task AllocateCsvsToPatient(int patientId, int count)
        {
            try
            {
                string csvFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "csvs");
                if (!Directory.Exists(csvFolder))
                {
                    Directory.CreateDirectory(csvFolder);
                    Console.WriteLine("CSV folder created. No files to allocate.");
                    return;
                }

                var allCsvFiles = Directory.GetFiles(csvFolder, "*.csv");
                if (allCsvFiles.Length == 0)
                {
                    Console.WriteLine("No CSV files found in folder. Skipping allocation.");
                    return;
                }

                // Get already allocated CSV file names
                var allocatedCsvNames = await _context.PatientDatas
                    .Select(pd => pd.FileName)
                    .ToListAsync();

                // Find unallocated CSV files
                var availableCsvFiles = allCsvFiles
                    .Where(file => !allocatedCsvNames.Contains(Path.GetFileName(file)))
                    .ToList();

                if (availableCsvFiles.Count == 0)
                {
                    Console.WriteLine("No unallocated CSV files available. Skipping allocation.");
                    return;
                }

                // Allocate up to 'count' unique CSVs
                var csvsToAllocate = availableCsvFiles.Take(count).ToList();
                var allocatedCount = 0;
                foreach (var file in csvsToAllocate)
                {
                    var patientData = new PatientData
                    {
                        PatientID = patientId,
                        FileName = Path.GetFileName(file),
                        FilePath = file,
                        UploadedAt = DateTime.Now
                    };
                    _context.PatientDatas.Add(patientData);
                    allocatedCount++;
                }
                await _context.SaveChangesAsync();
                Console.WriteLine($"Allocated {allocatedCount} unique CSVs to patient {patientId}: {string.Join(", ", csvsToAllocate.Select(Path.GetFileName))}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error allocating CSVs to patient {patientId}: {ex.Message}");
            }
        }

        // POST: api/patient/register-clinician
        [HttpPost("register-clinician")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterClinician([FromBody] ClinicianRegistrationModel model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (await _context.Users.AnyAsync(u => u.Email == model.Email || u.Phone == model.Phone)) return BadRequest("User already exists");

            var user = new User { Name = model.Name, Email = model.Email, Phone = model.Phone, PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password), Role = "clinician" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Populate new columns in Clinicians table
            var clinician = new Clinician { UserID = user.UserID, LicenseNumber = model.LicenseNumber, HospitalName = model.HospitalName, Specialization = model.Specialization, Name = model.Name, Phone = model.Phone, Email = model.Email };
            _context.Clinicians.Add(clinician);
            await _context.SaveChangesAsync();

            return Ok("Clinician registered successfully");
        }

        // GET: api/patient/dashboard/{userId}
        [HttpGet("dashboard/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetDashboard(int userId)
        {
            try
            {
                Console.WriteLine($"Fetching dashboard for userId: {userId}");

                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.UserID == userId);

                if (patient == null)
                {
                    Console.WriteLine("Patient not found");
                    return NotFound("Patient not found");
                }
                Console.WriteLine("Patient found: " + patient.PatientID);

                // Fetch allocation
                object clinicianData = null;
                try
                {
                    var allocation = await _context.Allocations
                        .Where(a => a.PatientID == patient.PatientID)
                        .Select(a => new
                        {
                            a.ClinicianID,
                            Clinician = a.Clinician != null ? new
                            {
                                Name = a.Clinician.Name ?? "N/A",
                                HospitalName = a.Clinician.HospitalName ?? "N/A",
                                Phone = a.Clinician.Phone ?? "N/A"
                            } : null
                        })
                        .FirstOrDefaultAsync();

                    if (allocation != null && allocation.Clinician != null)
                    {
                        clinicianData = allocation.Clinician;
                        Console.WriteLine("Clinician data loaded successfully");
                    }
                    else
                    {
                        Console.WriteLine("No valid clinician allocation found");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching allocation: {ex.Message}");
                    clinicianData = null;
                }

                // Fetch latest measurement
                var latestMeasurement = await _context.Measurements
                    .Where(m => m.PatientID == patient.PatientID)
                    .OrderByDescending(m => m.MeasuredAt)
                    .FirstOrDefaultAsync();
                Console.WriteLine("Latest measurement found: " + (latestMeasurement != null));

                // Fetch alerts (limit to 5 for speed)
                var alerts = await _context.Alerts
                    .Where(a => a.PatientID == patient.PatientID)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .ToListAsync();
                Console.WriteLine("Alerts count: " + alerts.Count);

                // Parse allocated CSVs but limit to 1 CSV and 10 frames for speed
                var patientDatas = await _context.PatientDatas
                    .Where(pd => pd.PatientID == patient.PatientID)
                    .Take(1)  // Limit to 1 CSV
                    .ToListAsync();
                Console.WriteLine("PatientDatas count: " + patientDatas.Count);

                var csvData = new List<object>();
                foreach (var pd in patientDatas)
                {
                    try
                    {
                        var frames = await ParseCsv(pd.FilePath);
                        if (frames.Count > 0)
                        {
                            var limitedFrames = frames.Take(10).ToList();  // Limit to 10 frames
                            var totalFrames = limitedFrames.Count;
                            var totalTime = totalFrames / 15.0; // 15 fps
                            var refreshMs = 3000; // Fixed refresh time: 3 seconds
                            csvData.Add(new { FileName = pd.FileName, Frames = limitedFrames, TotalFrames = totalFrames, TotalTime = totalTime, RefreshMs = refreshMs });
                            Console.WriteLine($"Added CSV data for {pd.FileName} with {totalFrames} frames, refresh {refreshMs} ms");
                        }
                        else
                        {
                            Console.WriteLine($"No frames parsed from {pd.FileName}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error parsing CSV {pd.FileName}: {ex.Message}");
                    }
                }
                Console.WriteLine("CsvData count: " + csvData.Count);

                // Build response with camelCase JSON (forced to match frontend expectations)
                var options = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
                var dashboardData = new
                {
                    Patient = new
                    {
                        patient.PatientID,
                        Name = patient.Name ?? "Unknown",
                        patient.Age,
                        patient.Gender,
                        Phone = patient.Phone ?? "N/A",
                        Email = patient.Email ?? "N/A"
                    },
                    Clinician = clinicianData,
                    LatestMeasurement = latestMeasurement != null ? new
                    {
                        latestMeasurement.PeakPressure,
                        latestMeasurement.ContactArea,
                        latestMeasurement.LowPressure,
                        latestMeasurement.AvgPressure
                    } : null,
                    Alerts = alerts.Select(a => new
                    {
                        a.AlertID,
                        a.Message,
                        a.IsCritical,
                        a.CreatedAt
                    }),
                    CsvData = csvData
                };

                Console.WriteLine("Dashboard data prepared successfully");
                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboard: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/patient/history/{userId}
        [HttpGet("history/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetHistory(int userId)
        {
            try
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
                if (patient == null) return NotFound("Patient not found");

                var history = await _context.History
                    .Include(h => h.Measurement)
                    .Where(h => h.PatientID == patient.PatientID)
                    .OrderByDescending(h => h.SnapshotAt)
                    .ToListAsync();

                // Force camelCase JSON for consistency
                var options = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
                var historyData = history.Select(h => new
                {
                    h.HistoryID,
                    h.SnapshotAt,
                    Measurement = h.Measurement != null ? new
                    {
                        h.Measurement.PeakPressure,
                        h.Measurement.ContactArea,
                        h.Measurement.LowPressure,
                        h.Measurement.AvgPressure,
                        FrameData = h.Measurement.FrameData,
                        HeatmapData = h.Measurement.HeatmapData,
                        LineChartData = h.Measurement.LineChartData
                    } : null
                });

                return Ok(historyData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetHistory: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/patient/history
        [HttpPost("history")]
        [Authorize]
        public async Task<IActionResult> SaveHistory([FromBody] HistoryModel model)
        {
            try
            {
                Console.WriteLine($"Saving history for userId: {model.UserId}");
                if (model.UserId <= 0)
                {
                    Console.WriteLine("Invalid userId");
                    return BadRequest("Invalid userId");
                }

                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == model.UserId);
                if (patient == null)
                {
                    Console.WriteLine("Patient not found");
                    return NotFound("Patient not found");
                }

                // Calculate KPIs from live CsvData frames (sent from frontend, using typed Frame objects)
                decimal peakPressure = 0;
                decimal contactArea = 0;
                decimal lowPressure = 0;  // Updated: Will be set to min > 0
                decimal avgPressure = 0;
                string frameDataJson = "[]";
                string heatMapDataJson = "[]";
                string lineChartDataJson = "[]";

                try
                {
                    if (model.Data != null && model.Data.CsvData != null && model.Data.CsvData.Length > 0 && model.Data.CsvData[0].Frames != null)
                    {
                        var frames = model.Data.CsvData[0].Frames;
                        if (frames.Any())
                        {
                            Console.WriteLine($"Frames count: {frames.Length}");
                            // Debug: Log the first frame
                            Console.WriteLine($"First frame: peakPressure={frames[0].peakPressure}, avgPressure={frames[0].avgPressure}");
                            // Calculate KPIs using typed properties
                            peakPressure = frames.Max(f => (decimal)f.peakPressure);
                            avgPressure = frames.Average(f => (decimal)f.avgPressure);
                            contactArea = frames.Average(f => (decimal)f.contactArea);  // Average contact area across frames

                            // Updated: Calculate lowPressure as the minimum value > 0 across all frames
                            var allValues = new List<double>();
                            foreach (var frame in frames)
                            {
                                if (frame.values != null)
                                {
                                    allValues.AddRange(frame.values);
                                }
                            }
                            var positiveValues = allValues.Where(v => v > 0).ToList();
                            lowPressure = positiveValues.Any() ? (decimal)positiveValues.Min() : 0;  // Min > 0, or 0 if none

                            Console.WriteLine($"Calculated KPIs from frames: Peak={peakPressure}, Contact={contactArea}, Low={lowPressure}, Avg={avgPressure}");

                            // Serialize data with camelCase
                            var options = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
                            frameDataJson = System.Text.Json.JsonSerializer.Serialize(frames, options);
                            heatMapDataJson = System.Text.Json.JsonSerializer.Serialize(frames[0].values, options);
                            lineChartDataJson = System.Text.Json.JsonSerializer.Serialize(frames.Select(f => (double)f.peakPressure).ToList(), options);
                        }
                        else
                        {
                            Console.WriteLine("Frames is empty");
                        }
                    }
                    else
                    {
                        Console.WriteLine("No valid CsvData or Frames found for KPIs. Data structure: " + System.Text.Json.JsonSerializer.Serialize(model.Data));
                    }
                }
                catch (Exception kpiEx)
                {
                    Console.WriteLine($"Error calculating KPIs: {kpiEx.Message}");
                    // Continue with 0 values
                }

                var measurement = new Measurement
                {
                    PatientID = patient.PatientID,
                    PeakPressure = peakPressure,
                    ContactArea = contactArea,
                    LowPressure = lowPressure,
                    AvgPressure = avgPressure,
                    HeatmapData = heatMapDataJson,
                    LineChartData = lineChartDataJson,
                    MeasuredAt = DateTime.Now,
                    FrameData = frameDataJson
                };

                Console.WriteLine("Adding measurement to context");
                _context.Measurements.Add(measurement);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Measurement saved with ID: {measurement.MeasurementID}");

                var history = new History
                {
                    PatientID = patient.PatientID,
                    MeasurementID = measurement.MeasurementID,
                    SnapshotAt = DateTime.Now
                };

                Console.WriteLine("Adding history to context");
                _context.History.Add(history);
                await _context.SaveChangesAsync();
                Console.WriteLine($"History saved with ID: {history.HistoryID}");

                // Generate alerts based on new pressure ranges
                await GenerateAlertsForMeasurement(measurement, patient.PatientID);

                return Ok("History saved");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving history: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Helper to generate alerts based on pressure ranges
        private async Task GenerateAlertsForMeasurement(Measurement measurement, int patientId)
        {
            try
            {
                string alertMessage = null;
                bool isCritical = false;

                if (measurement.PeakPressure == 0)
                {
                    alertMessage = $"Very Low pressure detected: Peak pressure is 0 mmHg.";
                    isCritical = false; // Info-level
                }
                else if (measurement.PeakPressure <= 250)
                {
                    alertMessage = $"Low pressure detected: Peak pressure {measurement.PeakPressure} mmHg is between 1-250 mmHg.";
                    isCritical = false; // Info-level
                }
                else if (measurement.PeakPressure <= 420)
                {
                    alertMessage = $"Medium pressure detected: Peak pressure {measurement.PeakPressure} mmHg is between 251-420 mmHg.";
                    isCritical = false; // Warning-level
                }
                else
                {
                    alertMessage = $"High pressure detected: Peak pressure {measurement.PeakPressure} mmHg exceeds 420 mmHg.";
                    isCritical = true; // Critical
                }

                if (alertMessage != null)
                {
                    var alert = new Alert
                    {
                        PatientID = patientId,
                        Message = alertMessage,
                        IsCritical = isCritical,
                        CreatedAt = DateTime.Now
                    };
                    _context.Alerts.Add(alert);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Alert generated: {alertMessage}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating alerts: {ex.Message}");
            }
        }


        // DELETE: api/patient/history/{historyId}
        [HttpDelete("history/{historyId}")]
        [Authorize]
        public async Task<IActionResult> DeleteHistory(int historyId)
        {
            try
            {
                var history = await _context.History.FindAsync(historyId);
                if (history == null) return NotFound("History not found");

                _context.History.Remove(history);
                await _context.SaveChangesAsync();

                return Ok("History deleted");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting history: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/patient/clinician-dashboard/{userId}
        [HttpGet("clinician-dashboard/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetClinicianDashboard(int userId)
        {
            try
            {
                Console.WriteLine($"Fetching clinician dashboard for userId: {userId}");

                var clinician = await _context.Clinicians
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.UserID == userId);

                if (clinician == null)
                {
                    Console.WriteLine("Clinician not found");
                    return NotFound("Clinician not found");
                }

                Console.WriteLine($"Clinician found: {clinician.ClinicianID}");

                // Get allocated patients
                var allocations = await _context.Allocations
                    .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                    .Where(a => a.ClinicianID == clinician.ClinicianID)
                    .ToListAsync();

                Console.WriteLine($"Allocations found: {allocations.Count}");

                var patients = new List<object>();
                foreach (var allocation in allocations)
                {
                    var patient = allocation.Patient;
                    if (patient == null)
                    {
                        Console.WriteLine("Patient is null in allocation");
                        continue;
                    }

                    Console.WriteLine($"Processing patient: {patient.PatientID}");

                    // Get latest measurement
                    var latestMeasurement = await _context.Measurements
                        .Where(m => m.PatientID == patient.PatientID)
                        .OrderByDescending(m => m.MeasuredAt)
                        .FirstOrDefaultAsync();

                    // Get allocated CSVs with parsed data
                    var patientDatas = await _context.PatientDatas
                        .Where(pd => pd.PatientID == patient.PatientID)
                        .Select(pd => new
                        {
                            pd.FileName,
                            pd.FilePath,
                            pd.UploadedAt
                        })
                        .ToListAsync();

                    var csvData = new List<object>();
                    foreach (var pd in patientDatas)
                    {
                        var frames = await ParseCsv(pd.FilePath);
                        var totalFrames = frames.Count;
                        if (totalFrames == 0) continue;
                        var totalTime = totalFrames / 15.0; // 15 fps
                        var refreshMs = 3000; // Fixed refresh time: 3 seconds
                        csvData.Add(new { FileName = pd.FileName, Frames = frames, TotalFrames = totalFrames, TotalTime = totalTime, RefreshMs = refreshMs });
                    }

                    patients.Add(new
                    {
                        PatientID = patient.PatientID,
                        Name = patient.User?.Name ?? "Unknown",
                        Age = patient.Age,
                        Gender = patient.Gender,
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

                Console.WriteLine($"Returning {patients.Count} patients");
                return Ok(new { Patients = patients });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetClinicianDashboard: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class LoginModel
    {
        public string EmailOrPhone { get; set; }
        public string Password { get; set; }
    }

    public class PatientRegistrationModel
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public string Gender { get; set; }
        public string State { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class ClinicianRegistrationModel
    {
        public string Name { get; set; }
        public string Gender { get; set; }
        public string State { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string LicenseNumber { get; set; }
        public string HospitalName { get; set; }
        public string Specialization { get; set; }
    }

    public class HistoryModel
    {
        public int UserId { get; set; }
        public DashboardData Data { get; set; }
    }

    public class DashboardData
    {
        public CsvDataItem[] CsvData { get; set; }
    }

    public class CsvDataItem
    {
        public string FileName { get; set; }
        public Frame[] Frames { get; set; }
        public int TotalFrames { get; set; }
        public double TotalTime { get; set; }
        public int RefreshMs { get; set; }
    }

    public class Frame
    {
        public List<double> values { get; set; }
        public double peakPressure { get; set; }
        public double lowPressure { get; set; }
        public double avgPressure { get; set; }
        public double contactArea { get; set; }
    }
}