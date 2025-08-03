# Product Overview

This is a **Production Ready Serverless Workshop** project that demonstrates building a comprehensive restaurant food ordering application using AWS serverless technologies and event-driven architecture.

## Core Features
- **Restaurant Discovery**: Browse and search restaurants by theme/cuisine
- **User Authentication**: Complete sign-up/sign-in flow with AWS Cognito
- **Order Placement**: Place food orders with event-driven processing
- **Restaurant Notifications**: Automated SNS notifications to restaurants
- **Event-Driven Workflow**: EventBridge-based order processing with Step Functions
- **Real-time Updates**: Order status tracking and user notifications
- **Comprehensive Testing**: Integration and end-to-end testing with temporary environments

## Architecture
- **Frontend**: Static web pages served from Lambda with Cognito authentication
- **API**: REST API via API Gateway with Lambda backends
- **Authentication**: AWS Cognito User Pools with SRP protocol
- **Database**: DynamoDB for restaurant and order data
- **Events**: EventBridge custom bus for order processing events
- **Notifications**: SNS topics for restaurant and user notifications
- **Workflow**: Step Functions state machine for complex order processing
- **Configuration**: SSM Parameter Store with Middy middleware
- **Infrastructure**: Fully managed via Terraform with workspace support

## Event-Driven Workflow
1. **Order Placed** → EventBridge `order_placed` event
2. **Restaurant Notification** → SNS notification + `restaurant_notified` event
3. **Order Processing** → Step Functions workflow for complex order states
4. **User Updates** → SNS notifications for order status changes

## Target Use Case
Educational workshop demonstrating production-ready serverless patterns including event-driven architecture, infrastructure automation, comprehensive testing strategies, and CI/CD practices for AWS Lambda applications.
