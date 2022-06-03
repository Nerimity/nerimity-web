import {createStore} from 'solid-js/store';
import { RawChannel, RawServer, RawUser } from '../RawData';


interface Account {
  user?: RawUser
}


const [account, setAccount] = createStore<Account>({});


const setUser = (user: RawUser) => 
  setAccount({...account, user});

const user = () => account.user;

export default function useAccount() {
  return {
    user,
    setUser
  }
}