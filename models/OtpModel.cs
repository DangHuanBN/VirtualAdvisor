using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class OtpCode
    {
        public OtpCode()
        {
            Email = string.Empty;
            Code = string.Empty;
        }

        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [Column("email")]
        public string Email { get; set; }
        
        [Required]
        [Column("code")]
        public string Code { get; set; }
        
        [Required]
        public DateTime ExpiryTime { get; set; }
        
        public bool IsUsed { get; set; } = false;
    }
} 