import React from 'react';
import { NavLink } from 'react-router-dom';

// react-bootstrap
import { Col, Container, Row } from 'react-bootstrap';

// assets
import BackgroundError from 'assets/images/maintenance/404.png';

// -----------------------|| ERROR ||-----------------------//

const NotFound404 = () => (
  <>
    <div className="auth-wrapper maintenance">
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <div className="text-center">
              <img src={BackgroundError} alt="Error - 404" className="img-fluid" />
              <h5 className="my-4 maintenance-text">Oops! Page not found!</h5>
              <NavLink to="/" className="mb-4">
                <i className="feather icon-refresh-ccw me-2 maintenance-text" />
                <span className="maintenance-text">Reload</span>
              </NavLink>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  </>
);

export default NotFound404;
