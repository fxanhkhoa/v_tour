package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"tour-guide-hub-backend/config"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Firebase Firestore
	config.ConnectDB()

	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// API Routes
	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"service": "Tour Guide Hub Go + Firebase Firestore Backend",
			})
		})

		// Authentication
		api.POST("/auth/register", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
		})
		api.POST("/auth/login", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"token": "sample_jwt_token_from_golang_backend"})
		})

		// Landmarks
		api.GET("/landmarks", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"landmarks": []string{"Ben Thanh Market", "Notre Dame Basilica", "The Cafe Apartments"}})
		})

		// Grab-style Instant Guide Dispatch
		api.POST("/bookings/instant", func(c *gin.Context) {
			c.JSON(http.StatusCreated, gin.H{
				"status": "matched",
				"guideName": "Minh Nguyen",
				"pinCode": "8492",
			})
		})
	}

	fmt.Printf("🚀 Tour Guide Hub Go Backend listening on port %s...\n", port)
	r.Run(":" + port)
}
