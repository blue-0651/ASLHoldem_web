import React, { useState } from 'react';

// react-bootstrap
import { Row, Col, Card, Button, Modal } from 'react-bootstrap';

// project import
import MainCard from '../../components/Card/MainCard';
import { noticeAPI } from '../../utils/api';

// ==============================|| SAMPLE PAGE ||============================== //

const SamplePage = () => {  // 다이얼로그(모달) 상태 관리
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleNoticeApiTest = async () => {
    try {
      const res = await noticeAPI.getAllNotices();
      alert(JSON.stringify(res.data, null, 2));
    } catch (e) {
      alert('API 호출 실패');
    }
  };

  return (
    <React.Fragment>
      <Row className="mb-4">
        <Col>
          <MainCard title="Hello Card" isOption>
            <p>
              &quot;Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
              irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
              non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.&quot;
            </p>
            <div className="d-flex justify-content-end">
              <Button variant="outline-primary" onClick={handleNoticeApiTest}>
                Notice Api Test
              </Button>
            </div>
          </MainCard>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <MainCard title="카드 컨트롤 예제 1" isOption>
            <Card className="mb-3">
              <Card.Header>기본 카드 헤더</Card.Header>
              <Card.Body>
                <Card.Title>특별 카드 제목</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">카드 부제목</Card.Subtitle>
                <Card.Text>
                  이것은 카드 컨트롤의 기본 예제입니다. 헤더, 본문, 푸터가 있는 구조입니다.
                  다양한 스타일링과 레이아웃을 적용할 수 있습니다.
                </Card.Text>
                <Button variant="primary" onClick={() => setShowDetailModal(true)}>자세히 보기</Button>
              </Card.Body>
              <Card.Footer className="text-muted">2025년 5월 23일 업데이트</Card.Footer>
            </Card>
          </MainCard>
        </Col>
        
        <Col md={6}>
          <MainCard title="카드 컨트롤 예제 2" isOption>
            <Card 
              bg="success"
              text="white"
              className="mb-3"
            >
              <Card.Header>색상이 적용된 카드</Card.Header>
              <Card.Body>
                <Card.Title>성공 테마 카드</Card.Title>
                <Card.Text>
                  이 카드는 성공(success) 테마가 적용되어 있습니다. 
                  다양한 색상 테마를 적용하여 중요도나 상태를 표현할 수 있습니다.
                </Card.Text>                <div className="d-flex justify-content-end">
                  <Button variant="light" className="me-2" onClick={() => setShowConfirmModal(false)}>취소</Button>
                  <Button variant="outline-light" onClick={() => setShowConfirmModal(true)}>확인</Button>
                </div>
              </Card.Body>
            </Card>
          </MainCard>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <MainCard title="다양한 스타일의 카드" isOption>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>액션 버튼이 포함된 카드</Card.Title>
                <Card.Text>
                  이 카드는 액션 버튼이 포함된 예제입니다. 사용자가 직접 조작할 수 있는 버튼을 추가하여
                  다양한 인터랙션을 제공할 수 있습니다.
                </Card.Text>
                <div className="d-flex justify-content-between">                  <Button variant="primary" onClick={() => setShowEditModal(true)}>수정</Button>
                  <Button variant="danger" onClick={() => setShowDeleteModal(true)}>삭제</Button>
                </div>
              </Card.Body>
            </Card>
          </MainCard>
        </Col>
        
        <Col md={6}>
          <MainCard title="푸터가 있는 카드" isOption>
            <Card className="text-center">
              <Card.Header>정보 카드</Card.Header>
              <Card.Body>
                <Card.Title>중요 공지사항</Card.Title>
                <Card.Text>
                  모든 회원은 필독 바랍니다. 중요 업데이트 사항이 포함되어 있습니다.
                </Card.Text>
              </Card.Body>
              <Card.Footer className="bg-light">
                <small className="text-muted">2025년 5월 1일 기준</small>
              </Card.Footer>
            </Card>
          </MainCard>
        </Col>
      </Row>
      
      <Row>
        <Col md={4}>
          <Card className="text-center">
            <Card.Header>추천 매장</Card.Header>
            <Card.Body>
              <Card.Title>ASL 홀덤 클럽</Card.Title>
              <Card.Text>
                최상의 서비스와 함께 즐거운 홀덤 게임을 경험해보세요.
              </Card.Text>
              <Button variant="outline-primary" onClick={() => setShowStoreInfoModal(true)}>매장 정보</Button>
            </Card.Body>
            <Card.Footer className="text-muted">홍대입구역 3번출구 5분거리</Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-primary">
            <Card.Header className="bg-transparent border-primary">인기 토너먼트</Card.Header>
            <Card.Body className="text-primary">
              <Card.Title>위클리 챔피언십</Card.Title>
              <Card.Text>
                매주 일요일 오후 2시에 진행되는 정기 토너먼트에 참가하세요.
                상금 500만원 + 스폰서십 기회
              </Card.Text>
            </Card.Body>
            <Card.Footer className="bg-transparent border-primary">
              <Button variant="primary" size="sm" onClick={() => setShowRegisterModal(true)}>참가하기</Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-end">
            <Card.Header>이벤트 알림</Card.Header>
            <Card.Img variant="top" src="/images/asl_logo.png" alt="ASL 로고" style={{ height: '80px', objectFit: 'contain', padding: '10px' }} />
            <Card.Body>
              <Card.Title>신규 회원 이벤트</Card.Title>
              <Card.Text>
                신규 가입 회원에게 첫 토너먼트 참가비 50% 할인!
              </Card.Text>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">이벤트 기간: 2025년 5월 한 달간</small>            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* 자세히 보기 모달 */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>특별 카드 상세 정보</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>이 카드는 기본적인 구조를 보여주는 예시입니다. 다양한 정보와 기능을 포함할 수 있습니다.</p>
          <p>카드 컴포넌트는 헤더, 본문, 푸터를 포함하여 다양한 정보를 구조적으로 표시할 수 있습니다. 
          반응형 레이아웃을 지원하여 모든 화면 크기에 적합하게 표시됩니다.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 확인 모달 */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>정말 이 작업을 진행하시겠습니까?</p>
          <p>이 작업은 되돌릴 수 없습니다.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            취소
          </Button>
          <Button variant="success" onClick={() => {
            // 여기에 확인 작업 로직 추가
            setShowConfirmModal(false);
          }}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 수정 모달 */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>내용 수정</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>여기에 수정 폼을 추가할 수 있습니다.</p>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">제목</label>
            <input type="text" className="form-control" id="title" defaultValue="액션 버튼이 포함된 카드" />
          </div>
          <div className="mb-3">
            <label htmlFor="content" className="form-label">내용</label>
            <textarea className="form-control" id="content" rows="3" 
              defaultValue="이 카드는 액션 버튼이 포함된 예제입니다. 사용자가 직접 조작할 수 있는 버튼을 추가하여 다양한 인터랙션을 제공할 수 있습니다."></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={() => {
            // 여기에 저장 로직 추가
            setShowEditModal(false);
          }}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>정말 이 항목을 삭제하시겠습니까?</p>
          <p className="text-danger">이 작업은 되돌릴 수 없습니다.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={() => {
            // 여기에 삭제 로직 추가
            setShowDeleteModal(false);
          }}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 매장 정보 모달 */}
      <Modal show={showStoreInfoModal} onHide={() => setShowStoreInfoModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>ASL 홀덤 클럽 정보</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={4}>
              <img 
                src="/images/asl_logo.png" 
                alt="ASL 로고" 
                className="img-fluid mb-3" 
                style={{ maxHeight: '150px', objectFit: 'contain' }} 
              />
            </Col>
            <Col md={8}>
              <h4>홍대 플래그십 스토어</h4>
              <p><strong>주소:</strong> 서울시 마포구 홍대입구역 3번출구 5분거리</p>
              <p><strong>영업시간:</strong> 매일 오후 1시 ~ 익일 오전 4시</p>
              <p><strong>연락처:</strong> 02-123-4567</p>
              <p><strong>특징:</strong> 최고급 테이블 10대, VIP룸 2개, 프리미엄 간식 및 음료 제공</p>
              <p><strong>주차:</strong> 발렛파킹 가능</p>
            </Col>
          </Row>
          <hr />
          <h5>이용 안내</h5>
          <ul>
            <li>첫 방문 시 회원 등록이 필요합니다. (신분증 지참)</li>
            <li>예약은 홈페이지 또는 전화로 가능합니다.</li>
            <li>주말 및 공휴일은 혼잡할 수 있으니 예약을 권장합니다.</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            // 여기에 예약 페이지로 이동하는 로직 추가
          }}>
            예약하기
          </Button>
          <Button variant="secondary" onClick={() => setShowStoreInfoModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 토너먼트 등록 모달 */}
      <Modal show={showRegisterModal} onHide={() => setShowRegisterModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>위클리 챔피언십 등록</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>토너먼트 정보</strong></p>
          <ul>
            <li>일시: 매주 일요일 오후 2시</li>
            <li>참가비: 100,000원</li>
            <li>상금: 500만원 + 스폰서십 기회</li>
            <li>장소: ASL 홀덤 클럽 홍대점</li>
          </ul>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">이름</label>
            <input type="text" className="form-control" id="name" placeholder="홍길동" />
          </div>
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">연락처</label>
            <input type="text" className="form-control" id="phone" placeholder="010-0000-0000" />
          </div>
          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="terms" />
            <label className="form-check-label" htmlFor="terms">대회 규정 및 개인정보 수집에 동의합니다</label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegisterModal(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={() => {
            // 여기에 등록 로직 추가
            setShowRegisterModal(false);
          }}>
            참가하기
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

export default SamplePage;
