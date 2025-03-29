# React Todo List - Hosting Configuration

This document provides detailed information about hosting options, configuration, and deployment procedures for the React Todo List application. As a client-side only application, it can be deployed to various static hosting providers with minimal configuration.

## Supported Hosting Providers

The React Todo List application supports the following hosting providers:

| Provider | Description | Pros | Cons |
|----------|-------------|------|------|
| GitHub Pages | Static site hosting provided by GitHub | Free for public repos, integrated with GitHub workflow, simple deployment | Limited customization, no server-side features |
| AWS S3 + CloudFront | Amazon Web Services static hosting with CDN | Highly scalable, full control, excellent performance | Pay-as-you-go cost, more complex setup |
| Netlify | Modern static site hosting platform | Free tier, easy deployment, preview builds, forms | Limited features in free tier |
| Vercel | Hosting platform optimized for React | Free tier, excellent performance, preview deployments | Limited features in free tier |

The default provider is GitHub Pages, which is sufficient for most use cases of this application.

## Configuration Options

The hosting configuration is defined in `config.json` in this directory. The file contains the following main sections:

1. **environments**: Environment-specific settings (development, staging, production)
2. **hosting**: General hosting configuration and provider-specific settings
3. **caching**: Cache control settings for different file types
4. **cdn**: Content Delivery Network configuration
5. **security**: Security headers and access control settings

You can modify these settings to customize the hosting configuration for your specific needs.

## Environment Configuration

The application supports three deployment environments:

1. **development**: For development and testing purposes
2. **staging**: For pre-production validation
3. **production**: For live deployment

Each environment can have different settings for:
- Hosting provider
- Domain name
- CDN configuration
- Caching policies
- Region settings

The environment is specified when running the deployment script:
```bash
./scripts/deploy.sh -e production
```

## GitHub Pages Deployment

GitHub Pages is the simplest hosting option for the React Todo List application.

### Configuration

1. In `config.json`, ensure the provider is set to `github-pages`:
   ```json
   "environments": {
     "production": {
       "provider": "github-pages",
       "branch": "gh-pages",
       ...
     }
   }
   ```

2. The `branch` setting determines which branch will be used for GitHub Pages (typically `gh-pages`).

### Deployment Steps

1. Build the application:
   ```bash
   cd src/web
   npm run build
   ```

2. Deploy using the deployment script:
   ```bash
   ./infrastructure/scripts/deploy.sh -e production -p github-pages
   ```

3. The script will push the build output to the specified GitHub Pages branch.

### Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. Add your domain in the GitHub repository settings under "Pages"
2. Create a CNAME file in the `public` directory with your domain name
3. Update DNS settings with your domain provider

### Limitations

- No server-side processing
- Limited to 1GB repository size
- Build artifacts must be committed to the repository

## AWS S3 + CloudFront Deployment

AWS provides a robust hosting solution with S3 for storage and CloudFront for content delivery.

### Prerequisites

1. AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Terraform installed (for infrastructure provisioning)

### Configuration

1. In `config.json`, set the provider to `aws-s3`:
   ```json
   "environments": {
     "production": {
       "provider": "aws-s3",
       "region": "us-east-1",
       "enableCdn": true,
       ...
     }
   }
   ```

2. CloudFront settings are defined in `../cloudfront/distribution.json`
3. S3 bucket policies are defined in `../s3/bucket-policy.json`

### Deployment Steps

1. Provision infrastructure (first time only):
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform apply -var environment=production
   ```

2. Deploy the application:
   ```bash
   ./infrastructure/scripts/deploy.sh -e production -p aws-s3
   ```

3. The script will build the application, upload to S3, and invalidate CloudFront cache if needed.

### Cost Considerations

AWS S3 + CloudFront typically costs $1-5/month for small applications with moderate traffic:
- S3: ~$0.023 per GB storage
- CloudFront: ~$0.085 per GB data transfer
- Request pricing: Minimal for small applications

### Performance Optimization

The CloudFront configuration includes:
- Optimized cache behaviors for different file types
- HTTP/2 support
- Compression enabled
- Custom error responses for SPA routing

## Netlify Deployment

Netlify provides an easy-to-use platform for deploying static websites.

### Prerequisites

1. Netlify account
2. Netlify CLI installed (optional for command-line deployment)

### Configuration

1. In `config.json`, set the provider to `netlify`:
   ```json
   "environments": {
     "production": {
       "provider": "netlify",
       ...
     }
   }
   ```

2. Create a `netlify.toml` file in the project root with:
   ```toml
   [build]
     publish = "src/web/build"
     command = "cd src/web && npm install && npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Deployment Steps

