import React, { useContext, useEffect, useRef } from 'react';

import { Outlet } from 'react-router-dom';

// project import
import Navigation from './Navigation';
import NavBar from './NavBar';

import useWindowSize from '../../hooks/useWindowSize';
import useOutsideClick from '../../hooks/useOutsideClick';
import { ConfigContext } from '../../contexts/ConfigContext';
import * as actionType from '../../store/actions';

// ==============================|| ADMIN LAYOUT ||============================== //

const AdminLayout = () => {

  const windowSize = useWindowSize();
  const ref = useRef();
  const configContext = useContext(ConfigContext);

  const { collapseMenu, layout } = configContext.state;
  const { dispatch } = configContext;

  useOutsideClick(ref, () => {
    if (collapseMenu) {
      dispatch({ type: actionType.COLLAPSE_MENU });
    }
  });

  useEffect(() => {
    if (windowSize.width > 992 && windowSize.width <= 1024) {
      console.log('vertical 1' + ':' + collapseMenu + ':' + windowSize.width);
      dispatch({ type: actionType.COLLAPSE_MENU });
    }

    if (windowSize.width < 992) {
      console.log('vertical 2 CHANGE_LAYOUT : ' + ':' + collapseMenu + ':' + windowSize.width);
      dispatch({ type: actionType.CHANGE_LAYOUT, layout: 'vertical' });
    }
  }, [dispatch, layout, windowSize]);

  const mobileOutClickHandler = () => {
    console.log('mobileOutClickHandler called with windowSize:', windowSize.width, 'collapseMenu:', collapseMenu);

    if (windowSize.width < 992 && collapseMenu) {
      console.log('vertical 3' + ':' + collapseMenu + ':' + windowSize.width);
      dispatch({ type: actionType.COLLAPSE_MENU });
    }
  };

  // sjhan modify
  //background: radial-gradient(circle at center, $asl-admin-body-bg-start, $asl-admin-body-bg-end);
  let mainClass = ['pcoded-wrapper'];
  //let mainClass = ['asl-admin-wrapper'];


  let common = (
    <React.Fragment>
      <Navigation />
      <NavBar />
    </React.Fragment>
  );

  if (windowSize.width < 992) {
    let outSideClass = ['nav-outside'];
    if (collapseMenu) {
      outSideClass = [...outSideClass, 'mob-backdrop'];
    }
    outSideClass = [...outSideClass, 'mob-fixed'];

    common = (
      <div className={outSideClass.join(' ')} ref={ref}>
        {common}
      </div>
    );
  }

  return (
    <React.Fragment>
      {common}
      <div className="pcoded-main-container" onClick={() => mobileOutClickHandler} onKeyDown={() => mobileOutClickHandler}>
        <div className={mainClass.join(' ')}>
          <div className="pcoded-content">
            <div className="pcoded-inner-content">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default AdminLayout;
