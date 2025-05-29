import React from 'react';
import { createRoot } from 'react-dom/client';

// Bootstrap CSS import
import 'bootstrap/dist/css/bootstrap.min.css';

import reportWebVitals from './reportWebVitals';

// 전체 스타일 파일 올리는 공간.
import './index.scss';

//import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    {/*<BrowserRouter>*/}
    <ConfigProvider>
      <App />
    </ConfigProvider>
    {/*</BrowserRouter>*/}
  </React.StrictMode>
);

reportWebVitals();
