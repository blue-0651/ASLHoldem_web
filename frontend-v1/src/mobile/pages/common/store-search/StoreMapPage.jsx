import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../../../components/MobileHeader';
import { storeAPI, bannerAPI } from '../../../../utils/api';

const StoreMapPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  // 매장 목록 불러오기 (개선된 API 사용)
  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏪 매장 목록 조회 시작');
      const response = await storeAPI.getAllStores();
      
      // API 응답 구조 확인
      const storeData = response.data?.results || response.data || [];
      console.log('📊 매장 API 응답:', { 
        total: storeData.length, 
        sample: storeData[0] 
      });
      
      // 위도/경도가 있는 매장만 필터링 (더 엄격한 필터링)
      const validStores = storeData.filter(store => {
        const lat = parseFloat(store.latitude);
        const lng = parseFloat(store.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      
      console.log(`✅ 전체 매장: ${storeData.length}개, GPS 정보가 있는 매장: ${validStores.length}개`);
      
      setStores(validStores);
      return validStores;
      
    } catch (err) {
      console.error('❌ 매장 데이터 로드 오류:', err);
      
      // 에러 타입에 따른 메시지 설정
      let errorMessage = '매장 정보를 불러오는 데 실패했습니다.';
      
      if (err.response?.status === 404) {
        errorMessage = '매장 API를 찾을 수 없습니다. 관리자에게 문의하세요.';
      } else if (err.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 갤러리 이미지 불러오기 (개선된 API 사용)
  const fetchGalleryImages = async () => {
    try {
      console.log('🖼️ 갤러리 이미지 조회 시작');
      
      const response = await bannerAPI.getStoreGalleryBanners();
      const galleryData = response.data?.banners || [];
      
      console.log('🎨 갤러리 API 응답:', { 
        total: galleryData.length, 
        sample: galleryData[0] 
      });
      
      setGalleryImages(galleryData);
      return galleryData;
      
    } catch (err) {
      console.warn('⚠️ 갤러리 이미지 로딩 실패:', err);
      // 갤러리 이미지 로딩 실패는 전체 기능에 영향을 주지 않음
      setGalleryImages([]);
      return [];
    }
  };

  // 매장 상세 정보 조회 (개선된 API 사용)
  const fetchStoreDetail = async (storeId) => {
    try {
      console.log(`🏪 매장 상세 정보 조회 시작 (ID: ${storeId})`);
      
      const response = await storeAPI.getStoreById(storeId);
      const storeDetail = response.data;
      
      console.log('📊 매장 상세 API 응답:', storeDetail);
      
      return storeDetail;
      
    } catch (err) {
      console.error('❌ 매장 상세 정보 로드 오류:', err);
      
      // 에러 타입에 따른 메시지 설정
      let errorMessage = '매장 정보를 불러오는데 실패했습니다.';
      
      if (err.response?.status === 404) {
        errorMessage = '해당 매장을 찾을 수 없습니다.';
      } else if (err.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      throw new Error(errorMessage);
    }
  };

  // 사용자 현재 위치 가져오기
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('지리적 위치 서비스가 지원되지 않습니다.');
        // 기본 위치 (서울역)
        const defaultLocation = { lat: 37.5549, lng: 126.9706 };
        setUserLocation(defaultLocation);
        resolve(defaultLocation);
        return;
      }

      console.log('📍 위치 정보를 가져오는 중...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('✅ 실제 위치 정보 획득:', location);
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.warn('⚠️ 위치 정보를 가져올 수 없습니다:', error.message);
          // 기본 위치 (서울역) - 위치 권한이 거부되어도 마커 표시
          const defaultLocation = { lat: 37.5549, lng: 126.9706 };
          console.log('🏠 기본 위치 사용:', defaultLocation);
          setUserLocation(defaultLocation);
          resolve(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // 카카오 지도 초기화
  const initializeMap = async () => {
    if (!window.kakao || !window.kakao.maps) {
      setError('카카오 지도 API를 불러오지 못했습니다. 개발자 콘솔에서 지도 서비스를 활성화해주세요.');
      // 지도 없이도 매장 데이터는 로드
      await getUserLocation();
      await fetchStores();
      await fetchGalleryImages();
      return;
    }

    try {
      console.log('🗺️ 카카오 지도 초기화 시작');
      
      const userLoc = await getUserLocation();
      const storeData = await fetchStores();
      const galleryData = await fetchGalleryImages();

      console.log('📈 초기화 완료:', {
        userLocation: userLoc,
        storeCount: storeData.length,
        galleryCount: galleryData.length
      });

      if (storeData.length === 0) {
        setError('GPS 정보가 등록된 매장이 없습니다. 매장 관리자가 위치 정보를 등록하면 지도에 표시됩니다.');
        return;
      }

      // 지도 중심 좌표 설정 (사용자 위치 우선)
      let centerLat = userLoc.lat;
      let centerLng = userLoc.lng;

      const mapContainer = mapRef.current;
      const mapOption = {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level: 8 // 지도 확대 레벨
      };

      // 지도 생성
      const map = new window.kakao.maps.Map(mapContainer, mapOption);
      kakaoMapRef.current = map;

      // 사용자 위치 마커 추가 (항상 표시)
      console.log('👤 사용자 위치 마커 생성 시작:', userLoc);
      
      // 더 간단하고 안정적인 마커 이미지 사용
      const userMarkerImage = new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
        new window.kakao.maps.Size(40, 42),
        { offset: new window.kakao.maps.Point(20, 42) }
      );

      const userMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(userLoc.lat, userLoc.lng),
        image: userMarkerImage,
        map: map,
        title: '내 위치',
        clickable: true,
        zIndex: 10 // 다른 마커보다 위에 표시
      });

      console.log('✅ 사용자 위치 마커 생성 완료:', userMarker);

      // 사용자 위치 정보 창 (더 간단하게 구성)
      const userInfoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:12px;text-align:center;min-width:150px;font-family:Arial,sans-serif;">
            <div style="margin-bottom:8px;">
              <i class="fas fa-location-arrow" style="color:#007bff;font-size:16px;"></i>
            </div>
            <h6 style="margin:0 0 6px 0;color:#007bff;font-size:14px;font-weight:600;">
              내 위치
            </h6>
            <p style="margin:0;font-size:11px;color:#666;line-height:1.3;">
              위도: ${userLoc.lat.toFixed(4)}<br/>
              경도: ${userLoc.lng.toFixed(4)}
            </p>
            <div style="margin-top:8px;font-size:10px;color:#999;">
              ${userLoc.lat === 37.5549 && userLoc.lng === 126.9706 ? '(기본 위치)' : '(실제 위치)'}
            </div>
          </div>
        `,
        removable: true
      });

      // 마커 클릭 시 정보창 표시
      window.kakao.maps.event.addListener(userMarker, 'click', () => {
        console.log('👤 사용자 위치 마커 클릭됨');
        userInfoWindow.open(map, userMarker);
      });

      // 마우스 오버 시 정보창 표시
      window.kakao.maps.event.addListener(userMarker, 'mouseover', () => {
        userInfoWindow.open(map, userMarker);
      });

      window.kakao.maps.event.addListener(userMarker, 'mouseout', () => {
        userInfoWindow.close();
      });

      // 마커 참조 저장 (나중에 위치 이동 시 사용)
      markersRef.current.push({
        marker: userMarker,
        infoWindow: userInfoWindow,
        type: 'user'
      });

      // 매장 마커 추가
      addStoreMarkers(map, storeData);

    } catch (error) {
      console.error('❌ 지도 초기화 오류:', error);
      setError('지도를 초기화하는 데 실패했습니다.');
    }
  };

  // 매장 상세 정보 모달 표시
  const handleStoreDetail = async (storeId) => {
    try {
      console.log(`🔍 매장 상세 정보 조회 (ID: ${storeId})`);
      setLoading(true);
      
      const storeDetail = await fetchStoreDetail(storeId);
      setSelectedStore(storeDetail);
      setShowStoreModal(true);
      
      console.log('✅ 매장 상세 정보 모달 표시 완료');
      
    } catch (error) {
      console.error('❌ 매장 상세 정보 조회 실패:', error);
      setError(error.message || '매장 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 특정 매장으로 지도 이동
  const flyToStore = (store) => {
    if (!kakaoMapRef.current) return;
    
    try {
      const lat = parseFloat(store.latitude);
      const lng = parseFloat(store.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('⚠️ 매장 GPS 정보 오류:', store);
        return;
      }
      
      console.log(`🎯 매장으로 지도 이동: ${store.name} (${lat}, ${lng})`);
      
      const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
      kakaoMapRef.current.setCenter(moveLatLng);
      kakaoMapRef.current.setLevel(3); // 확대
      
    } catch (error) {
      console.error('❌ 지도 이동 실패:', error);
    }
  };

  // 매장 마커 추가
  const addStoreMarkers = (map, storeData) => {
    // 기존 매장 마커만 제거 (사용자 위치 마커는 유지)
    const storeMarkers = markersRef.current.filter(item => item.type !== 'user');
    storeMarkers.forEach(item => {
      if (item.marker) {
        item.marker.setMap(null);
      }
    });
    
    // 사용자 위치 마커만 남기고 매장 마커 제거
    markersRef.current = markersRef.current.filter(item => item.type === 'user');

    console.log(`🏪 매장 마커 ${storeData.length}개 추가 시작`);

    storeData.forEach((store) => {
      const lat = parseFloat(store.latitude);
      const lng = parseFloat(store.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ 매장 ${store.name}의 GPS 정보 오류: lat=${lat}, lng=${lng}`);
        return;
      }

      // 매장 상태에 따른 테두리 색상
      const borderColor = store.status === 'ACTIVE' ? '#28a745' : '#dc3545';
      
      // 매장 마커 이미지 (파란색)
      const storeMarkerImage = new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png',
        new window.kakao.maps.Size(35, 39),
        { offset: new window.kakao.maps.Point(17, 39) }
      );

      // 매장 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        image: storeMarkerImage,
        map: map,
        title: store.name,
        clickable: true,
        zIndex: 5
      });

      // 매장 정보창 내용
      const infoWindowContent = `
        <div style="padding:15px;min-width:200px;font-family:Arial,sans-serif;">
          <div style="display:flex;align-items:center;margin-bottom:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${borderColor};margin-right:8px;"></div>
            <h6 style="margin:0;color:#333;font-size:14px;font-weight:600;">
              ${store.name}
            </h6>
          </div>
          
          <p style="margin:4px 0;font-size:12px;color:#666;line-height:1.4;">
            📍 ${store.address || '주소 정보 없음'}
          </p>
          
          ${store.description ? `
            <p style="margin:4px 0;font-size:11px;color:#999;line-height:1.3;">
              ${store.description}
            </p>
          ` : ''}
          
          ${store.phone_number ? `
            <p style="margin:4px 0;font-size:11px;color:#007bff;">
              📞 ${store.phone_number}
            </p>
          ` : ''}
          
          <div style="margin-top:10px;text-align:center;">
            <button 
              onclick="window.handleStoreDetailClick(${store.id})"
              style="
                background:#007bff;
                color:white;
                border:none;
                padding:6px 12px;
                border-radius:4px;
                font-size:11px;
                cursor:pointer;
                transition:background 0.2s;
              "
              onmouseover="this.style.background='#0056b3'"
              onmouseout="this.style.background='#007bff'"
            >
              상세 정보 보기
            </button>
          </div>
        </div>
      `;

      // 정보창 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoWindowContent,
        removable: true
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        console.log(`🏪 매장 마커 클릭: ${store.name}`);
        
        // 다른 정보창 모두 닫기
        markersRef.current.forEach(item => {
          if (item.infoWindow && item.type === 'store') {
            item.infoWindow.close();
          }
        });
        
        // 현재 정보창 열기
        infoWindow.open(map, marker);
        
        // 지도 중심을 클릭한 매장으로 이동
        flyToStore(store);
      });

      // 마커 참조 저장
      markersRef.current.push({
        marker,
        infoWindow,
        type: 'store',
        storeId: store.id
      });
    });

    console.log(`✅ 매장 마커 추가 완료: ${storeData.length}개`);
    
    // 전역 함수로 등록 (정보창에서 사용)
    window.handleStoreDetailClick = handleStoreDetail;
  };

  // 컴포넌트 초기화
  useEffect(() => {
    console.log('🚀 StoreMapPage 컴포넌트 마운트됨');
    
    // 초기화 함수
    const initializeComponent = async () => {
      try {
        console.log('📋 컴포넌트 초기화 시작');
        
        // 1. 사용자 위치 정보 먼저 가져오기
        console.log('1️⃣ 사용자 위치 정보 가져오기 시작');
        const userLoc = await getUserLocation();
        console.log('✅ 사용자 위치 정보 가져오기 완료:', userLoc);
        
        // 2. 병렬로 매장 데이터와 갤러리 이미지 가져오기
        console.log('2️⃣ 매장 데이터 및 갤러리 이미지 가져오기 시작');
        const [storeData, galleryData] = await Promise.allSettled([
          fetchStores(),
          fetchGalleryImages()
        ]);
        
        console.log('✅ 데이터 로딩 완료:', {
          stores: storeData.status === 'fulfilled' ? storeData.value?.length : 0,
          gallery: galleryData.status === 'fulfilled' ? galleryData.value?.length : 0
        });
        
        // 3. 지도 초기화 (약간의 지연 후)
        setTimeout(() => {
          console.log('3️⃣ 지도 초기화 시작');
          initializeMap();
        }, 500);
        
      } catch (error) {
        console.error('❌ 컴포넌트 초기화 중 오류 발생:', error);
        setError('페이지를 불러오는 중 오류가 발생했습니다.');
      }
    };

    // 초기화 실행
    initializeComponent();

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('🧹 StoreMapPage 컴포넌트 언마운트');
      
      // 카카오 지도 이벤트 정리
      if (kakaoMapRef.current) {
        // 모든 마커 제거
        markersRef.current.forEach(item => {
          if (item.marker) {
            item.marker.setMap(null);
          }
        });
        markersRef.current = [];
      }
    };
  }, []);

  return (
    <div className="store-map-page">
      <MobileHeader title="매장 지도" />
      
      <Container fluid className="py-3">
        {/* 지도 서비스 정상 작동 시 */}
        {!error ? (
          <>
            {/* 지도 및 컨트롤 영역 */}
            <Row className="h-100">
              <Col xs={12} className="h-100 position-relative">
                {/* 지도 컨테이너 */}
                <div
                  ref={mapRef}
                  style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                />
                
                {/* 지도 컨트롤 버튼들 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    zIndex: 100
                  }}
                >
                  {/* 내 위치 버튼 */}
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={async () => {
                      if (error) {
                        // 지도 API 실패 시 브라우저의 기본 지도 앱으로 현재 위치 표시
                        try {
                          const position = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                              enableHighAccuracy: true,
                              timeout: 10000,
                              maximumAge: 300000
                            });
                          });
                          
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          
                          // Google 지도로 현재 위치 표시
                          const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                          window.open(googleMapsUrl, '_blank');
                        } catch (locationError) {
                          alert('위치 정보를 가져올 수 없습니다.');
                        }
                        return;
                      }

                      // 카카오 지도가 정상 작동하는 경우
                      if (kakaoMapRef.current && userLocation) {
                        console.log('📍 내 위치로 이동:', userLocation);
                        
                        const moveLatLng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
                        kakaoMapRef.current.setCenter(moveLatLng);
                        kakaoMapRef.current.setLevel(5);
                        
                        // 사용자 위치 마커의 정보창 표시
                        const userMarkerInfo = markersRef.current.find(item => item.type === 'user');
                        if (userMarkerInfo && userMarkerInfo.infoWindow) {
                          userMarkerInfo.infoWindow.open(kakaoMapRef.current, userMarkerInfo.marker);
                          
                          // 3초 후 자동으로 정보창 닫기
                          setTimeout(() => {
                            userMarkerInfo.infoWindow.close();
                          }, 3000);
                        }
                      } else {
                        console.warn('⚠️ 지도 또는 위치 정보가 없음');
                        alert('위치 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                      }
                    }}
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#007bff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="내 위치로 이동"
                  >
                    📍
                  </Button>
                  
                  {/* 새로고침 버튼 */}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 지도 새로고침');
                      setError(null);
                      initializeMap();
                    }}
                    disabled={loading}
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#6c757d',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="지도 새로고침"
                  >
                    🔄
                  </Button>
                </div>

                {/* 로딩 오버레이 */}
                {loading && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 200
                    }}
                  >
                    <div className="text-center">
                      <Spinner animation="border" role="status" />
                      <div className="mt-2">
                        <small>매장 정보 로딩 중...</small>
                      </div>
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            {/* 매장 통계 정보 */}
            <Row className="mt-3">
              <Col xs={12}>
                <Card className="bg-light">
                  <Card.Body className="py-2">
                    <Row className="text-center">
                      <Col xs={4}>
                        <small className="text-muted">총 매장</small>
                        <div className="fw-bold text-primary">{stores.length}개</div>
                      </Col>
                      <Col xs={4}>
                        <small className="text-muted">갤러리 이미지</small>
                        <div className="fw-bold text-success">{galleryImages.length}개</div>
                      </Col>
                      <Col xs={4}>
                        <small className="text-muted">내 위치</small>
                        <div className="fw-bold text-info">
                          {userLocation ? '✅ 확인됨' : '⏳ 로딩중'}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          /* 에러 상태 */
          <Row>
            <Col xs={12}>
              <Alert variant="danger" className="text-center">
                <h6>⚠️ 지도 서비스 오류</h6>
                <p className="mb-2">{error}</p>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => {
                    setError(null);
                    initializeMap();
                  }}
                >
                  다시 시도
                </Button>
              </Alert>
            </Col>
          </Row>
        )}

        {/* 매장 상세 정보 모달 */}
        <Modal show={showStoreModal} onHide={() => setShowStoreModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-store me-2"></i>
              {selectedStore?.name || '매장 정보'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedStore ? (
              <div>
                {/* 매장 기본 정보 */}
                <Row className="mb-3">
                  <Col xs={12}>
                    <Card>
                      <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: selectedStore.status === 'ACTIVE' ? '#28a745' : '#dc3545',
                              marginRight: '8px'
                            }}
                          />
                          <span className="badge bg-primary me-2">
                            {selectedStore.status === 'ACTIVE' ? '영업중' : '휴업중'}
                          </span>
                          {selectedStore.max_capacity && (
                            <span className="badge bg-info">
                              수용인원: {selectedStore.max_capacity}명
                            </span>
                          )}
                        </div>
                        
                        <h6 className="mb-2">📍 주소</h6>
                        <p className="text-muted mb-3">{selectedStore.address || '주소 정보 없음'}</p>
                        
                        {selectedStore.description && (
                          <>
                            <h6 className="mb-2">📝 설명</h6>
                            <p className="text-muted mb-3">{selectedStore.description}</p>
                          </>
                        )}
                        
                        {/* 연락처 정보 */}
                        <Row>
                          {selectedStore.phone_number && (
                            <Col xs={12} sm={6} className="mb-2">
                              <h6 className="mb-1">📞 대표번호</h6>
                              <p className="text-muted mb-0">{selectedStore.phone_number}</p>
                            </Col>
                          )}
                          
                          {selectedStore.manager_phone && (
                            <Col xs={12} sm={6} className="mb-2">
                              <h6 className="mb-1">👤 관리자</h6>
                              <p className="text-muted mb-0">
                                {selectedStore.manager_name || '관리자'}: {selectedStore.manager_phone}
                              </p>
                            </Col>
                          )}
                        </Row>
                        
                        {/* 운영시간 */}
                        {(selectedStore.open_time || selectedStore.close_time) && (
                          <Row className="mt-2">
                            <Col xs={12}>
                              <h6 className="mb-1">🕐 운영시간</h6>
                              <p className="text-muted mb-0">
                                {selectedStore.open_time || '정보 없음'} ~ {selectedStore.close_time || '정보 없음'}
                              </p>
                            </Col>
                          </Row>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <div className="text-center py-4">
                <Spinner animation="border" role="status" />
                <div className="mt-2">매장 정보를 불러오는 중...</div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStoreModal(false)}>
              닫기
            </Button>
            {selectedStore && (
              <Button 
                variant="primary" 
                onClick={() => {
                  flyToStore(selectedStore);
                  setShowStoreModal(false);
                }}
              >
                지도에서 보기
              </Button>
            )}
            <Button 
              variant="success" 
              onClick={() => {
                if (selectedStore) {
                  navigate(`/mobile/common/store-detail/${selectedStore.id}`);
                }
              }}
            >
              상세 페이지로 이동
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default StoreMapPage; 