#!/usr/bin/env bash
# =============================================================================
# deploy.sh - Deployment script for React Todo List application
#
# This script deploys the React Todo List application to various hosting
# environments including GitHub Pages, AWS S3/CloudFront, Netlify, and Vercel.
#
# Usage: ./deploy.sh -e <environment> [options]
# =============================================================================

set -e

# Global Variables
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)
WEB_DIR="$ROOT_DIR/src/web"
BUILD_DIR="$WEB_DIR/build"
CONFIG_FILE="$SCRIPT_DIR/../hosting/config.json"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
LOG_FILE="$SCRIPT_DIR/deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default values for command line arguments
ENVIRONMENT="development"
PROVIDER=""
INFRASTRUCTURE=false
CREATE_BACKUP=false
SKIP_VERIFICATION=false
FORCE=false
VERBOSE=false

# Function: print_usage
# Description: Displays script usage information
print_usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Deploy the React Todo List application to specified environment.

Options:
  -e, --environment ENV   Target environment (development, staging, production)
                          Default: development
  -p, --provider PROVIDER Hosting provider (github-pages, aws-s3, netlify, vercel)
                          Default: From config.json
  -b, --build-dir DIR     Path to the build directory
                          Default: $BUILD_DIR
  -i, --infrastructure    Provision or update infrastructure before deployment
  -c, --create-backup     Create a backup before deployment
  -s, --skip-verification Skip post-deployment verification
  -f, --force             Force deployment without confirmation prompts
  -v, --verbose           Enable verbose logging
  -h, --help              Display this help message

Examples:
  $(basename "$0") -e production                  # Deploy to production
  $(basename "$0") -e staging -p aws-s3           # Deploy to staging using AWS S3
  $(basename "$0") -e development -i -c           # Deploy to dev with infrastructure update and backup

EOF
}

# Function: log_message
# Description: Logs a message to both console and log file
# Parameters:
#   - $1: Message to log
#   - $2: Optional verbose message (only shown in verbose mode)
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

# Function: check_dependencies
# Description: Verifies that all required dependencies are installed
# Parameters:
#   - $1: Provider to check dependencies for
# Returns:
#   - 0 if all dependencies are available, 1 otherwise
check_dependencies() {
    local provider="$1"
    local missing_deps=()
    
    # Check for jq (required for all providers)
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Check provider-specific dependencies
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
    
    # Check Terraform if infrastructure provisioning is enabled
    if [ "$INFRASTRUCTURE" = true ] && ! command -v terraform &> /dev/null; then
        missing_deps+=("terraform")
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_message "ERROR: Missing required dependencies: ${missing_deps[*]}"
        log_message "Please install the missing dependencies and try again."
        return 1
    fi
    
    return 0
}

# Function: validate_build_directory
# Description: Validates that the build directory exists and contains required files
# Returns:
#   - 0 if build directory is valid, 1 otherwise
validate_build_directory() {
    log_message "Validating build directory..."
    
    # Check if build directory exists
    if [ ! -d "$BUILD_DIR" ]; then
        log_message "ERROR: Build directory not found at $BUILD_DIR"
        log_message "Run the build process first or specify the correct directory with --build-dir"
        return 1
    fi
    
    # Check for index.html
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        log_message "ERROR: index.html not found in build directory"
        log_message "Make sure the build was created successfully"
        return 1
    fi
    
    # Check for static assets (JavaScript and CSS)
    if [ ! -d "$BUILD_DIR/static" ] || \
       [ -z "$(find "$BUILD_DIR/static" -name "*.js" 2>/dev/null)" ] || \
       [ -z "$(find "$BUILD_DIR/static" -name "*.css" 2>/dev/null)" ]; then
        log_message "WARNING: Static assets may be missing from build directory"
        
        if [ "$FORCE" != true ]; then
            log_message "Use --force to deploy anyway"
            return 1
        fi
    fi
    
    log_message "Build directory validation successful"
    return 0
}

