package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var DB *mongo.Database

// ConnectDB initializes connection to MongoDB
func ConnectDB() *mongo.Database {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "tour_guide_hub"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Printf("MongoDB Ping Warning (using mock or local instance): %v", err)
	} else {
		fmt.Println("✅ Successfully connected to MongoDB database:", dbName)
	}

	DB = client.Database(dbName)
	return DB
}
