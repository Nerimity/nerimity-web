import env from '../../common/env';
import { request } from './Request';

export interface TenorCategory {
  searchterm: string; // 'anime smile',
  path: string; // '/v2/search?q=anime%20smile&locale=en&component=categories&contentfilter=high',
  image: string; // 'https://media.tenor.com/KASKTaO4YvsAAAAM/my-dress-up-darling-anime-smile.gif',
  name: string; // '#anime smile'
}

export const getTenorCategories = async () => {
  const data = await request<TenorCategory>({
    method: 'GET',
    url: env.SERVER_URL + "/api/tenor/categories",
    useToken: true
  });
  return data;
};