# Function: create_backup
# Description: Creates a backup of the current deployment
# Parameters:
#   - $1: Environment to backup
# Returns:
#   - 0 if backup succeeds, 1 otherwise
create_backup() {
    local environment="$1"
    
    log_message "Creating backup of current deployment for $environment environment..."
    
    if [ -f "$SCRIPT_DIR/backup.sh" ]; then
        # Execute backup script
        if bash "$SCRIPT_DIR/backup.sh" -e "$environment"; then
            log_message "Backup completed successfully"
            return 0
        else
            log_message "WARNING: Backup failed, but continuing with deployment"
            return 1
        fi
    else
        log_message "WARNING: Backup script not found at $SCRIPT_DIR/backup.sh"
        return 1
    fi
}

# Function: deploy_github_pages
# Description: Deploys the application to GitHub Pages
# Parameters:
#   - $1: Environment to deploy to
# Returns:
#   - 0 if deployment succeeds, 1 otherwise
deploy_github_pages() {
    local environment="$1"
    
    log_message "Deploying to GitHub Pages for $environment environment..."
    
    # Determine target branch from configuration
    local target_branch
    target_branch=$(jq -r --arg env "$environment" '.environments[$env].branch // "gh-pages"' "$CONFIG_FILE")
    
    log_message "Target branch: $target_branch"
    
    # Create temporary git repository in the build directory
    (
        cd "$BUILD_DIR" || {
            log_message "ERROR: Could not change to build directory"
            return 1
        }
        
        # Initialize git repository if not already initialized
        if [ ! -d .git ]; then
            git init || {
                log_message "ERROR: Failed to initialize git repository"
                return 1
            }
        fi
        
        # Configure git user if not already configured
        if ! git config user.name > /dev/null; then
            git config user.name "Deployment Bot" || {
                log_message "ERROR: Failed to configure git user name"
                return 1
            }
        fi
        
        if ! git config user.email > /dev/null; then
            git config user.email "deploy@example.com" || {
                log_message "ERROR: Failed to configure git user email"
                return 1
            }
        fi
        
        # Create .nojekyll file to prevent GitHub Pages from ignoring files that begin with underscores
        touch .nojekyll
        
        # Add all files to git
        git add -A || {
            log_message "ERROR: Failed to add files to git"
            return 1
        }
        
        # Commit changes (will not fail if there are no changes)
        if git diff --staged --quiet; then
            log_message "No changes to commit"
        else
            git commit -m "Deploy to $environment on $(date)" || {
                log_message "ERROR: Failed to commit changes"
                return 1
            }
        fi
        
        # Push to target branch
        if [ "$VERBOSE" = true ]; then
            # In verbose mode, show git output
            git push -f origin HEAD:"$target_branch" || {
                log_message "ERROR: Failed to push to $target_branch"
                return 1
            }
        else
            # In normal mode, suppress git output
            git push -f origin HEAD:"$target_branch" > /dev/null 2>&1 || {
                log_message "ERROR: Failed to push to $target_branch"
                return 1
            }
        fi
        
        log_message "Successfully deployed to GitHub Pages ($target_branch)"
    )
    
    # Return the exit status of the subshell
    return $?
}

