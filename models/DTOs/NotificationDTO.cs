using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }
        
        public int UserId { get; set; }
        
        public string Content { get; set; }
        
        public DateTime Timestamp { get; set; }
        
        public bool IsRead { get; set; } = false;
        
        public string Type { get; set; } = "system";
        
        public string FormattedDate 
        { 
            get 
            {
                // Chuyển đổi thời gian thành định dạng "hôm nay", "hôm qua" hoặc "dd/MM/yyyy"
                DateTime now = DateTime.Now;
                if (Timestamp.Date == now.Date)
                {
                    return "Hôm nay";
                }
                else if (Timestamp.Date == now.AddDays(-1).Date)
                {
                    return "Hôm qua";
                }
                else
                {
                    return Timestamp.ToString("dd/MM/yyyy");
                }
            } 
        }
    }
} 