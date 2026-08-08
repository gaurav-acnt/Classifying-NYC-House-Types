from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel, Field
import joblib
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



COLUMNS = [
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood"
]

model = joblib.load("Model_Pipeline.pkl")


# Creating Pydantic model for input validation
class Features(BaseModel):

    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude must be between -90 and 90"
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude must be between -180 and 180"
    )

    price: float = Field(
        ...,
        gt=0,
        description="Price per night must be positive"
    )

    minimum_nights: int = Field(
        ...,
        ge=1,
        le=365,
        description="Minimum nights required for bookings"
    )

    number_of_reviews: int = Field(
        ...,
        ge=0,
        description="Total number of reviews"
    )

    reviews_per_month: float = Field(
        ...,
        ge=0,
        description="Average reviews per month"
    )

    calculated_host_listings_count: int = Field(
        ...,
        ge=0,
        description="Number of listings by this host"
    )

    availability_365: int = Field(
        ...,
        ge=0,
        le=365,
        description="Days available out of 365"
    )

    neighbourhood_group: str = Field(
        ...,
        min_length=1,
        description="Borough or neighbourhood group"
    )

    neighbourhood: str = Field(
        ...,
        min_length=1,
        description="Specific neighbourhood name"
    )


@app.get("/")
def greet():
    return "Hello Guys"


@app.post("/predict")
def predict(features: Features):

    # Convert Pydantic model into dictionary
    data = features.model_dump()

    # Create DataFrame
    row = pd.DataFrame([data])

    # Ensure columns are in the same order as the training data
    row = row[COLUMNS]

    # Prediction
    prediction = model.predict(row)

    # Prediction probability
    probability = model.predict_proba(row)

    return {
        "Predicted_room_type": prediction[0],
        "Probability": probability.tolist()
    }






















