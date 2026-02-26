import requests
import sys
import json
import base64
import io
from datetime import datetime
from PIL import Image
import time

class SmartNutritionAPITester:
    def __init__(self, base_url="https://smart-nutrition-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        
    def log_result(self, test_name, success, response_data=None, error_msg=None):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if response_data and isinstance(response_data, dict):
                if 'message' in response_data:
                    print(f"   📝 {response_data['message']}")
        else:
            print(f"❌ {test_name} - FAILED")
            if error_msg:
                print(f"   ⚠️  {error_msg}")
                
    def make_request(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make HTTP request with authentication"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        if files:
            # Remove content-type for file uploads
            headers.pop('Content-Type', None)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            response_data = {}
            
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    response_data = response.json()
                except:
                    pass
                    
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {}, 0

    def test_auth_register(self):
        """Test user registration"""
        data = {
            "email": self.test_user_email,
            "password": "TestPass123!",
            "name": "Test User",
            "age": 25,
            "height": 175.0,
            "current_weight": 70.0,
            "goal_weight": 65.0,
            "activity_level": "moderate",
            "goal": "fat_loss"
        }
        
        success, response_data, status_code = self.make_request('POST', 'auth/register', data, expected_status=200)
        
        if success and 'token' in response_data:
            self.token = response_data['token']
            self.user_id = response_data['user_id']
            self.log_result("User Registration", True, {"message": f"User created with ID: {self.user_id}"})
            return True
        else:
            self.log_result("User Registration", False, error_msg=f"Status: {status_code}, Response: {response_data}")
            return False

    def test_auth_login(self):
        """Test user login"""
        data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response_data, status_code = self.make_request('POST', 'auth/login', data, expected_status=200)
        
        if success and 'token' in response_data:
            self.token = response_data['token']
            self.log_result("User Login", True)
            return True
        else:
            self.log_result("User Login", False, error_msg=f"Status: {status_code}")
            return False

    def create_test_image(self):
        """Create a simple test image in base64 format"""
        # Create a simple 100x100 RGB image with some pattern
        img = Image.new('RGB', (100, 100), color=(255, 255, 255))
        
        # Add some pattern to make it a "real" image
        pixels = img.load()
        for i in range(100):
            for j in range(100):
                if (i + j) % 20 < 10:
                    pixels[i, j] = (255, 0, 0)  # Red pattern
                else:
                    pixels[i, j] = (0, 255, 0)  # Green pattern
        
        # Convert to bytes
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        return buffered.getvalue()

    def test_food_analysis(self):
        """Test AI food image analysis"""
        try:
            # Create test image
            img_bytes = self.create_test_image()
            files = {'file': ('test_food.jpg', img_bytes, 'image/jpeg')}
            
            success, response_data, status_code = self.make_request('POST', 'food/analyze', files=files, expected_status=200)
            
            if success and 'food_name' in response_data:
                self.log_result("Food Analysis", True, {"message": f"Detected: {response_data['food_name']}"})
                return True
            else:
                self.log_result("Food Analysis", False, error_msg=f"Status: {status_code}, Response: {response_data}")
                return False
        except Exception as e:
            self.log_result("Food Analysis", False, error_msg=str(e))
            return False

    def test_food_logging(self):
        """Test manual food logging"""
        data = {
            "food_name": "Test Apple",
            "calories": 95,
            "protein": 0.5,
            "carbs": 25,
            "fat": 0.3,
            "fiber": 4,
            "sugar": 19,
            "meal_type": "snack"
        }
        
        success, response_data, status_code = self.make_request('POST', 'food/log', data, expected_status=200)
        
        if success and 'id' in response_data:
            self.log_result("Food Logging", True, {"message": f"Food logged with ID: {response_data['id']}"})
            return response_data['id']
        else:
            self.log_result("Food Logging", False, error_msg=f"Status: {status_code}")
            return None

    def test_get_food_logs(self):
        """Test getting food logs"""
        today = datetime.now().strftime('%Y-%m-%d')
        success, response_data, status_code = self.make_request('GET', f'food/log?date={today}', expected_status=200)
        
        if success and isinstance(response_data, list):
            self.log_result("Get Food Logs", True, {"message": f"Found {len(response_data)} food logs"})
            return True
        else:
            self.log_result("Get Food Logs", False, error_msg=f"Status: {status_code}")
            return False

    def test_water_logging(self):
        """Test water logging"""
        data = {"amount_ml": 500}
        
        success, response_data, status_code = self.make_request('POST', 'water/log', data, expected_status=200)
        
        if success and 'id' in response_data:
            self.log_result("Water Logging", True, {"message": f"Logged {response_data['amount_ml']}ml"})
            return True
        else:
            self.log_result("Water Logging", False, error_msg=f"Status: {status_code}")
            return False

    def test_get_water_logs(self):
        """Test getting water logs"""
        today = datetime.now().strftime('%Y-%m-%d')
        success, response_data, status_code = self.make_request('GET', f'water/log?date={today}', expected_status=200)
        
        if success and 'total_ml' in response_data:
            self.log_result("Get Water Logs", True, {"message": f"Total: {response_data['total_ml']}ml"})
            return True
        else:
            self.log_result("Get Water Logs", False, error_msg=f"Status: {status_code}")
            return False

    def test_workout_logging(self):
        """Test workout logging"""
        data = {
            "exercise_name": "Push-ups",
            "sets": 3,
            "reps": 15,
            "weight": None,
            "duration_minutes": 10,
            "notes": "Felt great!"
        }
        
        success, response_data, status_code = self.make_request('POST', 'workout/log', data, expected_status=200)
        
        if success and 'id' in response_data:
            self.log_result("Workout Logging", True, {"message": f"Logged {response_data['exercise_name']}"})
            return response_data['id']
        else:
            self.log_result("Workout Logging", False, error_msg=f"Status: {status_code}")
            return None

    def test_get_workout_logs(self):
        """Test getting workout logs"""
        today = datetime.now().strftime('%Y-%m-%d')
        success, response_data, status_code = self.make_request('GET', f'workout/log?date={today}', expected_status=200)
        
        if success and isinstance(response_data, list):
            self.log_result("Get Workout Logs", True, {"message": f"Found {len(response_data)} workout logs"})
            return True
        else:
            self.log_result("Get Workout Logs", False, error_msg=f"Status: {status_code}")
            return False

    def test_workout_library(self):
        """Test workout library"""
        success, response_data, status_code = self.make_request('GET', 'workout/library', expected_status=200)
        
        if success and isinstance(response_data, list) and len(response_data) > 0:
            self.log_result("Workout Library", True, {"message": f"Found {len(response_data)} workout videos"})
            return True
        else:
            self.log_result("Workout Library", False, error_msg=f"Status: {status_code}")
            return False

    def test_weight_logging(self):
        """Test weight logging"""
        data = {
            "weight": 69.5,
            "body_fat_percentage": 15.0
        }
        
        success, response_data, status_code = self.make_request('POST', 'weight/log', data, expected_status=200)
        
        if success and 'id' in response_data:
            self.log_result("Weight Logging", True, {"message": f"Logged {response_data['weight']}kg"})
            return True
        else:
            self.log_result("Weight Logging", False, error_msg=f"Status: {status_code}")
            return False

    def test_analytics(self):
        """Test analytics endpoint"""
        success, response_data, status_code = self.make_request('GET', 'analytics/progress?days=7', expected_status=200)
        
        if success and 'weight_trend' in response_data:
            self.log_result("Analytics Progress", True, {"message": "Analytics data retrieved"})
            return True
        else:
            self.log_result("Analytics Progress", False, error_msg=f"Status: {status_code}")
            return False

    def test_health_insights(self):
        """Test health insights"""
        success, response_data, status_code = self.make_request('GET', 'analytics/insights', expected_status=200)
        
        if success and 'insights' in response_data:
            self.log_result("Health Insights", True, {"message": f"Found {len(response_data['insights'])} insights"})
            return True
        else:
            self.log_result("Health Insights", False, error_msg=f"Status: {status_code}")
            return False

    def test_diet_coach(self):
        """Test AI diet coach"""
        data = {
            "current_weight": 70.0,
            "goal_weight": 65.0,
            "goal": "fat_loss",
            "activity_level": "moderate",
            "dietary_preferences": "vegetarian"
        }
        
        print("⏳ Generating AI diet plan... (this may take a few seconds)")
        success, response_data, status_code = self.make_request('POST', 'diet/plan', data, expected_status=200)
        
        if success and 'daily_calories' in response_data:
            self.log_result("AI Diet Coach", True, {"message": f"Generated plan: {response_data['daily_calories']} calories"})
            return True
        else:
            self.log_result("AI Diet Coach", False, error_msg=f"Status: {status_code}, Response: {response_data}")
            return False

    def test_calculators(self):
        """Test fitness calculators"""
        calc_data = {
            "weight": 70.0,
            "height": 175.0,
            "age": 25,
            "gender": "male",
            "activity_level": "moderate"
        }
        
        # Test BMI
        bmi_success, bmi_data, _ = self.make_request('POST', 'calculator/bmi', calc_data, expected_status=200)
        if bmi_success and 'bmi' in bmi_data:
            self.log_result("BMI Calculator", True, {"message": f"BMI: {bmi_data['bmi']}"})
        else:
            self.log_result("BMI Calculator", False)
        
        # Test BMR
        bmr_success, bmr_data, _ = self.make_request('POST', 'calculator/bmr', calc_data, expected_status=200)
        if bmr_success and 'bmr' in bmr_data:
            self.log_result("BMR Calculator", True, {"message": f"BMR: {bmr_data['bmr']}"})
        else:
            self.log_result("BMR Calculator", False)
        
        # Test TDEE
        tdee_success, tdee_data, _ = self.make_request('POST', 'calculator/tdee', calc_data, expected_status=200)
        if tdee_success and 'tdee' in tdee_data:
            self.log_result("TDEE Calculator", True, {"message": f"TDEE: {tdee_data['tdee']}"})
        else:
            self.log_result("TDEE Calculator", False)
        
        return bmi_success and bmr_success and tdee_success

    def test_profile_management(self):
        """Test profile get and update"""
        # Get profile
        success, profile_data, status_code = self.make_request('GET', 'profile', expected_status=200)
        
        if success and 'email' in profile_data:
            self.log_result("Get Profile", True, {"message": f"Profile for {profile_data['email']}"})
            
            # Update profile
            update_data = {
                "name": "Updated Test User",
                "age": 26,
                "current_weight": 69.0
            }
            
            update_success, update_response, _ = self.make_request('PUT', 'profile', update_data, expected_status=200)
            
            if update_success:
                self.log_result("Update Profile", True)
                return True
            else:
                self.log_result("Update Profile", False)
                return False
        else:
            self.log_result("Get Profile", False, error_msg=f"Status: {status_code}")
            return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Smart Nutrition Hub API Test Suite")
        print(f"🌐 Testing API: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        if not self.test_auth_register():
            print("❌ Registration failed - stopping tests")
            return False
            
        if not self.test_auth_login():
            print("❌ Login failed - stopping tests")
            return False
        
        # Core Feature Tests
        self.test_food_analysis()
        food_log_id = self.test_food_logging()
        self.test_get_food_logs()
        
        self.test_water_logging()
        self.test_get_water_logs()
        
        workout_log_id = self.test_workout_logging()
        self.test_get_workout_logs()
        self.test_workout_library()
        
        self.test_weight_logging()
        self.test_analytics()
        self.test_health_insights()
        
        # AI Features (may take time)
        self.test_diet_coach()
        
        # Calculators and Profile
        self.test_calculators()
        self.test_profile_management()
        
        # Print summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check logs above.")
            return False

def main():
    tester = SmartNutritionAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())