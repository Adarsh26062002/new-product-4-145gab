#!/usr/bin/env bash
# =============================================================================
# backup.sh - Backup utility for React Todo List application
#
# Creates backups of build artifacts, configuration files, and infrastructure
# state for disaster recovery and rollback capabilities.
#
# Usage: ./backup.sh -e <environment> [options]
# =============================================================================

set -e

# Global Variables
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)
WEB_DIR="$ROOT_DIR/src/web"
BUILD_DIR="$WEB_DIR/build"
CONFIG_FILE="$SCRIPT_DIR/../hosting/config.json"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
BACKUP_DIR="$ROOT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERBOSE=false

# Function Declarations

# Display usage information
print_usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Creates backups of React Todo List application for disaster recovery and rollback.

Options:
  -e, --environment ENV   Target environment (development, staging, production)
                          Default: development
  -p, --provider PROVIDER Hosting provider (github-pages, aws-s3, netlify, vercel)
                          Default: From config.json
  -b, --build-only        Only backup build artifacts
  -c, --config-only       Only backup configuration files
  -s, --state-only        Only backup Terraform state
  -k, --keep-count NUM    Number of recent backups to keep per environment
                          Default: 5
  -o, --output-dir DIR    Custom backup output directory
                          Default: $ROOT_DIR/backups
  -v, --verbose           Enable verbose logging
  -h, --help              Display this help message

Examples:
  $(basename "$0") -e production                  # Backup everything for production
  $(basename "$0") -e staging -b                  # Backup only build artifacts for staging
  $(basename "$0") -e development -k 3            # Backup development and keep only 3 backups

EOF
}

# Log a message to console and log file
log_message() {
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local message="[$timestamp] $1"
    
    echo "$message"
    echo "$message" >> "$LOG_FILE"
    
    if [ "$VERBOSE" = true ] && [ -n "$2" ]; then
        echo "    $2"
        echo "    $2" >> "$LOG_FILE"
    fi
}

# Verify required tools are installed
check_dependencies() {
    local missing_deps=()
    
    # Check for essential tools
    for cmd in tar gzip jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for AWS CLI if backing up AWS resources
    if [ "$PROVIDER" = "aws-s3" ]; then
        if ! command -v aws &> /dev/null; then
            missing_deps+=("aws-cli")
        fi
    fi
    
    # Check for Terraform if backing up state
    if [ "$BACKUP_STATE" = true ]; then
        if ! command -v terraform &> /dev/null; then
            missing_deps+=("terraform")
        fi
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_message "ERROR: Missing required dependencies: ${missing_deps[*]}"
        log_message "Please install the missing dependencies and try again."
        return 1
    fi
    
    return 0
}

# Validate that the environment exists in config
validate_environment() {
    local env="$1"
    
    if [ -z "$env" ]; then
        log_message "ERROR: No environment specified"
        return 1
    fi
    
    # Check if environment exists in config file
    if ! jq -e ".environments.\"$env\"" "$CONFIG_FILE" &> /dev/null; then
        log_message "ERROR: Environment '$env' not found in configuration"
        log_message "Available environments: $(jq -r '.environments | keys | join(", ")' "$CONFIG_FILE")"
        return 1
    fi
    
    return 0
}

# Backup the build artifacts
backup_build_artifacts() {
    local backup_id="$1"
    local environment="$2"
    local target_dir="$BACKUP_DIR/$backup_id/build"
    
    log_message "Backing up build artifacts for $environment environment..."
    
    # Check if build directory exists
    if [ ! -d "$BUILD_DIR" ]; then
        log_message "WARNING: Build directory not found at $BUILD_DIR"
        log_message "Run the build process first or check directory path"
        return 1
    fi
    
    # Create backup directory
    mkdir -p "$target_dir" || {
        log_message "ERROR: Failed to create backup directory: $target_dir"
        return 1
    }
    
    # Create archive
    local archive_file="$target_dir/build_artifacts_${environment}.tar.gz"
    if tar -czf "$archive_file" -C "$WEB_DIR" build; then
        log_message "Successfully backed up build artifacts to $archive_file"
        return 0
    else
        log_message "ERROR: Failed to backup build artifacts"
        return 1
    fi
}

