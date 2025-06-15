import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Modal, InputGroup, Spinner } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { reqSignUp } from '../../../utils/auth';
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
    nickname: '', // 선택사항
    phone: '', // 필수, 로그인 아이디
    first_name: '',
    last_name: '',
    birthday: '',
    gender: ''
  });

  const [checkPassword, setCheckPassword] = useState('');
  // 전화번호 중복 체크를 위한 상태 관리
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');

  // 닉네임 중복 체크를 위한 상태 관리
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');

  // 비밀번호 관련 상태 관리
  const [passwordMatch, setPasswordMatch] = useState(null); // null: 미입력, true: 일치, false: 불일치
  const [showPassword, setShowPassword] = useState(false);

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

    // 입력 필드 변경 시 해당 필드의 에러 초기화
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // phone이 변경되면 중복 체크 상태 초기화
    if (name === 'phone') {
      setPhoneChecked(false);
      setPhoneAvailable(false);
      setPhoneMessage('');
    }

    // nickname이 변경되면 중복 체크 상태 초기화
    if (name === 'nickname') {
      setNicknameChecked(false);
      setNicknameAvailable(false);
      setNicknameMessage('');
    }

    // 비밀번호가 변경되면 확인 상태 초기화
    if (name === 'password') {
      setPasswordMatch(null);
    }
  };

  // 비밀번호 확인 필드 별도 핸들러
  const handleCheckPasswordChange = (e) => {
    const value = e.target.value;
    setCheckPassword(value);
    
    // checkPassword 에러 초기화
    if (errors.checkPassword) {
      const newErrors = { ...errors };
      delete newErrors.checkPassword;
      setErrors(newErrors);
    }
    
    // 비밀번호 확인이 변경되면 확인 상태 초기화
    setPasswordMatch(null);
  };

  // 전화번호 중복 확인 함수
  const checkPhone = async () => {
    // 먼저 전화번호 관련 에러 초기화
    const newErrors = { ...errors };
    delete newErrors.phone;
    setErrors(newErrors);

    if (!formData.phone.trim()) {
      setErrors({ ...newErrors, phone: '전화번호를 입력해주세요' });
      return;
    }

    // 전화번호 형식 검증
    if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phone)) {
      setErrors({ ...newErrors, phone: '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)' });
      return;
    }

    setCheckingPhone(true);
    setPhoneMessage('');

    try {
      const response = await API.get(`/accounts/users/check_phone/`, {
        params: { phone: formData.phone }
      });

      setPhoneChecked(true);
      setPhoneAvailable(response.data.is_available);

      if (response.data.is_available) {
        setPhoneMessage('사용할 수 있는 전화번호입니다.');
      } else {
        setPhoneMessage('이미 사용 중인 전화번호입니다.');
      }
    } catch (err) {
      console.error('전화번호 확인 오류:', err);
      setPhoneMessage('전화번호 확인 중 오류가 발생했습니다.');
      setPhoneChecked(false);
      setPhoneAvailable(false);
    } finally {
      setCheckingPhone(false);
    }
  };

  // 닉네임 중복 확인 함수
  const checkNickname = async () => {
    // 먼저 닉네임 관련 에러 초기화
    const newErrors = { ...errors };
    delete newErrors.nickname;
    setErrors(newErrors);

    if (!formData.nickname.trim()) {
      setErrors({ ...newErrors, nickname: '닉네임을 입력해주세요' });
      return;
    }

    // 닉네임 길이 검증 (최소 2자, 최대 20자)
    if (formData.nickname.length < 2) {
      setErrors({ ...newErrors, nickname: '닉네임은 2자 이상이어야 합니다' });
      return;
    }

    if (formData.nickname.length > 20) {
      setErrors({ ...newErrors, nickname: '닉네임은 20자 이하여야 합니다' });
      return;
    }

    setCheckingNickname(true);
    setNicknameMessage('');

    try {
      const response = await API.get(`/accounts/users/check_nickname/`, {
        params: { nickname: formData.nickname }
      });

      setNicknameChecked(true);
      setNicknameAvailable(response.data.is_available);

      if (response.data.is_available) {
        setNicknameMessage('사용할 수 있는 닉네임입니다.');
      } else {
        setNicknameMessage('이미 사용 중인 닉네임입니다.');
      }
    } catch (err) {
      console.error('닉네임 확인 오류:', err);
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameChecked(false);
      setNicknameAvailable(false);
    } finally {
      setCheckingNickname(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호는 필수입니다';
    } else if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)';
    }

    // 전화번호 중복 확인이 필요한 경우
    if (!phoneChecked) {
      newErrors.phone = '전화번호 중복 확인이 필요합니다';
    } else if (!phoneAvailable) {
      newErrors.phone = '이미 사용 중인 전화번호입니다';
    }

    // 닉네임 중복 확인 로직 (닉네임이 입력된 경우에만)
    if (formData.nickname.trim()) {
      if (!nicknameChecked) {
        newErrors.nickname = '닉네임 중복 확인이 필요합니다';
      } else if (!nicknameAvailable) {
        newErrors.nickname = '이미 사용 중인 닉네임입니다';
      }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    // 회원가입 데이터 디버깅
    console.log('회원가입 요청 데이터:', {
      phone: formData.phone,
      nickname: formData.nickname || null,
      email: formData.email,
      password: formData.password.substring(0, 3) + '...', // 보안을 위해 일부만 표시
      first_name: formData.first_name,
      last_name: formData.last_name,
      birthday: formData.birthday,
      gender: formData.gender
    });

    const result = await reqSignUp(
      formData.phone,
      formData.nickname,
      formData.email,
      formData.password,
      formData.first_name,
      formData.last_name,
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
                  <FeatherIcon icon="phone" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="(필수) 전화번호 (010-1234-5678)"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  isInvalid={!!errors.phone}
                  className="asl-mobile-form-control"
                />
                <InputGroup.Text 
                  onClick={checkPhone}
                  style={{ cursor: 'pointer' }}
                  className={`asl-mobile-inline-check ${checkingPhone || !formData.phone.trim() ? 'disabled' : ''}`}
                >
                  {checkingPhone ? <Spinner size="sm" /> : <FeatherIcon icon="check" size={14} />}
                </InputGroup.Text>
                {phoneMessage && (
                  <div className="w-100">
                    <small className={`mt-1 ${phoneAvailable ? 'text-success' : 'text-danger'}`}>
                      {phoneMessage}
                    </small>
                  </div>
                )}
                {errors.phone && (
                  <div className="w-100">
                    <Form.Text className="text-danger">{errors.phone}</Form.Text>
                  </div>
                )}
              </InputGroup>

              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="user" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="(선택) 닉네임"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  isInvalid={!!errors.nickname}
                  className="asl-mobile-form-control"
                />
                <InputGroup.Text 
                  onClick={checkNickname}
                  style={{ cursor: 'pointer' }}
                  className={`asl-mobile-inline-check ${checkingNickname || !formData.nickname.trim() ? 'disabled' : ''}`}
                >
                  {checkingNickname ? <Spinner size="sm" /> : <FeatherIcon icon="check" size={14} />}
                </InputGroup.Text>
                {nicknameMessage && (
                  <div className="w-100">
                    <small className={`mt-1 ${nicknameAvailable ? 'text-success' : 'text-danger'}`}>
                      {nicknameMessage}
                    </small>
                  </div>
                )}
                {errors.nickname && (
                  <div className="w-100">
                    <Form.Text className="text-danger">{errors.nickname}</Form.Text>
                  </div>
                )}
              </InputGroup>

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
                  type={showPassword ? "text" : "password"}
                  placeholder="(필수) 비밀번호"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  className="asl-mobile-form-control"
                />
                <InputGroup.Text 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                >
                  <FeatherIcon icon={showPassword ? "eye-off" : "eye"} size={16} />
                </InputGroup.Text>
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
                  onChange={handleCheckPasswordChange}
                  isInvalid={!!errors.checkPassword}
                  className="asl-mobile-form-control"
                />
                <InputGroup.Text 
                  onClick={() => {
                    if (formData.password && checkPassword) {
                      setPasswordMatch(formData.password === checkPassword);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  className={`asl-mobile-inline-check ${!formData.password || !checkPassword ? 'disabled' : ''}`}
                  title="비밀번호 확인"
                >
                  <FeatherIcon icon="check" size={14} />
                </InputGroup.Text>
                {/* 비밀번호 일치 여부 표시 */}
                {passwordMatch !== null && (
                  <div className="w-100">
                    <small className={passwordMatch ? 'text-success' : 'text-danger'}>
                      {passwordMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                    </small>
                  </div>
                )}
                {errors.checkPassword && (
                  <div className="w-100">
                    <Form.Text className="text-danger">{errors.checkPassword}</Form.Text>
                  </div>
                )}
              </InputGroup>

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