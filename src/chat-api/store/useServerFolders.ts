import {createStore, reconcile} from "solid-js/store";
import { RawServerFolder } from "../RawData";



const [serverFolders, setServerFolders] = createStore<Record<string, RawServerFolder>>({});


function setFolder (folder: RawServerFolder) {
  setServerFolders(folder.id, folder);
}

function getServerFolder (folderId: string) {
  return serverFolders[folderId];
}

function array () {
  return Object.values(serverFolders);
}

function updateServerIds (folderId: string, serverIds: string[]) {
  setServerFolders(folderId, "serverIds", reconcile(serverIds));
}

function reset() {
  setServerFolders(reconcile({}));
}



function isInFolder (serverId: string) {
  return array().find(folder => folder.serverIds.includes(serverId));
}

export default function useServerFolders() {
  return {
    get: getServerFolder,
    set: setFolder,
    array,
    isInFolder,
    reset,
    updateServerIds
  };
}