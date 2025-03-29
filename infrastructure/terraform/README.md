# React Todo List - Terraform Infrastructure

This directory contains Terraform configurations for provisioning the AWS infrastructure required to host the React Todo List application. The infrastructure consists of an S3 bucket for static website hosting, CloudFront for content delivery, and associated resources for security and performance optimization.

## Infrastructure Overview

The Terraform configuration provisions the following AWS resources:

- **S3 Bucket**: For hosting the static website files
- **CloudFront Distribution**: For content delivery with HTTPS and caching
- **Origin Access Identity**: For secure S3 access from CloudFront
- **S3 Bucket Policy**: For access control and security
- **ACM Certificate**: For custom domain HTTPS (optional)
- **Logging Configuration**: For access logs (optional)

This infrastructure provides a secure, scalable, and cost-effective hosting solution for the client-side React application.

## Prerequisites

Before using these Terraform configurations, ensure you have the following prerequisites:

1. **Terraform** (version 1.0.0 or higher) installed
2. **AWS CLI** installed and configured with appropriate credentials
3. **AWS Account** with permissions to create the required resources
4. **S3 Bucket** for Terraform state (optional, for team environments)

### AWS Permissions

The AWS account used for deployment needs permissions to create and manage the following resources:

- S3 buckets and bucket policies
- CloudFront distributions
- IAM roles and policies
- ACM certificates (if using custom domains)
- Route 53 records (if using custom domains with AWS DNS)

## Configuration

The Terraform configuration is split into multiple files for better organization:

### main.tf
Contains the main resource definitions for S3, CloudFront, and associated resources.

### variables.tf
Defines input variables that can be customized for different environments and deployments.

### outputs.tf
Defines output values that are displayed after successful deployment and can be used by other scripts.

## Variables

The following variables can be customized to configure the infrastructure:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region where resources will be created | `us-east-1` | No |
| `environment` | Deployment environment (development, staging, production) | `development` | No |
| `app_name` | Name of the application, used for resource naming | `react-todo-list` | No |
| `domain_name` | Custom domain name for the application | `""` (empty) | No |
| `enable_cdn` | Whether to enable CloudFront CDN | `true` | No |
| `price_class` | CloudFront price class | `PriceClass_100` | No |
| `enable_versioning` | Whether to enable S3 bucket versioning | `true` | No |
| `enable_logging` | Whether to enable access logging | `false` | No |
| `logs_retention` | Number of days to retain logs | `30` | No |
| `cache_ttl_html` | Cache TTL in seconds for HTML files | `0` | No |
| `cache_ttl_assets` | Cache TTL in seconds for static assets | `31536000` (1 year) | No |
| `tags` | Tags to apply to all resources | `{Project = "React Todo List", ManagedBy = "Terraform"}` | No |

These variables can be set in a `terraform.tfvars` file, passed as command-line arguments, or set as environment variables.

## Usage

Follow these steps to use the Terraform configuration:

### Initialization

Initialize the Terraform working directory:

```bash
cd infrastructure/terraform
terraform init
```

For team environments, configure a remote backend for state storage:

