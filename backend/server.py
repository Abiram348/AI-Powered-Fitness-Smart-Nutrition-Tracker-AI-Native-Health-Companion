from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import quote_plus
import jwt
import bcrypt
import base64
import google.generativeai as genai
import io
import certifi
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
if mongo_url.startswith('mongodb+srv') or 'mongodb.net' in mongo_url:
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
else:
    client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

# LLM Configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', os.environ.get('EMERGENT_LLM_KEY', ''))
genai.configure(api_key=GOOGLE_API_KEY)


@asynccontextmanager
async def lifespan(app):
    # Startup
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan)
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


def build_youtube_search_url(query: str) -> str:
    cleaned = (query or "healthy recipe").strip()
    if not cleaned:
        cleaned = "healthy recipe"
    return f"https://www.youtube.com/results?search_query={quote_plus(cleaned)}"

# Models


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    gender: Optional[str] = None
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


class DietMealRecipe(BaseModel):
    meal_name: str
    short_description: str
    ingredients: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    prep_time_minutes: Optional[int] = None
    calories_estimate: Optional[int] = None
    video_url: Optional[str] = None
    video_search_url: Optional[str] = None


class DietPlanResponse(BaseModel):
    plan: str
    daily_calories: int
    macro_split: Dict[str, float]
    meal_suggestions: List[str]
    meal_recipes: List[DietMealRecipe] = Field(default_factory=list)


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

# Chatbot Models


class ChatPersonaUpdate(BaseModel):
    persona: str


class ChatMessage(BaseModel):
    message: str
    persona: Optional[str] = None


