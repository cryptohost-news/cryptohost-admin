import React, { useEffect, useState } from 'react';
import { FormInstance, message, Upload, UploadFile, UploadProps } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import routes, { baseUrl, clientDomain } from '../../../routes';
import ImgCrop from 'antd-img-crop';

const { Dragger } = Upload;

type Props = {
  entityName: string;
  token: string;
  form: FormInstance;
  style: React.CSSProperties;
  imageUrl?: string;
};

const ImageDragger = (props: Props) => {
  const { entityName, token, form, style, imageUrl } = props;

  let defaultFileList: UploadFile[] | null = [];
  if (imageUrl) {
    const imageUrlChunks = imageUrl?.split('/');
    const defaultImageName = imageUrlChunks[imageUrlChunks.length - 1];

    const defaultImage = {
      uid: defaultImageName,
      name: defaultImageName,
      url: `${clientDomain}/${imageUrl}`
    };

    defaultFileList = ([defaultImage]);
  }


  const uploadProps: UploadProps = {
    name: 'image',
    defaultFileList,
    action: routes.upload(entityName),
    listType: 'picture',
    maxCount: 1,
    headers: {
      authorization: `Bearer ${token}`
    },
    onChange(info) {
      if (info.file.status === 'done') {
        form.setFieldsValue({
          image: info.file.response.imageUrl
        });
        message.success('Изображение успешно загружено');
      } else if (info.file.status === 'error') {
        message.error(info.file.response.message);
        console.error(info.file.response.message);
      }
    }
  };

  return (
    <ImgCrop aspect={4 / 3} showReset>
      <Dragger {...uploadProps} style={style}>
        <p className='ant-upload-drag-icon'>
          <PictureOutlined />
        </p>
        <p className='ant-upload-text'>Нажмите или перетащите изображение</p>
        <p className='ant-upload-hint'>
          Можно загрузить только одно изображение. Поддерживаются форматы jpeg и
          png.
        </p>
      </Dragger>
    </ImgCrop>
  );
};

export default ImageDragger;