# Function: deploy_aws_s3
# Description: Deploys the application to AWS S3 and optionally configures CloudFront
# Parameters:
#   - $1: Environment to deploy to
# Returns:
#   - 0 if deployment succeeds, 1 otherwise
deploy_aws_s3() {
    local environment="$1"
    
    log_message "Deploying to AWS S3 for $environment environment..."
    
    # Extract S3 bucket name from configuration
    local bucket_name
    bucket_name=$(jq -r --arg env "$environment" '.environments[$env].s3Bucket // empty' "$CONFIG_FILE")
    
    # If not in config, try to get from Terraform outputs
    if [ -z "$bucket_name" ] && [ -d "$TERRAFORM_DIR" ]; then
        log_message "S3 bucket not specified in config, attempting to read from Terraform outputs..."
        
        if pushd "$TERRAFORM_DIR" > /dev/null && terraform output -raw s3_bucket_name 2>/dev/null; then
            bucket_name=$(terraform output -raw s3_bucket_name)
            popd > /dev/null
        else
            log_message "Could not retrieve S3 bucket name from Terraform outputs"
            popd > /dev/null 2>/dev/null || true
        fi
    fi
    
    # Check if we have a bucket name
    if [ -z "$bucket_name" ]; then
        log_message "ERROR: S3 bucket name not specified and could not be determined"
        return 1
    fi
    
    log_message "Target S3 bucket: $bucket_name"
    
    # Check if CloudFront is enabled for this environment
    local enable_cdn
    enable_cdn=$(jq -r --arg env "$environment" '.environments[$env].enableCdn // false' "$CONFIG_FILE")
    
    # Get CloudFront distribution ID if CDN is enabled
    local distribution_id=""
    if [ "$enable_cdn" = "true" ]; then
        distribution_id=$(jq -r --arg env "$environment" '.environments[$env].cloudfrontId // empty' "$CONFIG_FILE")
        
        # If not in config, try to get from Terraform outputs
        if [ -z "$distribution_id" ] && [ -d "$TERRAFORM_DIR" ]; then
            log_message "CloudFront ID not specified in config, attempting to read from Terraform outputs..."
            
            if pushd "$TERRAFORM_DIR" > /dev/null && terraform output -raw cloudfront_distribution_id 2>/dev/null; then
                distribution_id=$(terraform output -raw cloudfront_distribution_id)
                popd > /dev/null
            else
                log_message "Could not retrieve CloudFront distribution ID from Terraform outputs"
                popd > /dev/null 2>/dev/null || true
            fi
        fi
        
        if [ -n "$distribution_id" ]; then
            log_message "CloudFront distribution ID: $distribution_id"
        else
            log_message "WARNING: CloudFront is enabled but distribution ID could not be determined"
        fi
    fi
    
    # Prepare AWS CLI deployment command with appropriate cache headers
    # Get caching profiles from configuration
    local html_cache
    html_cache=$(jq -r '.caching.profiles.html.cacheControl // "no-cache, no-store, must-revalidate"' "$CONFIG_FILE")
    
    local js_cache
    js_cache=$(jq -r '.caching.profiles.js.cacheControl // "public, max-age=31536000, immutable"' "$CONFIG_FILE")
    
    local css_cache
    css_cache=$(jq -r '.caching.profiles.css.cacheControl // "public, max-age=31536000, immutable"' "$CONFIG_FILE")
    
    local images_cache
    images_cache=$(jq -r '.caching.profiles.images.cacheControl // "public, max-age=86400"' "$CONFIG_FILE")
    
    local default_cache
    default_cache=$(jq -r '.caching.profiles.default.cacheControl // "public, max-age=86400"' "$CONFIG_FILE")
    
    # Deploy to S3 with appropriate cache headers
    log_message "Uploading files to S3 with appropriate cache headers..."
    
    # Upload HTML files
    aws s3 sync "$BUILD_DIR" "s3://$bucket_name" \
        --exclude "*" \
        --include "*.html" \
        --cache-control "$html_cache" \
        --acl public-read \
        $( [ "$VERBOSE" = true ] && echo "" || echo "--quiet" ) || {
        log_message "ERROR: Failed to upload HTML files to S3"
        return 1
    }
    
    # Upload JavaScript files
    aws s3 sync "$BUILD_DIR" "s3://$bucket_name" \
        --exclude "*" \
        --include "*.js" \
        --cache-control "$js_cache" \
        --acl public-read \
        $( [ "$VERBOSE" = true ] && echo "" || echo "--quiet" ) || {
        log_message "ERROR: Failed to upload JavaScript files to S3"
        return 1
    }
    
    # Upload CSS files
    aws s3 sync "$BUILD_DIR" "s3://$bucket_name" \
        --exclude "*" \
        --include "*.css" \
        --cache-control "$css_cache" \
        --acl public-read \
        $( [ "$VERBOSE" = true ] && echo "" || echo "--quiet" ) || {
        log_message "ERROR: Failed to upload CSS files to S3"
        return 1
    }
    
    # Upload image files
    aws s3 sync "$BUILD_DIR" "s3://$bucket_name" \
        --exclude "*" \
        --include "*.png" --include "*.jpg" --include "*.jpeg" --include "*.gif" --include "*.svg" --include "*.ico" \
        --cache-control "$images_cache" \
        --acl public-read \
        $( [ "$VERBOSE" = true ] && echo "" || echo "--quiet" ) || {
        log_message "ERROR: Failed to upload image files to S3"
        return 1
    }
    
    # Upload all other files
    aws s3 sync "$BUILD_DIR" "s3://$bucket_name" \
        --exclude "*.html" --exclude "*.js" --exclude "*.css" \
        --exclude "*.png" --exclude "*.jpg" --exclude "*.jpeg" --exclude "*.gif" --exclude "*.svg" --exclude "*.ico" \
        --cache-control "$default_cache" \
        --acl public-read \
        $( [ "$VERBOSE" = true ] && echo "" || echo "--quiet" ) || {
        log_message "ERROR: Failed to upload remaining files to S3"
        return 1
    }
    
    log_message "Successfully deployed to S3 bucket: $bucket_name"
    
    # Invalidate CloudFront cache if CDN is enabled and we have a distribution ID
    if [ "$enable_cdn" = "true" ] && [ -n "$distribution_id" ]; then
        log_message "Invalidating CloudFront cache..."
        
        # Get invalidation paths from configuration
        local invalidation_paths
        invalidation_paths=$(jq -r '.cdn.invalidationPaths // ["/*"]' "$CONFIG_FILE" | jq -r 'join(" ")')
        
        if [ -z "$invalidation_paths" ]; then
            invalidation_paths="/*"
        fi
        
        # Create invalidation
        aws cloudfront create-invalidation \
            --distribution-id "$distribution_id" \
            --paths $invalidation_paths \
            $( [ "$VERBOSE" = true ] && echo "" || echo "--no-cli-pager" ) || {
            log_message "WARNING: Failed to invalidate CloudFront cache, but deployment succeeded"
            return 0
        }
        
        log_message "Successfully invalidated CloudFront cache"
    fi
    
    return 0
}

