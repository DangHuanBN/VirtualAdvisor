using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace VirtualAdvisorAPI.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Username { get; set; }
        
        [Required]
        [MaxLength(255)]
        [JsonIgnore]
        public string Password { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; }
        
        public DateTime? Dob { get; set; }
        
        public bool? Gender { get; set; }
        
        [MaxLength(255)]
        public string? Address { get; set; }
        
        [MaxLength(100)]
        [EmailAddress]
        public string? Email { get; set; }
        
        [MaxLength(15)]
        public string? Phone { get; set; }
        
        [Required]
        public UserRole Role { get; set; }
        
        [Required]
        public string Status { get; set; } = "active"; // active hoặc inactive
    }

    public enum UserRole
    {
        Admin,
        Teacher,
        Student,
        Other
    }
} 