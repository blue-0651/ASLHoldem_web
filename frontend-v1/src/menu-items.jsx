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
        }
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
          icon: 'feather icon-home',
          url: '/tournaments'
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
          icon: 'feather icon-box',
          url: '/stores'
        }
      ]
    },

    {
      id: 'navigation-user',
      title: '사용자',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard-user',
          title: '사용자 관리',
          type: 'item',
          icon: 'feather icon-help-circle',
          url: '/sample-page'
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
          id: 'documentation',
          title: 'Documentation',
          type: 'item',
          icon: 'feather icon-help-circle',
          classes: 'nav-item',
          url: 'https://www.examples.com/',
          target: true,
          external: true
        }
      ]
    }
  ]
};

export default menuItems;