# Backup configuration files
backup_configuration() {
    local backup_id="$1"
    local environment="$2"
    local target_dir="$BACKUP_DIR/$backup_id/config"
    local temp_dir="$target_dir/temp"
    
    log_message "Backing up configuration files for $environment environment..."
    
    # Create backup directories
    mkdir -p "$temp_dir" || {
        log_message "ERROR: Failed to create backup directory: $temp_dir"
        return 1
    }
    
    # Copy hosting configuration
    cp "$CONFIG_FILE" "$temp_dir/" || log_message "WARNING: Failed to copy config.json"
    
    # Copy environment-specific configuration if exists
    local env_config="$SCRIPT_DIR/../environments/$environment.json"
    if [ -f "$env_config" ]; then
        cp "$env_config" "$temp_dir/" || log_message "WARNING: Failed to copy environment config"
    fi
    
    # Copy other important configuration files
    if [ -d "$SCRIPT_DIR/../cloudfront" ]; then
        mkdir -p "$temp_dir/cloudfront"
        cp -r "$SCRIPT_DIR/../cloudfront/"* "$temp_dir/cloudfront/" 2>/dev/null || log_message "WARNING: Failed to copy CloudFront configs"
    fi
    
    if [ -d "$SCRIPT_DIR/../s3" ]; then
        mkdir -p "$temp_dir/s3"
        cp -r "$SCRIPT_DIR/../s3/"* "$temp_dir/s3/" 2>/dev/null || log_message "WARNING: Failed to copy S3 configs"
    fi
    
    # Create archive
    local archive_file="$target_dir/configuration_${environment}.tar.gz"
    if tar -czf "$archive_file" -C "$target_dir" temp && rm -rf "$temp_dir"; then
        log_message "Successfully backed up configuration files to $archive_file"
        return 0
    else
        log_message "ERROR: Failed to backup configuration files"
        return 1
    fi
}

# Backup Terraform state files
backup_terraform_state() {
    local backup_id="$1"
    local environment="$2"
    local target_dir="$BACKUP_DIR/$backup_id/terraform"
    local temp_dir="$target_dir/temp"
    
    log_message "Backing up Terraform state for $environment environment..."
    
    # Check if Terraform directory exists
    if [ ! -d "$TERRAFORM_DIR" ]; then
        log_message "WARNING: Terraform directory not found at $TERRAFORM_DIR"
        return 1
    fi
    
    # Create backup directories
    mkdir -p "$temp_dir" || {
        log_message "ERROR: Failed to create backup directory: $temp_dir"
        return 1
    }
    
    # Change to Terraform directory
    pushd "$TERRAFORM_DIR" > /dev/null || {
        log_message "ERROR: Could not change to Terraform directory"
        return 1
    }
    
    # If using remote state, pull it to a local file
    if [ -f ".terraform/terraform.tfstate" ]; then
        if command -v terraform &> /dev/null; then
            log_message "Fetching remote Terraform state..."
            terraform state pull > "$temp_dir/terraform.tfstate" 2>/dev/null || log_message "WARNING: Could not pull remote state"
        else
            log_message "WARNING: Terraform not available, skipping remote state pull"
        fi
    fi
    
    # Copy local state files if they exist
    if [ -f "terraform.tfstate" ]; then
        cp terraform.tfstate "$temp_dir/" || log_message "WARNING: Could not copy terraform.tfstate"
    fi
    
    if [ -f "terraform.tfstate.backup" ]; then
        cp terraform.tfstate.backup "$temp_dir/" || log_message "WARNING: Could not copy terraform.tfstate.backup"
    fi
    
    # Copy terraform variables and outputs
    if [ -f "variables.tf" ]; then
        cp variables.tf "$temp_dir/" || log_message "WARNING: Could not copy variables.tf"
    fi
    
    if [ -f "outputs.tf" ]; then
        cp outputs.tf "$temp_dir/" || log_message "WARNING: Could not copy outputs.tf"
    fi
    
    # Return to original directory
    popd > /dev/null || {
        log_message "ERROR: Could not return from Terraform directory"
        return 1
    }
    
    # Check if we have any files to backup
    if [ -z "$(ls -A "$temp_dir" 2>/dev/null)" ]; then
        log_message "WARNING: No Terraform state files found to backup"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Create archive
    local archive_file="$target_dir/terraform_state_${environment}.tar.gz"
    if tar -czf "$archive_file" -C "$target_dir" temp && rm -rf "$temp_dir"; then
        log_message "Successfully backed up Terraform state to $archive_file"
        return 0
    else
        log_message "ERROR: Failed to backup Terraform state"
        return 1
    fi
}

