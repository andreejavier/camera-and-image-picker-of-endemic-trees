import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonImg, IonBackButton, IonButtons, IonInput, IonItem, IonLabel } from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Http } from '@capacitor-community/http';
import EXIF from 'exif-js'; // Import EXIF library
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Tab1.css';

export interface TreeData {
  name: string;
  scientificName: string;
  location: string;
  image?: string;
  lat?: string; // Add latitude
  lon?: string; // Add longitude
}

const Tab1: React.FC = () => {
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string | undefined>(undefined);
  const [treeData, setTreeData] = useState<TreeData>({
    name: '',
    scientificName: '',
    location: '',
    image: undefined,
    lat: undefined,
    lon: undefined
  });

  // Default location to center the map
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.7989, 125.0146]);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      setPhoto(image.dataUrl);
      setPhotoFileName(new Date().getTime() + '.jpg');
      setTreeData(prevData => ({ ...prevData, image: image.dataUrl }));
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const pickImage = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      setPhoto(image.dataUrl);
      setPhotoFileName(new Date().getTime() + '.jpg');
      setTreeData(prevData => ({ ...prevData, image: image.dataUrl }));
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleImageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const dataUrl = e.target?.result as string;
        setPhoto(dataUrl);
        setPhotoFileName(new Date().getTime() + '.jpg');
        setTreeData(prevData => ({ ...prevData, image: dataUrl }));
        extractExifData(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractExifData = (dataUrl: string) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      EXIF.getData(img, function() {
        const latitude = EXIF.getTag(this, 'GPSLatitude');
        const longitude = EXIF.getTag(this, 'GPSLongitude');
        setTreeData(prevData => ({
          ...prevData,
          lat: latitude ? convertDMSToDD(latitude) : 'Unknown',
          lon: longitude ? convertDMSToDD(longitude) : 'Unknown'
        }));
        // Update map center if location data is available
        if (latitude && longitude) {
          setMapCenter([convertDMSToDD(latitude), convertDMSToDD(longitude)]);
        }
      });
    };
  };

  const convertDMSToDD = (exifData: any) => {
    if (!exifData) return 0;
    const [degrees, minutes, seconds] = exifData;
    return degrees + (minutes / 60) + (seconds / 3600);
  };

  const uploadImage = async () => {
    if (!photo || !photoFileName) return;

    try {
      const base64Data = photo.split(',')[1];

      await Filesystem.writeFile({
        path: photoFileName,
        data: base64Data,
        directory: Directory.Documents,
      });

      const file = await Filesystem.readFile({
        path: photoFileName,
        directory: Directory.Documents,
      });

      const formData = new FormData();
      formData.append('file', new Blob([file.data], { type: 'image/jpeg' }), 'photo.jpg');

      const response = await Http.post({
        url: 'YOUR_BACKEND_URL_HERE',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
      });

      console.log('Upload response:', response);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleFormChange = (field: keyof TreeData, value: string) => {
    setTreeData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleReplace = () => {
    console.log('Replacing Tree Data:', treeData);
    // You can perform additional actions with the form data here
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <div className="ion-title-container">
            <IonTitle className="ion-title-3d">Camera and Upload Image of Endemic Trees</IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <div className="ion-title-container">
              <IonTitle size="large" className="ion-title-3d">Camera and Image Picker</IonTitle>
            </div>
          </IonToolbar>
        </IonHeader>
        <div className="container" style={{ marginTop: '2rem' }}>
          <IonButton onClick={takePhoto}>Take Picture</IonButton>
          <IonButton onClick={pickImage}>Open Gallery</IonButton>
        
          {photo && (
            <div>
              <IonImg src={photo} />
              <IonItem>
                <IonLabel position="floating">Tree Name</IonLabel>
                <IonInput value={treeData.name} onIonChange={e => handleFormChange('name', e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Scientific Name</IonLabel>
                <IonInput value={treeData.scientificName} onIonChange={e => handleFormChange('scientificName', e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Location</IonLabel>
                <IonInput value={treeData.location} onIonChange={e => handleFormChange('location', e.detail.value!)} />
              </IonItem>
              <div className="mt-3">
                <IonLabel position="floating"><pre>Latitude: <span>{treeData.lat}</span></pre></IonLabel>
                <IonLabel position="floating"><pre>Longitude: <span>{treeData.lon}</span></pre></IonLabel>
              </div>
              <IonButton onClick={uploadImage}>Upload Image</IonButton>
              {/* Map Component */}
              <div className="map-container" style={{ height: '400px', marginTop: '20px' }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {treeData.lat && treeData.lon && (
                    <Marker position={[parseFloat(treeData.lat), parseFloat(treeData.lon)]}>
                      <Popup>
                        {treeData.name} <br /> {treeData.scientificName}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
