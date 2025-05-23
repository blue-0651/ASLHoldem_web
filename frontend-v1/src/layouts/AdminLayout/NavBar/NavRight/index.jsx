import React from 'react';

// react-bootstrap
import { ListGroup } from 'react-bootstrap';


// ==============================|| NAV RIGHT ||============================== //

const NavRight = () => {
  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto">
        {/* 모든 아이콘 및 메뉴가 제거됨 */}
      </ListGroup>
    </React.Fragment>
  );
};

export default NavRight;