# Function: deploy_netlify
# Description: Deploys the application to Netlify
# Parameters:
#   - $1: Environment to deploy to
# Returns:
#   - 0 if deployment succeeds, 1 otherwise
deploy_netlify() {
    local environment="$1"
    
    log_message "Deploying to Netlify for $environment environment..."
    
    # Check for Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log_message "ERROR: Netlify CLI not found"
        log_message "Install with: npm install -g netlify-cli"
        return 1
    fi
    
    # Extract site ID from configuration
    local site_id
    site_id=$(jq -r --arg env "$environment" '.environments[$env].netlifyId // empty' "$CONFIG_FILE")
    
    if [ -z "$site_id" ]; then
        log_message "WARNING: Netlify site ID not specified in configuration"
        log_message "Will attempt to deploy without specific site ID"
    else
        log_message "Netlify site ID: $site_id"
    fi
    
    # Determine production flag based on environment
    local prod_flag=""
    if [ "$environment" = "production" ]; then
        prod_flag="--prod"
    fi
    
    # Deploy to Netlify
    if [ -n "$site_id" ]; then
        # Deploy to specific site
        if netlify deploy --dir="$BUILD_DIR" --site="$site_id" $prod_flag; then
            log_message "Successfully deployed to Netlify"
            return 0
        else
            log_message "ERROR: Failed to deploy to Netlify"
            return 1
        fi
    else
        # Deploy without specific site
        if netlify deploy --dir="$BUILD_DIR" $prod_flag; then
            log_message "Successfully deployed to Netlify"
            return 0
        else
            log_message "ERROR: Failed to deploy to Netlify"
            return 1
        fi
    fi
}

# Function: deploy_vercel
# Description: Deploys the application to Vercel
# Parameters:
#   - $1: Environment to deploy to
# Returns:
#   - 0 if deployment succeeds, 1 otherwise
deploy_vercel() {
    local environment="$1"
    
    log_message "Deploying to Vercel for $environment environment..."
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_message "ERROR: Vercel CLI not found"
        log_message "Install with: npm install -g vercel"
        return 1
    fi
    
    # Determine production flag based on environment
    local prod_flag=""
    if [ "$environment" = "production" ]; then
        prod_flag="--prod"
    fi
    
    # Extract project ID from configuration
    local project_id
    project_id=$(jq -r --arg env "$environment" '.environments[$env].vercelId // empty' "$CONFIG_FILE")
    
    if [ -n "$project_id" ]; then
        log_message "Vercel project ID: $project_id"
    fi
    
    # Deploy to Vercel
    if vercel "$BUILD_DIR" $prod_flag --yes; then
        log_message "Successfully deployed to Vercel"
        return 0
    else
        log_message "ERROR: Failed to deploy to Vercel"
        return 1
    fi
}