class ChatHistoryItem(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SentimentRequest(BaseModel):
    text: str

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
        "gender": user_data.gender,
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

        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt_text = """Analyze this food image and provide nutritional information in the following JSON format:
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

Provide ONLY the JSON response, no additional text."""

        response = model.generate_content([
            {"mime_type": "image/jpeg", "data": img_base64},
            prompt_text
        ])

        import json
        response_text = response.text.strip()
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


@api_router.delete("/water/log/{log_id}")
async def delete_water_log(log_id: str, user_id: str = Depends(get_current_user)):
    result = await db.water_logs.delete_one({"id": log_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

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
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""You are a professional nutritionist and diet coach. Create a personalized diet plan for a user with the following details:
- Goal: {plan_request.goal}
- Current Weight: {plan_request.current_weight} kg
- Goal Weight: {plan_request.goal_weight} kg
- Activity Level: {plan_request.activity_level}
- Dietary Preferences: {plan_request.dietary_preferences or 'None'}

Provide:
1. Recommended daily calorie intake
2. Macro split (protein, carbs, fat percentages)
3. 5 specific meal recipes with practical cooking guidance
4. General dietary advice

For each meal recipe include:
- meal_name
- short_description
- ingredients (4-10 items)
- steps (4-8 clear and short steps)
- prep_time_minutes
- calories_estimate
- video_query (query text to find a preparation video on YouTube)

Format your response as JSON:
{{
  "daily_calories": number,
  "protein_percentage": number,
  "carbs_percentage": number,
  "fat_percentage": number,
    "meal_suggestions": ["meal 1", "meal 2", ...],
    "meal_recipes": [
        {{
            "meal_name": "meal name",
            "short_description": "one-line summary",
            "ingredients": ["ingredient 1", "ingredient 2"],
            "steps": ["step 1", "step 2"],
            "prep_time_minutes": number,
            "calories_estimate": number,
            "video_query": "search phrase"
        }}
    ],
  "advice": "general advice text"
}}
"""

        import json

        plan_data: Dict = {}
        try:
            response = model.generate_content(prompt)
            response_text = (response.text or "").strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            parsed = json.loads(response_text)
            if isinstance(parsed, dict):
                plan_data = parsed
            else:
                logging.warning("Diet plan response was valid JSON but not an object. Falling back to defaults.")
        except Exception as llm_error:
            logging.warning(f"Diet plan LLM response parse failed, using defaults: {str(llm_error)}")

        def to_int(value, default):
            try:
                if value is None:
                    return default
                return int(float(value))
            except (TypeError, ValueError):
                return default

        def to_float(value, default):
            try:
                if value is None:
                    return default
                return float(value)
            except (TypeError, ValueError):
                return default

        meal_recipes: List[DietMealRecipe] = []
        raw_recipes = plan_data.get("meal_recipes", [])
        if isinstance(raw_recipes, list):
            for recipe in raw_recipes[:5]:
                if not isinstance(recipe, dict):
                    continue

                meal_name = str(recipe.get("meal_name") or recipe.get("name") or "").strip()
                if not meal_name:
                    continue

                ingredients_raw = recipe.get("ingredients", [])
                steps_raw = recipe.get("steps", [])
                ingredients = [str(item).strip() for item in ingredients_raw if str(item).strip()] if isinstance(ingredients_raw, list) else []
                steps = [str(item).strip() for item in steps_raw if str(item).strip()] if isinstance(steps_raw, list) else []

                if not ingredients:
                    ingredients = [
                        "Lean protein source",
                        "Complex carbohydrate",
                        "Fresh vegetables",
                        "Healthy fat source"
                    ]

                if not steps:
                    steps = [
                        f"Gather ingredients for {meal_name}.",
                        "Prep and portion all ingredients.",
                        "Cook protein and vegetables with minimal oil.",
                        "Serve in a balanced portion based on your calorie target."
                    ]

                short_description = str(recipe.get("short_description") or recipe.get("description") or "").strip()
                if not short_description:
                    short_description = "Balanced meal aligned to your calorie and macro targets."
                video_url = str(recipe.get("video_url") or "").strip() or None
                video_query = str(recipe.get("video_query") or meal_name).strip()
                video_search_url = build_youtube_search_url(video_query)

                prep_time = recipe.get("prep_time_minutes")
                calories_estimate = recipe.get("calories_estimate")

                prep_time_int = None
                if prep_time is not None:
                    try:
                        prep_time_int = int(float(prep_time))
                    except (TypeError, ValueError):
                        prep_time_int = None

                calories_estimate_int = None
                if calories_estimate is not None:
                    try:
                        calories_estimate_int = int(float(calories_estimate))
                    except (TypeError, ValueError):
                        calories_estimate_int = None

                meal_recipes.append(
                    DietMealRecipe(
                        meal_name=meal_name,
                        short_description=short_description,
                        ingredients=ingredients,
                        steps=steps,
                        prep_time_minutes=prep_time_int,
                        calories_estimate=calories_estimate_int,
                        video_url=video_url,
                        video_search_url=video_search_url,
                    )
                )

        meal_suggestions_raw = plan_data.get("meal_suggestions", [])
        meal_suggestions = [
            str(meal).strip()
            for meal in meal_suggestions_raw
            if isinstance(meal, str) and meal.strip()
        ] if isinstance(meal_suggestions_raw, list) else []

        if not meal_suggestions and meal_recipes:
            meal_suggestions = [recipe.meal_name for recipe in meal_recipes]

        if not meal_recipes and meal_suggestions:
            for meal in meal_suggestions[:5]:
                meal_recipes.append(
                    DietMealRecipe(
                        meal_name=meal,
                        short_description="Balanced meal tailored to your goal.",
                        ingredients=[
                            "Lean protein source",
                            "Complex carbohydrate",
                            "Fiber-rich vegetables",
                            "Healthy fat source"
                        ],
                        steps=[
                            "Prepare and portion all ingredients.",
                            "Cook protein with minimal oil.",
                            "Add vegetables and cook until tender.",
                            "Serve with complex carbs and healthy fat in balanced portions."
                        ],
                        video_search_url=build_youtube_search_url(f"{meal} healthy recipe")
                    )
                )

        if not meal_recipes:
            fallback_meals = [
                "High-protein breakfast bowl",
                "Grilled protein and quinoa salad",
                "Lentil and vegetable power lunch",
                "Greek yogurt fruit snack",
                "Baked fish or tofu with roasted vegetables"
            ]
            meal_suggestions = fallback_meals.copy()

            for meal in fallback_meals:
                meal_recipes.append(
                    DietMealRecipe(
                        meal_name=meal,
                        short_description="A practical, balanced meal for sustainable progress.",
                        ingredients=[
                            "Lean protein",
                            "Whole grain or complex carbs",
                            "Colorful vegetables",
                            "Healthy fat (nuts, seeds, or olive oil)"
                        ],
                        steps=[
                            "Prepare and portion all ingredients.",
                            "Cook protein and carbs until done.",
                            "Add vegetables and season lightly.",
                            "Plate and adjust portion size to fit your daily target."
                        ],
                        video_search_url=build_youtube_search_url(f"{meal} healthy recipe")
                    )
                )

        advice_text = str(plan_data.get("advice") or "").strip()
        if not advice_text:
            advice_text = (
                "Prioritize whole foods, hydrate well, and keep portions aligned with your calorie target. "
                "Aim for consistent meal timing and include protein in every meal for better satiety and recovery."
            )

        return DietPlanResponse(
            plan=advice_text,
            daily_calories=to_int(plan_data.get("daily_calories"), 2000),
            macro_split={
                "protein": to_float(plan_data.get("protein_percentage"), 30),
                "carbs": to_float(plan_data.get("carbs_percentage"), 40),
                "fat": to_float(plan_data.get("fat_percentage"), 30)
            },
            meal_suggestions=meal_suggestions,
            meal_recipes=meal_recipes
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

# ==================== CHATBOT ROUTES ====================

# 5 Coach personas — 3 Male, 2 Female — each with a distinct personality
COACH_PROFILES = {
    "marcus": {
        "name": "Coach Marcus",
        "gender": "male",
        "tagline": "Military-style discipline. Zero excuses.",
        "avatar_style": "muscular_male",
        "accent_color": "#ef4444",
        "prompt": """You are COACH MARCUS — a military-style male fitness coach in his 40s.
You are extremely strict, disciplined, and no-nonsense.
- Speak like a drill sergeant. Short, punchy commands.
- Call the user 'soldier' or 'recruit' sometimes.
- Push them relentlessly. Zero tolerance for excuses.
- Use phrases like 'Drop and give me 20!', 'Pain is weakness leaving the body!', 'No retreat, no surrender!'
- Deep down you care, but you show it through brutal honesty and tough love.
- If they mention slacking, give them a fiery motivational wake-up call."""
    },
    "alex": {
        "name": "Coach Alex",
        "gender": "male",
        "tagline": "Your chill bro who keeps it real.",
        "avatar_style": "athletic_male",
        "accent_color": "#22c55e",
        "prompt": """You are COACH ALEX — a laid-back, friendly male fitness buddy in his late 20s.
You're like a best friend who also happens to be a fitness enthusiast.
- Super casual, warm, and encouraging. Use slang naturally.
- Use emojis sometimes 💪🔥😊 to keep things fun.
- Celebrate every small win. 'Dude, that's awesome!' 'Bro, you crushed it!'
- Share relatable experiences ('Man, I hate leg day too but trust me...').
- Make fitness feel fun, not like a chore.
- If they're down, hype them up with genuine positivity."""
    },
    "dr_raj": {
        "name": "Dr. Raj",
        "gender": "male",
        "tagline": "Evidence-based. Data-driven. Science first.",
        "avatar_style": "professional_male",
        "accent_color": "#3b82f6",
        "prompt": """You are DR. RAJ — a male sports scientist and nutritionist in his 30s with a PhD.
You are analytical, precise, and evidence-based.
- Always cite scientific principles. 'Research indicates...', 'Studies show...'
- Explain the biology: muscle protein synthesis, metabolic adaptation, hormonal responses.
- Use data and numbers. 'Aim for 1.6-2.2g protein per kg bodyweight.'
- Be thorough but make complex topics accessible.
- Patient and methodical. You love when users ask 'why'.
- Think of yourself as a professor who genuinely wants people to understand the science."""
    },
    "maya": {
        "name": "Coach Maya",
        "gender": "female",
        "tagline": "Empowering strength through positivity.",
        "avatar_style": "athletic_female",
        "accent_color": "#a855f7",
        "prompt": """You are COACH MAYA — a powerful, motivational female fitness coach in her early 30s.
You are an empowering force of nature who inspires through passion and energy.
- Speak with fire and conviction. You BELIEVE in every person you coach.
- Use phrases like 'You are UNSTOPPABLE!', 'Feel that power!', 'You were BORN to do this!'
- Paint vivid pictures of their future success. Make them feel the transformation.
- Focus on empowerment, self-love, and inner strength alongside physical fitness.
- You've overcome your own struggles and share that vulnerability.
- Balance motivational fire with practical, actionable advice."""
    },
    "sophia": {
        "name": "Dr. Sophia",
        "gender": "female",
        "tagline": "Holistic wellness. Mind, body & soul.",
        "avatar_style": "wellness_female",
        "accent_color": "#ec4899",
        "prompt": """You are DR. SOPHIA — a female holistic wellness coach and certified nutritionist in her late 30s.
You take a mind-body-soul approach to fitness and health.
- Warm, nurturing, and deeply empathetic. You truly listen.
- Connect physical fitness with mental health, stress management, and mindfulness.
- Use phrases like 'Listen to your body', 'Let's nourish both body and mind', 'Balance is key'.
- Incorporate yoga, meditation, breathing techniques alongside traditional fitness.
- Address emotional eating, stress, sleep, and recovery holistically.
- You make everyone feel safe, understood, and capable of change."""
    }
}

PERSONA_PROMPTS = {k: v["prompt"] for k, v in COACH_PROFILES.items()}

SENTIMENT_KEYWORDS = {
    "positive": ["great", "awesome", "love", "amazing", "happy", "excited", "wonderful",
                 "fantastic", "good", "excellent", "progress", "achieved", "proud", "strong",
                 "motivated", "energized", "thanks", "thank", "perfect", "yes", "yeah", "crushed"],
    "negative": ["tired", "exhausted", "hate", "can't", "quit", "give up", "sore", "pain",
                 "frustrated", "angry", "disappointed", "failed", "weak", "sad", "depressed",
                 "unmotivated", "lazy", "bored", "hurt", "injury", "sick", "stressed", "anxious"],
    "curious": ["how", "what", "why", "when", "should", "could", "explain", "tell me",
                "help", "advice", "recommend", "suggest", "best", "difference", "?"],
    "greeting": ["hi", "hello", "hey", "sup", "yo", "morning", "evening", "night",
                 "what's up", "howdy", "greetings"]
}


def analyze_sentiment(text: str) -> Dict:
    """Fast keyword-based sentiment analysis for real-time coach reactions."""
    text_lower = text.lower()
    scores = {}
    for sentiment, keywords in SENTIMENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[sentiment] = score

    max_sentiment = max(scores, key=scores.get)
    if scores[max_sentiment] == 0:
        max_sentiment = "neutral"

    # Determine animation mood for 3D coach
    mood_map = {
        "positive": "celebrating",
        "negative": "encouraging",
        "curious": "thinking",
        "greeting": "waving",
        "neutral": "idle"
    }

    # Determine energy level (1-5)
    total_hits = sum(scores.values())
    energy = min(5, max(1, total_hits))

    return {
        "sentiment": max_sentiment,
        "mood": mood_map.get(max_sentiment, "idle"),
        "energy": energy,
        "scores": scores
    }


@api_router.post("/chatbot/sentiment")
async def get_sentiment(data: SentimentRequest):
    """Analyze sentiment of user text for real-time coach reactions."""
    result = analyze_sentiment(data.text)
    return result


@api_router.get("/chatbot/coaches")
async def get_coaches():
    """Return all available coaches with full profile info."""
    coaches = []
    for cid, profile in COACH_PROFILES.items():
        coaches.append({
            "id": cid,
            "name": profile["name"],
            "gender": profile["gender"],
            "tagline": profile["tagline"],
            "avatar_style": profile["avatar_style"],
            "accent_color": profile["accent_color"]
        })
    return {"coaches": coaches}


@api_router.put("/chatbot/persona")
async def set_chatbot_persona(data: ChatPersonaUpdate, user_id: str = Depends(get_current_user)):
    """Save user's preferred chatbot coach."""
    if data.persona not in COACH_PROFILES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid coach. Choose from: {list(COACH_PROFILES.keys())}"
        )

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"chatbot_persona": data.persona}}
    )
    coach = COACH_PROFILES[data.persona]
    return {"message": f"Coach set to {coach['name']}", "persona": data.persona}


