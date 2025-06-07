import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const PlayerRegistrationPage = () => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    store_id: '',
    status: 'active',
    notes: ''
  });



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: 실제 API 호출로 변경 필요
        // const playersResponse = await playerAPI.getAllPlayers();
        // const storesResponse = await storeAPI.getAllStores();
        // setPlayers(playersResponse.data);
        // setStores(storesResponse.data);
        
        // 임시로 빈 배열로 설정
        setPlayers([]);
        setStores([]);
        setLoading(false);
      } catch (err) {
        console.error('선수 데이터 로드 오류:', err);
        setError('선수 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShowModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        email: player.email,
        phone: player.phone,
        store_id: player.store_id,
        status: player.status,
        notes: player.notes || ''
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        store_id: '',
        status: 'active',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      store_id: '',
      status: 'active',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlayer) {
        // 수정 로직
        console.log('선수 정보 수정:', { ...formData, id: editingPlayer.id });
        // await playerAPI.updatePlayer(editingPlayer.id, formData);
        
        // 목 데이터 업데이트
        const storeName = stores.find(store => store.id === parseInt(formData.store_id))?.name || '';
        setPlayers(prev => prev.map(player => 
          player.id === editingPlayer.id 
            ? { 
                ...player, 
                ...formData, 
                store_id: parseInt(formData.store_id),
                store_name: storeName,
                updated_at: new Date().toISOString() 
              }
            : player
        ));
      } else {
        // 생성 로직
        console.log('새 선수 등록:', formData);
        // await playerAPI.createPlayer(formData);
        
        // 목 데이터에 추가
        const storeName = stores.find(store => store.id === parseInt(formData.store_id))?.name || '';
        const newPlayer = {
          id: Date.now(),
          ...formData,
          store_id: parseInt(formData.store_id),
          store_name: storeName,
          created_at: new Date().toISOString(),
          last_tournament: null,
          tournament_count: 0
        };
        setPlayers(prev => [newPlayer, ...prev]);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('선수 정보 저장 오류:', err);
      setError('선수 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (playerId) => {
    if (window.confirm('정말로 이 선수를 삭제하시겠습니까?')) {
      try {
        console.log('선수 삭제:', playerId);
        // await playerAPI.deletePlayer(playerId);
        
        // 목 데이터에서 제거
        setPlayers(prev => prev.filter(player => player.id !== playerId));
      } catch (err) {
        console.error('선수 삭제 오류:', err);
        setError('선수 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.phone.includes(searchTerm) ||
    player.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge bg="success">활성</Badge>
    ) : (
      <Badge bg="secondary">비활성</Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">선수 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>선수 회원 참가 관리</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FiPlus className="me-2" />
          새 선수 참가
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">전체 선수</h6>
                  <h3>{players.length}</h3>
                </div>
                <FiUser className="text-primary" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">활성 선수</h6>
                  <h3>{players.filter(p => p.status === 'active').length}</h3>
                </div>
                <FiUser className="text-success" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">이번 달 신규</h6>
                  <h3>{players.filter(p => new Date(p.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}</h3>
                </div>
                <FiPlus className="text-info" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">참여 매장</h6>
                  <h3>{stores.length}</h3>
                </div>
                <FiMapPin className="text-warning" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 검색 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="선수명, 이메일, 전화번호, 매장명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="position-absolute top-50 end-0 translate-middle-y me-3" />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 선수 목록 */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">선수 목록 ({filteredPlayers.length}명)</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>선수명</th>
                  <th>연락처</th>
                  <th>소속 매장</th>
                  <th>상태</th>
                  <th>토너먼트 참가</th>
                  <th>등록일</th>
                  <th>최근 참가</th>
                  <th width="120">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <tr key={player.id}>
                      <td>
                        <div>
                          <strong>{player.name}</strong>
                          {player.notes && (
                            <div>
                              <small className="text-muted">{player.notes}</small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div><FiMail className="me-1" size={14} />{player.email}</div>
                          <div><FiPhone className="me-1" size={14} />{player.phone}</div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="outline-primary">{player.store_name}</Badge>
                      </td>
                      <td>{getStatusBadge(player.status)}</td>
                      <td>
                        <strong>{player.tournament_count}</strong>회
                      </td>
                      <td>
                        <small>{formatDate(player.created_at)}</small>
                      </td>
                      <td>
                        <small>{formatDate(player.last_tournament)}</small>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleShowModal(player)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(player.id)}
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 선수가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* 선수 참가/수정 모달 */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPlayer ? '선수 정보 수정' : '새 선수 참가'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>선수명 *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="선수명을 입력하세요"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>소속 매장 *</Form.Label>
                  <Form.Select
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">매장을 선택하세요</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>이메일 *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>전화번호 *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>상태</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>메모</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="선수에 대한 추가 정보나 메모를 입력하세요"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              취소
            </Button>
            <Button variant="primary" type="submit">
              {editingPlayer ? '수정' : '참가'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PlayerRegistrationPage; 