# Function: provision_infrastructure
# Description: Provisions or updates infrastructure using Terraform
# Parameters:
#   - $1: Environment to provision for
# Returns:
#   - 0 if provisioning succeeds, 1 otherwise
provision_infrastructure() {
    local environment="$1"
    
    log_message "Provisioning infrastructure for $environment environment..."
    
    # Check if Terraform directory exists
    if [ ! -d "$TERRAFORM_DIR" ]; then
        log_message "ERROR: Terraform directory not found at $TERRAFORM_DIR"
        return 1
    fi
    
    # Change to Terraform directory
    pushd "$TERRAFORM_DIR" > /dev/null || {
        log_message "ERROR: Could not change to Terraform directory"
        return 1
    }
    
    # Initialize Terraform if not already initialized
    if [ ! -d ".terraform" ]; then
        log_message "Initializing Terraform..."
        if ! terraform init; then
            log_message "ERROR: Failed to initialize Terraform"
            popd > /dev/null
            return 1
        fi
    fi
    
    # Get provider from configuration
    local provider
    provider=$(jq -r --arg env "$environment" '.environments[$env].provider // "github-pages"' "$CONFIG_FILE")
    
    # Get region from configuration
    local region
    region=$(jq -r --arg env "$environment" '.environments[$env].region // "us-east-1"' "$CONFIG_FILE")
    
    # Get CDN enabled flag from configuration
    local enable_cdn
    enable_cdn=$(jq -r --arg env "$environment" '.environments[$env].enableCdn // false' "$CONFIG_FILE")
    
    # Apply Terraform configuration with variables
    log_message "Applying Terraform configuration..."
    
    if terraform apply -auto-approve \
        -var="environment=$environment" \
        -var="aws_region=$region" \
        -var="enable_cdn=$enable_cdn"; then
        log_message "Infrastructure provisioning successful"
        
        # Output infrastructure information for use in deployment
        log_message "Infrastructure outputs:"
        terraform output
        
        popd > /dev/null
        return 0
    else
        log_message "ERROR: Failed to provision infrastructure"
        popd > /dev/null
        return 1
    fi
}

# Function: verify_deployment
# Description: Verifies that the deployment was successful
# Parameters:
#   - $1: Environment that was deployed
#   - $2: Provider that was used for deployment
# Returns:
#   - 0 if verification succeeds, 1 otherwise
verify_deployment() {
    local environment="$1"
    local provider="$2"
    
    log_message "Verifying deployment for $environment environment on $provider..."
    
    # Determine the URL to check based on provider and environment
    local url=""
    
    case "$provider" in
        github-pages)
            # Get repository name from git remote
            local repo_name
            if [ -d "$ROOT_DIR/.git" ]; then
                repo_name=$(cd "$ROOT_DIR" && git remote get-url origin 2>/dev/null | sed -E 's/.*github.com[\/:]([^\/]+\/[^\/]+)(.git)?$/\1/')
            fi
            
            if [ -n "$repo_name" ]; then
                url="https://$(echo "$repo_name" | cut -d '/' -f 1).github.io/$(echo "$repo_name" | cut -d '/' -f 2)"
            else
                log_message "WARNING: Could not determine GitHub Pages URL"
                return 1
            fi
            ;;
        aws-s3)
            # Get bucket website endpoint from S3
            local bucket_name
            bucket_name=$(jq -r --arg env "$environment" '.environments[$env].s3Bucket // empty' "$CONFIG_FILE")
            
            if [ -n "$bucket_name" ]; then
                # Get region from configuration
                local region
                region=$(jq -r --arg env "$environment" '.environments[$env].region // "us-east-1"' "$CONFIG_FILE")
                
                url="http://$bucket_name.s3-website-$region.amazonaws.com"
            else
                log_message "WARNING: Could not determine S3 website URL"
                return 1
            fi
            ;;
        netlify)
            # Netlify deployments show the URL after deployment, can't easily determine here
            log_message "WARNING: Automated verification for Netlify deployments not implemented"
            log_message "Please check the deployment URL from the Netlify output above"
            return 0
            ;;
        vercel)
            # Vercel deployments show the URL after deployment, can't easily determine here
            log_message "WARNING: Automated verification for Vercel deployments not implemented"
            log_message "Please check the deployment URL from the Vercel output above"
            return 0
            ;;
        *)
            log_message "WARNING: Unknown provider for verification: $provider"
            return 1
            ;;
    esac
    
    if [ -n "$url" ]; then
        log_message "Verifying deployment at: $url"
        
        # Allow some time for deployment to propagate
        log_message "Waiting for deployment to propagate..."
        sleep 5
        
        # Check if the URL is accessible
        if curl -s -f -L "$url" > /dev/null; then
            log_message "Deployment verified successfully at $url"
            return 0
        else
            log_message "WARNING: Could not access deployment at $url"
            log_message "This may be due to propagation delay or deployment issues"
            return 1
        fi
    else
        log_message "WARNING: Could not determine URL for verification"
        return 1
    fi
}