@api_router.get("/chatbot/persona")
async def get_chatbot_persona(user_id: str = Depends(get_current_user)):
    """Get user's selected chatbot coach."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "chatbot_persona": 1})
    persona = user.get("chatbot_persona", "alex") if user else "alex"
    return {"persona": persona}


@api_router.post("/chatbot/message")
async def send_chat_message(data: ChatMessage, user_id: str = Depends(get_current_user)):
    """Send a message to the fitness chatbot and get a response with sentiment."""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        persona = data.persona or user.get("chatbot_persona", "alex")
        coach = COACH_PROFILES.get(persona, COACH_PROFILES["alex"])
        persona_prompt = coach["prompt"]

        # Sentiment analysis on user input
        sentiment_data = analyze_sentiment(data.message)

        # Gather user context
        user_context = ""
        if user.get("name"):
            user_context += f"User's name: {user['name']}. "
        if user.get("current_weight"):
            user_context += f"Current weight: {user['current_weight']}kg. "
        if user.get("goal_weight"):
            user_context += f"Goal weight: {user['goal_weight']}kg. "
        if user.get("goal"):
            user_context += f"Fitness goal: {user['goal']}. "
        if user.get("activity_level"):
            user_context += f"Activity level: {user['activity_level']}. "

        # Get recent chat history
        recent_history = await db.chat_history.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        recent_history.reverse()

        history_text = ""
        for msg in recent_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

        model = genai.GenerativeModel("gemini-2.5-flash")

        # Enhanced prompt with sentiment awareness
        sentiment_instruction = ""
        if sentiment_data["sentiment"] == "positive":
            sentiment_instruction = "The user seems happy and positive. Match their energy! Celebrate with them."
        elif sentiment_data["sentiment"] == "negative":
            sentiment_instruction = (
                "The user seems frustrated, tired, or down. "
                "Respond with extra empathy and encouragement in your style. Lift them up."
            )
        elif sentiment_data["sentiment"] == "curious":
            sentiment_instruction = "The user is asking a question. Be thorough and helpful with your answer."
        elif sentiment_data["sentiment"] == "greeting":
            sentiment_instruction = "The user is greeting you. Be warm and welcoming in your character's style."

        full_prompt = (
            f"{persona_prompt}\n\n"
            f"You are a fitness and health chatbot named {coach['name']}. "
            f"You know about workouts, nutrition, supplements, recovery, "
            f"mental health related to fitness, and general wellness.\n\n"
            f"SENTIMENT CONTEXT: {sentiment_instruction}\n\n"
            f"USER CONTEXT: {user_context}\n\n"
            f"CONVERSATION HISTORY:\n{history_text}\n\n"
            f"User: {data.message}\n\n"
            f"Respond naturally in character as {coach['name']}. "
            f"Keep responses helpful and conversational (2-4 paragraphs max).\n"
            f"If the user asks something unrelated to health/fitness, "
            f"gently steer the conversation back while being helpful.\n"
            f"Always remember you're chatting with a real person - be personable!"
        )

        response = model.generate_content(full_prompt)
        bot_reply = response.text.strip()

        # Analyze sentiment of bot reply too for animations
        reply_sentiment = analyze_sentiment(bot_reply)

        # Save both messages to history
        now = datetime.now(timezone.utc)
        await db.chat_history.insert_many([
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "role": "user",
                "content": data.message,
                "persona": persona,
                "sentiment": sentiment_data["sentiment"],
                "timestamp": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "role": "assistant",
                "content": bot_reply,
                "persona": persona,
                "sentiment": reply_sentiment["sentiment"],
                "timestamp": (now + timedelta(seconds=1)).isoformat()
            }
        ])

        return {
            "reply": bot_reply,
            "persona": persona,
            "coach_name": coach["name"],
            "timestamp": now.isoformat(),
            "user_sentiment": sentiment_data,
            "reply_sentiment": reply_sentiment
        }

    except Exception as e:
        logging.error(f"Chatbot error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@api_router.get("/chatbot/history")
async def get_chat_history(limit: int = 50, user_id: str = Depends(get_current_user)):
    """Get chat history for the user."""
    messages = await db.chat_history.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    messages.reverse()
    return {"messages": messages}


@api_router.delete("/chatbot/history")
async def clear_chat_history(user_id: str = Depends(get_current_user)):
    """Clear all chat history for the user."""
    await db.chat_history.delete_many({"user_id": user_id})
    return {"message": "Chat history cleared"}


@app.get("/")
async def root():
    """Root endpoint for quick browser checks."""
    return {
        "status": "ok",
        "service": "fittrack-api",
        "message": "Backend is live.",
        "health": "/health",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Public health check used by load balancers and deployment platforms."""
    return {
        "status": "ok",
        "service": "fittrack-api",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

app.include_router(api_router)

cors_origins = [
    origin.strip()
    for origin in os.environ.get('CORS_ORIGINS', '*').split(',')
    if origin.strip()
]
if not cors_origins:
    cors_origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