# Backup AWS resources configuration
backup_aws_resources() {
    local backup_id="$1"
    local environment="$2"
    local target_dir="$BACKUP_DIR/$backup_id/aws"
    
    log_message "Backing up AWS resources for $environment environment..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_message "ERROR: AWS CLI not available, cannot backup AWS resources"
        return 1
    fi
    
    # Create backup directory
    mkdir -p "$target_dir" || {
        log_message "ERROR: Failed to create backup directory: $target_dir"
        return 1
    }
    
    # Extract S3 bucket name from configuration
    local bucket_name
    bucket_name=$(jq -r --arg env "$environment" '.environments[$env].s3Bucket // empty' "$CONFIG_FILE")
    
    # If not in config, try to get from Terraform outputs
    if [ -z "$bucket_name" ] && [ -d "$TERRAFORM_DIR" ]; then
        pushd "$TERRAFORM_DIR" > /dev/null || {
            log_message "ERROR: Could not change to Terraform directory"
            return 1
        }
        
        if command -v terraform &> /dev/null; then
            bucket_name=$(terraform output -raw s3_bucket_name 2>/dev/null) || bucket_name=""
        fi
        
        popd > /dev/null || {
            log_message "ERROR: Could not return from Terraform directory"
            return 1
        }
    fi
    
    # If we have a bucket name, export its configuration
    if [ -n "$bucket_name" ]; then
        log_message "Exporting configuration for S3 bucket: $bucket_name"
        
        # Export bucket configuration
        aws s3api get-bucket-policy --bucket "$bucket_name" > "$target_dir/s3_bucket_policy.json" 2>/dev/null || log_message "WARNING: Could not get bucket policy"
        aws s3api get-bucket-website --bucket "$bucket_name" > "$target_dir/s3_bucket_website.json" 2>/dev/null || log_message "WARNING: Could not get bucket website configuration"
        aws s3api get-bucket-cors --bucket "$bucket_name" > "$target_dir/s3_bucket_cors.json" 2>/dev/null || log_message "WARNING: Could not get bucket CORS configuration"
        
        # List bucket content (metadata only)
        aws s3 ls "s3://$bucket_name" --recursive > "$target_dir/s3_bucket_contents.txt" 2>/dev/null || log_message "WARNING: Could not list bucket contents"
    else
        log_message "WARNING: Could not determine S3 bucket name, skipping S3 backup"
    fi
    
    # Check for CloudFront distribution
    local distribution_id
    distribution_id=$(jq -r --arg env "$environment" '.environments[$env].cloudfrontId // empty' "$CONFIG_FILE")
    
    # If not in config, try to get from Terraform outputs
    if [ -z "$distribution_id" ] && [ -d "$TERRAFORM_DIR" ]; then
        pushd "$TERRAFORM_DIR" > /dev/null || {
            log_message "ERROR: Could not change to Terraform directory"
            return 1
        }
        
        if command -v terraform &> /dev/null; then
            distribution_id=$(terraform output -raw cloudfront_distribution_id 2>/dev/null) || distribution_id=""
        fi
        
        popd > /dev/null || {
            log_message "ERROR: Could not return from Terraform directory"
            return 1
        }
    fi
    
    # If we have a distribution ID, export its configuration
    if [ -n "$distribution_id" ]; then
        log_message "Exporting configuration for CloudFront distribution: $distribution_id"
        
        # Export distribution configuration
        aws cloudfront get-distribution --id "$distribution_id" > "$target_dir/cloudfront_distribution.json" 2>/dev/null || log_message "WARNING: Could not get distribution configuration"
        aws cloudfront get-distribution-config --id "$distribution_id" > "$target_dir/cloudfront_distribution_config.json" 2>/dev/null || log_message "WARNING: Could not get distribution config"
    else
        log_message "WARNING: Could not determine CloudFront distribution ID, skipping CloudFront backup"
    fi
    
    # Check if we have any files to backup
    if [ -z "$(ls -A "$target_dir" 2>/dev/null)" ]; then
        log_message "WARNING: No AWS resource configurations were exported"
        return 1
    fi
    
    log_message "Successfully backed up AWS resource configurations to $target_dir"
    return 0
}

