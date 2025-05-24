import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import StorePlayerMapping from '../components/StorePlayerMapping';
import { dashboardAPI } from '../../utils/api';
import OrderCard from '../../components/Widgets/Statistic/OrderCard';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tournament_count: 0,
    active_store_count: 0,
    player_count: 0,
    ticket_count: 0
  });
  // const [mappingData, setMappingData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 대시보드 통계 데이터 가져오기
        const statsResponse = await dashboardAPI.getStats();
        console.log('대시보드 통계 응답:', statsResponse.data);
        setStats(statsResponse.data);

        /*
        try {
          // 매장/선수 매핑 데이터 가져오기 (실패해도 전체 대시보드가 중단되지 않도록 별도 try-catch로 처리)
          const mappingResponse = await dashboardAPI.getPlayerMapping();
          setMappingData(mappingResponse.data);
        } catch (mappingError) {
          console.error('매핑 데이터 로드 오류:', mappingError);
          // 매핑 데이터는 선택사항이므로 실패해도 대시보드는 정상 표시
        }
        */

        setLoading(false);
      } catch (err) {
        console.error('대시보드 데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

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
      <Row className="mb-4">
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: '총 토너먼트 수',
              class: 'bg-c-blue',
              icon: 'feather icon-award',
              primaryText: stats.tournament_count.toString(),
              secondaryText: '전체 토너먼트',
              extraText: '개'
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: '토너먼트 개최 매장 수',
              class: 'bg-c-green',
              icon: 'feather icon-map-pin',
              primaryText: stats.active_store_count.toString(),
              secondaryText: '참여 매장',
              extraText: '개소'
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: '등록 선수 수',
              class: 'bg-c-yellow',
              icon: 'feather icon-users',
              primaryText: stats.player_count.toString(),
              secondaryText: '전체 선수',
              extraText: '명'
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: '좌석권 보유 수',
              class: 'bg-c-red',
              icon: 'feather icon-credit-card',
              primaryText: stats.ticket_count.toString(),
              secondaryText: '보유 좌석권',
              extraText: '매'
            }}
          />
        </Col>
      </Row>

      {/* 매장/선수 매핑 */}
      {/* {mappingData && <StorePlayerMapping data={mappingData} />} */}
    </div>
  );
};

export default Dashboard;
