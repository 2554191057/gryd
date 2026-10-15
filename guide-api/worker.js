// guide-api Worker: 实时代理 QQ 音乐歌单（无缓存，刷新即同步）
// 部署: guide-api  |  路由: /api/playlist
const PLID = '9793336086';
const QQ_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

async function fetchJSON(url, referer) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': QQ_UA, 'Referer': referer || 'https://y.qq.com/' }
  });
  return await resp.json();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/playlist') {
      return new Response(JSON.stringify({ code: 404, msg: 'not found', data: [] }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }
    // 内置缓存（60s）：命中则直接返回，未命中才实时拉 QQ
    const CACHE_KEY = new Request('https://qqzttkx.eu.cc/api/playlist-cache');
    const cache = caches.default;
    const cached = await cache.match(CACHE_KEY);
    if (cached) return cached;
    try {
      // 1. 实时拉 QQ 官方歌单
      const pl = await fetchJSON(
        `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&disstid=${PLID}&format=json&g_tk=5381&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`
      );
      const cd = (pl.cdlist || [{}])[0];
      const songs = cd.songlist || [];
      if (!songs.length) throw new Error('empty playlist');

      // 2. 现拉每首歌播放地址（批量）
      const mids = songs.map(s => s.songmid).filter(Boolean);
      let midInfo = [], sip = 'https://dl.stream.qqmusic.qq.com/';
      if (mids.length) {
        try {
          const vk = await fetchJSON(
            'https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=' +
            encodeURIComponent(JSON.stringify({
              req: { module: 'vkey.GetVkeyServer', method: 'CgiGetVkey',
                param: { guid: '1000', songmid: mids, songtype: mids.map(() => 0),
                         uin: '0', loginflag: 1, platform: '20' } }
            }))
          );
          sip = (vk.req?.data?.sip || ['https://dl.stream.qqmusic.qq.com/'])[0];
          midInfo = vk.req?.data?.midurlinfo || [];
        } catch (e) { /* 音频地址失败则走兜底 */ }
      }

      // 3. 兜底：QQ 拿不到播放地址的歌曲，从 xfyun 中转同歌单取 src（中转只影响老歌，不影响实时列表）
      let fallbackMap = {};
      const missing = songs.filter((s, i) => !((midInfo[i] || {}).purl));
      if (missing.length) {
        try {
          const fb = await fetchJSON(
            `https://music.api.xfyun.club/api/v1/music/playlist-songs?platform=qq&playlistId=${PLID}&nocache=1`
          );
          for (const fs of (fb.data || [])) fallbackMap[fs.id] = fs.src;
        } catch (e) { /* 兜底失败则 src 留空 */ }
      }

      // 4. 组装播放器格式
      const list = songs.map((s, i) => {
        const mi = midInfo[i] || {};
        let src = (mi.purl ? sip + mi.purl : '') || fallbackMap[s.songmid] || '';
        const singers = (s.singer || []).map(x => x.name).join('/');
        return {
          id: s.songmid,
          title: s.songname || '',
          artist: singers,
          album: (s.album && s.album.name) || '',
          cover: 'https://y.qq.com/music/photo_new/T002R300x300M000' + (s.albummid || '') + '.jpg',
          src: src,
          duration: Math.round(s.interval || 0),
          lyrics_url: 'https://music.api.xfyun.club/api/v1/music/lyric?platform=qq&songId=' + s.songmid,
          pay: false
        };
      });

      const resp = new Response(JSON.stringify({ code: 200, msg: 'success', data: list }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' }
      });
      // 存入内置缓存（TTL 由 Cache-Control: max-age=60 控制）
      await cache.put(CACHE_KEY, resp.clone());
      return resp;
    } catch (e) {
      return new Response(JSON.stringify({ code: 500, msg: e.message, data: [] }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, s-maxage=60, max-age=30' }
      });
    }
  }
};
