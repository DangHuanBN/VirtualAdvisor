using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class Course
    {
        public Course()
        {
            CourseName = string.Empty;
            Lectures = new List<Lecture>();
            Type = "tuantu"; // Giá trị mặc định
        }
        
        [Key]
        [Column("course_id")]
        public int CourseId { get; set; }

        [Required]
        [Column("course_name")]
        [StringLength(255)]
        public string CourseName { get; set; }

        [Required]
        [Column("subject_id")]
        public int SubjectId { get; set; }
        
        [Required]
        [Column("type")]
        public string Type { get; set; }
        
        // Navigation property
        [ForeignKey("SubjectId")]
        public Subject? Subject { get; set; }

        // Lectures navigation property
        public ICollection<Lecture> Lectures { get; set; }
    }
} 