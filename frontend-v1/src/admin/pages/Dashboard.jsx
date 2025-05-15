import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import StorePlayerMapping from '../components/StorePlayerMapping';
import { dashboardAPI } from '../../utils/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tournament_count: 0,
    active_store_count: 0,
    player_count: 0,
    ticket_count: 0
  });
  const [mappingData, setMappingData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 대시보드 통계 데이터 가져오기
        const statsResponse = await dashboardAPI.getStats();
        setStats(statsResponse.data);

        try {
          // 매장/선수 매핑 데이터 가져오기 (실패해도 전체 대시보드가 중단되지 않도록 별도 try-catch로 처리)
          const mappingResponse = await dashboardAPI.getPlayerMapping();
          setMappingData(mappingResponse.data);
        } catch (mappingError) {
          console.error('매핑 데이터 로드 오류:', mappingError);

          console.warn('매핑 데이터 로드 실패: API가 구현되지 않았습니다.');

          // 임시 매핑 데이터 생성 (API가 구현될 때까지 더미 데이터 사용)
          setMappingData({
            토너먼트명: '임시 토너먼트',
            토너먼트_시작시간: new Date().toISOString(),
            총_좌석권_수량: 100,
            배포된_좌석권_수량: 75,
            매장별_현황: [
              { 매장명: 'A 매장', 좌석권_수량: 30 },
              { 매장명: 'B 매장', 좌석권_수량: 25 },
              { 매장명: 'C 매장', 좌석권_수량: 20 }
            ],
            선수별_현황: [
              { 선수명: '선수 1', 매장명: 'A 매장', 좌석권_보유: '있음' },
              { 선수명: '선수 2', 매장명: 'B 매장', 좌석권_보유: '있음' },
              { 선수명: '선수 3', 매장명: 'C 매장', 좌석권_보유: '있음' }
            ]
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('대시보드 데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    //fetchDashboardData();
    // 임시 매핑 데이터 생성 (API가 구현될 때까지 더미 데이터 사용)
    setMappingData({
      토너먼트명: '임시 토너먼트',
      토너먼트_시작시간: new Date().toISOString(),
      총_좌석권_수량: 100,
      배포된_좌석권_수량: 75,
      매장별_현황: [
        { 매장명: 'A 매장', 좌석권_수량: 30 },
        { 매장명: 'B 매장', 좌석권_수량: 25 },
        { 매장명: 'C 매장', 좌석권_수량: 20 }
      ],
      선수별_현황: [
        { 선수명: '선수 1', 매장명: 'A 매장', 좌석권_보유: '있음' },
        { 선수명: '선수 2', 매장명: 'B 매장', 좌석권_보유: '있음' },
        { 선수명: '선수 3', 매장명: 'C 매장', 좌석권_보유: '있음' }
      ]
    });
  }, []);

  const dashboardStats = [
    { title: '총 토너먼트 수', value: stats.tournament_count, color: 'blue', icon: 'trophy' },
    { title: '활성 매장 수', value: stats.active_store_count, color: 'green', icon: 'store' },
    { title: '등록 선수 수', value: stats.player_count, color: 'yellow', icon: 'users' },
    { title: '좌석권 보유 수', value: stats.ticket_count, color: 'red', icon: 'ticket' }
  ];

  // if (loading) {
  //   return (
  //     <div className="text-center p-5">
  //       <Spinner animation="border" variant="primary" />
  //       <p className="mt-3">데이터를 불러오는 중입니다...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>오류 발생</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">대시보드</h2>

      {/* 통계 카드 */}
      <Row className="dashboard-stats mb-4">
        {dashboardStats.map((stat, index) => (
          <Col md={3} sm={6} key={index}>
            <Card className={`card-${stat.color} h-100`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted">{stat.title}</h6>
                  <h2>{stat.value}</h2>
                </div>
                <div className="rounded-circle bg-light p-3">
                  <i className={`bi bi-${stat.icon} fs-4`}></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 매장/선수 매핑 */}
      {mappingData && <StorePlayerMapping data={mappingData} />}
    </div>
  );
};

export default Dashboard;
