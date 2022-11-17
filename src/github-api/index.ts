const owner = "Nerimity";
const repo = "nerimity-web";

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url + `?rnd=${Math.random()}`);
  const json = await res.json();
  return json;
}

function getReleases() {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  return fetchJson<Release[]>(url);
}

function getRelease(releaseId: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}`;
  return fetchJson<Release>(url); 
}

export function getLatestRelease() {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  return fetchJson<Release>(url); 
}

