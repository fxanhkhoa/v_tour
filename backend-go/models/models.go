package models

import (
	"time"
)

type UserRole string

const (
	RoleTraveler UserRole = "traveler"
	RoleGuide    UserRole = "guide"
	RoleAdmin    UserRole = "admin"
)

// User represents user account in Firebase Firestore
type User struct {
	ID        string    `firestore:"id" json:"id"`
	Name      string    `firestore:"name" json:"name"`
	Email     string    `firestore:"email" json:"email"`
	Password  string    `firestore:"-" json:"-"`
	Role      UserRole  `firestore:"role" json:"role"`
	Avatar    string    `firestore:"avatar" json:"avatar"`
	Phone     string    `firestore:"phone" json:"phone"`
	Bio       string    `firestore:"bio" json:"bio"`
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
}

// GuideProfile represents local guide profile details in Firebase Firestore
type GuideProfile struct {
	ID             string   `firestore:"id" json:"id"`
	UserID         string   `firestore:"userId" json:"userId"`
	FullName       string   `firestore:"fullName" json:"fullName"`
	City           string   `firestore:"city" json:"city"`
	Rating         float64  `firestore:"rating" json:"rating"`
	HourlyRateUSD  float64  `firestore:"hourlyRateUSD" json:"hourlyRateUSD"`
	Languages      []string `firestore:"languages" json:"languages"`
	Bio            string   `firestore:"bio" json:"bio"`
	TourTypes      []string `firestore:"tourTypes" json:"tourTypes"`
	Badges         []string `firestore:"badges" json:"badges"`
	IsOnline       bool     `firestore:"isOnline" json:"isOnline"`
	CurrentLat     float64  `firestore:"currentLat" json:"currentLat"`
	CurrentLng     float64  `firestore:"currentLng" json:"currentLng"`
	VehicleModel   string   `firestore:"vehicleModel" json:"vehicleModel"`
	Verified       bool     `firestore:"verified" json:"verified"`
	CompletedTours int      `firestore:"completedTours" json:"completedTours"`
}

// Landmark represents local attraction in Firebase Firestore
type Landmark struct {
	ID                    string   `firestore:"id" json:"id"`
	Name                  string   `firestore:"name" json:"name"`
	Category              string   `firestore:"category" json:"category"`
	City                  string   `firestore:"city" json:"city"`
	Address               string   `firestore:"address" json:"address"`
	Lat                   float64  `firestore:"lat" json:"lat"`
	Lng                   float64  `firestore:"lng" json:"lng"`
	ImageURL              string   `firestore:"imageUrl" json:"imageUrl"`
	Description           string   `firestore:"description" json:"description"`
	Rating                float64  `firestore:"rating" json:"rating"`
	OpeningHours          string   `firestore:"openingHours" json:"openingHours"`
	EntryFeeUSD           float64  `firestore:"entryFeeUSD" json:"entryFeeUSD"`
	SuggestedDurationMins int      `firestore:"suggestedDurationMins" json:"suggestedDurationMins"`
	Highlights            []string `firestore:"highlights" json:"highlights"`
}

// TourBooking represents Grab-style instant or scheduled booking in Firebase Firestore
type TourBooking struct {
	ID             string    `firestore:"id" json:"id"`
	BookingType    string    `firestore:"bookingType" json:"bookingType"` // "instant" or "scheduled"
	TravelerID     string    `firestore:"travelerId" json:"travelerId"`
	TravelerName   string    `firestore:"travelerName" json:"travelerName"`
	GuideID        string    `firestore:"guideId" json:"guideId"`
	GuideName      string    `firestore:"guideName" json:"guideName"`
	TourTitle      string    `firestore:"tourTitle" json:"tourTitle"`
	PickupLocation string    `firestore:"pickupLocation" json:"pickupLocation"`
	PickupLat      float64   `firestore:"pickupLat" json:"pickupLat"`
	PickupLng      float64   `firestore:"pickupLng" json:"pickupLng"`
	TransportMode  string    `firestore:"transportMode" json:"transportMode"`
	GroupSize      int       `firestore:"groupSize" json:"groupSize"`
	TotalPriceUSD  float64   `firestore:"totalPriceUSD" json:"totalPriceUSD"`
	Status         string    `firestore:"status" json:"status"` // "searching", "matched", "en_route", "in_progress", "completed"
	PINCode        string    `firestore:"pinCode" json:"pinCode"`
	CreatedAt      time.Time `firestore:"createdAt" json:"createdAt"`
}

