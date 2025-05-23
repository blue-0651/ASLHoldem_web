import requests
import json
import base64

def decode_token(token):
    """JWT 토큰을 디코딩하는 함수"""
    payload = token.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload)
    return json.loads(decoded)

print("🔐 " + "=" * 50)
print("최종 인증 테스트 - 모든 케이스")
print("=" * 50)

# 1. 일반사용자로 일반사용자 API (정상)
print("\n1️⃣  일반사용자 → 일반사용자 API (✅ 성공해야 함)")
response = requests.post('http://localhost:8000/api/v1/accounts/token/user/', 
                        json={'phone': '010-1111-1111', 'password': 'testpass123'})

if response.status_code == 200:
    print("✅ 로그인 성공")
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    print(f'   user_type: {token_payload.get("user_type")}')
    print(f'   is_store_owner: {token_payload.get("is_store_owner")}')
else:
    print(f"❌ 로그인 실패: {response.status_code} - {response.text}")

# 2. 일반사용자로 매장관리자 API (차단)
print("\n2️⃣  일반사용자 → 매장관리자 API (❌ 차단되어야 함)")
response = requests.post('http://localhost:8000/api/v1/accounts/token/store/', 
                        json={'phone': '010-1111-1111', 'password': 'testpass123'})

if response.status_code == 200:
    print("❌ 로그인 성공 (문제있음!)")
else:
    print("✅ 로그인 차단됨 - " + response.json().get('non_field_errors', [''])[0])

# 3. 매장관리자로 매장관리자 API (정상)
print("\n3️⃣  매장관리자 → 매장관리자 API (✅ 성공해야 함)")
response = requests.post('http://localhost:8000/api/v1/accounts/token/store/', 
                        json={'phone': '010-5555-5555', 'password': 'jjw'})

if response.status_code == 200:
    print("✅ 로그인 성공")
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    print(f'   user_type: {token_payload.get("user_type")}')
    print(f'   is_store_owner: {token_payload.get("is_store_owner")}')
else:
    print(f"❌ 로그인 실패: {response.status_code} - {response.text}")

# 4. 매장관리자로 일반사용자 API (차단)
print("\n4️⃣  매장관리자 → 일반사용자 API (❌ 차단되어야 함)")
response = requests.post('http://localhost:8000/api/v1/accounts/token/user/', 
                        json={'phone': '010-5555-5555', 'password': 'jjw'})

if response.status_code == 200:
    print("❌ 로그인 성공 (문제있음!)")
else:
    print("✅ 로그인 차단됨 - " + response.json().get('non_field_errors', [''])[0])

print("\n🎉 " + "=" * 50)
print("인증 시스템 테스트 완료!")
print("=" * 50) 