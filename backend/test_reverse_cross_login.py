import requests
import json
import base64

def decode_token(token):
    """JWT 토큰을 디코딩하는 함수"""
    payload = token.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload)
    return json.loads(decoded)

print("=" * 60)
print("❌ 잘못된 로그인 시도: 일반사용자 계정으로 매장관리자 API 호출")
print("=" * 60)

# 일반사용자 계정으로 매장관리자 API에 로그인 시도
response = requests.post('http://localhost:8000/api/v1/accounts/token/store/', 
                        json={'phone': '010-0000-0001', 'password': 'testpass123'})

if response.status_code == 200:
    print("❌ 로그인 성공 (이건 문제입니다!)")
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    
    print(f'user_type: {token_payload.get("user_type")}')
    print(f'is_store_owner: {token_payload.get("is_store_owner")}')
    print(f'role: {token_payload.get("role")}')
    print(f'phone: {token_payload.get("phone")}')
    print("\n→ 일반사용자가 매장관리자로 로그인되었습니다!")
else:
    print(f"✅ 로그인 거부됨: {response.status_code} - {response.text}")
    print("→ 이게 정상적인 동작입니다!")

print("\n" + "=" * 60)
print("✅ 올바른 로그인: 일반사용자 계정으로 일반사용자 API 호출")
print("=" * 60)

# 일반사용자 계정으로 일반사용자 API에 로그인
response = requests.post('http://localhost:8000/api/v1/accounts/token/user/', 
                        json={'phone': '010-0000-0001', 'password': 'testpass123'})

if response.status_code == 200:
    print("✅ 로그인 성공")
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    
    print(f'user_type: {token_payload.get("user_type")}')
    print(f'is_store_owner: {token_payload.get("is_store_owner")}')
    print(f'role: {token_payload.get("role")}')
    print(f'phone: {token_payload.get("phone")}')
else:
    print(f"❌ 로그인 실패: {response.status_code} - {response.text}") 