import React, { useEffect, useState } from 'react';
import {
  ApartmentOutlined, DesktopOutlined, FileImageOutlined,
  GiftOutlined, PicLeftOutlined,
  PicRightOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {Layout, Menu, MenuProps} from 'antd';
import Link from 'next/link';
import styles from './index.module.scss';
import cl from 'classnames';
import { useRouter } from 'next/router';

import routes, {extUrl} from '../../../routes.js';
import {ItemType} from "rc-collapse/es/interface";

const { Sider } = Layout;

type Props = {
  collapsed: boolean;
  setCollapsed: (state: boolean) => void;
};

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar = (props: Props) => {
  const router = useRouter();
  const { collapsed, setCollapsed } = props;
  const [collapsedMenuWidth, setCollapsedMenuWidth] = useState(200);

  const collapseSidebarOnMobileDevices = () => {
    if (window.innerWidth < 990) {
      setCollapsed(true);
    }
  }

  const items: MenuItem[] = [
    {
      key: '/news',
      icon: <PicRightOutlined />,
      label: <Link href={'/news'}>Новости</Link>,
      onClick: collapseSidebarOnMobileDevices,
    },
    {
      key: '/categories',
      icon: <ApartmentOutlined />,
      label: <Link href={'/categories'}>Категории</Link>,
      onClick: collapseSidebarOnMobileDevices,
    },
    {
      key: '/promo-banners',
      icon: <FileImageOutlined />,
      label: <Link href={'/promo-banners'}>Промо-баннеры</Link>,
      onClick: collapseSidebarOnMobileDevices,
    },
    {
      key: '/activities',
      icon: <GiftOutlined />,
      label: <Link href={'/activities'}>Активности</Link>,
      onClick: collapseSidebarOnMobileDevices,
    },
    { type: 'divider' },
    {
      key: extUrl as string,
      icon: <DesktopOutlined />,
      label: <Link href={extUrl as string} target="_blank">На сайт →</Link>,
      onClick: collapseSidebarOnMobileDevices,
    },
  ];

  useEffect(() => {
    const collapsedState = localStorage.getItem('collapsed');
    if (collapsedState === 'true') {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const updateCollapsedMenuWidth = () => {
      if (window.innerWidth < 990) {
        setCollapsedMenuWidth(0);
        setCollapsed(true);
      } else {
        setCollapsedMenuWidth(80);
      }
    };

    updateCollapsedMenuWidth(); // Вызов функции при первоначальной загрузке

    const handleResize = () => {
      updateCollapsedMenuWidth();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Sider
      theme="light"
      trigger={null}
      collapsed={collapsed}
      width={250}
      breakpoint="md"
      collapsedWidth={collapsedMenuWidth}
      onBreakpoint={(broken) => {
        setCollapsedMenuWidth(0);
      }}
      onCollapse={(isCollapsed, type) => {
        setCollapsed(isCollapsed);
      }}
      style={{
        overflowY: 'auto',
        height: '100dvh',
        borderRight: '1px solid rgba(5, 5, 5, 0.06)',
      }}
      className={styles.sidebar}
    >
      <div
        className={cl(styles.sidebarCategory, {
          [styles.sidebarCategoryHide]: collapsed,
        })}
      >
        Навигация
      </div>
      <Menu
        // theme="dark"
        mode="inline"
        defaultSelectedKeys={[`/${router.pathname.split('/')[1]}`]}
        style={{
          borderRight: 'none',
        }}
        items={items}
      ></Menu>
    </Sider>
  );
};

export default Sidebar;
