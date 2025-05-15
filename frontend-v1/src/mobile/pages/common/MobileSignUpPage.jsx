import React, { useState } from 'react';
import { Card, Row, Col, Button, InputGroup, Form, Spinner } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import aslLogo from 'assets/images/asl-logo.png';
import { NavLink, useNavigate } from 'react-router-dom';

import axios from 'axios';

const MobileSignUpPage = () => {
  // API 상태 관리
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    is_staff: false,
    is_superuser: false
  });

  const [password2, setPassword2] = useState('');

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

    if (formData.password !== password2) {
      newErrors.password2 = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    console.log('회원가입 데이터:', formData);

    const api = axios.create({
      baseURL: '/api/v1'
    });

    try {
      await api.post('/accounts/users/', formData);
      alert('회원가입이 성공적으로 완료되었습니다.');
      navigate('/mobile/login');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asl-admin-wrapper">
      <div className="asl-admin-content text-center">
        <Card className="borderless asl-admin-card-bg">
          <Row className="align-items-center text-center">
            <Col>
              <Card.Body className="card-body">
                <img src={aslLogo} alt="" className="img-fluid mb-4 rounded" style={{ width: '50%' }} />
                <h4 className="mb-3 f-w-400 asl-admin-text">ASL 회원가입</h4>

                <Form onSubmit={handleSubmit}>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="user" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="사용자 이름"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={!!errors.username}
                    />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="mail" />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      placeholder="이메일"
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
                      <FeatherIcon icon="phone" />
                    </InputGroup.Text>
                    <Form.Control
                      type="tel"
                      placeholder="전화번호"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FeatherIcon icon="lock" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="비밀번호"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>

                  <InputGroup className="mb-4">
                    <InputGroup.Text>
                      <FeatherIcon icon="check-circle" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="비밀번호 확인"
                      name="password2"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      isInvalid={!!errors.password2}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password2}</Form.Control.Feedback>
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
