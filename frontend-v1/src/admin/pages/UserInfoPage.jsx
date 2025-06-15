import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import API from '../../utils/api';
import { getToken } from '../../utils/auth';
import ErrorBoundary from '../components/ErrorBoundary';

import DataTable from 'react-data-table-component';

const UserInfoPage = () => {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    roleFilters: {
      USER: false,
      STORE_MANAGER: false,
      ADMIN: false,
      GUEST: false
    }
  });

  // 게스트 사용자 추가 모달 관련 상태
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestForm, setGuestForm] = useState({
    nickname: '',
    memo: '',
    expires_days: 30
  });
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState(null);
  const [guestSuccess, setGuestSuccess] = useState(null);

  // 사용자 수정 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    nickname: '',
    email: '',
    phone: '',
    role: '',
    is_active: true,
    is_verified: false,
    first_name: '',
    last_name: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  // 사용자 삭제 모달 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('사용자 목록 조회 시작...');
      
      const token = getToken();
      
      if (!token) {
        setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await API.get('/accounts/users/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('사용자 목록 응답:', response.data);

      if (response.data) {
        // 첫 번째 사용자 데이터의 구조를 확인하여 전화번호 필드명 파악
        if (response.data.length > 0) {
          console.log('첫 번째 사용자 데이터 구조:', response.data[0]);
          const firstUser = response.data[0];
          console.log('전화번호 필드 확인:', {
            phone_number: firstUser.phone_number,
            phone: firstUser.phone,
            mobile: firstUser.mobile
          });
        }

        // 역할 통계 디버깅
        const roleStats = {};
        response.data.forEach(user => {
          const role = user.role || 'undefined';
          roleStats[role] = (roleStats[role] || 0) + 1;
        });
        console.log('👥 사용자 역할 통계:', roleStats);
        
        // 매장 관리자 찾기
        const storeManagers = response.data.filter(user => user.role === 'STORE_MANAGER');
        console.log('🏪 매장 관리자 목록:', storeManagers);
        
        // 다양한 매장 관리자 role 값 확인
        const possibleStoreManagerRoles = response.data.filter(user => 
          user.role && (
            user.role.includes('STORE') || 
            user.role.includes('MANAGER') || 
            user.role.includes('store') || 
            user.role.includes('manager')
          )
        );
        console.log('🔍 매장 관리자 가능성 있는 사용자:', possibleStoreManagerRoles);
        
        setOriginalUsers(response.data);
        setUsers(response.data);
        setError(null);
        console.log(`✅ 사용자 ${response.data.length}명 로드 완료`);
      } else {
        setError('사용자 데이터가 없습니다.');
      }
    } catch (err) {
      console.error('❌ 사용자 목록 로드 오류:', err);
      if (err.response) {
        const errorMessage = err.response.data?.message || 
                           err.response.data?.detail || 
                           err.response.data?.error || 
                           '알 수 없는 오류가 발생했습니다.';
        setError(`서버 오류 (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(`요청 오류: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (중복 호출 방지)
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchUsers();
    }
  }, []);



  // 역할 필터 변경 핸들러
  const handleRoleFilterChange = (role) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        roleFilters: {
          ...prev.roleFilters,
          [role]: !prev.roleFilters[role]
        }
      };
      console.log('🎯 역할 필터 변경:', role, '→', !prev.roleFilters[role]);
      console.log('🎯 새로운 필터 상태:', newFilters.roleFilters);
      return newFilters;
    });
  };







  // 필터 적용 (활성 사용자만 + 역할 필터)
  const applyFilters = () => {
    try {
      // 먼저 활성 사용자만 필터링
      let filteredUsers = originalUsers.filter(user => user.is_active === true);
      console.log('🔍 활성 사용자 필터링:', `${filteredUsers.length}/${originalUsers.length}명`);

      // 역할 필터 적용
      const selectedRoles = Object.keys(filters.roleFilters).filter(role => filters.roleFilters[role]);
      console.log('🔍 역할 필터 디버깅:');
      console.log('- 선택된 역할들:', selectedRoles);
      console.log('- 현재 roleFilters 상태:', filters.roleFilters);
      
      if (selectedRoles.length > 0) { // 선택된 역할이 있는 경우만 필터링
        console.log('📋 역할 필터링 전 사용자 수:', filteredUsers.length);
        filteredUsers = filteredUsers.filter(user => {
          const userRoleInfo = getUserRoleInfo(user);
          const shouldInclude = selectedRoles.includes(userRoleInfo.type);
          console.log(`- ${user.username}: 원본 role="${user.role}", 판별된 type="${userRoleInfo.type}", 포함여부=${shouldInclude}`);
          return shouldInclude;
        });
        console.log('📋 역할 필터링 후 사용자 수:', filteredUsers.length);
      } else {
        console.log('⚠️ 역할 필터링 건너뜀 - 선택된 역할 없음');
      }

      // 기본 정렬 (닉네임 순)
      filteredUsers.sort((a, b) => {
        const nameA = a.nickname || a.username || '';
        const nameB = b.nickname || b.username || '';
        return nameA.localeCompare(nameB);
      });

      return filteredUsers;
    } catch (err) {
      console.error('필터 적용 중 오류:', err);
      return originalUsers.filter(user => user.is_active === true);
    }
  };



  // 새로고침 핸들러 (수동 새로고침 시에는 중복 방지 해제)
  const handleRefresh = () => {
    hasFetchedData.current = false;  // 수동 새로고침이므로 중복 방지 해제
    fetchUsers();
  };

  // 사용자 역할 판별 유틸리티 함수
  const getUserRoleInfo = useCallback((user) => {
    const role = user.role;
    
    // 관리자 확인
    if (role === 'ADMIN' || role === 'admin' || role === 'Admin') {
      return { type: 'ADMIN', display: '관리자', class: 'bg-danger' };
    }
    
    // 매장 관리자 확인 (다양한 형태)
    if (role === 'STORE_OWNER' ||           // 실제 API에서 사용하는 값!
        role === 'STORE_MANAGER' || 
        role === 'store_manager' || 
        role === 'store_owner' ||
        role === 'StoreManager' ||
        role === 'StoreOwner' ||
        role === 'MANAGER' ||
        (role && role.toLowerCase().includes('store') && (role.toLowerCase().includes('manager') || role.toLowerCase().includes('owner')))) {
      return { type: 'STORE_MANAGER', display: '매장관리자', class: 'bg-primary' };
    }
    
    // 게스트 사용자 확인
    if (role === 'GUEST' || role === 'guest' || role === 'Guest') {
      return { type: 'GUEST', display: '게스트', class: 'bg-warning text-dark' };
    }
    
    // 일반 사용자 (기본값)
    if (!role || role === 'USER' || role === 'user' || role === 'User') {
      return { type: 'USER', display: '일반사용자', class: 'bg-success' };
    }
    
    // 알 수 없는 역할
    return { type: role, display: role, class: 'bg-secondary' };
  }, []);

  // 필터 상태 변경을 감지하여 자동으로 필터 적용
  useEffect(() => {
    if (originalUsers.length > 0) {
      const filteredUsers = applyFilters();
      setUsers(filteredUsers);
    }
  }, [filters.roleFilters, originalUsers]);

  // 사용자 테이블 컬럼 정의
  const userColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>닉네임</span>,
      selector: (row) => row.nickname || row.username || '-',
      sortable: true,
      center: true,
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>이메일</span>,
      selector: (row) => row.email,
      sortable: true,
      center: true,
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>전화번호</span>,
      selector: (row) => row.phone_number || row.phone || row.mobile || '-',
      sortable: true,
      center: true,
      cell: (row) => {
        const phone = row.phone_number || row.phone || row.mobile;
        if (!phone) return '-';
        
        // 전화번호 포맷팅 (한국 전화번호 형식)
        const phoneStr = phone.toString().replace(/[^0-9]/g, '');
        if (phoneStr.length === 11 && phoneStr.startsWith('010')) {
          return `${phoneStr.slice(0, 3)}-${phoneStr.slice(3, 7)}-${phoneStr.slice(7)}`;
        } else if (phoneStr.length === 10) {
          return `${phoneStr.slice(0, 3)}-${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
        }
        return phone; // 포맷팅할 수 없으면 원본 반환
      },
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>가입일</span>,
      selector: (row) => row.date_joined,
      sortable: true,
      center: true,
      cell: (row) => new Date(row.date_joined).toLocaleDateString('ko-KR'),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>역할</span>,
      selector: (row) => getUserRoleInfo(row).type,
      sortable: true,
      center: true,
      cell: (row) => {
        const roleInfo = getUserRoleInfo(row);
        return <span className={`badge ${roleInfo.class}`}>{roleInfo.display}</span>;
      },
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },

    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>액션</span>,
      center: true,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleEdit(row)}
          >
            수정
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleDelete(row)}
          >
            삭제
          </Button>
        </div>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    }
  ], [getUserRoleInfo]);

  // 편집 핸들러 - 수정 모달 열기
  const handleEdit = (user) => {
    console.log('사용자 편집:', user);
    setEditingUser(user);
    setEditForm({
      nickname: user.nickname || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      is_active: user.is_active || false,
      is_verified: user.is_verified || false,
      first_name: user.first_name || '',
      last_name: user.last_name || ''
    });
    setEditError(null);
    setEditSuccess(null);
    setShowEditModal(true);
  };

  // 삭제 핸들러 - 삭제 확인 모달 열기
  const handleDelete = (user) => {
    console.log('사용자 삭제:', user);
    setDeletingUser(user);
    setDeleteError(null);
    setDeleteSuccess(null);
    setShowDeleteModal(true);
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      nickname: '',
      email: '',
      phone: '',
      role: '',
      is_active: true,
      is_verified: false,
      first_name: '',
      last_name: ''
    });
    setEditError(null);
    setEditSuccess(null);
    setEditLoading(false);
  };

  // 삭제 모달 닫기
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeleteLoading(false);
  };

  // 수정 폼 입력 핸들러
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // 전화번호 입력 시 자동 포맷팅
    if (name === 'phone' && type !== 'checkbox') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');
      
      // 11자리 숫자가 있으면 자동으로 하이픈 추가
      if (numbers.length <= 11) {
        if (numbers.length <= 3) {
          processedValue = numbers;
        } else if (numbers.length <= 7) {
          processedValue = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
          processedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
              } else {
          // 11자리 초과 시 입력 무시 (기존 값 유지)
          return;
        }
    }
    
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  // 사용자 정보 수정 API 호출
  const handleUpdateUser = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      setEditSuccess(null);

      const token = getToken();
      if (!token) {
        setEditError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      if (!editingUser) {
        setEditError('수정할 사용자 정보가 없습니다.');
        return;
      }

      // 입력값 검증 강화
      if (!editForm.email || !editForm.email.includes('@')) {
        setEditError('유효한 이메일 주소를 입력해주세요.');
        return;
      }

      // 전화번호 필수 검증 (백엔드에서 required=True)
      if (!editForm.phone || editForm.phone.trim() === '') {
        setEditError('전화번호는 필수 입력 항목입니다.');
        return;
      }

      // 전화번호 형식 검증
      const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
      if (!phoneRegex.test(editForm.phone.trim())) {
        setEditError('전화번호는 010-1234-5678 형식으로 입력해주세요.');
        return;
      }

      // 역할(role) 유효성 검증
      const validRoles = ['ADMIN', 'STORE_OWNER', 'USER', 'GUEST'];
      if (!editForm.role || !validRoles.includes(editForm.role)) {
        setEditError('유효한 사용자 역할을 선택해주세요.');
        return;
      }

      // 요청 데이터 준비
      const requestData = {
        user_id: editingUser.id,
        nickname: editForm.nickname ? editForm.nickname.trim() : null,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
        is_verified: editForm.is_verified,
        first_name: editForm.first_name ? editForm.first_name.trim() : '',
        last_name: editForm.last_name ? editForm.last_name.trim() : ''
      };

      console.log('사용자 정보 수정 요청:', requestData);

      const response = await API.post('/accounts/users/update_user/', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('사용자 정보 수정 응답:', response.data);
      console.log('응답 상태 코드:', response.status);
      console.log('success 필드:', response.data.success);

      // 응답 성공 여부 확인 (백엔드 응답 형식에 맞게 수정)
      if (response.data.success === true || (response.status === 200 && response.data.user)) {
        const successMessage = response.data.message || `사용자 "${editForm.nickname || editingUser.username}" 정보가 성공적으로 수정되었습니다.`;
        setEditSuccess(successMessage);
        
        // 사용자 목록 새로고침
        setTimeout(() => {
          handleRefresh();
          handleCloseEditModal();
        }, 2000);
      } else {
        // 오류 메시지 처리
        const errorMessage = response.data.error || 
                           response.data.message || 
                           '사용자 정보 수정에 실패했습니다.';
        setEditError(errorMessage);
      }

    } catch (err) {
      console.error('❌ 사용자 정보 수정 오류:', err);
      
      // 더 자세한 오류 정보 로깅
      if (err.response) {
        console.error('응답 상태:', err.response.status);
        console.error('응답 데이터:', err.response.data);
        console.error('응답 헤더:', err.response.headers);
        
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        
        if (err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.details) {
            // 시리얼라이저 검증 오류 처리
            const validationErrors = [];
            Object.keys(err.response.data.details).forEach(field => {
              const fieldErrors = err.response.data.details[field];
              if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach(error => {
                  validationErrors.push(`${field}: ${error}`);
                });
              } else {
                validationErrors.push(`${field}: ${fieldErrors}`);
              }
            });
            errorMessage = `입력 데이터 오류:\n${validationErrors.join('\n')}`;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
        }
        
        setEditError(`서버 오류 (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        setEditError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setEditError(`요청 오류: ${err.message}`);
      }
    } finally {
      setEditLoading(false);
    }
  };

  // 사용자 삭제 API 호출
  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      setDeleteSuccess(null);

      const token = getToken();
      if (!token) {
        setDeleteError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      if (!deletingUser) {
        setDeleteError('삭제할 사용자 정보가 없습니다.');
        return;
      }

      console.log('사용자 삭제 요청:', { user_id: deletingUser.id });

      const response = await API.post('/accounts/users/delete_user/', {
        user_id: deletingUser.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('사용자 삭제 응답:', response.data);

      // 응답 성공 여부 확인 (백엔드 응답 형식에 맞게 수정)
      if (response.data.success === true || (response.status === 200 && response.data.message)) {
        const successMessage = response.data.message || `사용자 "${deletingUser.nickname || deletingUser.username}"이 성공적으로 삭제(비활성화)되었습니다.`;
        setDeleteSuccess(successMessage);
        
        // 사용자 목록 새로고침
        setTimeout(() => {
          handleRefresh();
          handleCloseDeleteModal();
        }, 2000);
      } else {
        // 오류 메시지 처리
        const errorMessage = response.data.error || 
                           response.data.message || 
                           '사용자 삭제에 실패했습니다.';
        setDeleteError(errorMessage);
      }

    } catch (err) {
      console.error('❌ 사용자 삭제 오류:', err);
      if (err.response) {
        const errorMessage = err.response.data?.error || 
                           err.response.data?.message || 
                           err.response.data?.detail || 
                           '알 수 없는 오류가 발생했습니다.';
        setDeleteError(`서버 오류 (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        setDeleteError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setDeleteError(`요청 오류: ${err.message}`);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // 게스트 사용자 추가 모달 열기
  const handleOpenGuestModal = () => {
    setShowGuestModal(true);
    setGuestError(null);
    setGuestSuccess(null);
    setGuestForm({
      nickname: '',
      memo: '',
      expires_days: 30
    });
  };

  // 게스트 사용자 추가 모달 닫기
  const handleCloseGuestModal = () => {
    setShowGuestModal(false);
    setGuestError(null);
    setGuestSuccess(null);
    setGuestForm({
      nickname: '',
      memo: '',
      expires_days: 30
    });
    setGuestLoading(false);
  };

  // 게스트 폼 입력 핸들러
  const handleGuestFormChange = (e) => {
    const { name, value } = e.target;
    setGuestForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 게스트 사용자 생성 API 호출
  const handleCreateGuestUser = async () => {
    try {
      setGuestLoading(true);
      setGuestError(null);
      setGuestSuccess(null);

      const token = getToken();
      if (!token) {
        setGuestError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 입력값 검증
      if (guestForm.expires_days < 1 || guestForm.expires_days > 365) {
        setGuestError('만료일은 1일 이상 365일 이하로 설정해주세요.');
        return;
      }

      console.log('게스트 사용자 생성 요청:', guestForm);

      const response = await API.post('/accounts/users/create_guest_user/', {
        nickname: guestForm.nickname.trim(),
        memo: guestForm.memo.trim(),
        expires_days: parseInt(guestForm.expires_days)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('게스트 사용자 생성 응답:', response.data);

      if (response.data.success) {
        setGuestSuccess(`게스트 사용자 "${response.data.guest_user.nickname}"이 성공적으로 생성되었습니다.`);
        
        // 사용자 목록 새로고침 (새로 생성된 게스트 사용자 포함)
        setTimeout(() => {
          handleRefresh();
          handleCloseGuestModal();
        }, 2000);
      } else {
        setGuestError(response.data.error || '게스트 사용자 생성에 실패했습니다.');
      }

    } catch (err) {
      console.error('❌ 게스트 사용자 생성 오류:', err);
      if (err.response) {
        const errorMessage = err.response.data?.error || 
                           err.response.data?.message || 
                           err.response.data?.detail || 
                           '알 수 없는 오류가 발생했습니다.';
        setGuestError(`서버 오류 (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        setGuestError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setGuestError(`요청 오류: ${err.message}`);
      }
    } finally {
      setGuestLoading(false);
    }
  };

  // DataTable 커스텀 스타일
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        minHeight: '60px'
      }
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        backgroundColor: '#ffffff',
      }
    }
  };

  return (
    <ErrorBoundary>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>사용자 관리</h2>
            <p className="text-muted mb-0">시스템에 등록된 사용자 정보를 조회하고 관리할 수 있습니다.</p>
          </div>
          <div>
            <Button 
              variant="success" 
              onClick={handleOpenGuestModal}
              className="me-2"
            >
              <i className="fas fa-user-plus me-2"></i>
              게스트 사용자 추가
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  새로고침 중...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt me-2"></i>
                  새로고침
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 사용자 통계 카드 */}
        {!loading && users.length > 0 && (() => {
          // 실시간 통계 계산 및 디버깅 (활성 사용자만)
          const activeUsers = originalUsers.filter(user => user.is_active === true);
          const totalUsers = activeUsers.length; // 활성 사용자만 집계
          const regularUsers = activeUsers.filter(user => getUserRoleInfo(user).type === 'USER');
          const storeManagers = activeUsers.filter(user => getUserRoleInfo(user).type === 'STORE_MANAGER');
          const admins = activeUsers.filter(user => getUserRoleInfo(user).type === 'ADMIN');
          const guestUsers = activeUsers.filter(user => getUserRoleInfo(user).type === 'GUEST');
          
          // 매장 관리자 디버깅
          console.log('🔧 실시간 통계 디버깅:');
          console.log('- 총 사용자 수:', totalUsers);
          console.log('- 일반 사용자:', regularUsers.length, regularUsers.map(u => ({username: u.username, role: u.role})));
          console.log('- 매장 관리자:', storeManagers.length, storeManagers.map(u => ({username: u.username, role: u.role})));
          console.log('- 시스템 관리자:', admins.length, admins.map(u => ({username: u.username, role: u.role})));
          console.log('- 게스트 사용자:', guestUsers.length, guestUsers.map(u => ({username: u.username, role: u.role})));
          
          // 모든 사용자의 역할 정보 상세 출력
          originalUsers.forEach(user => {
            const roleInfo = getUserRoleInfo(user);
            if (roleInfo.type === 'STORE_MANAGER') {
              console.log(`✅ 매장 관리자 발견: ${user.username} (원본 role: "${user.role}", 판별 결과: ${roleInfo.type})`);
            }
            if (roleInfo.type === 'GUEST') {
              console.log(`🎭 게스트 사용자 발견: ${user.username} (원본 role: "${user.role}", 판별 결과: ${roleInfo.type})`);
            }
          });
          
          return (
            <Row className="mb-4">
              <Col md={2} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-primary">{totalUsers}</h5>
                    <p className="mb-0">총 사용자 수</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-success">{regularUsers.length}</h5>
                    <p className="mb-0">일반 사용자</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-info">{storeManagers.length}</h5>
                    <p className="mb-0">매장 관리자</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-danger">{admins.length}</h5>
                    <p className="mb-0">시스템 관리자</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-warning">{guestUsers.length}</h5>
                    <p className="mb-0">게스트 사용자</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          );
        })()}



        {/* 에러 메시지 */}
        {error && (
          <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* 사용자 목록 */}
        <Card>
          <Card.Header style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1" style={{ color: '#721c24', fontWeight: 'bold' }}>
                  <i className="fas fa-users me-2"></i>
                  사용자 목록
                </h5>
                                 <small className="text-muted">
                   역할별 필터링을 통해 원하는 사용자를 쉽게 찾을 수 있습니다.
                 </small>
              </div>
            </div>
            
            {/* 사용자 역할 필터 */}
            <div className="role-filter-section">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-filter me-2 text-primary"></i>
                <span className="fw-bold text-dark">사용자 역할 필터</span>
                <small className="text-muted ms-2">원하는 역할을 선택해주세요</small>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <div 
                  className={`filter-chip ${filters.roleFilters.USER ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('USER')}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid #28a745',
                    backgroundColor: filters.roleFilters.USER ? '#28a745' : 'white',
                    color: filters.roleFilters.USER ? 'white' : '#28a745',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                  }}
                >
                  <i className="fas fa-user me-1"></i>
                  일반 사용자
                </div>
                <div 
                  className={`filter-chip ${filters.roleFilters.STORE_MANAGER ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('STORE_MANAGER')}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid #007bff',
                    backgroundColor: filters.roleFilters.STORE_MANAGER ? '#007bff' : 'white',
                    color: filters.roleFilters.STORE_MANAGER ? 'white' : '#007bff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                  }}
                >
                  <i className="fas fa-store me-1"></i>
                  매장 관리자
                </div>
                <div 
                  className={`filter-chip ${filters.roleFilters.ADMIN ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('ADMIN')}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid #dc3545',
                    backgroundColor: filters.roleFilters.ADMIN ? '#dc3545' : 'white',
                    color: filters.roleFilters.ADMIN ? 'white' : '#dc3545',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                  }}
                >
                  <i className="fas fa-crown me-1"></i>
                  시스템 관리자
                </div>
                <div 
                  className={`filter-chip ${filters.roleFilters.GUEST ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('GUEST')}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid #ffc107',
                    backgroundColor: filters.roleFilters.GUEST ? '#ffc107' : 'white',
                    color: filters.roleFilters.GUEST ? 'white' : '#ffc107',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                  }}
                >
                  <i className="fas fa-user-clock me-1"></i>
                  게스트 사용자
                </div>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">사용자 목록을 불러오는 중입니다...</p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users}
                customStyles={customStyles}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                noDataComponent={
                  <div className="text-center p-5">
                    <div className="mb-3">
                      <i className="fas fa-users fa-3x text-muted"></i>
                    </div>
                    <h5 className="text-muted">
                      선택된 조건에 맞는 사용자가 없습니다.
                    </h5>
                    <p className="text-muted mb-0">
                      다른 역할 필터를 선택해보세요.
                    </p>
                  </div>
                }
                highlightOnHover
                striped
                responsive
              />
            )}
          </Card.Body>
        </Card>

        {/* 게스트 사용자 추가 모달 */}
        <Modal show={showGuestModal} onHide={handleCloseGuestModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-user-plus me-2 text-success"></i>
              게스트 사용자 추가
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {guestError && (
              <Alert variant="danger" className="mb-3">
                {guestError}
              </Alert>
            )}
            {guestSuccess && (
              <Alert variant="success" className="mb-3">
                {guestSuccess}
              </Alert>
            )}
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>닉네임</Form.Label>
                <Form.Control
                  type="text"
                  name="nickname"
                  value={guestForm.nickname}
                  onChange={handleGuestFormChange}
                  placeholder="비워두면 자동으로 생성됩니다 (예: 게스트_A12B3)"
                  disabled={guestLoading}
                />
                <Form.Text className="text-muted">
                  닉네임을 입력하지 않으면 시스템에서 자동으로 생성합니다.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>메모</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="memo"
                  value={guestForm.memo}
                  onChange={handleGuestFormChange}
                  placeholder="게스트 사용자에 대한 간단한 메모를 입력하세요 (선택사항)"
                  disabled={guestLoading}
                />
                <Form.Text className="text-muted">
                  용도나 특이사항 등을 메모해두실 수 있습니다.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>만료일 (일)</Form.Label>
                <Form.Control
                  type="number"
                  name="expires_days"
                  value={guestForm.expires_days}
                  onChange={handleGuestFormChange}
                  min="1"
                  max="365"
                  disabled={guestLoading}
                />
                <Form.Text className="text-muted">
                  게스트 계정의 유효 기간을 설정합니다 (1~365일). 현재는 참고용으로만 사용됩니다.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseGuestModal}
              disabled={guestLoading}
            >
              취소
            </Button>
            <Button 
              variant="success" 
              onClick={handleCreateGuestUser}
              disabled={guestLoading}
            >
              {guestLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <i className="fas fa-plus me-2"></i>
                  게스트 생성
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 사용자 수정 모달 */}
        <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-user-edit me-2 text-primary"></i>
              사용자 정보 수정
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editError && (
              <Alert variant="danger" className="mb-3">
                {editError}
              </Alert>
            )}
            {editSuccess && (
              <Alert variant="success" className="mb-3">
                {editSuccess}
              </Alert>
            )}
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>닉네임</Form.Label>
                <Form.Control
                  type="text"
                  name="nickname"
                  value={editForm.nickname}
                  onChange={handleEditFormChange}
                  placeholder="닉네임을 입력하세요"
                  disabled={editLoading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>이메일 <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  placeholder="이메일을 입력하세요"
                  disabled={editLoading}
                  required
                />
                <Form.Text className="text-muted">
                  유효한 이메일 주소를 입력하세요
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>전화번호 <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditFormChange}
                  placeholder="010-1234-5678"
                  disabled={editLoading}
                  required
                />
                <Form.Text className="text-muted">
                  010-1234-5678 형식으로 입력하세요
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>역할 <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditFormChange}
                  disabled={editLoading}
                  required
                >
                  <option value="">역할을 선택하세요</option>
                  <option value="ADMIN">관리자</option>
                  <option value="STORE_OWNER">매장관리자</option>
                  <option value="USER">일반사용자</option>
                  <option value="GUEST">게스트</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  사용자의 시스템 역할을 선택하세요
                </Form.Text>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="is_active"
                      label="계정 활성화"
                      checked={editForm.is_active}
                      onChange={handleEditFormChange}
                      disabled={editLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="is_verified"
                      label="계정 인증"
                      checked={editForm.is_verified}
                      onChange={handleEditFormChange}
                      disabled={editLoading}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleEditFormChange}
                      placeholder="이름을 입력하세요"
                      disabled={editLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>성</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleEditFormChange}
                      placeholder="성을 입력하세요"
                      disabled={editLoading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseEditModal}
              disabled={editLoading}
            >
              취소
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateUser}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  수정 중...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  수정
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 사용자 삭제 모달 */}
        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-trash-alt me-2 text-danger"></i>
              사용자 삭제 확인
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteError && (
              <Alert variant="danger" className="mb-3">
                {deleteError}
              </Alert>
            )}
            {deleteSuccess && (
              <Alert variant="success" className="mb-3">
                {deleteSuccess}
              </Alert>
            )}
            
            <div className="text-center">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h5>정말로 삭제하시겠습니까?</h5>
              <p className="mb-0">
                사용자 <strong>"{deletingUser?.nickname || deletingUser?.username}"</strong>을(를) 삭제하면
                <br />
                <span className="text-danger">계정이 비활성화되어 로그인할 수 없게 됩니다.</span>
              </p>
              <p className="text-muted mt-2">
                <small>이 작업은 되돌릴 수 있습니다.</small>
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseDeleteModal}
              disabled={deleteLoading}
            >
              취소
            </Button>
            <Button 
              variant="danger" 
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  삭제 중...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt me-2"></i>
                  삭제
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default UserInfoPage;