1. Using the deployment script:
   ```bash
   ./infrastructure/scripts/deploy.sh -e production -p netlify
   ```

2. Alternatively, connect your GitHub repository to Netlify for automatic deployments.

### Features

- Automatic HTTPS
- Preview deployments for pull requests
- Continuous deployment from Git
- Built-in form handling
- Free tier available

## Vercel Deployment

Vercel is optimized for React applications and provides excellent performance.

### Prerequisites

1. Vercel account
2. Vercel CLI installed (optional for command-line deployment)

### Configuration

1. In `config.json`, set the provider to `vercel`:
   ```json
   "environments": {
     "production": {
       "provider": "vercel",
       ...
     }
   }
   ```

2. Create a `vercel.json` file in the project root:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "src/web/package.json", "use": "@vercel/static-build", "config": { "distDir": "build" } }
     ],
     "routes": [
       { "handle": "filesystem" },
       { "src": "/.*", "dest": "/index.html" }
     ]
   }
   ```

### Deployment Steps

1. Using the deployment script:
   ```bash
   ./infrastructure/scripts/deploy.sh -e production -p vercel
   ```

2. Alternatively, connect your GitHub repository to Vercel for automatic deployments.

### Features

- Automatic HTTPS
- Preview deployments for pull requests
- Edge network for fast delivery
- Analytics included
- Free tier available

## Caching Configuration

The application uses optimized caching strategies for different file types:

| File Type | Cache Duration | Cache Control Header |
|-----------|----------------|----------------------|
| HTML | No cache | `no-cache, no-store, must-revalidate` |
| JavaScript | 1 year | `public, max-age=31536000, immutable` |
| CSS | 1 year | `public, max-age=31536000, immutable` |
| Images | 1 day (client), 1 week (CDN) | `public, max-age=86400, s-maxage=604800` |
| Fonts | 1 year | `public, max-age=31536000, immutable` |

These settings are defined in the `caching` section of `config.json` and are applied during deployment.

## Security Considerations

The hosting configuration includes several security enhancements:

1. **HTTPS Enforcement**: All environments force HTTPS connections
2. **Security Headers**: Appropriate security headers are set:
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy
   - Strict-Transport-Security
3. **S3 Bucket Policy**: When using AWS, the S3 bucket is private with CloudFront access only
4. **CORS Configuration**: Appropriate CORS headers for static assets

These settings are defined in the `security` section of `config.json`.

## Custom Domain Configuration

To use a custom domain with any hosting provider:

1. Purchase a domain from a domain registrar
2. Update the `domain` field in the environment configuration:
   ```json
   "environments": {
     "production": {
       "domain": "yourdomain.com",
       ...
     }
   }
   ```
3. Configure DNS settings according to your hosting provider's requirements:
   - **GitHub Pages**: Create a CNAME record pointing to your GitHub Pages URL
   - **AWS**: Create an A record pointing to your CloudFront distribution
   - **Netlify/Vercel**: Follow their domain configuration instructions

4. Update the deployment script with your domain information:
   ```bash
   ./infrastructure/scripts/deploy.sh -e production -d yourdomain.com
   ```

## Monitoring and Analytics

While the React Todo List application is client-side only, you can still implement basic monitoring:

1. **Performance Monitoring**:
   - Lighthouse scores for performance metrics
   - Page load time tracking
   - Client-side error tracking

2. **Usage Analytics** (Optional):
   - Google Analytics can be added for basic usage tracking
   - Privacy-focused alternatives like Plausible or Fathom

3. **Uptime Monitoring**:
   - Simple HTTP checks to verify the application is accessible
   - UptimeRobot or similar services for free basic monitoring

Refer to `../monitoring/README.md` for more detailed monitoring information.

## Troubleshooting

Common hosting issues and solutions:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| 404 errors after deployment | SPA routing not configured | Ensure proper redirects for client-side routing |
| Stale content after update | Browser or CDN caching | Add cache busting with file hashes, force CDN invalidation |
| CORS errors | Missing CORS headers | Configure appropriate CORS settings in hosting config |
| Slow initial load | Large bundle size | Implement code splitting, optimize assets |
| Deployment failures | Build errors, permission issues | Check build logs, verify credentials and permissions |

For detailed error information, check the deployment logs in `../scripts/deploy.log`.

This document provides comprehensive information about hosting options for the React Todo List application. The application's client-side only architecture allows for flexible deployment to various static hosting providers, with GitHub Pages being the simplest option for most use cases. For production deployments with higher performance requirements, AWS S3 with CloudFront provides an excellent balance of control, performance, and cost-effectiveness.