import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../../../components/MobileHeader';

// 간소화된 API 인스턴스 생성
const API = axios.create({
  baseURL: '/api/v1'
});

// 요청/응답 로깅 인터셉터 추가
API.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API 응답 오류: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('API 응답 없음:', error.request);
    } else {
      console.error('API 오류:', error.message);
    }
    return Promise.reject(error);
  }
);

const StoreSearchPage = () => {
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 매장 목록 불러오기
  const fetchStores = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // 검색어가 있으면 쿼리 파라미터 추가
      const endpoint = query 
        ? `/stores/?search=${encodeURIComponent(query)}` 
        : '/stores/';
        
      const response = await API.get(endpoint);
      // API가 배열을 직접 반환하므로 results 래핑 없이 사용
      setStores(response.data || []);
    } catch (err) {
      console.error('매장 데이터 로드 오류:', err);
      setError('매장 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchStores();
  }, []);

  // 검색 실행 함수
  const handleSearch = (e) => {
    e.preventDefault();
    fetchStores(searchQuery);
  };

  // 매장 상세 페이지로 이동
  const handleStoreClick = (storeId) => {
    navigate(`/mobile/common/store-detail/${storeId}`);
  };

  return (
    <div className="asl-mobile-container">
      <MobileHeader title="매장 찾기" />
      
      <div className="asl-mobile-dashboard">
        {/* 검색 폼 */}
        <Form onSubmit={handleSearch} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="매장 이름, 지역으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="asl-mobile-form-control"
            />
            <Button 
              variant="primary" 
              type="submit"
              className="d-flex align-items-center"
            >
              <i className="fas fa-search me-1"></i>검색
            </Button>
          </InputGroup>
        </Form>

        {/* 보기 옵션 버튼 */}
        <div className="d-flex gap-2 mb-4">
          <Button 
            variant="outline-primary" 
            className="flex-fill d-flex align-items-center justify-content-center"
            onClick={() => navigate('/mobile/common/store-map')}
          >
            <i className="fas fa-map-marked-alt me-1"></i>지도로 보기
          </Button>
          <Button 
            variant="primary" 
            className="flex-fill d-flex align-items-center justify-content-center"
          >
            <i className="fas fa-list me-1"></i>목록으로 보기
          </Button>
        </div>
        
        {/* 에러 표시 */}
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {/* 로딩 표시 */}
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">매장 정보를 불러오는 중...</p>
          </div>
        )}
        
        {/* 검색 결과 없음 */}
        {!loading && stores.length === 0 && (
          <div className="mobile-empty-state">
            <i className="fas fa-store mobile-empty-icon"></i>
            <h5>검색 결과가 없습니다</h5>
            <p className="text-muted">
              다른 키워드로 검색하거나 지역명을 입력해 보세요.
            </p>
          </div>
        )}
        
        {/* 매장 목록 */}
        {!loading && stores.length > 0 && (
          <div className="store-list">
            {stores.map((store) => (
              <Card 
                key={store.id}
                className="mb-3 store-card"
                onClick={() => handleStoreClick(store.id)}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">{store.name}</h5>
                      <p className="text-muted mb-2">
                        <i className="fas fa-map-marker-alt me-1"></i> {store.address}
                      </p>
                      {store.is_open ? (
                        <span className="badge bg-success">영업중</span>
                      ) : (
                        <span className="badge bg-secondary">영업종료</span>
                      )}
                      {store.has_tournament && (
                        <span className="badge bg-primary ms-2">토너먼트 진행</span>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="store-distance">
                        {store.distance && `${store.distance.toFixed(1)}km`}
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 전화 연결
                          window.location.href = `tel:${store.phone_number}`;
                        }}
                      >
                        <i className="fas fa-phone-alt me-1"></i> 전화
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSearchPage; 