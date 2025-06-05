import React from 'react';

// react-bootstrap
import { ListGroup } from 'react-bootstrap';

// project import
import UserProfile from './UserProfile';

// ==============================|| NAV RIGHT ||============================== //

const NavRight = () => {
  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto d-flex align-items-center">
        {/* 사용자 정보 표시 */}
        <ListGroup.Item 
          as="li" 
          bsPrefix=" " 
          className="nav-item d-flex align-items-center"
          style={{ border: 'none', padding: '0', background: 'transparent' }}
        >
          <UserProfile />
        </ListGroup.Item>
      </ListGroup>
    </React.Fragment>
  );
};

export default NavRight;
