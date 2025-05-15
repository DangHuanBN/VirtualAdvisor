using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class AITraining
    {
        [Key]
        [Column("training_id")]
        public int TrainingId { get; set; }

        [Required]
        [Column("lecture_id")]
        public int LectureId { get; set; }

        [Required]
        [Column("vector_store_path")]
        [StringLength(500)]
        public string VectorStorePath { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(50)]
        public string Status { get; set; } = "pending";

        [Column("training_time")]
        public DateTime? TrainingTime { get; set; }

        // Navigation property
        [ForeignKey("LectureId")]
        public Lecture? Lecture { get; set; }
    }
} 