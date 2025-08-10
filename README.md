# Production-Ready Serverless Workshop

A comprehensive serverless food ordering application built with AWS Lambda, API Gateway, DynamoDB, EventBridge, and Cognito.
This project demonstrates production-ready serverless architecture patterns, testing strategies, and CI/CD practices.

## 🏗️ Architecture

This application implements an event-driven serverless architecture:

- **Frontend**: Static web page with Cognito authentication
- **API**: REST API built with API Gateway and Lambda functions
- **Database**: DynamoDB for restaurant data storage
- **Authentication**: AWS Cognito for user management
- **Events**: EventBridge for order processing workflow
- **Notifications**: SNS for restaurant notifications
- **Configuration**: SSM Parameter Store with Middy middleware

## 🚀 Features

- **Restaurant Browsing**: View and search restaurants by theme
- **User Authentication**: Sign up, sign in with Cognito
- **Order Placement**: Place orders with event-driven processing
- **Restaurant Notifications**: Automated notifications via SNS
- **Dynamic Configuration**: Runtime configuration via SSM parameters
- **Comprehensive Testing**: Integration and end-to-end tests
- **CI/CD Pipeline**: GitHub Actions with temporary environments

## 📋 Prerequisites

- Node.js 22.x
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Git

## 🚀 Deployment

### Deploy Infrastructure

1. **Initialize Terraform**
   ```bash
   cd terraform
   terraform init -backend-config=config/dev.backend.hcl
   ```

2. **Deploy to development**
   ```bash
   terraform apply -var-file=environments/dev.tfvars
   ```

3. **Generate environment file**
   ```bash
   terraform output > ../.env
   ```

### Seed Database

```bash
npm run bootstrap-db
```

## 🧪 Testing

The project includes comprehensive testing with different modes:

### Integration Tests (Local)
```bash
npm run test:integration
```

### End-to-End Tests (Deployed API)
```bash
npm run test:e2e
```

### Test Structure
- `tests/steps/given.mjs` - Test setup (user creation)
- `tests/steps/when.mjs` - Test actions (API calls)
- `tests/steps/teardown.mjs` - Test cleanup
- `tests/test_cases/` - Test specifications

## 📁 Project Structure

```
├── functions/                 # Lambda function source code
│   ├── get-index/             # Landing page handler
│   ├── get-restaurants/       # Restaurant listing
│   ├── search-restaurants/    # Restaurant search
│   ├── place-order/           # Order placement
│   ├── notify-restaurant/     # Restaurant notifications
│   └── seed-orders/           # Save order data in DynamoDB table from EventBridge events
├── terraform/                 # Infrastructure as Code
│   ├── environments/          # Environment-specific configs
│   ├── config/                # Backend configurations
│   └── scripts/               # Deployment scripts
├── terraform-bootstrap/       # Terraform backend infrastructure
│   └── main.tf                # S3 bucket and DynamoDB for state management
├── tests/                     # Test suite
│   ├── steps/                 # Test helpers
│   └── test_cases/            # Test specifications
└── docs/                      # Project documentation
```

## 🔧 Configuration

### Environment Variables

Key environment variables used by the application:

- `AWS_REGION` - AWS region for deployment
- `service_name` - Service identifier
- `stage_name` - Environment name (dev, prod)
- `restaurants_table` - DynamoDB table name
- `cognito_user_pool_id` - Cognito User Pool ID
- `bus_name` - EventBridge bus name

### SSM Parameters

The application uses SSM Parameter Store for runtime configuration:
- `/{service_name}/{stage_name}/get-restaurants/config`
- `/{service_name}/{stage_name}/search-restaurants/config`

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows:

### Temporary Environment Deployment
```bash
# Triggered manually or on push
.github/workflows/dev.yml
```

Features:
- Creates ephemeral test environments
- Runs integration and e2e tests
- Cleans up resources after testing
- Uses IAM roles with OIDC for secure authentication

## 🏷️ API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/`      | Landing page | None |
| GET    | `/restaurants` | List restaurants | IAM |
| POST   | `/restaurants/search` | Search restaurants | Cognito |
| POST   | `/orders` | Place order | Cognito |

## 🎯 Event-Driven Workflow

1. **Order Placed** → EventBridge `order_placed` event
2. **Notify Restaurant** → SNS notification + `restaurant_notified` event
3. **Additional Processing** → Extensible via EventBridge rules

## 🔐 Security

- **Authentication**: AWS Cognito with SRP protocol
- **Authorization**: IAM policies and Cognito JWT tokens
- **Encryption**: KMS-encrypted SSM parameters
- **Network**: API Gateway with proper CORS configuration

## 🚀 Scaling Considerations

- **Lambda**: Automatic scaling with configurable concurrency
- **DynamoDB**: On-demand billing mode
- **API Gateway**: Built-in throttling and caching
- **EventBridge**: Automatic scaling for event processing

## 🐛 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check AWS credentials and permissions
   - Verify Terraform backend configuration

2. **Tests Fail**
   - Ensure environment variables are set
   - Check AWS service quotas

3. **Lambda Errors**
   - Check CloudWatch logs
   - Verify IAM permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 🙏 Acknowledgments

- Terraform AWS provider maintainers
- serverless.tf open-source framework
- Middy middleware framework contributors

---

For more detailed information about specific components, check the inline code documentation and comments throughout the project.
