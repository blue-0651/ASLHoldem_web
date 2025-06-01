const menuItems = {
  items: [
    {
      id: 'navigation-admin',
      title: 'ASL ADMIN 메뉴',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard-admin',
          title: '대시보드',
          type: 'item',
          icon: 'feather icon-home',
          url: '/dashboard'
        },
        {
          id: 'dashboard-board',
          title: '공지사항 관리',
          type: 'item',
          icon: 'feather icon-bell',
          url: '/board'
        },
        {
          id: 'dashboard-logout',
          title: '로그아웃',
          type: 'item',
          icon: 'feather icon-log-out',
          url: '/logout'
        },
      ]
    },
    {
      id: 'navigation-tournament',
      title: '토너먼트',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard-tournament',
          title: '토너먼트 관리',
          type: 'item',
          icon: 'fas fa-trophy',
          url: '/tournaments'
        },
        {
          id: 'dashboard-ticket-issue',
          title: 'SEAT권 전송',
          type: 'item',
          icon: 'feather icon-credit-card',
          url: '/ticket-issue'
        }
      ]
    },
    {
      id: 'navigation-store',
      title: '매장',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard-store',
          title: '매장관리',
          type: 'item',
          icon: 'feather icon-map-pin',
          url: '/stores'
        }
      ]
    },    {
      id: 'navigation-user',
      title: '사용자',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard-user',
          title: '사용자 관리',
          type: 'item',
          icon: 'feather icon-users',
          url: '/users'
        },
        {
          id: 'dashboard-player',
          title: '선수회원등록',
          type: 'item',
          icon: 'feather icon-user-plus',
          url: '/player-registration'
        }
      ]
    },

    {
      id: 'support',
      title: 'Support',
      type: 'group',
      icon: 'icon-support',
      children: [
        {
          id: 'sample-page',
          title: 'Sample Page',
          type: 'item',
          url: '/sample-page',
          classes: 'nav-item',
          icon: 'feather icon-sidebar'
        },
        {
          id: 'dash-analytics',
          title: 'Dash Analytics',
          type: 'item',
          url: '/dash-analytics',
          classes: 'nav-item',
          icon: 'feather icon-bar-chart'
        }
      ]
    }
  ]
};

export default menuItems;
