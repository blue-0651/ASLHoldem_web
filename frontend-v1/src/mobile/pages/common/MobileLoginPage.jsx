import React, { useState } from 'react';
import { Card, Button, InputGroup, Form, Alert } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import aslLogo from 'assets/images/asl-logo.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { reqLogin } from 'utils/authService';

const MobileLoginPage = () => {
  const [isUser, setIsUser] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleLoginType = () => setIsUser(!isUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userType = isUser ? 'user' : 'store';
      const result = await reqLogin(username, password, userType);

      // 로그인 성공 시 적절한 대시보드로 이동
      if (result.success) {
        console.log('로그인 성공:', result);
        
        // 매장관리자 여부와 로그인 유형 모두 확인
        // 1. 사용자가 실제 매장관리자(is_store_owner=true)이면 항상 매장 관리자 대시보드로 이동
        // 2. 또는 사용자가 매장관리자 유형(userType='store')으로 로그인했으면 매장 관리자 대시보드로 이동
        if (result.is_store_owner || userType === 'store') {
          console.log('매장 관리자 대시보드로 이동:', { 
            is_store_owner: result.is_store_owner, 
            userType: userType 
          });
          navigate('/mobile/store/dashboard');
        } else {
          // 그 외 일반 사용자 대시보드로 이동
          console.log('일반 사용자 대시보드로 이동');
          navigate('/mobile/user/dashboard');
        }
      } else {
        // 로그인 실패 시 에러 메시지 표시
        setError(result.error?.detail || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const links = {
    signup: { link: '/mobile/signup', text: '회원가입' },
    findId: { link: '/auth/signup-1', text: '아이디 찾기' },
    findPassword: { link: '/auth/reset-password-1', text: '비밀번호 찾기' }
  };

  const NavLinkText = ({ link, text }) => (
    <NavLink to={link} className="f-w-400">
      <span className="asl-admin-text">{text}</span>
    </NavLink>
  );

  return (
    <div className="asl-admin-wrapper text-center">
      <Card className="borderless asl-admin-card-bg">
        <Card.Body>
          <img src={aslLogo} alt="ASL Logo" className="img-fluid mb-4 rounded" />
          <h4 className="mb-3 f-w-400 asl-admin-text">{isUser ? 'ASL 사용자 로그인' : '매장 관리자 로그인'}</h4>

          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <InputGroup className="mb-3">
              <InputGroup.Text>
                <FeatherIcon icon="user" />
              </InputGroup.Text>
              <Form.Control type="text" placeholder="사용자(닉네임)명 입력" value={username} onChange={(e) => setUsername(e.target.value)} />
            </InputGroup>
            <InputGroup className="mb-4">
              <InputGroup.Text>
                <FeatherIcon icon="lock" />
              </InputGroup.Text>
              <Form.Control type="password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} />
            </InputGroup>

            <Button variant={isUser ? 'primary' : 'secondary'} size="lg" className="w-100 mt-4 mb-4" type="submit" disabled={loading}>
              {loading ? '로딩중' : '로그인'}
            </Button>
          </Form>

          <p className="mb-4 asl-admin-text">
            {isUser && (
              <>
                <NavLinkText link={links.signup.link} text={links.signup.text} />
                &nbsp;|&nbsp;
              </>
            )}
            <NavLinkText link={links.findId.link} text={links.findId.text} />
            &nbsp;|&nbsp;
            <NavLinkText link={links.findPassword.link} text={links.findPassword.text} />
          </p>

          <p className="mb-2 asl-admin-text">
            <span
              className="text-decoration-underline text-underline-offset-4 fs-6"
              style={{ cursor: 'pointer' }}
              onClick={toggleLoginType}
              onKeyDown={(e) => ['Enter', ' '].includes(e.key) && toggleLoginType()}
              role="button"
              tabIndex={0}
            >
              {isUser ? '매장 관리자 로그인' : '일반 사용자 로그인'}
            </span>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MobileLoginPage;
