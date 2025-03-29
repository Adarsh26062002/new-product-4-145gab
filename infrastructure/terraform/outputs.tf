# =========================================================================
# Terraform Output Configuration
# =========================================================================
# This file defines the outputs that are exposed after the infrastructure
# is deployed. These outputs are used by CI/CD pipelines for deployment
# and can be referenced when using the infrastructure.

output "website_bucket_name" {
  value       = aws_s3_bucket.todo_app_bucket.bucket
  description = "Name of the S3 bucket hosting the website files"
}

output "website_bucket_id" {
  value       = aws_s3_bucket.todo_app_bucket.id
  description = "ID of the S3 bucket hosting the website files"
}

output "website_endpoint" {
  value       = aws_s3_bucket.todo_app_bucket.website_endpoint
  description = "S3 website endpoint URL (direct S3 access)"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.todo_app_distribution.id
  description = "ID of the CloudFront distribution for cache invalidation"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.todo_app_distribution.domain_name
  description = "CloudFront domain name for accessing the website"
}

output "referer_secret" {
  value       = random_uuid.referer_secret.result
  description = "Secret UUID used for referer-based access control"
  sensitive   = true
}

output "deployment_url" {
  value       = "https://${aws_cloudfront_distribution.todo_app_distribution.domain_name}"
  description = "Primary URL to access the deployed application"
}