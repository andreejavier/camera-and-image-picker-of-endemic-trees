import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Http } from '@capacitor-community/http';

export async function takePhoto(): Promise<Photo> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });
  return photo;
}

export async function pickImage(): Promise<Photo> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });
  return photo;
}

export async function savePhoto(photo: Photo) {
  const base64Data = photo.dataUrl?.split(',')[1] ?? '';

  const fileName = new Date().getTime() + '.jpg';
  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Documents,
  });

  return fileName;
}

export async function uploadPhoto(fileName: string, backendUrl: string) {
  const file = await Filesystem.readFile({
    path: fileName,
    directory: Directory.Documents,
  });

  const response = await Http.post({
    url: backendUrl,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: {
      file: file.data,
      name: 'photo.jpg',
      type: 'image/jpg',
    },
  });

  return response;
}
