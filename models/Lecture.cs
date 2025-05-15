using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    public class Lecture
    {
        public Lecture()
        {
            Title = string.Empty;
            Content = string.Empty;
            Attachment = string.Empty;
            Type = string.Empty;
            Status = "chuahuanluyen";
            VectorPath = string.Empty;
        }

        [Key]
        [Column("lecture_id")]
        public int LectureId { get; set; }

        [Required]
        [Column("course_id")]
        public int CourseId { get; set; }

        [Required]
        [Column("teacher_id")]
        public int TeacherId { get; set; }

        [Required]
        [Column("title")]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("attachment")]
        [StringLength(500)]
        public string Attachment { get; set; } = string.Empty;

        [Required]
        [Column("upload_date")]
        public DateTime UploadDate { get; set; } = DateTime.Now;

        [Required]
        [Column("type")]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        [Column("vector_path")]
        [StringLength(500)]
        public string VectorPath { get; set; } = string.Empty;

        [Column("training_date")]
        public DateTime? TrainingDate { get; set; }

        [Column("maxhours")]
        public float? MaxHours { get; set; }
        
        // Navigation property
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
} 