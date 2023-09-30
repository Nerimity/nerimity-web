import { createSignal } from "solid-js";

export const [googleApiInitialized, setGoogleApiInitialized] = createSignal(false);

let initializing  = false;
export const initializeGoogleDrive = (accessToken?: string) => new Promise<void>(res => {
  if (googleApiInitialized()) return;
  if (initializing) return;
  initializing = true;
  const start = async () => {
    await gapi.client.init({
      apiKey: "AIzaSyA9BsxleoF_d5ktcvTgWBbiWnKl-n7KIK8",
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      clientId: '833085928210-2ksk1asgbmqvsg6jb3es4asnmug2a4iu.apps.googleusercontent.com',
    })

    accessToken && gapi.client.setToken({access_token: accessToken})
    initializing = false;
    setGoogleApiInitialized(true)
    res();
  }
  gapi.load('client', start);
})


let nerimityUploadsFolder: gapi.client.drive.File | undefined;

export const getOrCreateUploadsFolder = async (accessToken: string) => {
  if (nerimityUploadsFolder) return nerimityUploadsFolder;
  if (!googleApiInitialized()) await initializeGoogleDrive(accessToken);
  const res = await gapi.client.drive.files.list({
    q: "name = 'nerimity_uploads' and mimeType = 'application/vnd.google-apps.folder'",
    fields: "files(id)"
  })
  const folder = res.result.files?.[0];
  if (folder) {
    nerimityUploadsFolder = folder;
    return nerimityUploadsFolder;
  }
  
  const newFolder = await gapi.client.drive.files.create({
    resource: {
      name: "nerimity_uploads",
      mimeType: "application/vnd.google-apps.folder"
    },
    fields: "id"
  });
  nerimityUploadsFolder = newFolder.result;
  return nerimityUploadsFolder;
}


// https://stackoverflow.com/questions/53839499/google-drive-api-and-file-uploads-from-the-browser
export const uploadFileGoogleDrive = async (file: File, accessToken: string, onProgress?: (percent: number) => void) => {
  if (!googleApiInitialized()) await initializeGoogleDrive(accessToken);
  gapi.client.setToken({access_token: accessToken})
  const folder = await getOrCreateUploadsFolder(accessToken);
  const metadata = {
    'name': file.name,
    'mimeType': file.type,
    parents: [folder.id!],
  };


  var form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', file);
  
  var xhr = new XMLHttpRequest();
  xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,kind');
  xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  xhr.responseType = 'json';

  
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      onProgress?.(Math.round(percentComplete));
    }
  };

  return new Promise<{id: string}>((resolve, reject) => {
    xhr.onload = async  () => {

      if (xhr.status === 0) {
        return reject({message: "Could not connect to server."})
      }
      if (xhr.status !== 200) {
        nerimityUploadsFolder = undefined;
        return reject(xhr.response);
      }
        const id = xhr.response.id;
  
        const body = {
          value: "default",
          type: "anyone",
          role: "reader"
        };
        
        await gapi.client.drive.permissions
        .create({
          fileId: id,
          resource: body
        })
        resolve(xhr.response);
    };
    xhr.send(form);
  })
}



export const getFile = async (fileId: string, fields?: string) => {
  const res = await gapi.client.drive.files.get({
    fileId: fileId,
    fields: fields || "*"
  })
  return res.result
  
}