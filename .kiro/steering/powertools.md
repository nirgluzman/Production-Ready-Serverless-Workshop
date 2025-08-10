# AWS Lambda Powertools Patterns

This project extensively uses AWS Lambda Powertools for Node.js to implement production-ready observability and best practices.

## Core Components

### Logger (@aws-lambda-powertools/logger)
- **Structured Logging**: All logs output as JSON for better searchability
- **Service Name**: Automatically tagged with `process.env.service_name`
- **Sample Rate**: Configurable via `POWERTOOLS_LOGGER_SAMPLE_RATE` environment variable
- **Log Levels**: INFO for production, DEBUG for development environments
- **Context Injection**: Middy middleware automatically injects Lambda context (request ID, function name)

```javascript
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

const logger = new Logger({ serviceName: process.env.service_name });

// Usage patterns
logger.debug('getting restaurants...', { url: restaurantsApiRoot });
logger.debug('response status code', { statusCode: resp.status });
logger.debug('got restaurants', { count: restaurants.length });

// Middleware integration
export const handler = middy(async (event, context) => {
  logger.refreshSampleRateCalculation(); // Reset sampling for each invocation
  // ... handler logic
})
.use(injectLambdaContext(logger));
```

### Tracer (@aws-lambda-powertools/tracer)
- **X-Ray Integration**: Automatic distributed tracing across AWS services
- **Service Name**: Tagged with `process.env.service_name`
- **Cold Start Tracking**: Automatically captures Lambda cold starts
- **Response Metadata**: Add API responses to X-Ray traces for debugging

```javascript
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';

const tracer = new Tracer({ serviceName: process.env.service_name });

// Add response data to X-Ray trace
tracer.addResponseAsMetadata(data, 'GET /restaurants');

// Middleware integration
export const handler = middy(async (event, context) => {
  // ... handler logic
})
.use(captureLambdaHandler(tracer));
```

## Environment Variables

### Standard Configuration
- `POWERTOOLS_LOG_LEVEL`: Controls log verbosity (INFO/DEBUG)
- `POWERTOOLS_LOGGER_SAMPLE_RATE`: Percentage of logs to sample (0.1 = 10%)
- `POWERTOOLS_LOGGER_LOG_EVENT`: Whether to log incoming Lambda events (may contain PII)

### Project-Specific Variables
- `service_name`: Used for both Logger and Tracer service identification
- `stage_name`: Environment identifier (dev, prod)
- `ssm_stage_name`: SSM parameter path stage (may differ from stage_name)

## Terraform Integration

The custom Lambda function module automatically configures Powertools environment variables:

```hcl
environment_variables = merge(
  {
    service_name   = var.service_name
    stage_name     = var.stage_name
    ssm_stage_name = var.ssm_stage_name

    # AWS Lambda Powertools configuration
    POWERTOOLS_LOG_LEVEL          = var.log_level       # INFO for prod, DEBUG for dev
    POWERTOOLS_LOGGER_SAMPLE_RATE = var.log_sample_rate # Sample 10% of logs
    POWERTOOLS_LOGGER_LOG_EVENT   = "${var.log_event}"  # Log incoming events
  },
  var.environment_variables
)
```

## Best Practices

### Logging Patterns
- Use structured logging with attributes instead of string interpolation
- Capture variables as separate attributes for better searchability
- Reset sample rate calculation at the start of each invocation
- Use appropriate log levels (DEBUG for development details, INFO for production events)

### Tracing Patterns
- Add meaningful metadata to traces using `addResponseAsMetadata()`
- Use descriptive segment names that identify the operation
- Leverage automatic cold start and service name tagging

### Middleware Integration
- Always use Middy middleware for consistent context injection
- Apply both logger and tracer middleware to all handlers
- Order middleware appropriately (context injection should be early in the chain)

## Observability Benefits

### CloudWatch Logs
- Structured JSON logs enable advanced filtering and searching
- Automatic correlation with X-Ray traces via request IDs
- Cost optimization through sampling in high-volume environments

### X-Ray Traces
- End-to-end request tracing across Lambda, API Gateway, DynamoDB
- Performance bottleneck identification
- Error correlation and debugging
- Service map visualization for architecture understanding

### Monitoring Integration
- Structured logs integrate with CloudWatch Insights for advanced queries
- X-Ray service maps provide real-time architecture visualization
- Automatic alerting on error rates and performance degradation
