from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import io
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'fitness_tracker_secret_key_change_in_production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Helper Functions
def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return verify_token(credentials.credentials)

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: Optional[int] = None
    height: Optional[float] = None
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    activity_level: Optional[str] = "moderate"
    goal: Optional[str] = "maintenance"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: str
    name: str

class FoodAnalysisResponse(BaseModel):
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    confidence: str
    timestamp: datetime

class FoodLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float = 0
    sugar: float = 0
    meal_type: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodLogCreate(BaseModel):
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float = 0
    sugar: float = 0
    meal_type: str

class WaterLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount_ml: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WaterLogCreate(BaseModel):
    amount_ml: float

class WeightLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    weight: float
    body_fat_percentage: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeightLogCreate(BaseModel):
    weight: float
    body_fat_percentage: Optional[float] = None

class WorkoutLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exercise_name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    duration_minutes: Optional[int] = None
    calories_burned: Optional[float] = None
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkoutLogCreate(BaseModel):
    exercise_name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    duration_minutes: Optional[int] = None
    calories_burned: Optional[float] = None
    notes: Optional[str] = None

class WorkoutVideo(BaseModel):
    id: str
    title: str
    description: str
    duration_minutes: int
    difficulty: str
    muscle_group: str
    equipment: str
    video_url: str
    thumbnail_url: str

class DietPlanRequest(BaseModel):
    goal: str
    current_weight: float
    goal_weight: float
    activity_level: str
    dietary_preferences: Optional[str] = None

class DietPlanResponse(BaseModel):
    plan: str
    daily_calories: int
    macro_split: Dict[str, float]
    meal_suggestions: List[str]

class CalculatorInput(BaseModel):
    weight: float
    height: float
    age: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
    user_id = str(uuid.uuid4())
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password.decode(),
        "name": user_data.name,
        "age": user_data.age,
        "height": user_data.height,
        "current_weight": user_data.current_weight,
        "goal_weight": user_data.goal_weight,
        "activity_level": user_data.activity_level,
        "goal": user_data.goal,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    return TokenResponse(token=token, user_id=user_id, name=user_data.name)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(token=token, user_id=user["id"], name=user["name"])

