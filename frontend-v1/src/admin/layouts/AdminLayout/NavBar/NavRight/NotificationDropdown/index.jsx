import React, { useState } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';

// ==============================|| NOTIFICATION DROPDOWN ||============================== //

const NotificationDropdown = () => {
  const [notifications] = useState([
    {
      id: 1,
      title: '새로운 토너먼트',
      message: '강남점에서 새로운 토너먼트가 시작되었습니다.',
      time: '5분 전',
      type: 'info',
      read: false
    },
    {
      id: 2,
      title: '시스템 업데이트',
      message: '시스템 업데이트가 완료되었습니다.',
      time: '1시간 전',
      type: 'success',
      read: false
    },
    {
      id: 3,
      title: '매장 관리',
      message: '매장 정보 업데이트가 필요합니다.',
      time: '2시간 전',
      type: 'warning',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type) => {
    switch (type) {
      case 'info':
        return '#007bff';
      case 'success':
        return '#28a745';
      case 'warning':
        return '#ffc107';
      case 'danger':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const styles = {
    notificationToggle: {
      position: 'relative',
      padding: '8px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      color: '#495057'
    },
    badge: {
      position: 'absolute',
      top: '2px',
      right: '2px',
      padding: '2px 6px',
      fontSize: '10px',
      minWidth: '18px',
      height: '18px',
      borderRadius: '9px'
    },
    dropdown: {
      minWidth: '320px',
      maxHeight: '400px',
      overflowY: 'auto',
      border: 'none',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      borderRadius: '12px'
    },
    notificationItem: {
      padding: '15px 20px',
      borderBottom: '1px solid #f8f9fa',
      transition: 'background-color 0.2s ease'
    },
    notificationDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginRight: '12px',
      flexShrink: 0
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        id="notification-dropdown"
        className="position-relative"
        style={styles.notificationToggle}
      >
        <i className="feather icon-bell" style={{ fontSize: '20px' }}></i>
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            style={styles.badge}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={styles.dropdown}>
        {/* 헤더 */}
        <div className="px-3 py-3 border-bottom bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">알림</h6>
            {unreadCount > 0 && (
              <Badge bg="primary">{unreadCount}개의 새 알림</Badge>
            )}
          </div>
        </div>

        {/* 알림 목록 */}
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Dropdown.Item
              key={notification.id}
              style={{
                ...styles.notificationItem,
                backgroundColor: notification.read ? 'transparent' : '#f8f9fa'
              }}
              className="border-0 notification-item"
            >
              <div className="d-flex align-items-start">
                <div
                  style={{
                    ...styles.notificationDot,
                    backgroundColor: getTypeColor(notification.type)
                  }}
                ></div>
                <div className="flex-grow-1">
                  <div className="fw-semibold text-dark mb-1" style={{ fontSize: '14px' }}>
                    {notification.title}
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                    {notification.message}
                  </div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    {notification.time}
                  </div>
                </div>
                {!notification.read && (
                  <div
                    className="rounded-circle bg-primary"
                    style={{ width: '8px', height: '8px', marginTop: '6px' }}
                  ></div>
                )}
              </div>
            </Dropdown.Item>
          ))
        ) : (
          <div className="text-center py-4 text-muted">
            <i className="feather icon-bell mb-2" style={{ fontSize: '24px' }}></i>
            <div>새로운 알림이 없습니다.</div>
          </div>
        )}

        {/* 푸터 */}
        {notifications.length > 0 && (
          <div className="text-center border-top py-3">
            <Dropdown.Item className="text-center fw-semibold text-primary">
              모든 알림 보기
            </Dropdown.Item>
          </div>
        )}
      </Dropdown.Menu>

      <style jsx>{`
        .notification-item:hover {
          background-color: #f1f3f4 !important;
        }
      `}</style>
    </Dropdown>
  );
};

export default NotificationDropdown; 