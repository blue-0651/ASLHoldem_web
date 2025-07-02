import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Alert,
  Badge,
  Image
} from 'react-bootstrap';
import { bannerAPI } from '../../utils/api';
import { storeAPI } from '../../utils/api';

const BannerManagementPage = () => {
  // 상태 관리
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    store: '', // 매장 ID (필수)
    start_date: '',
    end_date: '',
    is_active: true,
    is_main_tournament: false,
    is_store_gallery: false,
    image: null
  });

  // 매장 목록 상태
  const [stores, setStores] = useState([]);

  // 배너 목록 조회
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerAPI.getAllBanners();
      setBanners(response.data.results || response.data || []);
    } catch (error) {
      console.error('배너 목록 조회 실패:', error);
      showAlert('배너 목록을 불러오는데 실패했습니다.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // 매장 목록 조회
  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAllStores();
      setStores(response.data.results || response.data || []);
    } catch (error) {
      console.error('매장 목록 조회 실패:', error);
      showAlert('매장 목록을 불러오는데 실패했습니다.', 'danger');
    }
  };

  // 컴포넌트 마운트 시 배너 목록 및 매장 목록 조회
  useEffect(() => {
    fetchBanners();
    fetchStores();
  }, []);

  // 알림 표시
  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  // 폼 검증
  const validateForm = () => {
    if (!formData.title.trim()) {
      showAlert('제목을 입력해주세요.', 'danger');
      return false;
    }
    
    if (!formData.store) {
      showAlert('매장을 선택해주세요.', 'danger');
      return false;
    }
    
    // 배너 추가 시에만 이미지 필수 검증 (수정 시에는 선택사항)
    if (!formData.image && !currentBanner) {
      showAlert('배너 이미지를 선택해주세요.', 'danger');
      return false;
    }
    
    if (!formData.start_date) {
      showAlert('시작일을 선택해주세요.', 'danger');
      return false;
    }
    
    if (!formData.end_date) {
      showAlert('종료일을 선택해주세요.', 'danger');
      return false;
    }
    
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      showAlert('종료일이 시작일보다 늦어야 합니다.', 'danger');
      return false;
    }
    
    return true;
  };

  // 배너 추가
  const handleAddBanner = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const dataToSend = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        store: parseInt(formData.store),
        start_date: new Date(formData.start_date + 'T00:00:00').toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
        is_active: Boolean(formData.is_active),
        is_main_tournament: Boolean(formData.is_main_tournament),
        is_store_gallery: Boolean(formData.is_store_gallery)
      };
      
      if (formData.image) {
        dataToSend.image = formData.image;
      }

      console.log('📤 배너 추가 - 전송할 데이터:', dataToSend);
      console.log('📤 이미지 파일:', formData.image ? formData.image.name : 'None');

      await bannerAPI.createBanner(dataToSend);
      showAlert('배너가 성공적으로 추가되었습니다.');
      fetchBanners();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('배너 추가 실패:', error);
      
      // 상세한 에러 메시지 표시
      let errorMessage = '배너 추가에 실패했습니다.';
      if (error.response?.data) {
        console.error('백엔드 에러 응답:', error.response.data);
        if (typeof error.response.data === 'string') {
          errorMessage += ` (${error.response.data})`;
        } else if (error.response.data.detail) {
          errorMessage += ` (${error.response.data.detail})`;
        } else if (error.response.data.message) {
          errorMessage += ` (${error.response.data.message})`;
        } else {
          // 필드별 에러 메시지 조합
          const fieldErrors = [];
          Object.keys(error.response.data).forEach(field => {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage += ` (${fieldErrors.join('; ')})`;
          }
        }
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // 배너 수정
  const handleEditBanner = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // FormData 생성 - 모든 필수 필드를 항상 포함
      const formDataToSend = new FormData();
      
      // 필수 필드들을 항상 포함 (빈 값 체크 후)
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim() || '');
      formDataToSend.append('store', parseInt(formData.store));
      
      // 날짜를 DateTime 형식으로 변환 (ISO 8601 형식)
      const startDateTime = new Date(formData.start_date + 'T00:00:00').toISOString();
      const endDateTime = new Date(formData.end_date + 'T23:59:59').toISOString();
      formDataToSend.append('start_date', startDateTime);
      formDataToSend.append('end_date', endDateTime);
      
      formDataToSend.append('is_active', Boolean(formData.is_active));
      formDataToSend.append('is_main_tournament', Boolean(formData.is_main_tournament));
      formDataToSend.append('is_store_gallery', Boolean(formData.is_store_gallery));
      
      // 이미지 처리: 새로 선택한 경우 새 이미지, 아니면 기존 이미지 URL
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (currentBanner && currentBanner.image) {
        // 기존 이미지 URL을 보내기 (백엔드에서 처리 필요)
        formDataToSend.append('existing_image_url', currentBanner.image);
      }

      console.log('📤 배너 수정 - 전송할 FormData:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value);
      }

      await bannerAPI.updateBanner(currentBanner.id, formDataToSend);
      showAlert('배너가 성공적으로 수정되었습니다.');
      fetchBanners();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('배너 수정 실패:', error);
      
      // 상세한 에러 메시지 표시
      let errorMessage = '배너 수정에 실패했습니다.';
      if (error.response?.data) {
        console.error('백엔드 에러 응답:', error.response.data);
        if (typeof error.response.data === 'string') {
          errorMessage += ` (${error.response.data})`;
        } else if (error.response.data.detail) {
          errorMessage += ` (${error.response.data.detail})`;
        } else if (error.response.data.message) {
          errorMessage += ` (${error.response.data.message})`;
        } else {
          // 필드별 에러 메시지 조합
          const fieldErrors = [];
          Object.keys(error.response.data).forEach(field => {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage += ` (${fieldErrors.join('; ')})`;
          }
        }
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // 배너 삭제
  const handleDeleteBanner = async () => {
    setLoading(true);
    
    try {
      await bannerAPI.deleteBanner(currentBanner.id);
      showAlert('배너가 성공적으로 삭제되었습니다.');
      fetchBanners();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      showAlert('배너 삭제에 실패했습니다.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // 배너 상태 토글
  const toggleBannerStatus = async (banner) => {
    try {
      await bannerAPI.toggleBannerActive(banner.id);
      showAlert(`배너가 ${!banner.is_active ? '활성화' : '비활성화'}되었습니다.`);
      fetchBanners();
    } catch (error) {
      console.error('배너 상태 변경 실패:', error);
      showAlert('배너 상태 변경에 실패했습니다.', 'danger');
    }
  };

  // 메인 토너먼트 배너로 설정
  const setAsMainTournament = async (banner) => {
    try {
      const response = await bannerAPI.setAsMainTournament(banner.id);
      showAlert(`'${banner.title}' 배너가 메인 토너먼트 배너로 설정되었습니다.`);
      fetchBanners();
    } catch (error) {
      console.error('메인 토너먼트 배너 설정 실패:', error);
      let errorMessage = '메인 토너먼트 배너 설정에 실패했습니다.';
      if (error.response?.data?.error) {
        errorMessage += ` (${error.response.data.error})`;
      }
      showAlert(errorMessage, 'danger');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      store: '',
      start_date: '',
      end_date: '',
      is_active: true,
      is_main_tournament: false,
      is_store_gallery: false,
      image: null
    });
    setCurrentBanner(null);
  };

  // 편집 모달 열기
  const openEditModal = (banner) => {
    setCurrentBanner(banner);
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      store: banner.store || '',
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      is_active: banner.is_active,
      is_main_tournament: banner.is_main_tournament || false,
      is_store_gallery: banner.is_store_gallery || false,
      image: null
    });
    setShowEditModal(true);
  };

  // 삭제 모달 열기
  const openDeleteModal = (banner) => {
    setCurrentBanner(banner);
    setShowDeleteModal(true);
  };

  return (
    <div className="banner-management-page">
      <Container fluid>
        {/* 알림 */}
        {alert.show && (
          <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: 'success' })}>
            {alert.message}
          </Alert>
        )}

        <Row>
          <Col md={12}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title as="h5">배너 관리</Card.Title>
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddModal(true)}
                  disabled={loading}
                >
                  새 배너 추가
                </Button>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center">
                    <p>로딩 중...</p>
                  </div>
                ) : banners.length === 0 ? (
                  <div className="text-center">
                    <p className="text-muted">등록된 배너가 없습니다.</p>
                  </div>
                ) : (
                                      <Table responsive hover>
                      <thead>
                        <tr>
                          <th>이미지</th>
                          <th>제목</th>
                          <th>매장</th>
                          <th>설명</th>
                          <th>기간</th>
                          <th>상태</th>
                          <th>메인 배너</th>
                          <th>갤러리 배너</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {banners.map((banner) => (
                          <tr key={banner.id}>
                            <td>
                              {banner.image && (
                                <Image 
                                  src={banner.image} 
                                  alt={banner.title}
                                  thumbnail
                                  style={{ width: '100px', height: '60px', objectFit: 'cover' }}
                                />
                              )}
                            </td>
                            <td>{banner.title}</td>
                            <td>
                              {stores.find(store => store.id === banner.store)?.name || `ID: ${banner.store}`}
                            </td>
                            <td>{banner.description}</td>
                            <td>
                              <small>
                                {banner.start_date && new Date(banner.start_date).toLocaleDateString()} ~ <br/>
                                {banner.end_date && new Date(banner.end_date).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Badge 
                                bg={banner.is_active ? 'success' : 'secondary'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleBannerStatus(banner)}
                              >
                                {banner.is_active ? '활성' : '비활성'}
                              </Badge>
                            </td>
                            <td>
                              {banner.is_main_tournament ? (
                                <Badge bg="warning" className="text-dark">
                                  🏆 메인 배너
                                </Badge>
                              ) : (
                                <Badge bg="light" className="text-muted">
                                  일반 배너
                                </Badge>
                              )}
                            </td>
                            <td>
                              {banner.is_store_gallery ? (
                                <Badge bg="info" className="text-white">
                                  🏪 갤러리 배너
                                </Badge>
                              ) : (
                                <Badge bg="light" className="text-muted">
                                  일반 배너
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => openEditModal(banner)}
                              >
                                수정
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                className="me-2"
                                onClick={() => openDeleteModal(banner)}
                              >
                                삭제
                              </Button>
                              <Button 
                                variant={banner.is_main_tournament ? "secondary" : "warning"}
                                size="sm"
                                disabled={banner.is_main_tournament || !banner.is_active}
                                onClick={() => setAsMainTournament(banner)}
                                title={
                                  banner.is_main_tournament 
                                    ? "이미 메인 배너로 설정됨" 
                                    : !banner.is_active 
                                    ? "활성화된 배너만 메인 배너로 설정 가능" 
                                    : "메인 토너먼트 배너로 설정"
                                }
                              >
                                {banner.is_main_tournament ? "메인 설정됨" : "메인으로 설정"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 배너 추가 모달 */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>새 배너 추가</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddBanner}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>제목 <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>매장 <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">매장을 선택하세요</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>설명</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>시작일 <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>종료일 <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>배너 이미지 <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_active"
                  label="활성화"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_main_tournament"
                  label="메인 토너먼트 배너로 설정"
                  checked={formData.is_main_tournament}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  메인 토너먼트 배너는 하나만 설정할 수 있습니다. 새로 설정하면 기존 메인 배너는 해제됩니다.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_store_gallery"
                  label="인기 스토어 갤러리용 배너로 설정"
                  checked={formData.is_store_gallery}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  인기 스토어 갤러리에 표시될 배너로 설정합니다. 최대 8개까지 표시됩니다.
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                취소
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                추가
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* 배너 수정 모달 */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>배너 수정</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditBanner}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>제목 <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>매장 <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">매장을 선택하세요</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>설명</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>시작일 <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>종료일 <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>배너 이미지 (변경하려면 새 파일 선택)</Form.Label>
                <Form.Control
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_active"
                  label="활성화"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_main_tournament"
                  label="메인 토너먼트 배너로 설정"
                  checked={formData.is_main_tournament}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  메인 토너먼트 배너는 하나만 설정할 수 있습니다. 새로 설정하면 기존 메인 배너는 해제됩니다.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_store_gallery"
                  label="인기 스토어 갤러리용 배너로 설정"
                  checked={formData.is_store_gallery}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  인기 스토어 갤러리에 표시될 배너로 설정합니다. 최대 8개까지 표시됩니다.
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                취소
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                수정
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* 배너 삭제 확인 모달 */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>배너 삭제</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>정말로 이 배너를 삭제하시겠습니까?</p>
            {currentBanner && (
              <p><strong>{currentBanner.title}</strong></p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDeleteBanner} disabled={loading}>
              삭제
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default BannerManagementPage;
