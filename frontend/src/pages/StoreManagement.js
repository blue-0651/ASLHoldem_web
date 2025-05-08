import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Table } from 'react-bootstrap';

const StoreManagement = () => {
  // 샘플 데이터: 실제 API 연동 시 대체해야 함
  const stores = [
    {
      id: 1,
      name: 'AA 매장',
      address: '서울시 강남구 역삼동 123-45',
      phone: '02-1234-5678',
      tournament_count: 5
    },
    {
      id: 2,
      name: 'BB 매장',
      address: '서울시 서초구 서초동 456-78',
      phone: '02-2345-6789',
      tournament_count: 3
    },
    {
      id: 3,
      name: 'CC 매장',
      address: '서울시 송파구 송파동 789-12',
      phone: '02-3456-7890',
      tournament_count: 4
    }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>매장 관리</h2>
      </div>

      {/* 필터 섹션 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4} sm={6} xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>매장명</Form.Label>
                <Form.Control type="text" placeholder="매장명 검색..." />
              </Form.Group>
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>주소</Form.Label>
                <Form.Control type="text" placeholder="주소 검색..." />
              </Form.Group>
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>정렬</Form.Label>
                <Form.Select>
                  <option value="name">매장명 (오름차순)</option>
                  <option value="-name">매장명 (내림차순)</option>
                  <option value="tournament_count">토너먼트 수 (오름차순)</option>
                  <option value="-tournament_count">토너먼트 수 (내림차순)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" className="me-2">초기화</Button>
            <Button variant="primary">필터 적용</Button>
          </div>
        </Card.Body>
      </Card>

      {/* 매장 목록 */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>매장명</th>
                  <th>주소</th>
                  <th>전화번호</th>
                  <th>토너먼트 수</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id}>
                    <td>{store.id}</td>
                    <td>{store.name}</td>
                    <td>{store.address}</td>
                    <td>{store.phone}</td>
                    <td>{store.tournament_count}</td>
                    <td>
                      <Button variant="outline-primary" size="sm">
                        수정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StoreManagement; 