package config

import (
	"context"
	"fmt"
	"log"
	"os"

	"cloud.google.com/go/firestore"
)

var DB *firestore.Client

// ConnectDB initializes connection to Firebase Firestore
func ConnectDB() *firestore.Client {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "tour-guide-hub-firebase"
	}

	ctx := context.Background()
	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		log.Printf("Firebase Firestore Client Notice (using memory fallback if unconfigured): %v", err)
	} else {
		fmt.Println("✅ Successfully connected to Firebase Firestore database project:", projectID)
	}

	DB = client
	return DB
}
