import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Form, Row, Col, Alert } from 'react-bootstrap';
import API from '../../../utils/api';
import '../../styles/MobileStyles.css';

const StoreInfo = () => {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/v1/store/info/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
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
      await API.put('/api/v1/store/info/', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
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

  // QR 코드 생성
  const handleGenerateQR = async () => {
    try {
      const response = await API.post('/api/v1/store/generate-qr/', null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // QR 코드 이미지 다운로드 또는 표시
      const qrUrl = response.data.qr_url;
      window.open(qrUrl, '_blank');
    } catch (err) {
      console.error('QR 코드 생성 오류:', err);
      alert('QR 코드 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <button 
          className="mobile-nav-button" 
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="mobile-header-title">매장 정보</h1>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>
      
      {/* 로딩 및 에러 처리 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </Spinner>
          <p style={{ marginTop: '10px' }}>매장 정보를 불러오는 중입니다...</p>
        </div>
      ) : error ? (
        <div className="mobile-empty-state">
          <i className="fas fa-exclamation-triangle mobile-empty-icon"></i>
          <p>{error}</p>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchStoreInfo}
          >
            다시 시도
          </Button>
        </div>
      ) : (
        <div>
          {/* 성공 메시지 */}
          {success && (
            <Alert variant="success" className="mobile-alert" onClose={() => setSuccess(null)} dismissible>
              {success}
            </Alert>
          )}
          
          {/* 매장 정보 표시 또는 편집 */}
          <Card className="mobile-card">
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
                  
                  <div style={{ marginTop: '20px' }}>
                    <Button 
                      variant="outline-primary" 
                      className="w-100"
                      onClick={handleGenerateQR}
                    >
                      <i className="fas fa-qrcode" style={{ marginRight: '10px' }}></i>
                      매장 QR 코드 생성
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StoreInfo; 