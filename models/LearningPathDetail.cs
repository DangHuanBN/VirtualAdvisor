using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class LearningPathDetail
    {
        [Key]
        [Column("detail_id")]
        public int DetailId { get; set; }

        [Required]
        [Column("path_id")]
        public int PathId { get; set; }

        [Required]
        [Column("lecture_id")]
        public int LectureId { get; set; }

        [Required]
        [Column("order_number")]
        public int OrderNumber { get; set; }

        // Navigation properties
        [ForeignKey("PathId")]
        public LearningPath? LearningPath { get; set; }

        [ForeignKey("LectureId")]
        public Lecture? Lecture { get; set; }
    }
} 