using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GrapheneTraceApp.Api.Models
{
    public class Message
    {
        [Key]
        public int MessageID { get; set; }

        [Required]
        [ForeignKey("Sender")]
        public int SenderID { get; set; }

        [Required]
        [ForeignKey("Receiver")]
        public int ReceiverID { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;

        // Navigation properties
        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}