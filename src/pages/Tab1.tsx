import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonImg } from '@ionic/react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Http } from '@capacitor-community/http';
import './Tab1.css';

const Tab1: React.FC = () => {
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    setPhoto(image.dataUrl);
  };

  const pickImage = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    setPhoto(image.dataUrl);
  };

  const uploadImage = async () => {
    if (!photo) return;

    const base64Data = photo.split(',')[1];

    const fileName = new Date().getTime() + '.jpg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });

    const file = await Filesystem.readFile({
      path: fileName,
      directory: Directory.Documents,
    });

    const response = await Http.post({
      url: 'YOUR_BACKEND_URL_HERE',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: {
        file: file.data,
        name: 'photo.jpg',
        type: 'image/jpg',
      },
    });

    console.log(response);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Camera and Image Picker of Endemic Trees</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Camera and Image Picker</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="container">
          <IonButton onClick={takePhoto}>Take a new photo using the camera</IonButton>
          <IonButton onClick={pickImage}>Pick an image from the gallery</IonButton>
          {photo && <IonImg src={photo} />}
          {photo && <IonButton onClick={uploadImage}>Upload Image</IonButton>}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
