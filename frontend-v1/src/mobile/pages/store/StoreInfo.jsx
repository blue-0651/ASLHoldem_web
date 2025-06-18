import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API from '../../../utils/api';
import { getToken } from '../../../utils/auth';
import MobileHeader from '../../components/MobileHeader';
// MobileStyles.css는 _mobile-commons.scss로 통합됨

const StoreInfo = () => {
  const [storeData, setStoreData] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tournamentError, setTournamentError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    open_time: '',
    close_time: '',
    manager_name: '',
    manager_phone: '',
    max_capacity: 0
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  useEffect(() => {
    if (storeData?.id) {
      fetchStoreTournaments(storeData.id);
    }
  }, [storeData]);

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      console.log('매장 정보 가져오기 시작');
      const token = getToken();
      console.log('인증 토큰:', token ? '있음' : '없음');
      
      const response = await API.get('/store/info/');
      console.log('매장 정보 응답:', response.data);
      
      setStoreData(response.data);
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        address: response.data.address || '',
        phone_number: response.data.phone_number || '',
        open_time: response.data.open_time || '',
        close_time: response.data.close_time || '',
        manager_name: response.data.manager_name || '',
        manager_phone: response.data.manager_phone || '',
        max_capacity: response.data.max_capacity || 0
      });
      setError(null);
    } catch (err) {
      console.error('매장 정보 가져오기 오류:', err);
      setError('매장 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreTournaments = async (storeId) => {
    try {
      setTournamentLoading(true);
      const response = await API.get(`/store/tournaments/?store_id=${storeId}`);
      setTournaments(response.data);
      setTournamentError(null);
    } catch (err) {
      console.error('토너먼트 목록 가져오기 오류:', err);
      setTournamentError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setTournamentLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    
    try {
      const response = await API.put('/store/info/', formData);
      console.log('매장 정보 업데이트 응답:', response.data);
      
      setSuccess('매장 정보가 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
      fetchStoreInfo(); // 업데이트된 정보 다시 불러오기
    } catch (err) {
      console.error('매장 정보 업데이트 오류:', err);
      setError('매장 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 편집 취소하고 원래 데이터로 복원
    setFormData({
      name: storeData.name || '',
      description: storeData.description || '',
      address: storeData.address || '',
      phone_number: storeData.phone_number || '',
      open_time: storeData.open_time || '',
      close_time: storeData.close_time || '',
      manager_name: storeData.manager_name || '',
      manager_phone: storeData.manager_phone || '',
      max_capacity: storeData.max_capacity || 0
    });
    setIsEditing(false);
  };

  const ErrorState = ({ error, onRetry }) => (
    <div className="asl-mobile-empty-state">
      <i className="fas fa-exclamation-triangle mobile-empty-icon"></i>
      <p>{error}</p>
      <Button
        variant="outline-primary"
        size="sm"
        onClick={onRetry}
      >
        다시 시도
      </Button>
    </div>
  );

  return (
    <div className="asl-mobile-container">
      {/* MobileHeader 컴포넌트 사용 */}
      <MobileHeader title="매장 정보" />
      
      <Container className="asl-mobile-content">
        {/* 로딩 및 에러 처리 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </Spinner>
            <p style={{ marginTop: '10px' }}>매장 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={fetchStoreInfo} />
        ) : (
          <div>
            {/* 성공 메시지 */}
            {success && (
              <Alert variant="success" className="mobile-alert" onClose={() => setSuccess(null)} dismissible>
                {success}
              </Alert>
            )}
            
            {/* 매장 정보 표시 또는 편집 */}
            <Card className="asl-mobile-card">
              <Card.Body>
                {isEditing ? (
                  /* 편집 모드 */
                  <Form onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>매장 정보 수정</h3>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>매장 이름</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="name" 
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>매장 설명</Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={3}
                        name="description" 
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>주소</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="address" 
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>전화번호</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="phone_number" 
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                    
                    <Row className="mb-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>오픈 시간</Form.Label>
                          <Form.Control 
                            type="time"
                            name="open_time" 
                            value={formData.open_time}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>마감 시간</Form.Label>
                          <Form.Control 
                            type="time"
                            name="close_time" 
                            value={formData.close_time}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>매니저 이름</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="manager_name" 
                        value={formData.manager_name}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>매니저 연락처</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="manager_phone" 
                        value={formData.manager_phone}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>최대 수용 인원</Form.Label>
                      <Form.Control 
                        type="number" 
                        name="max_capacity" 
                        value={formData.max_capacity}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <Button 
                        variant="secondary" 
                        onClick={handleCancel}
                        disabled={saving}
                        style={{ flex: 1 }}
                      >
                        취소
                      </Button>
                      <Button 
                        variant="primary"
                        type="submit"
                        disabled={saving}
                        style={{ flex: 1 }}
                        className="mobile-btn-primary"
                      >
                        {saving ? '저장 중...' : '저장'}
                      </Button>
                    </div>
                  </Form>
                ) : (
                  /* 보기 모드 */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '18px', margin: 0 }}>매장 정보</h3>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
                        수정
                      </Button>
                    </div>
                    
                    <div className="mb-3">
                      <strong>매장 이름</strong>
                      <p>{storeData.name}</p>
                    </div>
                    
                    {storeData.description && (
                      <div className="mb-3">
                        <strong>매장 설명</strong>
                        <p>{storeData.description}</p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <strong>주소</strong>
                      <p>{storeData.address}</p>
                    </div>
                    
                    <div className="mb-3">
                      <strong>전화번호</strong>
                      <p>{storeData.phone_number}</p>
                    </div>
                    
                    <div className="mb-3">
                      <strong>영업 시간</strong>
                      <p>{storeData.open_time} - {storeData.close_time}</p>
                    </div>
                    
                    {storeData.manager_name && (
                      <div className="mb-3">
                        <strong>매니저 정보</strong>
                        <p>{storeData.manager_name} ({storeData.manager_phone})</p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <strong>최대 수용 인원</strong>
                      <p>{storeData.max_capacity}명</p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* 토너먼트 목록 섹션 */}
        <Card className="asl-mobile-card mt-4">
          <Card.Body>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>토너먼트 목록</h3>
            
            {tournamentLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spinner animation="border" size="sm" />
                <p style={{ marginTop: '10px' }}>토너먼트 목록을 불러오는 중...</p>
              </div>
            ) : tournamentError ? (
              <Alert variant="danger">{tournamentError}</Alert>
            ) : tournaments.length === 0 ? (
              <p className="text-muted">등록된 토너먼트가 없습니다.</p>
            ) : (
              <div className="tournament-list">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="mb-3">
                    <Card.Body>
                      <h5>{tournament.name}</h5>
                      <p className="mb-1">시작 시간: {new Date(tournament.start_time).toLocaleString()}</p>
                      <p className="mb-1">상태: {tournament.status}</p>
                      <p className="mb-1">필요 SEAT권: {tournament.buy_in}개</p>
                      <p className="mb-0">남은 좌석: {tournament.ticket_quantity - tournament.participant_count}석</p>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default StoreInfo; 