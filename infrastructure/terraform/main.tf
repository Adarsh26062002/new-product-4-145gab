# =========================================================================
# Terraform Configuration
# =========================================================================
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # version ~> 4.0
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random" # version ~> 3.0
      version = "~> 3.0"
    }
  }
}

# =========================================================================
# Provider Configuration
# =========================================================================
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.tags
  }
}

# Provider for us-east-1 region (required for ACM certificates used with CloudFront)
provider "aws" {
  region = "us-east-1"
  alias  = "us-east-1"
  default_tags {
    tags = var.tags
  }
}

# =========================================================================
# Local Variables
# =========================================================================
locals {
  bucket_name       = "${var.app_name}-${var.environment}-${random_id.bucket_suffix.hex}"
  logs_bucket_name  = "${var.app_name}-${var.environment}-logs-${random_id.bucket_suffix.hex}"
  use_custom_domain = var.domain_name != ""
}

# =========================================================================
# Random Resources
# =========================================================================
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "random_uuid" "referer_secret" {
  # Generate a random UUID for referer-based access control
}

# =========================================================================
# S3 Bucket for Website Hosting
# =========================================================================
resource "aws_s3_bucket" "todo_app_bucket" {
  bucket        = local.bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "todo_app_website" {
  bucket = aws_s3_bucket.todo_app_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_versioning" "todo_app_versioning" {
  bucket = aws_s3_bucket.todo_app_bucket.id
  
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_cors_configuration" "todo_app_cors" {
  bucket = aws_s3_bucket.todo_app_bucket.id

  cors_rule {
    allowed_headers = ["Authorization", "Content-Type", "Origin", "Accept"]
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "Content-Length"]
    max_age_seconds = 3600
  }
}

# =========================================================================
# S3 Bucket for Access Logs
# =========================================================================
resource "aws_s3_bucket" "logs_bucket" {
  count         = var.enable_logging ? 1 : 0
  bucket        = local.logs_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs_bucket[0].id

  rule {
    id     = "auto-expire"
    status = "Enabled"

    expiration {
      days = var.logs_retention
    }
  }
}

resource "aws_s3_bucket_logging" "todo_app_logging" {
  count         = var.enable_logging ? 1 : 0
  bucket        = aws_s3_bucket.todo_app_bucket.id
  target_bucket = aws_s3_bucket.logs_bucket[0].id
  target_prefix = "s3-access-logs/"
}

# =========================================================================
# CloudFront Origin Access Identity
# =========================================================================
resource "aws_cloudfront_origin_access_identity" "todo_app_oai" {
  comment = "OAI for ${var.app_name} ${var.environment}"
}

# =========================================================================
# S3 Bucket Policy
# =========================================================================
resource "aws_s3_bucket_policy" "todo_app_policy" {
  bucket = aws_s3_bucket.todo_app_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    sid     = "CloudFrontAccess"
    effect  = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.todo_app_oai.iam_arn]
    }
    
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.todo_app_bucket.arn}/*"]
  }

  statement {
    sid     = "DenyDirectAccessExceptWithReferer"
    effect  = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.todo_app_bucket.arn}/*"]
    
    condition {
      test     = "StringNotEquals"
      variable = "aws:Referer"
      values   = [random_uuid.referer_secret.result]
    }
  }

  statement {
    sid     = "EnforceHTTPS"
    effect  = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions   = ["s3:*"]
    resources = [
      aws_s3_bucket.todo_app_bucket.arn,
      "${aws_s3_bucket.todo_app_bucket.arn}/*"
    ]
    
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# =========================================================================
# CloudFront Distribution
# =========================================================================
resource "aws_cloudfront_distribution" "todo_app_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront Distribution for ${var.app_name} ${var.environment}"
  default_root_object = "index.html"
  price_class         = var.price_class
  http_version        = "http2"

  origin {
    domain_name = aws_s3_bucket.todo_app_bucket.bucket_regional_domain_name
    origin_id   = "S3Origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.todo_app_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin"]
    }
  }

  # Cache behavior for HTML files - shorter TTL
  ordered_cache_behavior {
    path_pattern     = "*.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 0
    default_ttl            = var.cache_ttl_html
    max_ttl                = var.cache_ttl_html

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin"]
    }
  }

  # Cache behavior for JS files - longer TTL
  ordered_cache_behavior {
    path_pattern     = "*.js"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = var.cache_ttl_assets
    default_ttl            = var.cache_ttl_assets
    max_ttl                = var.cache_ttl_assets

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin"]
    }
  }

  # Cache behavior for CSS files - longer TTL
  ordered_cache_behavior {
    path_pattern     = "*.css"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = var.cache_ttl_assets
    default_ttl            = var.cache_ttl_assets
    max_ttl                = var.cache_ttl_assets

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin"]
    }
  }

  # SPA routing - return index.html for 404/403 errors
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Geo restrictions (none by default)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL certificate configuration
  viewer_certificate {
    cloudfront_default_certificate = !local.use_custom_domain
    acm_certificate_arn            = local.use_custom_domain ? aws_acm_certificate.cert[0].arn : ""
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : null
  }

  # Logging configuration
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = false
      bucket          = aws_s3_bucket.logs_bucket[0].bucket_regional_domain_name
      prefix          = "cloudfront-logs/"
    }
  }
}

# =========================================================================
# ACM Certificate for Custom Domain (if specified)
# =========================================================================
resource "aws_acm_certificate" "cert" {
  count             = local.use_custom_domain ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  provider          = aws.us-east-1  # CloudFront requires certificates in us-east-1

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "cert_validation" {
  count              = local.use_custom_domain ? 1 : 0
  certificate_arn    = aws_acm_certificate.cert[0].arn
  provider           = aws.us-east-1
}