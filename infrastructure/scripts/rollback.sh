#!/usr/bin/env bash
# =============================================================================
# rollback.sh - Rollback utility for React Todo List application
#
# Restores build artifacts, configuration, and infrastructure state from 
# previous backups to recover from deployment failures or issues.
#
# Usage: ./rollback.sh -e <environment> [options]
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
LOG_FILE="$SCRIPT_DIR/rollback.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function Declarations

# Display usage information
print_usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Rolls back React Todo List application to a previous deployment state.

Options:
  -e, --environment ENV   Target environment (development, staging, production)
                          Default: development
  -p, --provider PROVIDER Hosting provider (github-pages, aws-s3, netlify, vercel)
                          Default: From config.json
  -b, --backup-id ID      Specific backup ID to restore from
                          If not specified, lists available backups for selection
  -c, --backup-current    Create a backup of the current state before rollback
                          Default: True
  -i, --infrastructure    Rollback infrastructure state as well
                          Default: False
  -l, --list-backups      List available backups for the specified environment
  -s, --skip-verification Skip post-rollback verification
                          Default: False
  -f, --force             Force rollback without confirmation prompts
                          Default: False
  -v, --verbose           Enable verbose logging
  -h, --help              Display this help message

Examples:
  $(basename "$0") -e production                  # Interactive backup selection for production
  $(basename "$0") -e staging -b backup_staging_20230615_120000  # Rollback to specific backup
  $(basename "$0") -e development -i              # Rollback including infrastructure

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
    local provider="$1"
    local missing_deps=()
    
    # Check for essential tools
    for cmd in tar gzip jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for provider-specific dependencies
    case "$provider" in
        github-pages)
            if ! command -v git &> /dev/null; then
                missing_deps+=("git")
            fi
            ;;
        aws-s3)
            if ! command -v aws &> /dev/null; then
                missing_deps+=("aws-cli")
            fi
            ;;
        netlify)
            if ! command -v netlify &> /dev/null; then
                missing_deps+=("netlify-cli")
            fi
            ;;
        vercel)
            if ! command -v vercel &> /dev/null; then
                missing_deps+=("vercel")
            fi
            ;;
    esac
    
    # Check for terraform if infrastructure rollback is enabled
    if [ "$ROLLBACK_INFRASTRUCTURE" = true ]; then
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

