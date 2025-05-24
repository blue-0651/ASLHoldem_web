import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

const BoardManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_pinned: false,
    is_active: true
  });

  // 목 데이터 (실제로는 API에서 가져옴)
  const mockBoards = [
    {
      id: 1,
      title: '시스템 점검 안내',
      content: '2024년 1월 15일 새벽 2시부터 4시까지 시스템 점검이 있습니다.',
      priority: 'high',
      is_pinned: true,
      is_active: true,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
      views: 245
    },
    {
      id: 2,
      title: '새로운 토너먼트 규정 안내',
      content: '2024년도 새로운 토너먼트 규정이 적용됩니다.',
      priority: 'normal',
      is_pinned: false,
      is_active: true,
      created_at: '2024-01-08T14:30:00Z',
      updated_at: '2024-01-08T14:30:00Z',
      views: 128
    },
    {
      id: 3,
      title: '앱 업데이트 완료',
      content: '모바일 앱이 최신 버전으로 업데이트되었습니다.',
      priority: 'low',
      is_pinned: false,
      is_active: true,
      created_at: '2024-01-05T16:20:00Z',
      updated_at: '2024-01-05T16:20:00Z',
      views: 89
    }
  ];

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        // 실제 API 호출 대신 목 데이터 사용
        // const response = await boardAPI.getAllBoards();
        // setBoards(response.data);
        
        // 시뮬레이션을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
        setBoards(mockBoards);
        setLoading(false);
      } catch (err) {
        console.error('공지사항 데이터 로드 오류:', err);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleShowModal = (board = null) => {
    if (board) {
      setEditingBoard(board);
      setFormData({
        title: board.title,
        content: board.content,
        priority: board.priority,
        is_pinned: board.is_pinned,
        is_active: board.is_active
      });
    } else {
      setEditingBoard(null);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        is_pinned: false,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBoard(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      is_pinned: false,
      is_active: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBoard) {
        // 수정 로직
        console.log('공지사항 수정:', { ...formData, id: editingBoard.id });
        // await boardAPI.updateBoard(editingBoard.id, formData);
        
        // 목 데이터 업데이트
        setBoards(prev => prev.map(board => 
          board.id === editingBoard.id 
            ? { ...board, ...formData, updated_at: new Date().toISOString() }
            : board
        ));
      } else {
        // 생성 로직
        console.log('새 공지사항 생성:', formData);
        // await boardAPI.createBoard(formData);
        
        // 목 데이터에 추가
        const newBoard = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          views: 0
        };
        setBoards(prev => [newBoard, ...prev]);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('공지사항 저장 오류:', err);
      setError('공지사항 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (boardId) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        console.log('공지사항 삭제:', boardId);
        // await boardAPI.deleteBoard(boardId);
        
        // 목 데이터에서 제거
        setBoards(prev => prev.filter(board => board.id !== boardId));
      } catch (err) {
        console.error('공지사항 삭제 오류:', err);
        setError('공지사항 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityBadge = (priority) => {
    const variants = {
      high: 'danger',
      normal: 'primary',
      low: 'secondary'
    };
    const labels = {
      high: '높음',
      normal: '보통',
      low: '낮음'
    };
    return <Badge bg={variants[priority]}>{labels[priority]}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">공지사항을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>공지사항 관리</h2>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FiPlus className="me-2" />
          새 공지사항
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 검색 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="제목이나 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="position-absolute top-50 end-0 translate-middle-y me-3" />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 공지사항 목록 */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">공지사항 목록 ({filteredBoards.length}건)</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>제목</th>
                  <th width="100">우선순위</th>
                  <th width="80">고정</th>
                  <th width="80">상태</th>
                  <th width="80">조회수</th>
                  <th width="150">작성일</th>
                  <th width="120">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoards.length > 0 ? (
                  filteredBoards.map((board) => (
                    <tr key={board.id}>
                      <td>
                        <div>
                          <strong>{board.title}</strong>
                          {board.is_pinned && (
                            <Badge bg="warning" className="ms-2">고정</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {board.content.length > 50 
                            ? `${board.content.substring(0, 50)}...` 
                            : board.content}
                        </small>
                      </td>
                      <td>{getPriorityBadge(board.priority)}</td>
                      <td>
                        {board.is_pinned ? (
                          <Badge bg="warning">고정</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={board.is_active ? 'success' : 'secondary'}>
                          {board.is_active ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td>{board.views}</td>
                      <td>
                        <small>{formatDate(board.created_at)}</small>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleShowModal(board)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(board.id)}
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 공지사항이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* 공지사항 생성/수정 모달 */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBoard ? '공지사항 수정' : '새 공지사항 작성'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>제목 *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="공지사항 제목을 입력하세요"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>우선순위</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">낮음</option>
                    <option value="normal">보통</option>
                    <option value="high">높음</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>내용 *</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="공지사항 내용을 입력하세요"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="is_pinned"
                  name="is_pinned"
                  label="상단 고정"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  label="게시 활성화"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              취소
            </Button>
            <Button variant="primary" type="submit">
              {editingBoard ? '수정' : '생성'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default BoardManagementPage; 