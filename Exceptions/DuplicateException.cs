using System;

namespace VirtualAdvisorAPI.Exceptions
{
    public class DuplicateException : Exception
    {
        public DuplicateException() : base() { }
        
        public DuplicateException(string message) : base(message) { }
        
        public DuplicateException(string message, Exception innerException) 
            : base(message, innerException) { }
    }
} 