# List all available backups for the specified environment
list_available_backups() {
    local environment="$1"
    local backups=()
    
    log_message "Listing available backups for $environment environment..."
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_message "No backups found. Backup directory does not exist."
        return 1
    fi
    
    # Find all backup directories for this environment
    for backup_dir in "$BACKUP_DIR"/*; do
        if [ -f "$backup_dir/metadata.json" ]; then
            local backup_env
            backup_env=$(jq -r '.environment // empty' "$backup_dir/metadata.json" 2>/dev/null)
            
            if [ "$backup_env" = "$environment" ]; then
                local backup_id
                backup_id=$(basename "$backup_dir")
                local timestamp
                timestamp=$(jq -r '.timestamp // empty' "$backup_dir/metadata.json" 2>/dev/null)
                
                # Format timestamp for display
                local display_time
                if [ -n "$timestamp" ]; then
                    display_time=$(date -d "$timestamp" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$timestamp")
                else
                    display_time="Unknown"
                fi
                
                backups+=("$backup_id|$display_time")
            fi
        fi
    done
    
    # Sort backups by timestamp (newest first)
    IFS=$'\n' sorted_backups=($(sort -r <<<"${backups[*]}"))
    unset IFS
    
    # Display backups
    if [ ${#sorted_backups[@]} -eq 0 ]; then
        log_message "No backups found for $environment environment."
        return 1
    else
        log_message "Available backups for $environment environment:"
        log_message "--------------------------------------------------"
        for i in "${!sorted_backups[@]}"; do
            local backup_info=(${sorted_backups[$i]//|/ })
            local index=$((i + 1))
            echo "$index) ${backup_info[0]} (${backup_info[1]})"
        done
        log_message "--------------------------------------------------"
    fi
    
    # Return array of backup IDs
    echo "${sorted_backups[@]}"
    return 0
}

# Validate that the specified backup exists and is complete
validate_backup() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Validating backup: $backup_id"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR/$backup_id" ]; then
        log_message "ERROR: Backup directory not found: $BACKUP_DIR/$backup_id"
        return 1
    fi
    
    # Check if metadata file exists
    if [ ! -f "$BACKUP_DIR/$backup_id/metadata.json" ]; then
        log_message "ERROR: Backup metadata not found: $BACKUP_DIR/$backup_id/metadata.json"
        return 1
    fi
    
    # Verify that backup is for the specified environment
    local backup_env
    backup_env=$(jq -r '.environment // empty' "$BACKUP_DIR/$backup_id/metadata.json" 2>/dev/null)
    
    if [ "$backup_env" != "$environment" ]; then
        log_message "ERROR: Backup is for environment '$backup_env', not '$environment'"
        return 1
    fi
    
    # Check for required components based on provider
    local provider
    provider=$(jq -r '.provider // empty' "$BACKUP_DIR/$backup_id/metadata.json" 2>/dev/null)
    
    # Ensure build artifacts exist
    if [ ! -d "$BACKUP_DIR/$backup_id/build" ]; then
        log_message "ERROR: Build artifacts not found in backup"
        return 1
    fi
    
    # For infrastructure rollback, ensure terraform state exists
    if [ "$ROLLBACK_INFRASTRUCTURE" = true ] && [ ! -d "$BACKUP_DIR/$backup_id/terraform" ]; then
        log_message "ERROR: Terraform state not found in backup, cannot rollback infrastructure"
        return 1
    fi
    
    log_message "Backup is valid: $backup_id"
    return 0
}

# Create a backup of the current state before rollback
create_current_backup() {
    local environment="$1"
    local provider="$2"
    
    log_message "Creating backup of current state before rollback..."
    
    # Generate backup ID
    local backup_id="pre_rollback_${environment}_${TIMESTAMP}"
    
    # Use backup.sh script to create backup
    if bash "$SCRIPT_DIR/backup.sh" -e "$environment" -p "$provider" -o "$BACKUP_DIR"; then
        log_message "Successfully created backup of current state: $backup_id"
        return 0
    else
        log_message "WARNING: Failed to create backup of current state"
        return 1
    fi
}

# Restore build artifacts from backup
restore_build_artifacts() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Restoring build artifacts from backup: $backup_id"
    
    # Check if build artifacts exist in backup
    local archive_file="$BACKUP_DIR/$backup_id/build/build_artifacts_${environment}.tar.gz"
    if [ ! -f "$archive_file" ]; then
        log_message "ERROR: Build artifacts not found in backup: $archive_file"
        return 1
    fi
    
    # Remove current build directory if it exists
    if [ -d "$BUILD_DIR" ]; then
        log_message "Removing current build directory: $BUILD_DIR"
        rm -rf "$BUILD_DIR"
    fi
    
    # Create parent directory if it doesn't exist
    mkdir -p "$(dirname "$BUILD_DIR")"
    
    # Extract build artifacts to build directory
    log_message "Extracting build artifacts to: $WEB_DIR"
    
    if tar -xzf "$archive_file" -C "$WEB_DIR"; then
        log_message "Successfully restored build artifacts"
        return 0
    else
        log_message "ERROR: Failed to restore build artifacts"
        return 1
    fi
}

# Restore configuration files from backup
restore_configuration() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Restoring configuration files from backup: $backup_id"
    
    # Check if configuration exists in backup
    local archive_file="$BACKUP_DIR/$backup_id/config/configuration_${environment}.tar.gz"
    if [ ! -f "$archive_file" ]; then
        log_message "WARNING: Configuration files not found in backup: $archive_file"
        log_message "Skipping configuration restoration"
        return 0
    fi
    
    # Create temporary directory for extraction
    local temp_dir="$BACKUP_DIR/$backup_id/config/temp"
    mkdir -p "$temp_dir"
    
    # Backup current configuration
    local config_backup_dir="$SCRIPT_DIR/../config_backup_${TIMESTAMP}"
    mkdir -p "$config_backup_dir"
    cp -r "$SCRIPT_DIR/../hosting" "$config_backup_dir/" 2>/dev/null || true
    
    # Extract configuration files
    if tar -xzf "$archive_file" -C "$BACKUP_DIR/$backup_id/config"; then
        # Copy configuration files to their respective directories
        cp -r "$temp_dir"/* "$SCRIPT_DIR/../" 2>/dev/null
        
        # Clean up
        rm -rf "$temp_dir"
        
        log_message "Successfully restored configuration files"
        log_message "Original configuration backed up to: $config_backup_dir"
        return 0
    else
        log_message "ERROR: Failed to restore configuration files"
        return 1
    fi
}

# Restore Terraform state from backup
restore_terraform_state() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Restoring Terraform state from backup: $backup_id"
    
    # Check if terraform state exists in backup
    local archive_file="$BACKUP_DIR/$backup_id/terraform/terraform_state_${environment}.tar.gz"
    if [ ! -f "$archive_file" ]; then
        log_message "WARNING: Terraform state not found in backup: $archive_file"
        log_message "Skipping Terraform state restoration"
        return 0
    fi
    
    # Create temporary directory for extraction
    local temp_dir="$BACKUP_DIR/$backup_id/terraform/temp"
    mkdir -p "$temp_dir"
    
    # Backup current Terraform state
    local tf_backup_dir="$TERRAFORM_DIR/state_backup_${TIMESTAMP}"
    mkdir -p "$tf_backup_dir"
    
    if [ -f "$TERRAFORM_DIR/terraform.tfstate" ]; then
        cp "$TERRAFORM_DIR/terraform.tfstate" "$tf_backup_dir/" 2>/dev/null || true
    fi
    
    if [ -f "$TERRAFORM_DIR/terraform.tfstate.backup" ]; then
        cp "$TERRAFORM_DIR/terraform.tfstate.backup" "$tf_backup_dir/" 2>/dev/null || true
    fi
    
    # Extract Terraform state files
    if tar -xzf "$archive_file" -C "$BACKUP_DIR/$backup_id/terraform"; then
        # Copy state files to Terraform directory
        cp -r "$temp_dir"/* "$TERRAFORM_DIR/" 2>/dev/null
        
        # Clean up
        rm -rf "$temp_dir"
        
        log_message "Successfully restored Terraform state"
        log_message "Original state backed up to: $tf_backup_dir"
        
        # If using remote state, push the restored state
        if command -v terraform &> /dev/null && [ -f "$TERRAFORM_DIR/.terraform/terraform.tfstate" ]; then
            log_message "Pushing restored state to remote storage..."
            (cd "$TERRAFORM_DIR" && terraform state push terraform.tfstate) || {
                log_message "WARNING: Failed to push state to remote storage"
                return 1
            }
        fi
        
        return 0
    else
        log_message "ERROR: Failed to restore Terraform state"
        return 1
    fi
}

# Rollback GitHub Pages deployment
rollback_github_pages() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Rolling back GitHub Pages deployment for $environment environment..."
    
    # First restore build artifacts
    if ! restore_build_artifacts "$backup_id" "$environment"; then
        log_message "ERROR: Failed to restore build artifacts, cannot proceed with GitHub Pages rollback"
        return 1
    fi
    
    # Get target branch from configuration
    local target_branch
    target_branch=$(jq -r --arg env "$environment" '.environments[$env].branch // "gh-pages"' "$CONFIG_FILE")
    
    log_message "Target GitHub Pages branch: $target_branch"
    
    # Create a temporary git repository in the build directory
    (
        cd "$BUILD_DIR" || {
            log_message "ERROR: Could not access build directory: $BUILD_DIR"
            return 1
        }
        
        # Initialize git
        git init || {
            log_message "ERROR: Failed to initialize git repository"
            return 1
        }
        
        # Configure git for GitHub Pages deployment
        git config user.name "Rollback Script" || {
            log_message "ERROR: Failed to configure git user name"
            return 1
        }
        
        git config user.email "rollback@example.com" || {
            log_message "ERROR: Failed to configure git user email"
            return 1
        }
        
        # Add all files
        git add -A || {
            log_message "ERROR: Failed to add files to git repository"
            return 1
        }
        
        # Commit changes
        git commit -m "Rollback to backup $backup_id" || {
            log_message "ERROR: Failed to commit changes"
            return 1
        }
        
        # Get remote URL from the parent repository
        local remote_url
        remote_url=$(cd "$ROOT_DIR" && git remote get-url origin 2>/dev/null) || {
            log_message "ERROR: Failed to get remote URL"
            return 1
        }
        
        # Add remote
        git remote add origin "$remote_url" || {
            log_message "ERROR: Failed to add remote"
            return 1
        }
        
        # Force push to target branch
        git push -f origin HEAD:"$target_branch" || {
            log_message "ERROR: Failed to push changes to $target_branch branch"
            return 1
        }
        
        log_message "Successfully rolled back GitHub Pages deployment to backup $backup_id"
        return 0
    ) || return 1
    
    # Clean up temporary git repository
    rm -rf "$BUILD_DIR/.git"
    
    return 0
}

# Rollback AWS S3 and CloudFront deployment
rollback_aws_s3() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Rolling back AWS S3 deployment for $environment environment..."
    
    # First restore build artifacts
    if ! restore_build_artifacts "$backup_id" "$environment"; then
        log_message "ERROR: Failed to restore build artifacts, cannot proceed with AWS S3 rollback"
        return 1
    fi
    
    # Get S3 bucket name from configuration
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
    
    if [ -z "$bucket_name" ]; then
        log_message "ERROR: Could not determine S3 bucket name"
        return 1
    fi
    
    log_message "Target S3 bucket: $bucket_name"
    
    # Sync build artifacts to S3 bucket
    log_message "Syncing build artifacts to S3 bucket..."
    
    # Apply appropriate cache headers based on file types
    local sync_command="aws s3 sync \"$BUILD_DIR\" \"s3://$bucket_name\" --delete"
    
    # Get cache profiles from config
    local cache_profiles
    cache_profiles=$(jq -c '.caching.profiles // {}' "$CONFIG_FILE")
    local file_mappings
    file_mappings=$(jq -c '.caching.fileExtensionMappings // {}' "$CONFIG_FILE")
    
    # Apply cache headers based on file extension
    local extensions
    extensions=$(echo "$file_mappings" | jq -r 'keys[]')
    
    for ext in $extensions; do
        local profile
        profile=$(echo "$file_mappings" | jq -r --arg ext "$ext" '.[$ext]')
        local cache_control
        cache_control=$(echo "$cache_profiles" | jq -r --arg profile "$profile" '.[$profile].cacheControl // "public, max-age=86400"')
        
        # Add to sync command
        sync_command="$sync_command --exclude \"*\" --include \"*$ext\" --cache-control \"$cache_control\""
    done
    
    # Add default cache control for remaining files
    local default_cache_control
    default_cache_control=$(echo "$cache_profiles" | jq -r '.default.cacheControl // "public, max-age=86400"')
    sync_command="$sync_command --exclude \"*.[^.]*\" --cache-control \"$default_cache_control\""
    
    # Execute the sync command
    eval "$sync_command" || {
        log_message "ERROR: Failed to sync build artifacts to S3 bucket"
        return 1
    }
    
    # Check if CloudFront distribution exists
    local cloudfront_id
    cloudfront_id=$(jq -r --arg env "$environment" '.environments[$env].cloudfrontId // empty' "$CONFIG_FILE")
    
    # If not in config, try to get from Terraform outputs
    if [ -z "$cloudfront_id" ] && [ -d "$TERRAFORM_DIR" ]; then
        pushd "$TERRAFORM_DIR" > /dev/null || {
            log_message "ERROR: Could not change to Terraform directory"
            return 1
        }
        
        if command -v terraform &> /dev/null; then
            cloudfront_id=$(terraform output -raw cloudfront_distribution_id 2>/dev/null) || cloudfront_id=""
        fi
        
        popd > /dev/null || {
            log_message "ERROR: Could not return from Terraform directory"
            return 1
        }
    fi
    
    # If CloudFront is enabled, invalidate cache
    if [ -n "$cloudfront_id" ]; then
        log_message "Invalidating CloudFront cache for distribution: $cloudfront_id"
        
        local invalidation_paths
        invalidation_paths=$(jq -r '.cdn.invalidationPaths[]' "$CONFIG_FILE" 2>/dev/null || echo "/*")
        
        # Create invalidation
        aws cloudfront create-invalidation --distribution-id "$cloudfront_id" --paths $invalidation_paths || {
            log_message "WARNING: Failed to invalidate CloudFront cache"
        }
    fi
    
    log_message "Successfully rolled back AWS S3 deployment to backup $backup_id"
    return 0
}

# Rollback Netlify deployment
rollback_netlify() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Rolling back Netlify deployment for $environment environment..."
    
    # Check for Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log_message "ERROR: Netlify CLI not found"
        log_message "Install Netlify CLI: npm install -g netlify-cli"
        return 1
    fi
    
    # First restore build artifacts
    if ! restore_build_artifacts "$backup_id" "$environment"; then
        log_message "ERROR: Failed to restore build artifacts, cannot proceed with Netlify rollback"
        return 1
    fi
    
    # Get Netlify site ID from configuration or environment
    local site_id
    site_id=$(jq -r --arg env "$environment" '.environments[$env].netlifyId // empty' "$CONFIG_FILE")
    
    if [ -z "$site_id" ]; then
        # Try to find site ID from Netlify config
        if [ -f "$ROOT_DIR/netlify.toml" ]; then
            site_id=$(grep -o 'site_id = "[^"]*"' "$ROOT_DIR/netlify.toml" | cut -d'"' -f2)
        fi
    fi
    
    if [ -z "$site_id" ]; then
        log_message "WARNING: No Netlify site ID found, will use default site"
    fi
    
    # Deploy to Netlify
    log_message "Deploying restored build to Netlify..."
    
    if [ -n "$site_id" ]; then
        netlify deploy --dir="$BUILD_DIR" --prod --site="$site_id" || {
            log_message "ERROR: Failed to deploy to Netlify"
            return 1
        }
    else
        netlify deploy --dir="$BUILD_DIR" --prod || {
            log_message "ERROR: Failed to deploy to Netlify"
            return 1
        }
    fi
    
    log_message "Successfully rolled back Netlify deployment to backup $backup_id"
    return 0
}

# Rollback Vercel deployment
rollback_vercel() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Rolling back Vercel deployment for $environment environment..."
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_message "ERROR: Vercel CLI not found"
        log_message "Install Vercel CLI: npm install -g vercel"
        return 1
    fi
    
    # First restore build artifacts
    if ! restore_build_artifacts "$backup_id" "$environment"; then
        log_message "ERROR: Failed to restore build artifacts, cannot proceed with Vercel rollback"
        return 1
    fi
    
    # Map environment to Vercel environment
    local vercel_env
    case "$environment" in
        production)
            vercel_env="production"
            ;;
        staging)
            vercel_env="preview"
            ;;
        *)
            vercel_env="development"
            ;;
    esac
    
    # Deploy to Vercel
    log_message "Deploying restored build to Vercel ($vercel_env environment)..."
    
    if [ "$vercel_env" = "production" ]; then
        vercel --cwd "$BUILD_DIR" --prod || {
            log_message "ERROR: Failed to deploy to Vercel production"
            return 1
        }
    else
        vercel --cwd "$BUILD_DIR" --env "$vercel_env" || {
            log_message "ERROR: Failed to deploy to Vercel $vercel_env"
            return 1
        }
    fi
    
    log_message "Successfully rolled back Vercel deployment to backup $backup_id"
    return 0
}

# Rollback infrastructure using Terraform
rollback_infrastructure() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "Rolling back infrastructure for $environment environment..."
    
    # Restore Terraform state from backup
    if ! restore_terraform_state "$backup_id" "$environment"; then
        log_message "ERROR: Failed to restore Terraform state, cannot proceed with infrastructure rollback"
        return 1
    fi
    
    # Change to Terraform directory
    pushd "$TERRAFORM_DIR" > /dev/null || {
        log_message "ERROR: Could not change to Terraform directory"
        return 1
    }
    
    log_message "Applying Terraform configuration with restored state..."
    
    # Initialize Terraform if needed
    if [ ! -d ".terraform" ]; then
        terraform init || {
            log_message "ERROR: Failed to initialize Terraform"
            popd > /dev/null || true
            return 1
        }
    fi
    
    # Apply Terraform configuration
    terraform apply -auto-approve -var="environment=$environment" || {
        log_message "ERROR: Failed to apply Terraform configuration"
        popd > /dev/null || true
        return 1
    }
    
    # Return to original directory
    popd > /dev/null || {
        log_message "ERROR: Could not return from Terraform directory"
        return 1
    }
    
    log_message "Successfully rolled back infrastructure to state from backup $backup_id"
    return 0
}

# Verify rollback was successful
verify_rollback() {
    local environment="$1"
    local provider="$2"
    
    log_message "Verifying rollback for $environment environment..."
    
    # Determine URL to check based on provider and environment
    local url=""
    
    case "$provider" in
        github-pages)
            local domain
            domain=$(jq -r --arg env "$environment" '.environments[$env].domain // empty' "$CONFIG_FILE")
            
            if [ -n "$domain" ]; then
                url="https://$domain"
            else
                # Get GitHub repository URL
                local repo_url
                repo_url=$(cd "$ROOT_DIR" && git remote get-url origin 2>/dev/null)
                repo_url=$(echo "$repo_url" | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
                
                # Get branch from config
                local branch
                branch=$(jq -r --arg env "$environment" '.environments[$env].branch // "gh-pages"' "$CONFIG_FILE")
                
                # Construct GitHub Pages URL
                local repo_name
                repo_name=$(basename "$repo_url")
                local owner
                owner=$(dirname "$repo_url" | xargs basename)
                
                if [ "$branch" = "gh-pages" ] || [ -z "$branch" ]; then
                    url="https://$owner.github.io/$repo_name"
                else
                    # For non-standard branches, we'd need to know the custom domain
                    url=""
                fi
            fi
            ;;
        aws-s3)
            # Try to get URL from config
            url=$(jq -r --arg env "$environment" '.environments[$env].url // empty' "$CONFIG_FILE")
            
            # If not in config, try to get from CloudFront
            if [ -z "$url" ]; then
                local cloudfront_id
                cloudfront_id=$(jq -r --arg env "$environment" '.environments[$env].cloudfrontId // empty' "$CONFIG_FILE")
                
                if [ -n "$cloudfront_id" ]; then
                    # Use CloudFront distribution URL
                    url="https://$cloudfront_id.cloudfront.net"
                else
                    # Try to get from S3 bucket
                    local bucket_name
                    bucket_name=$(jq -r --arg env "$environment" '.environments[$env].s3Bucket // empty' "$CONFIG_FILE")
                    
                    if [ -n "$bucket_name" ]; then
                        url="http://$bucket_name.s3-website-$(jq -r --arg env "$environment" '.environments[$env].region // "us-east-1"' "$CONFIG_FILE").amazonaws.com"
                    fi
                fi
            fi
            ;;
        netlify)
            # Try to get URL from Netlify
            local site_id
            site_id=$(jq -r --arg env "$environment" '.environments[$env].netlifyId // empty' "$CONFIG_FILE")
            
            if [ -n "$site_id" ] && command -v netlify &> /dev/null; then
                url=$(netlify sites:info "$site_id" --json | jq -r '.url // empty')
            else
                url=""
            fi
            ;;
        vercel)
            # Vercel URLs are more complex to determine
            # We would need to query the Vercel API
            url=""
            ;;
    esac
    
    # If we can't determine the URL, skip verification
    if [ -z "$url" ]; then
        log_message "WARNING: Could not determine URL for verification"
        log_message "Manual verification recommended"
        return 0
    fi
    
    log_message "Verifying rollback at URL: $url"
    
    # Wait a few seconds for deployment to propagate
    log_message "Waiting for rollback to propagate..."
    sleep 10
    
    # Check if site is accessible
    if command -v curl &> /dev/null; then
        # Check main page
        if ! curl -s -f -o /dev/null "$url"; then
            log_message "WARNING: Site is not accessible at $url"
            return 1
        fi
        
        # Check for index.html
        if ! curl -s -f -o /dev/null "$url/index.html"; then
            log_message "WARNING: index.html not found at $url/index.html"
            return 1
        fi
        
        log_message "Rollback verified successfully at $url"
        return 0
    else
        log_message "WARNING: curl not available for verification"
        log_message "Manual verification recommended"
        return 0
    fi
}

# Create a report of the rollback operation
create_rollback_report() {
    local backup_id="$1"
    local environment="$2"
    local provider="$3"
    local status="$4"
    
    log_message "Creating rollback report..."
    
    # Create report directory if it doesn't exist
    local report_dir="$ROOT_DIR/reports"
    mkdir -p "$report_dir"
    
    # Generate report file name
    local report_file="$report_dir/rollback_report_${environment}_${TIMESTAMP}.txt"
    
    # Create report
    {
        echo "====================================================="
        echo "           ROLLBACK OPERATION REPORT"
        echo "====================================================="
        echo ""
        echo "Date: $(date)"
        echo "Environment: $environment"
        echo "Provider: $provider"
        echo "Backup ID: $backup_id"
        echo ""
        echo "Status: $( [ "$status" -eq 0 ] && echo "SUCCESS" || echo "FAILURE")"
        echo ""
        echo "-----------------------------------------------------"
        echo "Components Rolled Back:"
        echo "-----------------------------------------------------"
        echo "- Build Artifacts"
        
        if [ "$ROLLBACK_INFRASTRUCTURE" = true ]; then
            echo "- Infrastructure State"
        fi
        
        echo ""
        echo "-----------------------------------------------------"
        echo "Log Excerpts:"
        echo "-----------------------------------------------------"
        
        # Include last 10 log entries
        tail -n 10 "$LOG_FILE" | sed 's/^/  /'
        
        echo ""
        echo "Full log available at: $LOG_FILE"
        echo ""
        echo "====================================================="
    } > "$report_file"
    
    log_message "Rollback report created: $report_file"
    echo "$report_file"
}

# Main function
main() {
    # Default values
    local ENVIRONMENT="development"
    local PROVIDER=""
    local BACKUP_ID=""
    local BACKUP_CURRENT=true
    local ROLLBACK_INFRASTRUCTURE=false
    local LIST_BACKUPS=false
    local SKIP_VERIFICATION=false
    local FORCE=false
    local VERBOSE=false
    
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
            -b|--backup-id)
                BACKUP_ID="$2"
                shift 2
                ;;
            -c|--backup-current)
                BACKUP_CURRENT=true
                shift
                ;;
            -i|--infrastructure)
                ROLLBACK_INFRASTRUCTURE=true
                shift
                ;;
            -l|--list-backups)
                LIST_BACKUPS=true
                shift
                ;;
            -s|--skip-verification)
                SKIP_VERIFICATION=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
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
    
    log_message "Starting rollback process"
    log_message "Environment: $ENVIRONMENT"
    log_message "Provider: $PROVIDER"
    
    # Check dependencies
    if ! check_dependencies "$PROVIDER"; then
        exit 1
    fi
    
    # List available backups if requested or no backup ID provided
    if [ "$LIST_BACKUPS" = true ] || [ -z "$BACKUP_ID" ]; then
        available_backups=$(list_available_backups "$ENVIRONMENT")
        
        if [ "$LIST_BACKUPS" = true ]; then
            exit 0
        fi
        
        if [ -z "$BACKUP_ID" ]; then
            # Prompt for backup selection
            echo ""
            read -p "Enter backup number to rollback to: " backup_choice
            echo ""
            
            # Validate input
            if ! [[ "$backup_choice" =~ ^[0-9]+$ ]]; then
                log_message "ERROR: Invalid backup selection"
                exit 1
            fi
            
            # Get backup ID from selection
            backup_index=$((backup_choice - 1))
            IFS=$'\n' backup_array=($available_backups)
            unset IFS
            
            if [ "$backup_index" -lt 0 ] || [ "$backup_index" -ge ${#backup_array[@]} ]; then
                log_message "ERROR: Invalid backup selection"
                exit 1
            fi
            
            selected_backup="${backup_array[$backup_index]}"
            BACKUP_ID=$(echo "$selected_backup" | cut -d'|' -f1)
        fi
    fi
    
    # Validate selected backup
    if ! validate_backup "$BACKUP_ID" "$ENVIRONMENT"; then
        exit 1
    fi
    
    log_message "Selected backup: $BACKUP_ID"
    
    # Confirm rollback if not using force flag
    if [ "$FORCE" != true ]; then
        echo ""
        echo "You are about to rollback the $ENVIRONMENT environment to backup: $BACKUP_ID"
        echo "This will overwrite the current deployment."
        echo ""
        read -p "Do you want to continue? (y/n): " confirm
        echo ""
        
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_message "Rollback aborted by user"
            exit 0
        fi
    fi
    
    # Create backup of current state if requested
    if [ "$BACKUP_CURRENT" = true ]; then
        create_current_backup "$ENVIRONMENT" "$PROVIDER" || {
            log_message "WARNING: Failed to create backup of current state"
            
            if [ "$FORCE" != true ]; then
                echo ""
                read -p "Continue rollback without current state backup? (y/n): " confirm
                echo ""
                
                if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                    log_message "Rollback aborted by user"
                    exit 0
                fi
            fi
        }
    fi
    
    # Perform rollback based on provider
    case "$PROVIDER" in
        github-pages)
            rollback_github_pages "$BACKUP_ID" "$ENVIRONMENT" || {
                log_message "ERROR: GitHub Pages rollback failed"
                exit 1
            }
            ;;
        aws-s3)
            rollback_aws_s3 "$BACKUP_ID" "$ENVIRONMENT" || {
                log_message "ERROR: AWS S3 rollback failed"
                exit 1
            }
            ;;
        netlify)
            rollback_netlify "$BACKUP_ID" "$ENVIRONMENT" || {
                log_message "ERROR: Netlify rollback failed"
                exit 1
            }
            ;;
        vercel)
            rollback_vercel "$BACKUP_ID" "$ENVIRONMENT" || {
                log_message "ERROR: Vercel rollback failed"
                exit 1
            }
            ;;
        *)
            log_message "ERROR: Unsupported provider: $PROVIDER"
            exit 1
            ;;
    esac
    
    # Rollback infrastructure if requested
    if [ "$ROLLBACK_INFRASTRUCTURE" = true ]; then
        rollback_infrastructure "$BACKUP_ID" "$ENVIRONMENT" || {
            log_message "ERROR: Infrastructure rollback failed"
            exit 1
        }
    fi
    
    # Verify rollback success
    local verification_status=0
    
    if [ "$SKIP_VERIFICATION" != true ]; then
        verify_rollback "$ENVIRONMENT" "$PROVIDER" || {
            log_message "WARNING: Rollback verification failed"
            verification_status=1
        }
    fi
    
    # Create rollback report
    create_rollback_report "$BACKUP_ID" "$ENVIRONMENT" "$PROVIDER" "$verification_status"
    
    # Final status
    if [ "$verification_status" -eq 0 ]; then
        log_message "Rollback completed successfully"
        exit 0
    else
        log_message "Rollback completed with verification warnings"
        exit 1
    fi
}

# Execute main function
main "$@"