# Create metadata file for the backup
create_backup_metadata() {
    local backup_id="$1"
    local environment="$2"
    local provider="$3"
    local target_dir="$BACKUP_DIR/$backup_id"
    
    log_message "Creating backup metadata..."
    
    # Gather backed up components
    local components=()
    
    if [ -d "$target_dir/build" ]; then
        components+=("build_artifacts")
    fi
    
    if [ -d "$target_dir/config" ]; then
        components+=("configuration")
    fi
    
    if [ -d "$target_dir/terraform" ]; then
        components+=("terraform_state")
    fi
    
    if [ -d "$target_dir/aws" ]; then
        components+=("aws_resources")
    fi
    
    # Get git commit hash if available
    local git_commit=""
    if command -v git &> /dev/null && [ -d "$ROOT_DIR/.git" ]; then
        git_commit=$(cd "$ROOT_DIR" && git rev-parse HEAD 2>/dev/null) || git_commit=""
    fi
    
    # Create metadata file
    cat > "$target_dir/metadata.json" <<EOF
{
  "backup_id": "$backup_id",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$environment",
  "provider": "$provider",
  "components": [$(printf "\"%s\"," "${components[@]}" | sed 's/,$//')]
  ${git_commit:+, "git_commit": "$git_commit"}
}
EOF
    
    if [ -f "$target_dir/metadata.json" ]; then
        log_message "Successfully created backup metadata"
        return 0
    else
        log_message "ERROR: Failed to create backup metadata"
        return 1
    fi
}

