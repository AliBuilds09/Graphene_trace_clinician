using Microsoft.AspNetCore.Authorization; // test commit
using Microsoft.AspNetCore.Mvc;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using System.Linq;

namespace GrapheneTraceApp.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Model for profile update data
        public class ProfileUpdateDto
        {
            public string name { get; set; }
            public string email { get; set; }
            public string phone { get; set; }
        }

        // GET: api/profile/{userId} - Get user profile
        [HttpGet("{userId}")]
        public IActionResult GetUserProfile(int userId)
        {
            try
            {
                Console.WriteLine($"Fetching profile for userId: {userId}");

                var user = _context.Users.FirstOrDefault(u => u.UserID == userId);
                if (user == null)
                {
                    Console.WriteLine($"User not found for userId: {userId}");
                    return NotFound("User not found.");
                }
                Console.WriteLine($"User found: Role = {user.Role}");

                object profile = null;
                if (user.Role == "patient")
                {
                    var patient = _context.Patients.FirstOrDefault(p => p.UserID == userId);
                    Console.WriteLine($"Patient lookup: {patient?.PatientID}");
                    if (patient != null)
                    {
                        profile = new
                        {
                            name = patient.Name,
                            email = patient.Email,
                            phone = patient.Phone
                        };
                    }
                }
                else if (user.Role == "clinician")
                {
                    var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                    Console.WriteLine($"Clinician lookup: {clinician?.ClinicianID}");
                    if (clinician != null)
                    {
                        profile = new
                        {
                            name = clinician.Name,
                            email = clinician.Email,
                            phone = clinician.Phone
                        };
                    }
                }
                else if (user.Role == "admin")
                {
                    Console.WriteLine("Processing as Admin");
                    profile = new
                    {
                        name = user.Name,
                        email = user.Email,
                        phone = user.Phone
                    };
                }

                if (profile == null)
                {
                    Console.WriteLine("Profile not found");
                    return NotFound("Profile not found.");
                }

                Console.WriteLine("Profile found and returned");
                return Ok(profile);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUserProfile: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: api/profile/{userId} - Update user profile
        [HttpPut("{userId}")]
        public IActionResult UpdateUserProfile(int userId, [FromBody] ProfileUpdateDto profileData)
        {
            try
            {
                Console.WriteLine($"Updating profile for userId: {userId}");

                var user = _context.Users.FirstOrDefault(u => u.UserID == userId);
                if (user == null)
                {
                    Console.WriteLine($"User not found for userId: {userId}");
                    return NotFound("User not found.");
                }

                if (user.Role == "patient")
                {
                    var patient = _context.Patients.FirstOrDefault(p => p.UserID == userId);
                    if (patient != null)
                    {
                        patient.Name = profileData.name;
                        patient.Email = profileData.email;
                        patient.Phone = profileData.phone;
                        _context.SaveChanges();
                        Console.WriteLine("Patient profile updated");
                        return Ok("Profile updated successfully.");
                    }
                }
                else if (user.Role == "clinician")
                {
                    var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                    if (clinician != null)
                    {
                        clinician.Name = profileData.name;
                        clinician.Email = profileData.email;
                        clinician.Phone = profileData.phone;
                        _context.SaveChanges();
                        Console.WriteLine("Clinician profile updated");
                        return Ok("Profile updated successfully.");
                    }
                }
                else if (user.Role == "admin")
                {
                    user.Name = profileData.name;
                    user.Email = profileData.email;
                    user.Phone = profileData.phone;
                    _context.SaveChanges();
                    Console.WriteLine("Admin profile updated");
                    return Ok("Profile updated successfully.");
                }

                Console.WriteLine("Profile update failed");
                return BadRequest("Failed to update profile.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateUserProfile: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}