# Food Routes
@api_router.post("/food/analyze")
async def analyze_food(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"food_analysis_{user_id}_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are a nutrition expert. Analyze food images and provide detailed nutritional information."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        from emergentintegrations.llm.chat import ImageContent
        
        message = UserMessage(
            text="""Analyze this food image and provide nutritional information in the following JSON format:
{
  "food_name": "name of the dish",
  "calories": estimated calories (number),
  "protein": grams of protein (number),
  "carbs": grams of carbohydrates (number),
  "fat": grams of fat (number),
  "fiber": grams of fiber (number),
  "sugar": grams of sugar (number),
  "confidence": percentage confidence (e.g., "85%")
}

Provide ONLY the JSON response, no additional text.""",
            file_contents=[ImageContent(image_base64=img_base64)]
        )
        
        response = await chat.send_message(message)
        
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        nutrition_data = json.loads(response_text)
        
        return FoodAnalysisResponse(
            food_name=nutrition_data.get("food_name", "Unknown Food"),
            calories=float(nutrition_data.get("calories", 0)),
            protein=float(nutrition_data.get("protein", 0)),
            carbs=float(nutrition_data.get("carbs", 0)),
            fat=float(nutrition_data.get("fat", 0)),
            fiber=float(nutrition_data.get("fiber", 0)),
            sugar=float(nutrition_data.get("sugar", 0)),
            confidence=nutrition_data.get("confidence", "N/A"),
            timestamp=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logging.error(f"Food analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/food/log", response_model=FoodLog)
async def create_food_log(food_data: FoodLogCreate, user_id: str = Depends(get_current_user)):
    food_dict = food_data.model_dump()
    food_obj = FoodLog(user_id=user_id, **food_dict)
    
    doc = food_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.food_logs.insert_one(doc)
    return food_obj

@api_router.get("/food/log", response_model=List[FoodLog])
async def get_food_logs(date: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    
    if date:
        try:
            target_date = datetime.fromisoformat(date)
            start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            query["timestamp"] = {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_day.isoformat()
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    logs = await db.food_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    for log in logs:
        if isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

@api_router.delete("/food/log/{log_id}")
async def delete_food_log(log_id: str, user_id: str = Depends(get_current_user)):
    result = await db.food_logs.delete_one({"id": log_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

# Water Routes
@api_router.post("/water/log", response_model=WaterLog)
async def create_water_log(water_data: WaterLogCreate, user_id: str = Depends(get_current_user)):
    water_obj = WaterLog(user_id=user_id, amount_ml=water_data.amount_ml)
    
    doc = water_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.water_logs.insert_one(doc)
    return water_obj

@api_router.get("/water/log")
async def get_water_logs(date: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    
    if date:
        try:
            target_date = datetime.fromisoformat(date)
            start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            query["timestamp"] = {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_day.isoformat()
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    logs = await db.water_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    total = sum(log['amount_ml'] for log in logs)
    
    return {"logs": logs, "total_ml": total}

# Weight Routes
@api_router.post("/weight/log", response_model=WeightLog)
async def create_weight_log(weight_data: WeightLogCreate, user_id: str = Depends(get_current_user)):
    weight_obj = WeightLog(user_id=user_id, **weight_data.model_dump())
    
    doc = weight_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.weight_logs.insert_one(doc)
    return weight_obj

@api_router.get("/weight/log", response_model=List[WeightLog])
async def get_weight_logs(user_id: str = Depends(get_current_user)):
    logs = await db.weight_logs.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    for log in logs:
        if isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

# Workout Routes
@api_router.post("/workout/log", response_model=WorkoutLog)
async def create_workout_log(workout_data: WorkoutLogCreate, user_id: str = Depends(get_current_user)):
    workout_obj = WorkoutLog(user_id=user_id, **workout_data.model_dump())
    
    doc = workout_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.workout_logs.insert_one(doc)
    return workout_obj

@api_router.get("/workout/log", response_model=List[WorkoutLog])
async def get_workout_logs(date: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    
    if date:
        try:
            target_date = datetime.fromisoformat(date)
            start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            query["timestamp"] = {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_day.isoformat()
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    logs = await db.workout_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    for log in logs:
        if isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

@api_router.delete("/workout/log/{log_id}")
async def delete_workout_log(log_id: str, user_id: str = Depends(get_current_user)):
    result = await db.workout_logs.delete_one({"id": log_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

# Workout Library
@api_router.get("/workout/library", response_model=List[WorkoutVideo])
async def get_workout_library(muscle_group: Optional[str] = None, difficulty: Optional[str] = None):
    workout_videos = [
        {
            "id": "1",
            "title": "Full Body HIIT Workout",
            "description": "High-intensity interval training for fat loss",
            "duration_minutes": 30,
            "difficulty": "intermediate",
            "muscle_group": "full_body",
            "equipment": "none",
            "video_url": "https://www.youtube.com/watch?v=ml6cT4AZdqI",
            "thumbnail_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400"
        },
        {
            "id": "2",
            "title": "Chest & Triceps Blast",
            "description": "Build upper body strength and size",
            "duration_minutes": 45,
            "difficulty": "advanced",
            "muscle_group": "chest",
            "equipment": "dumbbells",
            "video_url": "https://www.youtube.com/watch?v=IODxDxX7oi4",
            "thumbnail_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
        },
        {
            "id": "3",
            "title": "Leg Day Power",
            "description": "Build strong and powerful legs",
            "duration_minutes": 50,
            "difficulty": "intermediate",
            "muscle_group": "legs",
            "equipment": "barbell",
            "video_url": "https://www.youtube.com/watch?v=BS8Y7Q3gHjY",
            "thumbnail_url": "https://images.pexels.com/photos/136404/pexels-photo-136404.jpeg?w=400"
        },
        {
            "id": "4",
            "title": "Back & Biceps",
            "description": "Sculpt a strong back and arms",
            "duration_minutes": 40,
            "difficulty": "intermediate",
            "muscle_group": "back",
            "equipment": "dumbbells",
            "video_url": "https://www.youtube.com/watch?v=eE7dzZEMwfg",
            "thumbnail_url": "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400"
        },
        {
            "id": "5",
            "title": "Yoga Flow for Recovery",
            "description": "Stretch and recover with gentle yoga",
            "duration_minutes": 25,
            "difficulty": "beginner",
            "muscle_group": "mobility",
            "equipment": "mat",
            "video_url": "https://www.youtube.com/watch?v=v7AYKMP6rOE",
            "thumbnail_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"
        },
        {
            "id": "6",
            "title": "Core Shredder",
            "description": "Intense ab workout for a strong core",
            "duration_minutes": 20,
            "difficulty": "intermediate",
            "muscle_group": "abs",
            "equipment": "none",
            "video_url": "https://www.youtube.com/watch?v=DHD1-2P94DI",
            "thumbnail_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
        }
    ]
    
    filtered = workout_videos
    if muscle_group:
        filtered = [v for v in filtered if v["muscle_group"] == muscle_group]
    if difficulty:
        filtered = [v for v in filtered if v["difficulty"] == difficulty]
    
    return filtered

# Diet Coach Routes
@api_router.post("/diet/plan", response_model=DietPlanResponse)
async def generate_diet_plan(plan_request: DietPlanRequest, user_id: str = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"diet_plan_{user_id}_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are a professional nutritionist and diet coach."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Create a personalized diet plan for a user with the following details:
- Goal: {plan_request.goal}
- Current Weight: {plan_request.current_weight} kg
- Goal Weight: {plan_request.goal_weight} kg
- Activity Level: {plan_request.activity_level}
- Dietary Preferences: {plan_request.dietary_preferences or 'None'}

Provide:
1. Recommended daily calorie intake
2. Macro split (protein, carbs, fat percentages)
3. 5 specific meal suggestions
4. General dietary advice

Format your response as JSON:
{{
  "daily_calories": number,
  "protein_percentage": number,
  "carbs_percentage": number,
  "fat_percentage": number,
  "meal_suggestions": ["meal 1", "meal 2", ...],
  "advice": "general advice text"
}}
"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        plan_data = json.loads(response_text)
        
        return DietPlanResponse(
            plan=plan_data.get("advice", ""),
            daily_calories=int(plan_data.get("daily_calories", 2000)),
            macro_split={
                "protein": plan_data.get("protein_percentage", 30),
                "carbs": plan_data.get("carbs_percentage", 40),
                "fat": plan_data.get("fat_percentage", 30)
            },
            meal_suggestions=plan_data.get("meal_suggestions", [])
        )
    except Exception as e:
        logging.error(f"Diet plan generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")

# Analytics Routes
@api_router.get("/analytics/progress")
async def get_progress_analytics(days: int = 30, user_id: str = Depends(get_current_user)):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff_date.isoformat()
    
    weight_logs = await db.weight_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff_iso}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    food_logs = await db.food_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    workout_logs = await db.workout_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    daily_calories = {}
    for log in food_logs:
        date_str = log['timestamp'][:10]
        if date_str not in daily_calories:
            daily_calories[date_str] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        daily_calories[date_str]["calories"] += log['calories']
        daily_calories[date_str]["protein"] += log['protein']
        daily_calories[date_str]["carbs"] += log['carbs']
        daily_calories[date_str]["fat"] += log['fat']
    
    return {
        "weight_trend": weight_logs,
        "daily_nutrition": daily_calories,
        "total_workouts": len(workout_logs),
        "avg_daily_calories": sum(d["calories"] for d in daily_calories.values()) / max(len(daily_calories), 1)
    }

@api_router.get("/analytics/insights")
async def get_health_insights(user_id: str = Depends(get_current_user)):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
    cutoff_iso = cutoff_date.isoformat()
    
    food_logs = await db.food_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    water_logs = await db.water_logs.find(
        {"user_id": user_id, "timestamp": {"$gte": cutoff_iso}},
        {"_id": 0}
    ).to_list(10000)
    
    total_protein = sum(log['protein'] for log in food_logs)
    total_water = sum(log['amount_ml'] for log in water_logs)
    avg_daily_protein = total_protein / 7
    avg_daily_water = total_water / 7
    
    insights = []
    
    if avg_daily_protein < 80:
        insights.append({"type": "warning", "message": f"Your protein intake is low at {avg_daily_protein:.1f}g/day. Aim for at least 80-100g for optimal muscle recovery."})
    else:
        insights.append({"type": "success", "message": f"Great job! Your protein intake of {avg_daily_protein:.1f}g/day is on track."})
    
    if avg_daily_water < 2000:
        insights.append({"type": "warning", "message": f"You're drinking only {avg_daily_water:.0f}ml/day. Try to reach 2500-3000ml for optimal hydration."})
    else:
        insights.append({"type": "success", "message": f"Excellent hydration at {avg_daily_water:.0f}ml/day!"})
    
    return {"insights": insights, "weekly_summary": {"avg_protein": avg_daily_protein, "avg_water": avg_daily_water}}

# Calculator Routes
@api_router.post("/calculator/bmi")
async def calculate_bmi(data: CalculatorInput):
    height_m = data.height / 100
    bmi = data.weight / (height_m ** 2)
    
    category = "Normal"
    if bmi < 18.5:
        category = "Underweight"
    elif bmi >= 25 and bmi < 30:
        category = "Overweight"
    elif bmi >= 30:
        category = "Obese"
    
    return {"bmi": round(bmi, 2), "category": category}

@api_router.post("/calculator/bmr")
async def calculate_bmr(data: CalculatorInput):
    if not data.age or not data.gender:
        raise HTTPException(status_code=400, detail="Age and gender required for BMR")
    
    if data.gender.lower() == "male":
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
    else:
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
    
    return {"bmr": round(bmr, 2)}

@api_router.post("/calculator/tdee")
async def calculate_tdee(data: CalculatorInput):
    if not data.age or not data.gender or not data.activity_level:
        raise HTTPException(status_code=400, detail="Age, gender, and activity level required for TDEE")
    
    if data.gender.lower() == "male":
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
    else:
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
    
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    multiplier = multipliers.get(data.activity_level.lower(), 1.55)
    tdee = bmr * multiplier
    
    return {"tdee": round(tdee, 2), "bmr": round(bmr, 2)}

# Profile Routes
@api_router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/profile")
async def update_profile(profile_data: ProfileUpdate, user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile updated successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
