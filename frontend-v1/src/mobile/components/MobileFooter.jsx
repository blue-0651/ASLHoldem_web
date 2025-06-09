import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

/**
 * 모바일 페이지용 Footer 컴포넌트
 * 사업자 정보 및 회사 정보를 표시
 */
const MobileFooter = () => {
  return (
    <footer className="asl-mobile-footer">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12}>
            <div className="footer-content text-center">
              {/* 회사명 */}
              <div className="company-name">
                <strong>주식회사 아시안스포츠리그</strong>
              </div>
              
              {/* 사업자정보 */}
              <div className="business-info">
                <p className="mb-1">
                  <small>사업자등록번호: 533-87-03532 | 대표자: 강기성</small>
                </p>
                <p className="mb-1">
                  <small>서울특별시 송파구 중대로 207, 2층 201-제이480호(가락동, 대명빌딩)</small>
                </p>
                <p className="mb-2">
                  <small>연락처: pluskgs@naver.com</small>
                </p>
              </div>
              
              {/* 저작권 정보 */}
              <div className="copyright">
                <small className="text-muted">
                  © 2025 ASL Holdem. All rights reserved.
                </small>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default MobileFooter; 