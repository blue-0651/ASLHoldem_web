import React, { useState } from 'react';
import { Card, Row, Col, Button, InputGroup, Form, Spinner } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { reqSignUp } from '../../../utils/authService';
import axios from 'axios';
import '../../../assets/scss/mobile/_mobile-commons.scss';

// API 인스턴스 생성
const API = axios.create({
  baseURL: '/api/v1'
});

const MobileSignup = () => {
  // API 상태 관리
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    first_name: '',
    last_name: '',
    birthday: '',
    gender: '',
    is_staff: false,
    is_superuser: false,
    is_active: true
  });

  // 화면처리에 필요한 데이터
  // email(메일), password(비번), passwordConfirm(비번확인), Gender(성별), [firstName(이름), lastName(성)], phone(전화번호), birthday(생년월일)

  const [checkPassword, setCheckPassword] = useState('');
  // 사용자명 중복 체크를 위한 상태 관리
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');

  // 로그인
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // username이 변경되면 중복 체크 상태 초기화
    if (name === 'username') {
      setUsernameChecked(false);
      setUsernameAvailable(false);
      setUsernameMessage('');
    }
  };

  // username 중복 확인 함수
  const checkUsername = async () => {
    if (!formData.username.trim()) {
      setErrors({...errors, username: '사용자 이름을 입력해주세요'});
      return;
    }

    setCheckingUsername(true);
    setUsernameMessage('');

    try {
      const response = await API.get(`/accounts/users/check_username/`, {
        params: { username: formData.username }
      });

      setUsernameChecked(true);
      setUsernameAvailable(response.data.is_available);

      if (response.data.is_available) {
        setUsernameMessage('사용할 수 있는 사용자 이름입니다.');
      } else {
        setUsernameMessage('이미 사용 중인 사용자 이름입니다.');
      }
    } catch (err) {
      console.error('사용자 이름 확인 오류:', err);
      setUsernameMessage('사용자 이름 확인 중 오류가 발생했습니다.');
      setUsernameChecked(false);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자 이름은 필수입니다';
    }

    // 사용자 이름 중복 확인이 필요한 경우
    if (!usernameChecked) {
      newErrors.username = '사용자 이름 중복 확인이 필요합니다';
    } else if (!usernameAvailable) {
      newErrors.username = '이미 사용 중인 사용자 이름입니다';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일은 필수입니다';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (formData.password !== checkPassword) {
      newErrors.checkPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.phone) {
      newErrors.phone = '전화번호는 필수입니다';
    } else if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = '이름은 필수입니다';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = '성은 필수입니다';
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!formData.birthday) {
      newErrors.birthday = '생년월일은 필수입니다';
    }
    // date 타입은 자동으로 YYYY-MM-DD 형식을 보장하므로 추가 유효성 검사는 불필요

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    // 회원가입 데이터 디버깅
    console.log('회원가입 요청 데이터:', {
      username: formData.username,
      email: formData.email,
      password: formData.password.substring(0, 3) + '...', // 보안을 위해 일부만 표시
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      birthday: formData.birthday,
      gender: formData.gender,
      is_staff: formData.is_staff,
      is_superuser: formData.is_superuser,
      is_active: formData.is_active
    });

    //export const reqSignUp = async (username, email, password, first_name, last_name, is_staff, is_superuser)
    const result = await reqSignUp(
      formData.username,
      formData.email,
      formData.password,
      formData.first_name,
      formData.last_name,
      formData.is_staff,
      formData.is_superuser,
      formData.is_active,
      formData.phone,
      formData.birthday,
      formData.gender
    );

    setLoading(false);

    if (result.success) {
      alert('회원가입이 성공적으로 완료되었습니다.');
      navigate('/mobile/login');
    } else {
      console.error('회원가입 실패 응답:', result.error);
      alert(result.error?.detail || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="asl-mobile-container">
      <div className="asl-mobile-logo-container">
        <img 
          src="/images/asl_logo.png" 
          alt="ASL 홀덤 로고" 
          className="asl-mobile-logo"
        />
      </div>

      <div className="asl-mobile-login-container">
        <Card className="asl-mobile-login-card">
          <Card.Body>
            <h3 className="text-center mb-4">ASL 회원가입</h3>

            <Form className="asl-mobile-form" onSubmit={handleSubmit}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="mail" />
                </InputGroup.Text>
                <Form.Control
                  required
                  placeholder="(필수) 이메일 주소"
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                  className="asl-mobile-form-control"
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </InputGroup>

              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="lock" />
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="(필수) 비밀번호"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  className="asl-mobile-form-control"
                />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </InputGroup>

              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="check-circle" />
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="(필수) 비밀번호 확인"
                  name="checkPassword"
                  value={checkPassword}
                  onChange={(e) => setCheckPassword(e.target.value)}
                  isInvalid={!!errors.checkPassword}
                  className="asl-mobile-form-control"
                />
                <Form.Control.Feedback type="invalid">{errors.checkPassword}</Form.Control.Feedback>
              </InputGroup>

              <Row>
                <Col xs="8" className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FeatherIcon icon="user" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="(필수) 사용자 이름"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={!!errors.username}
                      className="asl-mobile-form-control"
                    />
                  </InputGroup>
                  {usernameMessage && (
                    <small className={`mt-1 ${usernameAvailable ? 'text-success' : 'text-danger'}`}>
                      {usernameMessage}
                    </small>
                  )}
                  {errors.username && <Form.Text className="text-danger">{errors.username}</Form.Text>}
                </Col>
                <Col xs="4" className="mb-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={checkUsername}
                    disabled={checkingUsername || !formData.username.trim()}
                    className="w-100"
                  >
                    {checkingUsername ? <Spinner size="sm" /> : '중복 확인'}
                  </Button>
                </Col>
              </Row>

              <Row>
                <Col xs="6" className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FeatherIcon icon="user" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="(필수) 성"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      isInvalid={!!errors.last_name}
                      className="asl-mobile-form-control"
                    />
                    <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                  </InputGroup>
                </Col>
                <Col xs="6" className="mb-3">
                  <InputGroup>
                    <Form.Control
                      placeholder="(필수) 이름"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      isInvalid={!!errors.first_name}
                      className="asl-mobile-form-control"
                    />
                    <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                  </InputGroup>
                </Col>
              </Row>

              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="phone" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="(필수) 전화번호 (예: 010-1234-5678)"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  isInvalid={!!errors.phone}
                  className="asl-mobile-form-control"
                />
                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
              </InputGroup>

              <Form.Group className="mb-3">
                <Form.Label>생년월일</Form.Label>
                <Form.Control
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  isInvalid={!!errors.birthday}
                  className="asl-mobile-form-control"
                />
                <Form.Control.Feedback type="invalid">{errors.birthday}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>성별</Form.Label>
                <div className="d-flex">
                  <Form.Check
                    type="radio"
                    id="gender-male"
                    label="남성"
                    name="gender"
                    value="M"
                    className="me-4"
                    checked={formData.gender === 'M'}
                    onChange={handleChange}
                    isInvalid={!!errors.gender}
                  />
                  <Form.Check
                    type="radio"
                    id="gender-female"
                    label="여성"
                    name="gender"
                    value="F"
                    checked={formData.gender === 'F'}
                    onChange={handleChange}
                    isInvalid={!!errors.gender}
                  />
                </div>
                {errors.gender && <Form.Text className="text-danger">{errors.gender}</Form.Text>}
              </Form.Group>

              <Button 
                type="submit" 
                className="asl-mobile-login-btn asl-user-btn" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    가입 중...
                  </>
                ) : '가입하기'}
              </Button>

              <div className="text-center mt-4">
                <p className="mb-0">
                  이미 계정이 있으신가요? <NavLink to="/mobile/login">로그인</NavLink>
                </p>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default MobileSignup; 