```bash
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=react-todo-list/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

### Planning

Generate and review an execution plan:

```bash
terraform plan -var environment=production
```

Or using a variables file:

```bash
terraform plan -var-file=production.tfvars
```

### Deployment

Apply the Terraform configuration to create the infrastructure:

```bash
terraform apply -var environment=production
```

Review the plan and confirm by typing `yes` when prompted.

### Outputs

After successful deployment, Terraform will display the following outputs:

- `website_bucket_name`: Name of the S3 bucket for website files
- `website_bucket_id`: ID of the S3 bucket
- `website_endpoint`: S3 website endpoint URL
- `cloudfront_distribution_id`: ID of the CloudFront distribution
- `cloudfront_domain_name`: CloudFront domain name
- `deployment_url`: Primary URL to access the application
- `referer_secret`: Secret for referer-based access control (sensitive)

These outputs can be used for deployment scripts and accessing the application.

## Deployment Integration

The Terraform configuration is designed to work with the deployment script (`infrastructure/scripts/deploy.sh`) for a streamlined deployment process:

```bash
# Deploy to AWS S3+CloudFront using Terraform
./infrastructure/scripts/deploy.sh -e production -p aws-s3
```

The deployment script will:

1. Initialize and apply the Terraform configuration
2. Build the React application
3. Upload the build artifacts to the S3 bucket
4. Invalidate the CloudFront cache if needed

See the deployment script documentation for more details.

## Custom Domain Configuration

To use a custom domain with the application:

1. Set the `domain_name` variable to your domain name:

```bash
terraform apply -var environment=production -var domain_name=todo.example.com
```

2. After deployment, create a CNAME record in your DNS provider pointing to the CloudFront domain name (available in the `cloudfront_domain_name` output).

3. Wait for the DNS changes to propagate and the SSL certificate to be validated.

Note: If using Route 53 for DNS, you can extend the Terraform configuration to automatically create the required DNS records.

## Cost Optimization

The infrastructure is designed to be cost-effective for a simple static website. Estimated monthly costs:

| Resource | Estimated Cost | Optimization Tips |
|----------|----------------|-------------------|
| S3 Storage | < $0.10 for typical usage | Clean up old versions if versioning is enabled |
| CloudFront | $0.10 - $1.00 depending on traffic | Use appropriate price class (PriceClass_100 for US/Europe only) |
| Data Transfer | Varies based on traffic | Enable appropriate caching to reduce origin requests |
| ACM Certificate | Free | No cost for certificates used with CloudFront |
| Logs Storage | $0.10 - $0.50 if enabled | Set appropriate retention period, disable in development |

Total estimated cost: **$0.20 - $2.00 per month** for typical usage.

To minimize costs:

- Disable logging in development environments
- Use appropriate CloudFront price class
- Set optimal cache TTL values
- Clean up resources when no longer needed

## Security Considerations

The Terraform configuration implements several security best practices:

- **Private S3 Bucket**: The S3 bucket is not publicly accessible
- **CloudFront OAI**: Only CloudFront can access the S3 bucket
- **HTTPS Enforcement**: All traffic is encrypted with HTTPS
- **TLS 1.2+**: Modern TLS protocols are enforced
- **Secure Headers**: Security headers are configured for CloudFront
- **Bucket Policy**: Restricts access and enforces HTTPS

Additional security measures can be implemented as needed for specific requirements.

## Maintenance and Updates

Regular maintenance tasks include:

1. **Terraform Updates**: Keep Terraform and providers updated
2. **Security Patches**: Apply security updates as needed
3. **Cost Review**: Regularly review resource usage and costs
4. **Performance Monitoring**: Monitor CloudFront and S3 metrics

To update the infrastructure:

```bash
# Update Terraform providers
terraform init -upgrade

# Apply changes
terraform apply -var environment=production
```

## Destroying Resources

To destroy the infrastructure when no longer needed:

```bash
terraform destroy -var environment=production
```

Review the plan carefully and confirm by typing `yes` when prompted.

**Warning**: This will permanently delete all resources, including the S3 bucket and its contents. Ensure you have backups of any important data.

## Troubleshooting

Common issues and their solutions:

1. **S3 Bucket Naming Conflicts**:
   - Error: `BucketAlreadyExists`
   - Solution: Change the `app_name` or add a unique suffix

2. **CloudFront Distribution Updates**:
   - Issue: Changes to CloudFront take 15-30 minutes to propagate
   - Solution: Be patient and wait for the deployment to complete

3. **ACM Certificate Validation**:
   - Issue: Certificate stuck in pending validation
   - Solution: Ensure DNS records are correctly configured

4. **Permission Issues**:
   - Error: `AccessDenied`
   - Solution: Verify AWS credentials have the required permissions

5. **Terraform State Lock**:
   - Error: `Error acquiring the state lock`
   - Solution: Check if another process is running or manually release the lock