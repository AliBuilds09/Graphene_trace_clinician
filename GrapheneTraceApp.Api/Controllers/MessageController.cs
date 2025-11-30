using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GrapheneTraceApp.Api.Data;
using GrapheneTraceApp.Api.Models;
using System.Linq;

namespace GrapheneTraceApp.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MessageController(ApplicationDbContext context)
        {
            _context = context;
        }

        // DTO for sending messages to avoid model validation issues
        public class MessageDto
        {
            public int SenderID { get; set; }
            public int ReceiverID { get; set; }
            public string Content { get; set; }
        }

        // GET: api/message/{userId} - Get conversation messages for the user
        [HttpGet("{userId}")]
        public IActionResult GetMessages(int userId)
        {
            try
            {
                Console.WriteLine($"Fetching messages for userId: {userId}");

                var user = _context.Users.FirstOrDefault(u => u.UserID == userId);
                if (user == null)
                {
                    Console.WriteLine($"User not found for userId: {userId}");
                    return NotFound("User not found.");
                }
                Console.WriteLine($"User found: Role = {user.Role}");

                if (user.Role == "patient")
                {
                    Console.WriteLine("Processing as Patient");
                    var patient = _context.Patients.FirstOrDefault(p => p.UserID == userId);
                    if (patient == null)
                    {
                        Console.WriteLine($"Patient not found for userId: {userId}");
                        return NotFound("Patient not found.");
                    }
                    Console.WriteLine($"Patient found: PatientID = {patient.PatientID}");

                    var allocations = _context.Allocations.Where(a => a.PatientID == patient.PatientID).ToList();
                    if (!allocations.Any())
                    {
                        Console.WriteLine("No allocated clinicians found for patient");
                        return NotFound("No allocated clinicians found for this patient.");
                    }
                    Console.WriteLine($"Allocations found: {allocations.Count}");

                    var conversations = new List<object>();
                    foreach (var allocation in allocations)
                    {
                        var clinician = _context.Clinicians.FirstOrDefault(c => c.ClinicianID == allocation.ClinicianID);
                        if (clinician == null || clinician.UserID == 0)
                        {
                            Console.WriteLine($"Clinician not found or invalid UserID for allocation: {allocation.AllocationID}");
                            continue;
                        }
                        Console.WriteLine($"Processing clinician: {clinician.Name}, UserID: {clinician.UserID}");

                        var messages = _context.Messages
                            .Where(m => (m.SenderID == userId && m.ReceiverID == clinician.UserID) ||
                                        (m.SenderID == clinician.UserID && m.ReceiverID == userId))
                            .OrderBy(m => m.SentAt)
                            .ToList();
                        Console.WriteLine($"Messages for clinician {clinician.Name}: {messages.Count}");

                        conversations.Add(new
                        {
                            Name = clinician.Name,
                            UserID = clinician.UserID,
                            Messages = messages.Select(m => new
                            {
                                m.MessageID,
                                m.Content,
                                m.SentAt,
                                m.SenderID,
                                m.ReceiverID,
                                SenderName = m.SenderID == userId ? "You" : clinician.Name
                            })
                        });
                    }

                    Console.WriteLine($"Returning conversations: {conversations.Count} items");
                    foreach (var conv in conversations)
                    {
                        Console.WriteLine($"Conversation: Name={conv.GetType().GetProperty("Name")?.GetValue(conv)}, UserID={conv.GetType().GetProperty("UserID")?.GetValue(conv)}");
                    }
                    return Ok(conversations);
                }
                else if (user.Role == "clinician")
                {
                    Console.WriteLine("Processing as Clinician");
                    var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == userId);
                    if (clinician == null)
                    {
                        Console.WriteLine($"Clinician not found for userId: {userId}");
                        return NotFound("Clinician not found.");
                    }
                    Console.WriteLine($"Clinician found: ClinicianID = {clinician.ClinicianID}");

                    var allocations = _context.Allocations.Where(a => a.ClinicianID == clinician.ClinicianID).ToList();
                    if (!allocations.Any())
                    {
                        Console.WriteLine("No allocated patients found for clinician");
                        return NotFound("No allocated patients found for this clinician.");
                    }
                    Console.WriteLine($"Allocations found: {allocations.Count}");

                    var conversations = new List<object>();
                    foreach (var allocation in allocations)
                    {
                        var patient = _context.Patients.FirstOrDefault(p => p.PatientID == allocation.PatientID);
                        if (patient == null || patient.UserID == 0)
                        {
                            Console.WriteLine($"Patient not found or invalid UserID for allocation: {allocation.AllocationID}");
                            continue;
                        }
                        Console.WriteLine($"Processing patient: {patient.Name}, UserID: {patient.UserID}");

                        var messages = _context.Messages
                            .Where(m => (m.SenderID == userId && m.ReceiverID == patient.UserID) ||
                                        (m.SenderID == patient.UserID && m.ReceiverID == userId))
                            .OrderBy(m => m.SentAt)
                            .ToList();
                        Console.WriteLine($"Messages for patient {patient.Name}: {messages.Count}");

                        conversations.Add(new
                        {
                            Name = patient.Name,
                            UserID = patient.UserID,
                            Messages = messages.Select(m => new
                            {
                                m.MessageID,
                                m.Content,
                                m.SentAt,
                                m.SenderID,
                                m.ReceiverID,
                                SenderName = m.SenderID == userId ? "You" : patient.Name
                            })
                        });
                    }

                    Console.WriteLine($"Returning conversations: {conversations.Count} items");
                    foreach (var conv in conversations)
                    {
                        Console.WriteLine($"Conversation: Name={conv.GetType().GetProperty("Name")?.GetValue(conv)}, UserID={conv.GetType().GetProperty("UserID")?.GetValue(conv)}");
                    }
                    return Ok(conversations);
                }
                else
                {
                    Console.WriteLine($"Invalid role: {user.Role}");
                    return BadRequest("Invalid user role for messaging.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMessages: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/message/{userId}/{messageId} - Get a specific message
        [HttpGet("{userId}/{messageId}")]
        public IActionResult GetMessage(int userId, int messageId)
        {
            try
            {
                Console.WriteLine($"Fetching message for userId: {userId}, messageId: {messageId}");

                if (messageId <= 0)
                {
                    Console.WriteLine($"Invalid messageId: {messageId}");
                    return BadRequest("Invalid message ID.");
                }

                var message = _context.Messages
                    .FirstOrDefault(m => (m.SenderID == userId || m.ReceiverID == userId) && m.MessageID == messageId);

                if (message == null)
                {
                    Console.WriteLine($"Message not found for userId: {userId}, messageId: {messageId}");
                    return NotFound("Message not found.");
                }

                return Ok(new
                {
                    message.MessageID,
                    message.Content,
                    message.SentAt,
                    message.SenderID,
                    message.ReceiverID
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMessage: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/message - Send a new message
        [HttpPost]
        public IActionResult SendMessage([FromBody] MessageDto messageDto)
        {
            try
            {
                Console.WriteLine($"Received message: SenderID={messageDto?.SenderID}, ReceiverID={messageDto?.ReceiverID}, Content='{messageDto?.Content}'");

                if (messageDto == null || string.IsNullOrEmpty(messageDto.Content) || messageDto.ReceiverID == 0)
                {
                    Console.WriteLine("Message is null, content is empty, or ReceiverID is invalid");
                    return BadRequest("Message content is required and ReceiverID must be valid.");
                }

                // Validate that sender and receiver are allocated (patient-clinician or vice versa)
                var sender = _context.Users.FirstOrDefault(u => u.UserID == messageDto.SenderID);
                var receiver = _context.Users.FirstOrDefault(u => u.UserID == messageDto.ReceiverID);
                Console.WriteLine($"Sender: {sender?.UserID} Role: {sender?.Role}, Receiver: {receiver?.UserID} Role: {receiver?.Role}");

                if (sender == null || receiver == null)
                {
                    Console.WriteLine("Sender or receiver not found");
                    return BadRequest("Invalid sender or receiver.");
                }

                bool isAllocated = false;
                if (sender.Role == "patient" && receiver.Role == "clinician")
                {
                    var patient = _context.Patients.FirstOrDefault(p => p.UserID == messageDto.SenderID);
                    Console.WriteLine($"Patient lookup for sender: {patient?.PatientID}");
                    var clinicianLookup = _context.Clinicians.FirstOrDefault(c => c.UserID == messageDto.ReceiverID);
                    Console.WriteLine($"Clinician lookup for receiver: {clinicianLookup?.ClinicianID}");
                    isAllocated = patient != null && clinicianLookup != null && _context.Allocations.Any(a => a.PatientID == patient.PatientID && a.ClinicianID == clinicianLookup.ClinicianID);
                    Console.WriteLine($"Allocation check for patient to clinician: {isAllocated}");
                }
                else if (sender.Role == "clinician" && receiver.Role == "patient")
                {
                    var clinician = _context.Clinicians.FirstOrDefault(c => c.UserID == messageDto.SenderID);
                    Console.WriteLine($"Clinician lookup for sender: {clinician?.ClinicianID}");
                    var patientLookup = _context.Patients.FirstOrDefault(p => p.UserID == messageDto.ReceiverID);
                    Console.WriteLine($"Patient lookup for receiver: {patientLookup?.PatientID}");
                    isAllocated = clinician != null && patientLookup != null && _context.Allocations.Any(a => a.ClinicianID == clinician.ClinicianID && a.PatientID == patientLookup.PatientID);
                    Console.WriteLine($"Allocation check for clinician to patient: {isAllocated}");
                }
                else
                {
                    Console.WriteLine("Invalid role combination for messaging");
                    return BadRequest("Messages can only be sent between allocated patient and clinician.");
                }

                if (!isAllocated)
                {
                    Console.WriteLine("Allocation not found");
                    return BadRequest("Messages can only be sent between allocated patient and clinician.");
                }

                var message = new Message
                {
                    SenderID = messageDto.SenderID,
                    ReceiverID = messageDto.ReceiverID,
                    Content = messageDto.Content,
                    SentAt = DateTime.Now
                };
                _context.Messages.Add(message);
                _context.SaveChanges();
                Console.WriteLine("Message saved successfully");

                return Ok(new
                {
                    message.MessageID,
                    message.Content,
                    message.SentAt,
                    message.SenderID,
                    message.ReceiverID
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendMessage: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}