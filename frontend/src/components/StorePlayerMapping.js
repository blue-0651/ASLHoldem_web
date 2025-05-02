import React from 'react';
import { Card, Table, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';

const StorePlayerMapping = ({ data }) => {
  if (!data) {
    return (
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-success text-white">
          매장/선수 매핑 현황
        </Card.Header>
        <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">데이터를 불러오는 중입니다...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header as="h5" className="bg-success text-white">
        {data.토너먼트명} 매장/선수 매핑 현황
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between mb-4">
          <div className="text-center p-3 border rounded">
            <h6>매장 좌석권 보유 현황</h6>
            <h4>{data.매장별_현황?.length || 0}</h4>
          </div>
          <div className="text-center p-3 border rounded">
            <h6>배포된 좌석권 수량</h6>
            <h4>{data.배포된_좌석권_수량 || 0}</h4>
          </div>
          <div className="text-center p-3 border rounded">
            <h6>총 좌석권 수량</h6>
            <h4>{data.총_좌석권_수량 || 0}</h4>
          </div>
        </div>

        <h5 className="mb-3">선수별 좌석권 현황</h5>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>선수명</th>
                <th>매장명</th>
                <th>좌석권 보유 여부</th>
              </tr>
            </thead>
            <tbody>
              {data.선수별_현황?.length > 0 ? (
                data.선수별_현황.map((item, index) => (
                  <tr key={index}>
                    <td>{item.선수명}</td>
                    <td>{item.매장명}</td>
                    <td>{item.좌석권_보유}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">매핑 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

StorePlayerMapping.propTypes = {
  data: PropTypes.shape({
    토너먼트명: PropTypes.string,
    토너먼트_시작시간: PropTypes.string,
    총_좌석권_수량: PropTypes.number,
    배포된_좌석권_수량: PropTypes.number,
    매장별_현황: PropTypes.arrayOf(
      PropTypes.shape({
        매장명: PropTypes.string,
        좌석권_수량: PropTypes.number
      })
    ),
    선수별_현황: PropTypes.arrayOf(
      PropTypes.shape({
        선수명: PropTypes.string,
        매장명: PropTypes.string,
        좌석권_보유: PropTypes.string
      })
    )
  })
};

export default StorePlayerMapping; 