# Remove old backups to save space
cleanup_old_backups() {
    local environment="$1"
    local keep_count="$2"
    
    log_message "Cleaning up old backups for $environment environment (keeping $keep_count)..."
    
    # List all backup directories for this environment
    local backups=()
    for backup_dir in "$BACKUP_DIR"/*; do
        if [ -f "$backup_dir/metadata.json" ]; then
            local backup_env
            backup_env=$(jq -r '.environment // empty' "$backup_dir/metadata.json" 2>/dev/null)
            
            if [ "$backup_env" = "$environment" ]; then
                backups+=("$backup_dir")
            fi
        fi
    done
    
    # If we have more backups than we want to keep
    if [ ${#backups[@]} -gt "$keep_count" ]; then
        # Sort backups by creation time (oldest first)
        local sorted_backups=()
        for backup in "${backups[@]}"; do
            local timestamp
            timestamp=$(stat -c %Y "$backup" 2>/dev/null || stat -f %m "$backup" 2>/dev/null)
            sorted_backups+=("$timestamp $backup")
        done
        
        # Sort the backups
        IFS=$'\n' sorted_backups=($(sort -n <<<"${sorted_backups[*]}"))
        unset IFS
        
        # Calculate how many to delete
        local delete_count=$((${#sorted_backups[@]} - keep_count))
        
        # Delete the oldest backups
        local deleted=0
        for ((i=0; i<delete_count; i++)); do
            local backup_to_delete
            backup_to_delete=$(echo "${sorted_backups[$i]}" | cut -d' ' -f2-)
            
            log_message "Deleting old backup: $(basename "$backup_to_delete")"
            
            if rm -rf "$backup_to_delete"; then
                deleted=$((deleted + 1))
            else
                log_message "ERROR: Failed to delete backup: $backup_to_delete"
            fi
        done
        
        log_message "Cleanup complete. Deleted $deleted old backups."
    else
        log_message "No backups to clean up (have ${#backups[@]}, keeping $keep_count)"
    fi
    
    return 0
}

# Main function
main() {
    # Default values
    local ENVIRONMENT="development"
    local PROVIDER=""
    local BACKUP_BUILD=true
    local BACKUP_CONFIG=true
    local BACKUP_STATE=true
    local BACKUP_AWS=false
    local KEEP_COUNT=5
    local OUTPUT_DIR=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -p|--provider)
                PROVIDER="$2"
                shift 2
                ;;
            -b|--build-only)
                BACKUP_BUILD=true
                BACKUP_CONFIG=false
                BACKUP_STATE=false
                shift
                ;;
            -c|--config-only)
                BACKUP_BUILD=false
                BACKUP_CONFIG=true
                BACKUP_STATE=false
                shift
                ;;
            -s|--state-only)
                BACKUP_BUILD=false
                BACKUP_CONFIG=false
                BACKUP_STATE=true
                shift
                ;;
            -k|--keep-count)
                KEEP_COUNT="$2"
                shift 2
                ;;
            -o|--output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # If custom output directory is provided, update backup dir
    if [ -n "$OUTPUT_DIR" ]; then
        BACKUP_DIR="$OUTPUT_DIR"
    fi
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Validate environment
    if ! validate_environment "$ENVIRONMENT"; then
        exit 1
    fi
    
    # Get provider from config if not specified
    if [ -z "$PROVIDER" ]; then
        PROVIDER=$(jq -r --arg env "$ENVIRONMENT" '.environments[$env].provider' "$CONFIG_FILE")
    fi
    
    # Set AWS backup flag if provider is aws-s3
    if [ "$PROVIDER" = "aws-s3" ]; then
        BACKUP_AWS=true
    fi
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    # Generate backup ID
    local BACKUP_ID="backup_${ENVIRONMENT}_${TIMESTAMP}"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$BACKUP_ID" || {
        log_message "ERROR: Failed to create backup directory: $BACKUP_DIR/$BACKUP_ID"
        exit 1
    }
    
    log_message "Starting backup of React Todo List application"
    log_message "Environment: $ENVIRONMENT"
    log_message "Provider: $PROVIDER"
    log_message "Backup ID: $BACKUP_ID"
    
    # Track success status
    local success=true
    
    # Backup build artifacts
    if [ "$BACKUP_BUILD" = true ]; then
        if ! backup_build_artifacts "$BACKUP_ID" "$ENVIRONMENT"; then
            success=false
            log_message "WARNING: Build artifacts backup failed, continuing with other backups"
        fi
    fi
    
    # Backup configuration
    if [ "$BACKUP_CONFIG" = true ]; then
        if ! backup_configuration "$BACKUP_ID" "$ENVIRONMENT"; then
            success=false
            log_message "WARNING: Configuration backup failed, continuing with other backups"
        fi
    fi
    
    # Backup Terraform state
    if [ "$BACKUP_STATE" = true ]; then
        if ! backup_terraform_state "$BACKUP_ID" "$ENVIRONMENT"; then
            success=false
            log_message "WARNING: Terraform state backup failed, continuing with other backups"
        fi
    fi
    
    # Backup AWS resources
    if [ "$BACKUP_AWS" = true ]; then
        if ! backup_aws_resources "$BACKUP_ID" "$ENVIRONMENT"; then
            success=false
            log_message "WARNING: AWS resources backup failed, continuing with other backups"
        fi
    fi
    
    # Create metadata
    if ! create_backup_metadata "$BACKUP_ID" "$ENVIRONMENT" "$PROVIDER"; then
        success=false
        log_message "WARNING: Metadata creation failed"
    fi
    
    # Cleanup old backups
    if ! cleanup_old_backups "$ENVIRONMENT" "$KEEP_COUNT"; then
        log_message "WARNING: Cleanup of old backups failed"
    fi
    
    # Final status
    if [ "$success" = true ]; then
        log_message "Backup completed successfully: $BACKUP_ID"
        log_message "Backup location: $BACKUP_DIR/$BACKUP_ID"
        exit 0
    else
        log_message "Backup completed with warnings: $BACKUP_ID"
        log_message "Backup location: $BACKUP_DIR/$BACKUP_ID"
        exit 1
    fi
}

# Execute main function
main "$@"