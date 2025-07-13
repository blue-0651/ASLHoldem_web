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

  // 인기 스토어 갤러리 상태 관리
  const [storesList, setStoresList] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState(null);
  const isStoreApiCalledRef = useRef(false);

  // 기본 매장 데이터 (API 호출 실패 시 대비용)
  const defaultStores = [
    { 
      id: 'gallery-1', // 임시 ID 추가
      name: '골프클럽 라운지', 
      image: galleryImg1,
      description: '프리미엄 골프 클럽하우스에서 즐기는 홀덤'
    },
    { 
      id: 'gallery-2', // 임시 ID 추가
      name: '낚시터 펍', 
      image: galleryImg2,
      description: '강가 낚시터에서 여유롭게 즐기는 카드게임'
    },
    { 
      id: 'gallery-3', // 임시 ID 추가
      name: '전통 장기원', 
      image: galleryImg3,
      description: '전통 한옥에서 장기와 함께하는 홀덤'
    },
    { 
      id: 'gallery-4', // 임시 ID 추가
      name: '홀덤펍 메인', 
      image: gangnamStore,
      description: '도심 속 프리미엄 홀덤 전문 펍'
    },
    { 
      id: 'gallery-5', // 임시 ID 추가
      name: '리버사이드 골프', 
      image: hongdaeStore,
      description: '강변 골프클럽의 특별한 홀덤 라운지'
    },
    { 
      id: 'gallery-6', // 임시 ID 추가
      name: '바다낚시 카페', 
      image: gundaeStore,
      description: '바다가 보이는 낚시카페의 홀덤방'
    },
    { 
      id: 'gallery-7', // 임시 ID 추가
      name: '궁중 장기원', 
      image: apgujeongStore,
      description: '궁중 분위기의 고급 장기원 홀덤실'
    },
    { 
      id: 'gallery-8', // 임시 ID 추가
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

  // 인기 스토어 갤러리 배너 불러오기
  const fetchStoreGalleryBanners = async () => {
    // 이미 API 호출 중인 경우 중복 호출 방지 (완료 여부는 제외)
    if (isStoreApiCalledRef.current) {
      console.log('🔄 중복 API 호출 방지: 스토어 갤러리 이미 처리 중');
      return;
    }

    try {
      isStoreApiCalledRef.current = true;
      setStoresLoading(true);
      setStoresError(null);
      
      console.log('📤 인기 스토어 갤러리 배너 조회 시작');
      const response = await bannerAPI.getStoreGalleryBanners();
      console.log('🔍 API 응답 데이터:', response.data);
      
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (!isMountedRef.current) {
        console.log('⚠️ 컴포넌트 언마운트됨: 스토어 갤러리 상태 업데이트 취소');
        return;
      }
      
              if (response.data.banners && response.data.banners.length > 0) {
        // 배너 데이터를 매장 형태로 변환
        const transformedStores = response.data.banners.map(banner => {
          return {
            id: banner.store_id || banner.id, // 매장 ID 우선, 없으면 배너 ID
            name: banner.title || banner.store_name || '매장명 없음',
            image: banner.image, // 백엔드에서 완전한 URL을 반환하므로 별도 처리 불필요
            description: banner.description || '매장 설명이 없습니다.',
            store_id: banner.store_id, // 매장 ID 별도 저장
            banner_id: banner.id // 배너 ID 별도 저장
          };
        });
        
        setStoresList(transformedStores);
        console.log('✅ 인기 스토어 갤러리 배너 로드 성공', transformedStores.length, '개');
        console.log('📊 변환된 스토어 데이터:', transformedStores);
      } else {
        // API에서 데이터가 없으면 기본 데이터 사용
        setStoresList(defaultStores);
        console.log('ℹ️ 설정된 갤러리 배너가 없어 기본 데이터 사용');
      }
    } catch (error) {
      console.error('❌ 인기 스토어 갤러리 배너 불러오기 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (!isMountedRef.current) {
        return;
      }
      
      setStoresError('스토어 갤러리를 불러오는데 실패했습니다.');
      // 에러 발생 시 기본 데이터 사용
      setStoresList(defaultStores);
    } finally {
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (isMountedRef.current) {
        setStoresLoading(false);
      }
    }
  };

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

  // 컴포넌트 마운트 시 메인 토너먼트 배너 및 스토어 갤러리 불러오기
  useEffect(() => {
    isMountedRef.current = true;
    
    // API 호출 플래그 초기화 (컴포넌트 마운트 시)
    isApiCalledRef.current = false;
    isStoreApiCalledRef.current = false;
    
    // 컴포넌트 마운트 후 API 호출
    console.log('🚀 AslAd 컴포넌트 마운트됨 - API 호출 시작');
    fetchMainTournamentBanner();
    fetchStoreGalleryBanners();

    // cleanup 함수
    return () => {
      isMountedRef.current = false;
      console.log('🔄 AslAd 컴포넌트 언마운트');
    };
  }, []);

  // 2초마다 자동 슬라이딩 (데이터가 로드된 후에만 실행)
  useEffect(() => {
    if (storesList.length === 0) return; // 데이터가 없으면 슬라이더 실행하지 않음
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        // 4개씩 보여주므로, 총 슬라이드 수는 storesList.length - 3
        const maxSlide = Math.max(0, storesList.length - 4);
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }, 2000); // 2초마다 실행

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [storesList.length]);

  // 현재 슬라이드에 따른 매장 4개 선택
  const getCurrentStores = () => {
    if (storesList.length === 0) return [];
    return storesList.slice(currentSlide, currentSlide + 4);
  };

  const handleLogin = () => {
    navigate('/mobile/login');
  };

  const handleStoreClick = (store) => {
    console.log(`${store.name} 클릭됨`);
    console.log('스토어 데이터:', store);
    
    // 배너에서 온 데이터인지 확인 (store_id 또는 banner_id가 있는 경우)
    if (store.store_id || store.banner_id) {
      // 실제 매장 ID가 있는 경우 매장 상세 페이지로 이동
      if (store.store_id) {
        console.log('실제 매장 상세 페이지로 이동:', store.store_id);
        navigate(`/mobile/common/store-detail/${store.store_id}`);
      } else {
        // 배너 ID만 있는 경우 (매장 연결 없음) 매장 검색 페이지로 이동
        console.log('배너만 있는 스토어 클릭 - 매장 검색 페이지로 이동');
        navigate('/mobile/common/store-search');
      }
    } else if (store.id) {
      // 기본 데이터 처리 (gallery-로 시작하는 임시 ID)
      if (typeof store.id === 'number' || (typeof store.id === 'string' && !store.id.startsWith('gallery-'))) {
        // 실제 매장 ID인 경우 매장 상세 페이지로 이동
        console.log('실제 매장 상세 페이지로 이동:', store.id);
        navigate(`/mobile/common/store-detail/${store.id}`);
      } else {
        // 갤러리 임시 ID인 경우 매장 검색 페이지로 이동
        console.log('갤러리 스토어 클릭 - 매장 검색 페이지로 이동');
        navigate('/mobile/common/store-search');
      }
    } else {
      // 스토어 ID가 없는 경우 매장 검색 페이지로 이동
      console.log('스토어 ID가 없어 매장 검색 페이지로 이동합니다.');
      navigate('/mobile/common/store-search');
    }
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
                <h3 className="mb-2" style={{ color: '#333', fontWeight: '700' }}>ASIAN SPORTS LEAGUE</h3>
                <p className="text-muted mb-3">아시안 스포츠 리그</p>
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
                        setBannerLoading(true);
                        setBannerError(null);
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
              {storesError && (
                <p className="text-warning small">
                  ⚠️ {storesError} (기본 데이터로 표시됩니다)
                </p>
              )}
            </div>
            
            {storesLoading ? (
              <div className="text-center py-4" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">로딩중...</span>
                  </div>
                  <p className="text-muted small">인기 스토어를 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="asl-ad-stores-gallery">
                  {getCurrentStores().map((store, index) => (
                    <div 
                      key={store.id ? `store-${store.id}-${index}` : `${currentSlide}-${index}`}
                      className="asl-ad-store-item asl-ad-store-slide-in"
                      onClick={() => handleStoreClick(store)}
                    >
                      <div className="asl-ad-store-image-wrapper">
                        <img 
                          src={store.image} 
                          alt={store.name}
                          className="asl-ad-store-image"
                          onError={(e) => {
                            // 이미지 로드 실패 시 기본 이미지 사용
                            e.target.src = galleryImg1;
                          }}
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
                {storesList.length > 4 && (
                  <div className="asl-ad-stores-indicators">
                    {Array.from({ length: Math.max(1, storesList.length - 3) }, (_, index) => (
                      <div 
                        key={index}
                        className={`asl-ad-indicator ${currentSlide === index ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                )}

                {/* 다시 시도 버튼 (에러 상태일 때만 표시) */}
                {storesError && (
                  <div className="text-center mt-3">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        // 다시 시도 시 API 호출 플래그 리셋
                        isStoreApiCalledRef.current = false;
                        setStoresLoading(true);
                        setStoresError(null);
                        fetchStoreGalleryBanners();
                      }}
                    >
                      인기 스토어 다시 불러오기
                    </button>
                  </div>
                )}
              </>
            )}
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