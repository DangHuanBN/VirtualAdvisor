namespace VirtualAdvisorAPI.Models.DTOs
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public UserRole Role { get; set; }
        
        public UserDTO()
        {
            FullName = string.Empty;
        }
    }
} 