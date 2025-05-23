import requests
import json
import base64

def decode_token(token):
    """JWT 토큰을 디코딩하는 함수"""
    payload = token.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload)
    return json.loads(decoded)

print("=" * 50)
print("매장관리자 로그인 테스트")
print("=" * 50)

# 매장관리자 로그인
response = requests.post('http://localhost:8000/api/v1/accounts/token/store/', 
                        json={'phone': '010-5555-5555', 'password': 'jjw'})

if response.status_code == 200:
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    
    print(f'user_type: {token_payload.get("user_type")}')
    print(f'is_store_owner: {token_payload.get("is_store_owner")}')
    print(f'role: {token_payload.get("role")}')
    print(f'phone: {token_payload.get("phone")}')
else:
    print(f'로그인 실패: {response.status_code} - {response.text}')

print("\n" + "=" * 50)
print("일반사용자 로그인 테스트")
print("=" * 50)

# 일반사용자 로그인
response = requests.post('http://localhost:8000/api/v1/accounts/token/user/', 
                        json={'phone': '010-0000-0001', 'password': 'testpass123'})

if response.status_code == 200:
    token_data = response.json()
    token_payload = decode_token(token_data['access'])
    
    print(f'user_type: {token_payload.get("user_type")}')
    print(f'is_store_owner: {token_payload.get("is_store_owner")}')
    print(f'role: {token_payload.get("role")}')
    print(f'phone: {token_payload.get("phone")}')
else:
    print(f'로그인 실패: {response.status_code} - {response.text}') 