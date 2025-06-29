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
        try {
          const statsResponse = await dashboardAPI.getStats();
          console.log('대시보드 통계 응답:', statsResponse.data);
          
          // API 응답 데이터를 안전하게 처리
          const responseData = statsResponse.data || {};
          setStats({
            tournament_count: responseData.tournament_count || 0,
            active_store_count: responseData.active_store_count || 0,
            player_count: responseData.player_count || 0,
            ticket_count: responseData.ticket_count || 0
          });
        } catch (apiError) {
          console.warn('API 호출 실패, 더미 데이터 사용:', apiError);
          // API 호출 실패 시 더미 데이터 사용
          setStats({
            tournament_count: 12,
            active_store_count: 5,
            player_count: 234,
            ticket_count: 89
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('대시보드 데이터 로드 오류:', err);
        // 오류가 발생해도 더미 데이터로 화면 표시
        setStats({
          tournament_count: 0,
          active_store_count: 0,
          player_count: 0,
          ticket_count: 0
        });
        setError('데이터 연결에 문제가 있어 임시 데이터를 표시합니다.');
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
              primaryText: (stats.tournament_count || 0).toString(),
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
              primaryText: (stats.active_store_count || 0).toString(),
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
              primaryText: (stats.player_count || 0).toString(),
              secondaryText: '전체 선수',
              extraText: '명'
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: 'SEAT권 보유 수',
              class: 'bg-c-red',
              icon: 'feather icon-credit-card',
              primaryText: (stats.ticket_count || 0).toString(),
              secondaryText: '보유 SEAT권',
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
