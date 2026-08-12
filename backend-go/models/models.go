package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type UserRole string

const (
	RoleTraveler UserRole = "traveler"
	RoleGuide    UserRole = "guide"
	RoleAdmin    UserRole = "admin"
)

// User represents user account in MongoDB
type User struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string        `bson:"name" json:"name"`
	Email     string        `bson:"email" json:"email"`
	Password  string        `bson:"password" json:"-"`
	Role      UserRole      `bson:"role" json:"role"`
	Avatar    string        `bson:"avatar" json:"avatar"`
	Phone     string        `bson:"phone" json:"phone"`
	Bio       string        `bson:"bio" json:"bio"`
	CreatedAt time.Time     `bson:"createdAt" json:"createdAt"`
}

// GuideProfile represents local guide profile details in MongoDB
type GuideProfile struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         bson.ObjectID `bson:"userId" json:"userId"`
	FullName       string        `bson:"fullName" json:"fullName"`
	City           string        `bson:"city" json:"city"`
	Rating         float64       `bson:"rating" json:"rating"`
	HourlyRateUSD  float64       `bson:"hourlyRateUSD" json:"hourlyRateUSD"`
	Languages      []string      `bson:"languages" json:"languages"`
	Bio            string        `bson:"bio" json:"bio"`
	TourTypes      []string      `bson:"tourTypes" json:"tourTypes"`
	Badges         []string      `bson:"badges" json:"badges"`
	IsOnline       bool          `bson:"isOnline" json:"isOnline"`
	CurrentLat     float64       `bson:"currentLat" json:"currentLat"`
	CurrentLng     float64       `bson:"currentLng" json:"currentLng"`
	VehicleModel   string        `bson:"vehicleModel" json:"vehicleModel"`
	Verified       bool          `bson:"verified" json:"verified"`
	CompletedTours int           `bson:"completedTours" json:"completedTours"`
}

// Landmark represents local attraction in MongoDB
type Landmark struct {
	ID                    bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name                  string        `bson:"name" json:"name"`
	Category              string        `bson:"category" json:"category"`
	City                  string        `bson:"city" json:"city"`
	Address               string        `bson:"address" json:"address"`
	Lat                   float64       `bson:"lat" json:"lat"`
	Lng                   float64       `bson:"lng" json:"lng"`
	ImageURL              string        `bson:"imageUrl" json:"imageUrl"`
	Description           string        `bson:"description" json:"description"`
	Rating                float64       `bson:"rating" json:"rating"`
	OpeningHours          string        `bson:"openingHours" json:"openingHours"`
	EntryFeeUSD           float64       `bson:"entryFeeUSD" json:"entryFeeUSD"`
	SuggestedDurationMins int           `bson:"suggestedDurationMins" json:"suggestedDurationMins"`
	Highlights            []string      `bson:"highlights" json:"highlights"`
}

// TourBooking represents Grab-style instant or scheduled booking in MongoDB
type TourBooking struct {
	ID               bson.ObjectID `bson:"_id,omitempty" json:"id"`
	BookingType      string        `bson:"bookingType" json:"bookingType"` // "instant" or "scheduled"
	TravelerID       bson.ObjectID `bson:"travelerId" json:"travelerId"`
	TravelerName     string        `bson:"travelerName" json:"travelerName"`
	GuideID          bson.ObjectID `bson:"guideId" json:"guideId"`
	GuideName        string        `bson:"guideName" json:"guideName"`
	TourTitle        string        `bson:"tourTitle" json:"tourTitle"`
	PickupLocation   string        `bson:"pickupLocation" json:"pickupLocation"`
	PickupLat        float64       `bson:"pickupLat" json:"pickupLat"`
	PickupLng        float64       `bson:"pickupLng" json:"pickupLng"`
	TransportMode    string        `bson:"transportMode" json:"transportMode"`
	GroupSize        int           `bson:"groupSize" json:"groupSize"`
	TotalPriceUSD    float64       `bson:"totalPriceUSD" json:"totalPriceUSD"`
	Status           string        `bson:"status" json:"status"` // "searching", "matched", "en_route", "in_progress", "completed"
	PINCode          string        `bson:"pinCode" json:"pinCode"`
	CreatedAt        time.Time     `bson:"createdAt" json:"createdAt"`
}
