using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using static BCrypt.Net.BCrypt;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using System.IO;
using System.Linq;

namespace GrapheneTraceApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Check if user already exists
            if (_context.Users.Any(u => u.Email == request.Email || u.Phone == request.Phone))
                return BadRequest("User already exists.");

            // Hash password
            var passwordHash = HashPassword(request.Password);

            // Create user
            var user = new User
            {
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = passwordHash,
                Role = request.Role,
                Name = request.Name,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create role-specific record
            if (request.Role == "Patient")
            {
                var patient = new Patient { UserID = user.UserID, Age = request.Age, Gender = request.Gender };
                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                // Allocate first 3 available CSVs (not already allocated)
                var allocatedCsvNames = _context.PatientDatas.Select(pd => pd.FileName).ToList();
                var allCsvFiles = Directory.GetFiles("wwwroot/csvs", "*.csv").Select(Path.GetFileName).ToList();
                var availableCsvs = allCsvFiles.Except(allocatedCsvNames).Take(3).ToList();

                foreach (var csvName in availableCsvs)
                {
                    var csvPath = Path.Combine("wwwroot/csvs", csvName);
                    var patientData = new PatientData
                    {
                        PatientID = patient.PatientID,
                        FileName = csvName,
                        FilePath = csvPath,
                        UploadedAt = DateTime.Now
                    };
                    _context.PatientDatas.Add(patientData);
                }
                await _context.SaveChangesAsync();
            }
            // Add similar for Clinician/Admin if needed

            return Ok("User registered successfully.");
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Find user
            var user = _context.Users.FirstOrDefault(u =>
                (u.Email == request.Username || u.Phone == request.Username) && u.IsActive);

            if (user == null || !Verify(request.Password, user.PasswordHash))
                return Unauthorized("Invalid credentials.");

            // Generate JWT
            var token = GenerateJwtToken(user);

            // Return response with lowercase keys to match frontend expectation
            return Ok(new { token, role = user.Role, userId = user.UserID, name = user.Name });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserID.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // Request models
    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string Name { get; set; }
        public int? Age { get; set; }
        public string Gender { get; set; }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
