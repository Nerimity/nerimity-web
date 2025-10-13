const repos = {
  nerimityWeb: {
    owner: "Nerimity",
    repo: "nerimity-web",
  },
  nerimityDesktop: {
    owner: "Nerimity",
    repo: "nerimity-desktop",
  },
  nerimityReactNative: {
    owner: "Nerimity",
    repo: "NerimityReactNative",
  },
};

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: Asset[];
}

export interface Asset {
  name: string;
  browser_download_url: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url + `?rnd=${Math.random()}`);
  const json = await res.json();
  return json;
}

export function getLatestRelease({ owner, repo } = repos.nerimityWeb) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  return fetchJson<Release>(url);
}

export function getLatestSha({ owner, repo } = repos.nerimityWeb) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/main`;

  const res = fetchJson<{ sha: string }>(url);
  return res.then((x) => x.sha?.substring(0, 7));
}

const AvailableExtensions = ["apk", "exe", "AppImage", "deb", "dmg"] as const;
type AvailableExtensions = (typeof AvailableExtensions)[number];
interface Platform {
  name: string;
  downloadUrl: string;
  platform: "windows" | "linux" | "android" | "macos";
  ext: AvailableExtensions;
}

let cachedPlatforms: Platform[] = [];

export async function getPlatformDownloadLinks() {
  if (cachedPlatforms.length > 0) {
    return cachedPlatforms;
  }
  const platforms: Platform[] = [];

  const release = await getLatestRelease(repos.nerimityDesktop);
  const mobileRelease = await getLatestRelease(repos.nerimityReactNative);

  const assets = [...release.assets, ...mobileRelease.assets];

  assets.forEach((asset) => {
    const extName = asset.name.split(".").slice(-1)[0] as AvailableExtensions;
    const isExecutable = AvailableExtensions.includes(extName);
    if (isExecutable) {
      let platformName = "";
      if (extName === "apk") {
        platformName = "android";
      }
      if (extName === "exe") {
        platformName = "windows";
      }
      if (extName === "AppImage" || extName === "deb") {
        platformName = "linux";
      }
      if (extName === "dmg") {
        platformName = "macos";
      }
      platforms.push({
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        platform: platformName as "android",
        ext: extName,
      });
    }
  });

  cachedPlatforms = platforms;

  return platforms;
}
