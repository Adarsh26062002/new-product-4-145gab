variable "aws_region" {
  description = "AWS region where the infrastructure will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "app_name" {
  description = "Name of the application, used for resource naming"
  type        = string
  default     = "react-todo-list"
}

variable "domain_name" {
  description = "Custom domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "enable_cdn" {
  description = "Whether to enable CloudFront CDN for content delivery"
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class determining geographic distribution"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "enable_versioning" {
  description = "Whether to enable versioning for the S3 bucket"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Whether to enable access logging for S3 and CloudFront"
  type        = bool
  default     = false
}

variable "logs_retention" {
  description = "Number of days to retain logs before automatic deletion"
  type        = number
  default     = 30
}

variable "cache_ttl_html" {
  description = "Cache TTL in seconds for HTML files"
  type        = number
  default     = 0
}

variable "cache_ttl_assets" {
  description = "Cache TTL in seconds for static assets (JS, CSS)"
  type        = number
  default     = 31536000  # 1 year
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {
    Project   = "React Todo List"
    ManagedBy = "Terraform"
  }
}