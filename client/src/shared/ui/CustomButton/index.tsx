import cl from 'classnames';
import React, { useState } from 'react';

import styles from './index.module.scss';
import { Button, Popconfirm, Popover, message, } from 'antd';
import Link from 'next/link';
import { DeleteOutlined } from '@ant-design/icons';

type Props = {
  popover?: string | undefined;
  type?: 'link' | 'text' | 'default' | 'primary' | 'dashed' | undefined;
  danger?: boolean | undefined;
  onClick?: React.MouseEventHandler<HTMLElement> | undefined;
  icon?: React.ReactNode | false;
  confirm?: {
    title: string;
    description: string;
    onConfirm: () => void;
  };
};

const CustomButton = (props: Props) => {
  const { popover, type, onClick, icon = false, danger, confirm } = props;
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showPopconfirm = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    setConfirmLoading(true);

    try {
      confirm?.onConfirm();
      setOpen(false);
    } catch (err) {
      message.error('Ошибка при подтверждении действия');
      console.error('Ошибка при подтверждении действия', err);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (confirm) {
    return (
      <Popconfirm
        title={confirm.title}
        description={confirm.description}
        onConfirm={handleOk}
        onCancel={handleCancel}
        open={open}
        okButtonProps={{ loading: confirmLoading }}
        okText="Да"
        cancelText="Отмена"
      >
        {popover ? (
          <Popover content={popover}>
            <Button
              type={type}
              onClick={showPopconfirm}
              icon={icon}
              danger={danger}
            />
          </Popover>
        ) : (
          <Button
            type={type}
            onClick={showPopconfirm}
            icon={icon}
            danger={danger}
          />
        )}
      </Popconfirm>
    );
  }

  return popover ? (
    <Popover content={popover}>
      <Button type={type} onClick={onClick} icon={icon} danger={danger} />
    </Popover>
  ) : (
    <Button type={type} onClick={onClick} icon={icon} danger={danger} />
  );
};

export default CustomButton;
