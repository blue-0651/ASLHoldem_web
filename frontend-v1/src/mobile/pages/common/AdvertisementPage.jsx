import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvertisementPage.scss';

// 기존 ASL 로고 이미지 import
import aslLogo from '../../../assets/images/logo.png';

// 실제 포커/홀덤 토너먼트 광고 이미지
const TOURNAMENT_IMAGE = 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80';

// 실제 홀덤펍/포커바 매장 이미지들
const STORE_IMAGES = [
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 포커 테이블
  'https://images.unsplash.com/photo-1585504198199-20277593b94f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 바 인테리어
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 포커 칩
  'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 포커 핸드
  'https://images.unsplash.com/photo-1574391584692-9c3ddc42d346?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 맥주잔
];

// 매장명 배열
const STORE_NAMES = [
  '강남 홀덤펍',
  '홍대 포커바',
  '건대 홀덤클럽',
  '압구정 포커하우스',
  '신촌 홀덤라운지'
];

// 포커/도박 관련 브랜드 로고들
const BANNER_LOGOS = [
  'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/pokerstars.svg',
  'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/twitch.svg',
  'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/youtube.svg',
  'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/discord.svg',
  'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/instagram.svg',
];

/**
 * ASL 광고 화면 페이지 컴포넌트
 * 대회 로고 이미지와 협력사 배너 이미지를 표시하는 메인 광고 페이지
 */
const AdvertisementPage = () => {
  const navigate = useNavigate();
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);
  const [slideDistance, setSlideDistance] = useState(164); // 기본값
  
  const handleLogin = () => navigate('/mobile/login');

  // 반응형 슬라이딩 거리 계산
  const calculateSlideDistance = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      return 268; // 200px(min-width) + 48px(gap) + 20px(여유)
    } else if (width >= 1024) {
      return 240; // 180px(min-width) + 40px(gap) + 20px(여유)
    } else if (width >= 768) {
      return 202; // 150px(min-width) + 32px(gap) + 20px(여유)
    } else {
      return 164; // 140px(min-width) + 24px(gap)
    }
  };

  // 매장 갤러리 자동 슬라이딩 (2초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStoreIndex((prevIndex) => 
        prevIndex === STORE_IMAGES.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 화면 크기 변경 감지 및 슬라이딩 거리 업데이트
  useEffect(() => {
    const updateSlideDistance = () => {
      setSlideDistance(calculateSlideDistance());
    };

    // 초기 설정
    updateSlideDistance();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateSlideDistance);

    return () => {
      window.removeEventListener('resize', updateSlideDistance);
    };
  }, []);

  return (
    <div className="asl-advertisement-layout">
      {/* 타이틀바 */}
      <header className="asl-titlebar asl-titlebar-small">
        <div className="asl-logo">
          <div className="logo-container">
            <img 
              src={aslLogo} 
              alt="ASL HOLDEM Logo" 
              className="logo-image"
            />
          </div>
        </div>
        <button className="asl-login-btn" onClick={handleLogin}>
          로그인
        </button>
      </header>

      {/* 대회 로고 이미지 */}
      <section className="asl-tournament-section">
        <img
          src={TOURNAMENT_IMAGE}
          alt="ASL 홀덤 토너먼트 대회"
          className="asl-tournament-image"
        />
        
        {/* 토너먼트 정보 오버레이 */}
        <div className="asl-tournament-overlay">
          <div className="tournament-content">
            <h1 className="tournament-title">
              <span className="title-main">ASL HOLDEM</span>
              <span className="title-sub">CHAMPIONSHIP 2024</span>
            </h1>
            
            <div className="tournament-details">
              <div className="prize-info">
                <span className="prize-label">총 상금</span>
                <span className="prize-amount">₩50,000,000</span>
              </div>
              
              <div className="tournament-date">
                <i className="fas fa-calendar-alt"></i>
                <span>매주 토요일 오후 2시</span>
              </div>
              
              <div className="tournament-location">
                <i className="fas fa-map-marker-alt"></i>
                <span>강남 홀덤펍 본점</span>
              </div>
            </div>
            
            <div className="cta-buttons">
              <button className="cta-primary">
                <i className="fas fa-trophy"></i>
                지금 참가하기
              </button>
              <button className="cta-secondary">
                <i className="fas fa-info-circle"></i>
                자세히 보기
              </button>
            </div>
          </div>
          
          {/* 장식적 요소들 */}
          <div className="decoration-elements">
            <div className="floating-chip chip-1">♠</div>
            <div className="floating-chip chip-2">♥</div>
            <div className="floating-chip chip-3">♦</div>
            <div className="floating-chip chip-4">♣</div>
          </div>
        </div>
      </section>

      {/* 매장 사진 리스트 - 자동 슬라이딩 */}
      <section className="asl-store-section">
        <div className="asl-store-list" style={{
          transform: `translateX(-${currentStoreIndex * slideDistance}px)`,
          transition: 'transform 0.5s ease-in-out'
        }}>
          {STORE_IMAGES.map((src, idx) => (
            <div 
              className={`asl-store-thumb ${idx === currentStoreIndex ? 'active' : ''}`} 
              key={idx}
            >
              <img src={src} alt={`홀덤펍 매장 ${idx + 1}`} />
              
              {/* 매장명 오버레이 */}
              <div className="store-name-overlay">
                <div className="store-name-content">
                  <h3 className="store-name">{STORE_NAMES[idx]}</h3>
                  <div className="store-info">
                    <span className="store-status">영업중</span>
                    <span className="store-rating">★ 4.8</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 배너 리스트 */}
      <section className="asl-banner-section">
        <div className="asl-banner-list">
          {BANNER_LOGOS.map((src, idx) => (
            <div className="asl-banner-logo" key={idx}>
              <img src={src} alt={`협력사 ${idx + 1}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdvertisementPage; 