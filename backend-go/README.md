# Tour Guide Hub - Golang + Firebase Firestore Backend

This folder contains the native Golang REST API backend with Firebase Firestore integration for **Tour Guide Hub**.

## Features
- **Firebase Firestore Integration**: Uses official `cloud.google.com/go/firestore`.
- **Gin Web Framework**: Fast routing and middleware support.
- **JWT & Bcrypt Security**: Authentication and password hashing.
- **Grab-Style Guide Booking Engine**: Instant guide dispatch and location coordinates.

## How to Run Locally

1. **Set Environment Variables**:
```bash
export FIREBASE_PROJECT_ID="tour-guide-hub-firebase"
export PORT="8080"
```

2. **Run the Go Server**:
```bash
go run main.go
```

## Docker Deployment

Build and run using Docker:
```bash
docker build -t tour-guide-backend .
docker run -p 8080:8080 -e FIREBASE_PROJECT_ID="your-firebase-project-id" tour-guide-backend
```

