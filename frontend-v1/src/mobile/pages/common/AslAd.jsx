import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { bannerAPI } from '../../../utils/api';
import './AslAd.scss';

// 이미지 import
import aslLogo from '../../../assets/images/asl-logo-120.png';
import tournamentImage from '../../../assets/images/stores/tournament1.jpeg';
import gangnamStore from '../../../assets/images/stores/gangnam.jpg';
import hongdaeStore from '../../../assets/images/stores/hongdae.jpg';
import gundaeStore from '../../../assets/images/stores/gundae.jpg';
import apgujeongStore from '../../../assets/images/stores/apgujeong.jpg';
import sinchonStore from '../../../assets/images/stores/sinchon.jpg';
import galleryImg1 from '../../../assets/images/gallery-grid/img-grd-gal-1.jpg';
import galleryImg2 from '../../../assets/images/gallery-grid/img-grd-gal-2.jpg';
import galleryImg3 from '../../../assets/images/gallery-grid/img-grd-gal-3.jpg';

/**
 * ASL 광고 화면 페이지 컴포넌트
 * - 대회 로고 이미지 표시
 * - 매장 리스트 부페이저 (2초마다 자동 슬라이딩)
 * - 협력사 배너 이미지 리스트
 */
const AslAd = () => {
  const navigate = useNavigate();
  const isMountedRef = useRef(false);
  const isApiCalledRef = useRef(false);
  
  // 매장 슬라이더 상태 관리
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // 메인 토너먼트 배너 상태 관리
  const [mainTournamentBanner, setMainTournamentBanner] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerError, setBannerError] = useState(null);

  // 매장 데이터 (8개로 확장)
  const stores = [
    { 
      name: '골프클럽 라운지', 
      image: galleryImg1,
      description: '프리미엄 골프 클럽하우스에서 즐기는 홀덤'
    },
    { 
      name: '낚시터 펍', 
      image: galleryImg2,
      description: '강가 낚시터에서 여유롭게 즐기는 카드게임'
    },
    { 
      name: '전통 장기원', 
      image: galleryImg3,
      description: '전통 한옥에서 장기와 함께하는 홀덤'
    },
    { 
      name: '홀덤펍 메인', 
      image: gangnamStore,
      description: '도심 속 프리미엄 홀덤 전문 펍'
    },
    { 
      name: '리버사이드 골프', 
      image: hongdaeStore,
      description: '강변 골프클럽의 특별한 홀덤 라운지'
    },
    { 
      name: '바다낚시 카페', 
      image: gundaeStore,
      description: '바다가 보이는 낚시카페의 홀덤방'
    },
    { 
      name: '궁중 장기원', 
      image: apgujeongStore,
      description: '궁중 분위기의 고급 장기원 홀덤실'
    },
    { 
      name: '프라이빗 홀덤', 
      image: sinchonStore,
      description: '프라이빗 룸으로 운영되는 VIP 홀덤클럽'
    },
  ];

  // 협력사 로고 (외부 CDN 사용)
  const partnerLogos = [
    'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/google.svg',
    'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/naver.svg',
    'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/kakao.svg',
    'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/samsung.svg',
  ];

  // 메인 토너먼트 배너 불러오기
  const fetchMainTournamentBanner = async () => {
    // 이미 API 호출 중이거나 완료된 경우 중복 호출 방지
    if (isApiCalledRef.current || bannerLoading === false) {
      console.log('🔄 중복 API 호출 방지: 이미 처리 중이거나 완료됨');
      return;
    }

    try {
      isApiCalledRef.current = true;
      setBannerLoading(true);
      setBannerError(null);
      
      console.log('📤 메인 토너먼트 배너 조회 시작');
      const response = await bannerAPI.getMainTournamentBanner();
      
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (!isMountedRef.current) {
        console.log('⚠️ 컴포넌트 언마운트됨: 상태 업데이트 취소');
        return;
      }
      
      if (response.data.banner) {
        setMainTournamentBanner(response.data.banner);
        console.log('✅ 메인 토너먼트 배너 로드 성공');
      } else {
        setMainTournamentBanner(null);
        console.log('ℹ️ 설정된 메인 토너먼트 배너 없음');
      }
    } catch (error) {
      console.error('❌ 메인 토너먼트 배너 불러오기 실패:', error);
      
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (!isMountedRef.current) {
        return;
      }
      
      setBannerError('배너를 불러오는데 실패했습니다.');
      setMainTournamentBanner(null);
    } finally {
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (isMountedRef.current) {
        setBannerLoading(false);
      }
    }
  };

  // 컴포넌트 마운트 시 메인 토너먼트 배너 불러오기
  useEffect(() => {
    isMountedRef.current = true;
    
    // 컴포넌트 마운트 후 한 번만 실행
    if (!isApiCalledRef.current) {
      fetchMainTournamentBanner();
    }

    // cleanup 함수
    return () => {
      isMountedRef.current = false;
      console.log('🔄 AslAd 컴포넌트 언마운트');
    };
  }, []);

  // 2초마다 자동 슬라이딩
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        // 4개씩 보여주므로, 총 슬라이드 수는 stores.length - 3
        const maxSlide = stores.length - 4;
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }, 2000); // 2초마다 실행

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [stores.length]);

  // 현재 슬라이드에 따른 매장 4개 선택
  const getCurrentStores = () => {
    return stores.slice(currentSlide, currentSlide + 4);
  };

  const handleLogin = () => {
    navigate('/mobile/login');
  };

  const handleStoreClick = (store) => {
    console.log(`${store.name} 클릭됨`);
    // 매장 상세 페이지로 이동하는 로직 추가 가능
  };

  return (
    <div className="asl-mobile-container">
      {/* 로고 섹션 */}
      {/* <div className="asl-mobile-logo-container">
        <img src={aslLogo} alt="ASL Logo" className="asl-mobile-logo" />
      </div> */}

      <Container className="asl-ad-content-container">
        {/* 헤더 카드 */}
        <Card className="asl-mobile-card mb-3">
          <Card.Body>
            <div className="asl-ad-header-content">
              <div className="text-center">
                <h3 className="mb-2" style={{ color: '#333', fontWeight: '700' }}>아시안 스포츠 리그</h3>
                <p className="text-muted mb-3">최고의 경험을 만나보세요</p>
              </div>
              <div className="text-center">
                <Button 
                  className="asl-mobile-login-btn asl-user-btn"
                  onClick={handleLogin}
                  style={{
                    backgroundColor: '#8B4513',
                    borderColor: '#8B4513',
                    width: 'auto',
                    padding: '10px 30px'
                  }}
                >
                  로그인
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* 대회 로고 이미지 카드 */}
        <Card className="asl-mobile-card mb-3">
          <Card.Body>
            <div className="text-center mb-3">
              <h5 style={{ color: '#333', fontWeight: '600' }}>
                {mainTournamentBanner?.title || '토너먼트 정보'}
              </h5>
              <p className="text-muted small">
                {mainTournamentBanner?.description || '최신 대회 소식을 확인하세요'}
              </p>
            </div>
            <div className="asl-ad-tournament-image-container">
              {bannerLoading ? (
                <div className="text-center py-4" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div>
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">로딩중...</span>
                    </div>
                    <p className="text-muted small">배너를 불러오는 중...</p>
                  </div>
                </div>
              ) : bannerError ? (
                <div className="text-center py-4" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div>
                    <div className="text-danger mb-2" style={{ fontSize: '2rem' }}>⚠️</div>
                    <p className="text-muted small">{bannerError}</p>
                    <button 
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={() => {
                        // 다시 시도 시 API 호출 플래그 리셋
                        isApiCalledRef.current = false;
                        fetchMainTournamentBanner();
                      }}
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              ) : mainTournamentBanner ? (
                <div>
                  <img 
                    src={mainTournamentBanner.image} 
                    alt={mainTournamentBanner.title || "메인 토너먼트 배너"} 
                    className="asl-ad-tournament-image"
                    onError={(e) => {
                      e.target.src = tournamentImage; // 이미지 로드 실패 시 기본 이미지 사용
                    }}
                  />
                  {mainTournamentBanner.title && (
                    <div className="text-center mt-2">
                      <h6 style={{ color: '#333', fontWeight: '600', margin: '8px 0 4px 0' }}>
                        {mainTournamentBanner.title}
                      </h6>
                      {mainTournamentBanner.description && (
                        <p className="text-muted small" style={{ margin: '0', fontSize: '0.8rem' }}>
                          {mainTournamentBanner.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <img 
                    src={tournamentImage} 
                    alt="기본 토너먼트 이미지" 
                    className="asl-ad-tournament-image"
                  />
                  <div className="text-center mt-2">
                    <p className="text-muted small">현재 설정된 메인 토너먼트 배너가 없습니다.</p>
                  </div>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* 매장 리스트 카드 */}
        <Card className="asl-mobile-card mb-3">
          <Card.Body>
            <div className="text-center mb-3">
              <h5 style={{ color: '#333', fontWeight: '600' }}>인기 스토어</h5>
              
            </div>
            <div className="asl-ad-stores-gallery">
              {getCurrentStores().map((store, index) => (
                <div 
                  key={`${currentSlide}-${index}`}
                  className="asl-ad-store-item asl-ad-store-slide-in"
                  onClick={() => handleStoreClick(store)}
                >
                  <div className="asl-ad-store-image-wrapper">
                    <img 
                      src={store.image} 
                      alt={store.name}
                      className="asl-ad-store-image"
                    />
                    <div className="asl-ad-store-overlay">
                      <span className="asl-ad-store-name">{store.name}</span>
                      <p className="asl-ad-store-description">{store.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지 인디케이터 */}
            <div className="asl-ad-stores-indicators">
              {Array.from({ length: stores.length - 3 }, (_, index) => (
                <div 
                  key={index}
                  className={`asl-ad-indicator ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* 협력사 배너 카드 */}
        <Card className="asl-mobile-card mb-4">
          <Card.Body>
            <div className="text-center mb-3">
              <h5 style={{ color: '#333', fontWeight: '600' }}>협력사</h5>
              <p className="text-muted small">신뢰할 수 있는 파트너들과 함께합니다</p>
            </div>
            <div className="asl-ad-partners-gallery">
              {partnerLogos.map((logo, index) => (
                <div key={index} className="asl-ad-partner-item">
                  <div className="asl-ad-partner-logo-wrapper">
                    <img 
                      src={logo} 
                      alt={`협력사 로고 ${index + 1}`}
                      className="asl-ad-partner-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Footer - 사업자 정보 */}
      <footer className="asl-mobile-footer">
        <div className="footer-content">
          <div className="company-name">
            <strong>㈜아시안 스포츠 리그</strong>
          </div>
          
          <div className="business-info">
            <p><small>대표자: 강기성 | 사업자등록번호: 533-87-03532</small></p>
            <p><small>주소: 서울특별시 송파구 중대로 207, 2층 201-제이480호(가락동, 대명빌딩)</small></p>
            <p><small>업태: 서비스업 | 종목: 전자, 컴퓨터 소프트웨어 개발 및 대여업</small></p>     
          </div>
          
          <div className="copyright">
            <small>© 2025 Asian Sports League. All rights reserved.</small>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AslAd; 