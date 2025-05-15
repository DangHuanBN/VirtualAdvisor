using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class LearningPath
    {
        public LearningPath()
        {
            PathName = string.Empty;
            LearningPathDetails = new List<LearningPathDetail>();
        }

        [Key]
        [Column("path_id")]
        public int PathId { get; set; }

        [Required]
        [Column("course_id")]
        public int CourseId { get; set; }

        [Required]
        [Column("path_name")]
        [StringLength(255)]
        public string PathName { get; set; }

        // Navigation property
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // LearningPathDetails navigation property
        public ICollection<LearningPathDetail> LearningPathDetails { get; set; }
    }
} 