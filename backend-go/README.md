# Tour Guide Hub - Golang + MongoDB Backend

This folder contains the native Golang REST API backend with MongoDB driver for **Tour Guide Hub**.

## Features
- **MongoDB Integration**: Uses official `go.mongodb.org/mongo-driver/v2`.
- **Gin Web Framework**: Fast routing and middleware support.
- **JWT & Bcrypt Security**: Authentication and password hashing.
- **Grab-Style Guide Booking Engine**: Instant guide dispatch and location coordinates.

## How to Run Locally

1. **Start MongoDB**:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. **Set Environment Variables**:
```bash
export MONGO_URI="mongodb://localhost:27017"
export MONGO_DB_NAME="tour_guide_hub"
export PORT="8080"
```

3. **Run the Go Server**:
```bash
go run main.go
```

## Docker Deployment

Build and run using Docker:
```bash
docker build -t tour-guide-backend .
docker run -p 8080:8080 -e MONGO_URI="mongodb://your-mongo-host:27017" tour-guide-backend
```
