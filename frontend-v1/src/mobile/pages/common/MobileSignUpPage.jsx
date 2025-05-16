import React, { useState } from 'react';
import { Card, Row, Col, Button, InputGroup, Form, Spinner } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { reqSignUp } from '../../../utils/authService';

const MobileSignUpPage = () => {
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
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자 이름은 필수입니다';
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
    <div className="asl-admin-wrapper">
      <div className="asl-admin-content text-center">
        <Card className="borderless asl-admin-card-bg">
          <Row className="align-items-center text-center">
            <Col>
              <Card.Body className="card-body">
                <h3 className="mb-5 f-w-400 asl-admin-text">ASL 회원가입</h3>

                <Form onSubmit={handleSubmit}>
                  {/*<h6 className="mb-2"> 이메일  </h6>*/}
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
                    />
                    <Form.Control.Feedback type="invalid">{errors.checkPassword}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="users" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="(필수) 닉 네임"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={!!errors.username}
                    />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-5">
                    <InputGroup.Text>
                      <FeatherIcon icon="phone" />
                    </InputGroup.Text>
                    <Form.Control
                      type="tel"
                      placeholder="(필수) 전화번호"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="user" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="성"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      isInvalid={!!errors.last_name}
                      className="me-3"
                    />
                    <Form.Control
                      type="text"
                      placeholder="이름"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      isInvalid={!!errors.first_name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.first_name || errors.last_name}</Form.Control.Feedback>
                  </InputGroup>
                  
                  {/* 성별 선택 버튼 추가 */}
                  <div className="mb-3">
                    <Form.Group>
                      <InputGroup className="mb-2">
                        <InputGroup.Text>
                          <FeatherIcon icon="users" />
                        </InputGroup.Text>
                        <div className="form-control d-flex">
                          <span className="me-3">성별:</span>
                          <Form.Check
                            inline
                            label="남성"
                            name="gender"
                            type="radio"
                            id="gender-male"
                            value="M"
                            checked={formData.gender === 'M'}
                            onChange={handleChange}
                            className="me-4"
                          />
                          <Form.Check
                            inline
                            label="여성"
                            name="gender"
                            type="radio"
                            id="gender-female"
                            value="F"
                            checked={formData.gender === 'F'}
                            onChange={handleChange}
                          />
                        </div>
                      </InputGroup>
                      {errors.gender && (
                        <div className="text-danger small text-start ms-4">{errors.gender}</div>
                      )}
                    </Form.Group>
                  </div>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="gift" />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      placeholder="생년월일"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      isInvalid={!!errors.birthday}
                      max={new Date().toISOString().split('T')[0]} // 오늘 날짜 이후는 선택 불가능
                    />
                    <Form.Control.Feedback type="invalid">{errors.birthday}</Form.Control.Feedback>
                  </InputGroup>

                  <Button type="submit" variant="primary" size="lg" className="btn-block mt-4 mb-4 w-100" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : '회원가입'}
                  </Button>
                </Form>

                <p className="mb-2 asl-admin-text">
                  <NavLink to="/mobile/login" className="asl-admin-text">
                    이미 계정이 있으신가요? 로그인하기
                  </NavLink>
                </p>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default MobileSignUpPage;