# Function: main
# Description: Main function that orchestrates the deployment process
# Parameters:
#   - Command-line arguments
# Returns:
#   - 0 if deployment succeeds, 1 otherwise
main() {
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
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
            -b|--build-dir)
                BUILD_DIR="$2"
                shift 2
                ;;
            -i|--infrastructure)
                INFRASTRUCTURE=true
                shift
                ;;
            -c|--create-backup)
                CREATE_BACKUP=true
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
    
    log_message "Starting deployment of React Todo List application"
    log_message "Environment: $ENVIRONMENT"
    
    # Validate environment
    case "$ENVIRONMENT" in
        development|staging|production)
            # Valid environment
            ;;
        *)
            log_message "ERROR: Invalid environment: $ENVIRONMENT"
            log_message "Valid environments are: development, staging, production"
            exit 1
            ;;
    esac
    
    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        log_message "ERROR: Configuration file not found at $CONFIG_FILE"
        exit 1
    fi
    
    # If provider not specified, get from config file
    if [ -z "$PROVIDER" ]; then
        PROVIDER=$(jq -r --arg env "$ENVIRONMENT" '.environments[$env].provider // "github-pages"' "$CONFIG_FILE")
        log_message "Provider from configuration: $PROVIDER"
    fi
    
    # Validate provider
    case "$PROVIDER" in
        github-pages|aws-s3|netlify|vercel)
            # Valid provider
            ;;
        *)
            log_message "ERROR: Invalid provider: $PROVIDER"
            log_message "Valid providers are: github-pages, aws-s3, netlify, vercel"
            exit 1
            ;;
    esac
    
    # Check dependencies for selected provider
    if ! check_dependencies "$PROVIDER"; then
        exit 1
    fi
    
    # Validate build directory
    if ! validate_build_directory; then
        exit 1
    fi
    
    # Create backup if requested
    if [ "$CREATE_BACKUP" = true ]; then
        create_backup "$ENVIRONMENT" || true  # Continue even if backup fails
    fi
    
    # Provision infrastructure if requested
    if [ "$INFRASTRUCTURE" = true ]; then
        if ! provision_infrastructure "$ENVIRONMENT"; then
            log_message "ERROR: Infrastructure provisioning failed"
            exit 1
        fi
    fi
    
    # Deploy to selected provider
    local deploy_status=1
    case "$PROVIDER" in
        github-pages)
            deploy_github_pages "$ENVIRONMENT"
            deploy_status=$?
            ;;
        aws-s3)
            deploy_aws_s3 "$ENVIRONMENT"
            deploy_status=$?
            ;;
        netlify)
            deploy_netlify "$ENVIRONMENT"
            deploy_status=$?
            ;;
        vercel)
            deploy_vercel "$ENVIRONMENT"
            deploy_status=$?
            ;;
    esac
    
    if [ $deploy_status -ne 0 ]; then
        log_message "ERROR: Deployment failed"
        exit 1
    fi
    
    # Verify deployment if not skipped
    if [ "$SKIP_VERIFICATION" != true ]; then
        if ! verify_deployment "$ENVIRONMENT" "$PROVIDER"; then
            log_message "WARNING: Deployment verification failed"
            # Don't exit with error, as the deployment itself was successful
        fi
    fi
    
    log_message "Deployment completed successfully"
    return 0
}

# Execute main function with all arguments
main "$@"