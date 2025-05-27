import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { noticeAPI, userAPI } from '../../utils/api';

const BoardManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null); // 모달 내 에러 상태 추가
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [viewingBoard, setViewingBoard] = useState(null);
  
  // 기본 날짜 생성 헬퍼 함수
  const getDefaultDateTime = (minutesFromNow = 10) => {
    const now = new Date();
    const defaultTime = new Date(now.getTime() + minutesFromNow * 60 * 1000);
    return defaultTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm 형식
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notice_type: 'GENERAL',
    priority: 'NORMAL',
    is_published: true,
    is_pinned: false,
    start_date: '',
    end_date: ''
  });

  // useEffect 중복 실행 방지를 위한 ref
  const hasFetched = useRef(false);

  // 공지사항 목록을 가져오는 함수 (재사용 가능)
  const fetchBoards = async () => {
    try {
      setLoading(true);
      
      // 개발 환경에서만 API 호출 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 fetchBoards 함수 호출됨');
      }
      
      const response = await noticeAPI.getAllNoticesAdmin();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 API 응답:', response.data);
      }
      
      // 페이지네이션 구조에서 results 배열 추출
      const boardsData = response.data?.results || [];
      setBoards(boardsData);
      setLoading(false);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ fetchBoards 완료, 항목 수:', boardsData.length);
      }
      
      return boardsData;
    } catch (err) {
      console.error('❌ 공지사항 데이터 로드 오류:', err);
      setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      setBoards([]);
      setLoading(false);
      throw err;
    }
  };

  // 초기 데이터 로드 (중복 실행 방지)
  useEffect(() => {
    if (hasFetched.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ useEffect 중복 실행 방지됨 (React Strict Mode로 인한 중복 실행)');
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 초기 데이터 로드 시작');
    }
    
    hasFetched.current = true;
    fetchBoards();

    // cleanup 함수 (컴포넌트 언마운트 시 실행)
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 BoardManagementPage cleanup');
      }
    };
  }, []);

  const handleShowModal = (board = null) => {
    // 모달 에러 상태 초기화
    setModalError(null);
    
    if (board) {
      setEditingBoard(board);
      setFormData({
        title: board.title,
        content: board.content,
        notice_type: board.notice_type,
        priority: board.priority,
        is_published: board.is_published,
        is_pinned: board.is_pinned,
        start_date: board.start_date ? board.start_date.slice(0, 16) : '',
        end_date: board.end_date ? board.end_date.slice(0, 16) : ''
      });
    } else {
      setEditingBoard(null);
      // 새 공지사항 작성 시 기본 날짜 설정 (현재 시간 + 10분, + 1일)
      const defaultStartDate = getDefaultDateTime(10); // 10분 후
      const defaultEndDate = getDefaultDateTime(24 * 60 + 10); // 1일 10분 후
      
      setFormData({
        title: '',
        content: '',
        notice_type: 'GENERAL',
        priority: 'NORMAL',
        is_published: true,
        is_pinned: false,
        start_date: defaultStartDate,
        end_date: defaultEndDate
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 새 공지사항 기본 날짜 설정:', {
          start_date: defaultStartDate,
          end_date: defaultEndDate
        });
      }
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBoard(null);
    setModalError(null); // 모달 에러 상태 초기화
    
    // 폼 데이터 초기화 (기본 날짜 포함)
    const defaultStartDate = getDefaultDateTime(10);
    const defaultEndDate = getDefaultDateTime(24 * 60 + 10);
    
    setFormData({
      title: '',
      content: '',
      notice_type: 'GENERAL',
      priority: 'NORMAL',
      is_published: true,
      is_pinned: false,
      start_date: defaultStartDate,
      end_date: defaultEndDate
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 입력 시 모달 에러 상태 초기화
    if (modalError) {
      setModalError(null);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    console.log('🚀 handleSubmit 함수 시작!');
    console.log('📝 이벤트 객체:', e);
    console.log('📋 현재 formData:', formData);
    console.log('✏️ 수정 모드 여부:', !!editingBoard);
    
    e.preventDefault();
    console.log('✅ preventDefault 실행 완료');
    
    // 프론트엔드 유효성 검사
    console.log('🔍 유효성 검사 시작...');
    if (!formData.title || formData.title.trim().length < 5) {
      console.log('❌ 제목 유효성 검사 실패:', formData.title);
      setModalError('제목은 최소 5자 이상이어야 합니다.');
      return;
    }
    console.log('✅ 제목 유효성 검사 통과');
    
    if (!formData.content || formData.content.trim().length < 10) {
      console.log('❌ 내용 유효성 검사 실패:', formData.content);
      setModalError('내용은 최소 10자 이상이어야 합니다.');
      return;
    }
    console.log('✅ 내용 유효성 검사 통과');
    
    // 날짜 유효성 검사
    console.log('📅 날짜 유효성 검사 시작...');
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      console.log('📅 시작일:', startDate, '종료일:', endDate);
      
      if (startDate >= endDate) {
        console.log('❌ 날짜 유효성 검사 실패: 종료일이 시작일보다 빠름');
        setModalError('종료일은 시작일보다 늦어야 합니다.');
        return;
      }
    }
    
    // 시작일이 과거인지 확인 (수정 모드가 아닐 때만, 시작일이 있을 때만)
    if (!editingBoard && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const now = new Date();
      
      // 현재 시간보다 5분 이전이면 과거로 판단 (여유시간 제공)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      console.log('📅 시작일 과거 검사:', {
        startDate: startDate,
        now: now,
        fiveMinutesAgo: fiveMinutesAgo,
        isPast: startDate < fiveMinutesAgo
      });
      
      if (startDate < fiveMinutesAgo) {
        console.log('❌ 날짜 유효성 검사 실패: 시작일이 과거 (5분 여유시간 적용)');
        setModalError('시작일은 현재 시간보다 늦어야 합니다. (최소 5분 후)');
        return;
      }
    }
    console.log('✅ 날짜 유효성 검사 통과');
    

    
    console.log('🎯 모든 유효성 검사 통과! API 호출 준비...');
    
    try {
      console.log('📤 전송할 데이터:', formData);
      console.log('📋 formData 상세:', {
        title: formData.title,
        content: formData.content,
        notice_type: formData.notice_type,
        priority: formData.priority,
        is_published: formData.is_published,
        is_pinned: formData.is_pinned,
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      
      // 인증 토큰 확인
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log('현재 토큰:', token ? '토큰 있음' : '토큰 없음');
      
      // 현재 사용자 정보 확인
      try {
        const userResponse = await userAPI.getCurrentUser();
        console.log('현재 사용자:', userResponse.data);
        console.log('관리자 여부:', userResponse.data.is_staff || userResponse.data.is_superuser);
      } catch (userErr) {
        console.log('사용자 정보 조회 실패:', userErr);
      }
      
      if (editingBoard) {
        // 수정 로직
              console.log('수정 모드 - editingBoard.id:', editingBoard.id);
      console.log('수정할 데이터:', formData);
      
      // 날짜 필드 처리 (ISO 형식으로 변환)
      const processedFormData = { ...formData };
      if (processedFormData.start_date && processedFormData.start_date !== '') {
        processedFormData.start_date = new Date(processedFormData.start_date).toISOString();
      }
      if (processedFormData.end_date && processedFormData.end_date !== '') {
        processedFormData.end_date = new Date(processedFormData.end_date).toISOString();
      }
      
      console.log('처리된 데이터:', processedFormData);
      
      const updateResponse = await noticeAPI.updateNotice(editingBoard.id, processedFormData);
        console.log('✅ 수정 응답:', updateResponse);
        
        // 목록 새로고침 (최적화된 방식)
        console.log('🔄 수정 후 목록 새로고침 시작...');
        await fetchBoards();
        console.log('✅ 수정 후 목록 새로고침 완료');
      } else {
        // 생성 로직
        console.log('🆕 생성 모드 진입!');
        
        // 날짜 필드 처리 (ISO 형식으로 변환)
        const processedFormData = { ...formData };
        console.log('🔄 날짜 처리 시작...');
        if (processedFormData.start_date && processedFormData.start_date !== '') {
          processedFormData.start_date = new Date(processedFormData.start_date).toISOString();
          console.log('📅 시작일 ISO 변환:', processedFormData.start_date);
        }
        if (processedFormData.end_date && processedFormData.end_date !== '') {
          processedFormData.end_date = new Date(processedFormData.end_date).toISOString();
          console.log('📅 종료일 ISO 변환:', processedFormData.end_date);
        }
        
        console.log('📋 생성할 처리된 데이터:', processedFormData);
        console.log('🚀 noticeAPI.createNotice 호출 시작...');
        
        const createResponse = await noticeAPI.createNotice(processedFormData);
        console.log('✅ 생성 API 응답:', createResponse);
        
        // 목록 새로고침 (최적화된 방식)
        console.log('🔄 생성 후 목록 새로고침 시작...');
        const boardsData = await fetchBoards();
        console.log('✅ 생성 후 목록 새로고침 완료, 항목 수:', boardsData.length);
      }
      
      console.log('🎉 모든 작업 완료! 모달 닫기...');
      handleCloseModal();
      console.log('✅ handleSubmit 함수 완료!');
    } catch (err) {
      console.error('❌ 공지사항 저장 오류:', err);
      console.error('❌ 에러 상세:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      // 백엔드 에러 메시지 표시
      console.log('🔍 백엔드 에러 응답:', err.response?.data);
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(', ');
        setModalError(`저장 실패: ${errorMessages}`);
        console.log('📝 사용자에게 표시할 에러:', errorMessages);
      } else {
        setModalError('공지사항 저장 중 오류가 발생했습니다.');
        console.log('📝 일반 에러 메시지 표시');
      }
    }
  };

  const handleDeleteClick = (board) => {
    setDeletingBoard(board);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBoard) return;
    
    try {
      console.log('🗑️ 공지사항 삭제 시작, ID:', deletingBoard.id);
      await noticeAPI.deleteNotice(deletingBoard.id);
      console.log('✅ 삭제 완료');
      
      // 목록 새로고침 (최적화된 방식)
      console.log('🔄 삭제 후 목록 새로고침 시작...');
      await fetchBoards();
      console.log('✅ 삭제 후 목록 새로고침 완료');
      
      // 모달 닫기
      setShowDeleteModal(false);
      setDeletingBoard(null);
    } catch (err) {
      console.error('❌ 공지사항 삭제 오류:', err);
      setModalError('공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingBoard(null);
  };

  const handleShowDetailModal = (board) => {
    setViewingBoard(board);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setViewingBoard(null);
  };

  const filteredBoards = Array.isArray(boards) ? boards.filter(board =>
    board.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getPriorityBadge = (priority) => {
    const variants = {
      URGENT: 'danger',
      HIGH: 'warning',
      NORMAL: 'primary',
      LOW: 'secondary'
    };
    const labels = {
      URGENT: '긴급',
      HIGH: '높음',
      NORMAL: '보통',
      LOW: '낮음'
    };
    return <Badge bg={variants[priority]}>{labels[priority]}</Badge>;
  };

  const getNoticeTypeBadge = (noticeType) => {
    const variants = {
      GENERAL: 'info',
      MEMBER_ONLY: 'success'
    };
    const labels = {
      GENERAL: '전체 공지',
      MEMBER_ONLY: '회원 전용'
    };
    return <Badge bg={variants[noticeType]}>{labels[noticeType]}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
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
                  <th width="100">공지 유형</th>
                  <th width="100">우선순위</th>
                  <th width="80">고정</th>
                  <th width="80">공개</th>
                  <th width="80">조회수</th>
                  <th width="100">작성자</th>
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
                          <strong 
                            className="text-primary" 
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => handleShowDetailModal(board)}
                          >
                            {board.title || '제목 없음'}
                          </strong>
                          {board.is_pinned && (
                            <Badge bg="warning" className="ms-2">고정</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {(board.content || '').length > 50 
                            ? `${(board.content || '').substring(0, 50)}...` 
                            : (board.content || '내용 없음')}
                        </small>
                      </td>
                      <td>{getNoticeTypeBadge(board.notice_type || 'GENERAL')}</td>
                      <td>{getPriorityBadge(board.priority || 'NORMAL')}</td>
                      <td>
                        {board.is_pinned ? (
                          <Badge bg="warning">고정</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={board.is_published ? 'success' : 'secondary'}>
                          {board.is_published ? '공개' : '비공개'}
                        </Badge>
                      </td>
                      <td>{board.view_count || 0}</td>
                      <td>
                        <small>{board.author_name || '관리자'}</small>
                      </td>
                      <td>
                        <small>{board.created_at ? formatDate(board.created_at) : '-'}</small>
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
                          onClick={() => handleDeleteClick(board)}
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
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
            {/* 모달 내 에러 표시 */}
            {modalError && (
              <Alert variant="danger" dismissible onClose={() => setModalError(null)} className="mb-4">
                <div className="d-flex align-items-center">
                  <strong className="me-2">⚠️</strong>
                  <span>{modalError}</span>
                </div>
              </Alert>
            )}
            
            {/* 기본 정보 섹션 */}
            <div className="mb-4">
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>제목 *</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="공지사항 제목을 입력하세요 (최소 5자)"
                      required
                      maxLength={200}
                    />
                    <Form.Text className="text-muted">
                      {(formData.title || '').length}/200자
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>공지 유형 *</Form.Label>
                    <Form.Select
                      name="notice_type"
                      value={formData.notice_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="GENERAL">전체 공지사항</option>
                      <option value="MEMBER_ONLY">회원 전용 공지사항</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      전체: 모든 사용자, 회원 전용: 로그인한 사용자만
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>우선순위 *</Form.Label>
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="LOW">낮음</option>
                      <option value="NORMAL">보통</option>
                      <option value="HIGH">높음</option>
                      <option value="URGENT">긴급</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      긴급/높음은 상단에 우선 표시됩니다
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* 내용 섹션 */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">내용</h6>
              <Form.Group className="mb-3">
                <Form.Label>공지사항 내용 *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="공지사항 내용을 입력하세요 (최소 10자)"
                  required
                  maxLength={5000}
                />
                <Form.Text className="text-muted">
                  {(formData.content || '').length}/5000자 (최소 10자 이상 입력해주세요)
                </Form.Text>
              </Form.Group>
            </div>

            {/* 공개 설정 섹션 */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">공개 설정</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>공지 시작일</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">
                      공지사항이 표시되기 시작할 날짜와 시간입니다. (현재 시간보다 5분 이후 설정 권장)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>공지 종료일</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">
                      공지사항이 표시를 중단할 날짜와 시간입니다. (시작일보다 늦게 설정)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* 추가 옵션 섹션 */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">추가 옵션</h6>
              <Row>
                <Col md={12}>
                  <div className="d-flex gap-4">
                    <div>
                      <Form.Check
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        label="즉시 공개"
                        checked={formData.is_published}
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        체크 해제 시 임시저장 상태가 됩니다.
                      </Form.Text>
                    </div>
                    
                    <div>
                      <Form.Check
                        type="checkbox"
                        id="is_pinned"
                        name="is_pinned"
                        label="상단 고정"
                        checked={formData.is_pinned}
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        중요한 공지사항을 목록 상단에 고정합니다.
                      </Form.Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
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

      {/* 삭제 확인 모달 */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>공지사항 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deletingBoard && (
            <div>
              <div className="d-flex align-items-center mb-3">
                <div className="text-danger me-3" style={{ fontSize: '2rem' }}>
                  ⚠️
                </div>
                <div>
                  <h5 className="mb-1">정말로 이 공지사항을 삭제하시겠습니까?</h5>
                  <p className="text-muted mb-0">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              
              <div className="bg-light p-3 rounded">
                <h6 className="mb-2">삭제할 공지사항 정보</h6>
                <div className="mb-2">
                  <strong>제목:</strong> {deletingBoard.title || '제목 없음'}
                </div>
                <div className="mb-2">
                  <strong>공지 유형:</strong> {deletingBoard.notice_type_display || '전체 공지사항'}
                </div>
                <div className="mb-2">
                  <strong>작성일:</strong> {deletingBoard.created_at ? formatDate(deletingBoard.created_at) : '-'}
                </div>
                <div>
                  <strong>조회수:</strong> {deletingBoard.view_count || 0}회
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-danger mb-0">
                  <strong>주의:</strong> 삭제된 공지사항은 복구할 수 없으며, 관련된 모든 데이터가 영구적으로 제거됩니다.
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 공지사항 상세보기 모달 */}
      <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>공지사항 상세 정보</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingBoard && (
            <div>
              {/* 제목 섹션 */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h4 className="mb-0 me-3">{viewingBoard.title || '제목 없음'}</h4>
                  {viewingBoard.is_pinned && (
                    <Badge bg="warning" className="me-2">📌 고정</Badge>
                  )}
                  {getNoticeTypeBadge(viewingBoard.notice_type || 'GENERAL')}
                  <span className="ms-2">{getPriorityBadge(viewingBoard.priority || 'NORMAL')}</span>
                </div>
                <div className="text-muted small">
                  <span className="me-3">
                    <strong>작성자:</strong> {viewingBoard.author_name || '관리자'}
                  </span>
                  <span className="me-3">
                    <strong>작성일:</strong> {viewingBoard.created_at ? formatDate(viewingBoard.created_at) : '-'}
                  </span>
                  <span className="me-3">
                    <strong>조회수:</strong> {viewingBoard.view_count || 0}회
                  </span>
                  <span>
                    <Badge bg={viewingBoard.is_published ? 'success' : 'secondary'}>
                      {viewingBoard.is_published ? '공개' : '비공개'}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* 내용 섹션 */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">📄 공지사항 내용</h6>
                <div 
                  className="bg-light p-3 rounded"
                  style={{ 
                    minHeight: '150px', 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}
                >
                  {viewingBoard.content || '내용이 없습니다.'}
                </div>
              </div>

              {/* 공개 설정 섹션 */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">⚙️ 공개 설정</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded">
                      <strong>공지 시작일:</strong><br />
                      <span className="text-muted">
                        {viewingBoard.start_date ? formatDate(viewingBoard.start_date) : '설정 안함'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded">
                      <strong>공지 종료일:</strong><br />
                      <span className="text-muted">
                        {viewingBoard.end_date ? formatDate(viewingBoard.end_date) : '설정 안함'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 섹션 */}
              <div className="mb-3">
                <h6 className="text-muted mb-3">📊 추가 정보</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="h5 mb-1">{viewingBoard.view_count || 0}</div>
                      <small className="text-muted">조회수</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="h5 mb-1">
                        {viewingBoard.is_active ? '✅' : '❌'}
                      </div>
                      <small className="text-muted">활성 상태</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-2 bg-light rounded">
                      <div className="h5 mb-1">
                        {viewingBoard.updated_at ? 
                          new Date(viewingBoard.updated_at).toLocaleDateString('ko-KR') : '-'}
                      </div>
                      <small className="text-muted">최종 수정일</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            handleCloseDetailModal();
            handleShowModal(viewingBoard);
          }}>
            수정하기
          </Button>
          <Button variant="secondary" onClick={handleCloseDetailModal}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BoardManagementPage; 