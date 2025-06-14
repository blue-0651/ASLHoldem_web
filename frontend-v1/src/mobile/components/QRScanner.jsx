import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';

const QRScanner = ({ show, onHide, onScan, onError }) => {
  const videoRef = useRef(null);
  const [codeReader, setCodeReader] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    if (show) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [show]);

  const initializeScanner = async () => {
    try {
      setError('');
      const reader = new BrowserMultiFormatReader();
      setCodeReader(reader);

      // 사용 가능한 비디오 장치 목록 가져오기
      const videoDevices = await reader.listVideoInputDevices();
      setDevices(videoDevices);

      if (videoDevices.length > 0) {
        // 후면 카메라 우선 선택 (모바일에서)
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        const deviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
        setSelectedDevice(deviceId);
        startScanning(reader, deviceId);
      } else {
        setError('카메라를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('QR 스캐너 초기화 오류:', err);
      setError('카메라 접근 권한이 필요합니다.');
      if (onError) onError(err);
    }
  };

  const startScanning = async (reader, deviceId) => {
    try {
      setIsScanning(true);
      setError('');

      await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, error) => {
        if (result) {
          console.log('QR 코드 스캔 성공:', result.getText());
          if (onScan) {
            onScan(result.getText());
          }
          stopScanning();
        }
        
        if (error && error.name !== 'NotFoundException') {
          console.error('QR 스캔 오류:', error);
        }
      });
    } catch (err) {
      console.error('스캔 시작 오류:', err);
      setError('스캔을 시작할 수 없습니다.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
    }
    setIsScanning(false);
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    if (codeReader && isScanning) {
      stopScanning();
      startScanning(codeReader, deviceId);
    }
  };

  const handleClose = () => {
    stopScanning();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-qrcode me-2"></i>
          QR 코드 스캔
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <Alert variant="danger">
            <Alert.Heading>스캔 오류</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={initializeScanner}>
              다시 시도
            </Button>
          </Alert>
        ) : (
          <>
            <div className="text-center mb-3">
              <p className="text-muted">
                QR 코드를 카메라에 비춰주세요
              </p>
            </div>

            {/* 카메라 선택 */}
            {devices.length > 1 && (
              <div className="mb-3">
                <label className="form-label">카메라 선택:</label>
                <select 
                  className="form-select"
                  value={selectedDevice}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `카메라 ${device.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 비디오 스트림 */}
            <div className="position-relative">
              <video
                ref={videoRef}
                className="w-100"
                style={{
                  maxHeight: '400px',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                autoPlay
                playsInline
                muted
              />
              
              {/* 스캔 가이드 오버레이 */}
              <div 
                className="position-absolute top-50 start-50 translate-middle"
                style={{
                  width: '200px',
                  height: '200px',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  pointerEvents: 'none'
                }}
              />

              {/* 로딩 스피너 */}
              {!isScanning && (
                <div className="position-absolute top-50 start-50 translate-middle text-white">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">카메라 로딩 중...</span>
                  </Spinner>
                  <div className="mt-2">카메라 준비 중...</div>
                </div>
              )}
            </div>

            <div className="text-center mt-3">
              <small className="text-muted">
                QR 코드가 파란색 사각형 안에 들어오도록 맞춰주세요
              </small>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScanner; 