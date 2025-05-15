using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class Subject
    {
        public Subject()
        {
            SubjectName = string.Empty;
            Courses = new List<Course>();
        }
        
        [Key]
        [Column("subject_id")]
        public int SubjectId { get; set; }

        [Required]
        [Column("subject_name")]
        [StringLength(255)]
        public string SubjectName { get; set; }
        
        [Required]
        [Column("credits")]
        public int Credits { get; set; }

        // Navigation property
        public ICollection<Course> Courses { get; set; }
    }
} 