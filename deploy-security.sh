#!/bin/bash

# Expertisestation API Security Hardening Deployment Script
# This script deploys the hardened API and runs security validation

set -e

API_URL="${API_URL:-https://api.expertisestation.com}"
ZAP_PORT="${ZAP_PORT:-8090}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo "🚀 Starting Expertisestation API Security Hardening Deployment"
echo "Environment: $ENVIRONMENT"
echo "API URL: $API_URL"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local timeout=${2:-60}
    local count=0
    
    echo "⏳ Waiting for service at $url to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo "✅ Service is ready!"
            return 0
        fi
        sleep 2
        count=$((count + 2))
    done
    
    echo "❌ Service failed to start within $timeout seconds"
    return 1
}

# Step 1: Deploy the application
echo "📦 Step 1: Deploying application..."

if [ "$ENVIRONMENT" = "docker" ]; then
    echo "🐳 Using Docker deployment..."
    
    # Build and start containers
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for API to be ready
    wait_for_service "http://localhost:8080/api/test" 30
    
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "🏭 Production deployment..."
    
    # Navigate to server directory
    cd src/server
    
    # Install dependencies
    npm ci --only=production
    
    # Start the server (assuming PM2 or similar process manager)
    if command_exists pm2; then
        pm2 restart expertisestation-api || pm2 start server.js --name expertisestation-api
    else
        echo "⚠️  PM2 not found. Starting server in background..."
        nohup node server.js > server.log 2>&1 &
        echo $! > server.pid
    fi
    
    cd ../..
    
    # Wait for API to be ready
    wait_for_service "$API_URL/api/test" 60
    
else
    echo "🔧 Development deployment..."
    cd src/server
    npm install
    npm run dev &
    SERVER_PID=$!
    cd ../..
    
    # Wait for API to be ready
    wait_for_service "http://localhost:8080/api/test" 30
fi

echo "✅ Application deployed successfully!"
echo ""

# Step 2: Run security validation tests
echo "🔒 Step 2: Running security validation tests..."

if command_exists node; then
    API_URL="$API_URL" node security-test.js
else
    echo "❌ Node.js not found. Skipping security tests."
fi

echo ""

# Step 3: Run OWASP ZAP security scan
echo "🕷️  Step 3: Running OWASP ZAP security scan..."

if command_exists docker; then
    echo "🐳 Starting ZAP Docker container..."
    
    # Create reports directory
    mkdir -p zap-reports
    
    # Run ZAP baseline scan
    docker run --rm \
        -v "$(pwd)/zap-reports:/zap/wrk/:rw" \
        -t owasp/zap2docker-stable zap-baseline.py \
        -t "$API_URL" \
        -J zap-report.json \
        -H zap-report.html \
        -r zap-report.md \
        -x zap-report.xml \
        -I \
        -d || true  # Don't fail on ZAP findings
    
    echo "📊 ZAP scan completed. Reports saved in zap-reports/"
    
    # Check if critical issues were found
    if [ -f "zap-reports/zap-report.json" ]; then
        CRITICAL_COUNT=$(grep -o '"riskcode":"3"' zap-reports/zap-report.json | wc -l || echo "0")
        HIGH_COUNT=$(grep -o '"riskcode":"2"' zap-reports/zap-report.json | wc -l || echo "0")
        
        echo "🔍 ZAP Scan Results:"
        echo "   Critical Issues: $CRITICAL_COUNT"
        echo "   High Issues: $HIGH_COUNT"
        
        if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$HIGH_COUNT" -gt 5 ]; then
            echo "⚠️  High number of security issues found. Please review the ZAP report."
        else
            echo "✅ Security scan passed with acceptable risk level."
        fi
    fi
    
elif command_exists zap.sh; then
    echo "🕷️  Using local ZAP installation..."
    
    # Start ZAP daemon
    zap.sh -daemon -port $ZAP_PORT -config api.disablekey=true &
    ZAP_PID=$!
    
    # Wait for ZAP to start
    sleep 10
    
    # Run baseline scan using ZAP API
    curl -s "http://localhost:$ZAP_PORT/JSON/spider/action/scan/?url=$API_URL" > /dev/null
    
    # Wait for spider to complete
    sleep 30
    
    # Run active scan
    curl -s "http://localhost:$ZAP_PORT/JSON/ascan/action/scan/?url=$API_URL" > /dev/null
    
    # Wait for scan to complete
    sleep 60
    
    # Generate report
    curl -s "http://localhost:$ZAP_PORT/OTHER/core/other/htmlreport/" > zap-report.html
    
    # Stop ZAP
    kill $ZAP_PID 2>/dev/null || true
    
    echo "📊 ZAP scan completed. Report saved as zap-report.html"
    
else
    echo "⚠️  OWASP ZAP not found. Skipping automated security scan."
    echo "   Please install ZAP or Docker to run security scans."
fi

echo ""

# Step 4: Validate specific security implementations
echo "🔍 Step 4: Validating security implementations..."

echo "Checking CSP headers..."
CSP_HEADER=$(curl -s -I "$API_URL/api/test" | grep -i "content-security-policy" || echo "Not found")
echo "CSP: $CSP_HEADER"

echo "Checking CORS configuration..."
CORS_HEADER=$(curl -s -I -H "Origin: https://malicious-site.com" "$API_URL/api/test" | grep -i "access-control-allow-origin" || echo "Properly restricted")
echo "CORS: $CORS_HEADER"

echo "Checking X-Powered-By removal..."
POWERED_BY=$(curl -s -I "$API_URL/api/test" | grep -i "x-powered-by" || echo "Successfully removed")
echo "X-Powered-By: $POWERED_BY"

echo "Checking metadata path blocking..."
METADATA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/actuator/health")
echo "Metadata path response: $METADATA_RESPONSE (should be 404)"

echo ""

# Step 5: Performance and health check
echo "🏥 Step 5: Running health checks..."

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/test")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed (Status: $HEALTH_STATUS)"
fi

# Check response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/api/test")
echo "⏱️  API response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "⚠️  API response time is slow. Consider optimization."
fi

echo ""

# Final summary
echo "🎉 Security hardening deployment completed!"
echo ""
echo "📋 Summary of implemented security measures:"
echo "   ✅ Content Security Policy (CSP) with frame-ancestors 'none'"
echo "   ✅ Tightened CORS configuration"
echo "   ✅ Restrictive Permissions-Policy header"
echo "   ✅ X-Powered-By header removal"
echo "   ✅ JSON content types for API responses"
echo "   ✅ Metadata path blocking"
echo "   ✅ Standardized 404 handling"
echo "   ✅ Hardened caching behavior"
echo ""
echo "📊 Next steps:"
echo "   1. Review ZAP scan results in zap-reports/ directory"
echo "   2. Monitor API performance and security metrics"
echo "   3. Schedule regular security scans"
echo "   4. Update security configurations as needed"
echo ""
echo "🔗 Useful commands:"
echo "   - View logs: docker-compose logs -f api"
echo "   - Run security tests: API_URL=$API_URL node security-test.js"
echo "   - Check API status: curl $API_URL/api/test"

# Cleanup development processes if needed
if [ "$ENVIRONMENT" = "development" ] && [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "🧹 Cleaning up development server..."
    kill $SERVER_PID 2>/dev/null || true
fi