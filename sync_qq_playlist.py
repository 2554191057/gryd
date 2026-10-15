# -*- coding: utf-8 -*-
"""同步 QQ 音乐歌单到引导页本地播放器
用法: python sync_qq_playlist.py [--deploy]
流程: 拉QQ歌单清单 -> 对比本地 -> 新歌网易云搜索匹配 -> 下载mp3+封面 -> 更新playlist.json
"""
import urllib.request, json, os, re, sys, time

QQ_PLAYLIST_ID = 9793336086
DIST = r'D:\Download\wangzhan\个人引导页\dist'
MUSIC = os.path.join(DIST, 'music')
COVER = os.path.join(MUSIC, 'cover')
PLJSON = os.path.join(MUSIC, 'playlist.json')
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'}

def log(*a):
    print('[sync]', *a, flush=True)

def get_qq_songs():
    url = ('https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?'
           'type=1&json=1&utf8=1&onlysong=0&disstid=%d&format=json&g_tk=5381'
           '&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0' % QQ_PLAYLIST_ID)
    req = urllib.request.Request(url, headers={'User-Agent': UA['User-Agent'], 'Referer': 'https://y.qq.com/'})
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore'))
    cd = (data.get('cdlist') or [{}])[0]
    out = []
    for s in (cd.get('songlist') or []):
        singers = '/'.join(x.get('name', '') for x in (s.get('singer') or []))
        out.append({'name': s.get('songname', '').strip(), 'singer': singers, 'interval': s.get('interval', 0)})
    return cd.get('dissname', '?'), out

def search_netease(keyword):
    url = 'https://music.163.com/api/search/get/web?' + urllib.parse.urlencode({'s': keyword, 'type': 1, 'limit': 10, 'offset': 0})
    req = urllib.request.Request(url, headers=UA)
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore'))
    return (data.get('result') or {}).get('songs') or []

def get_url(song_id):
    url = 'https://music.163.com/api/song/enhance/player/url?ids=%%5B%d%%5D&br=128000' % song_id
    req = urllib.request.Request(url, headers=dict(UA, Cookie='os=pc'))
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore'))
    d = (data.get('data') or [{}])[0]
    return d.get('url'), d.get('fee')

def get_cover(song_id):
    url = 'https://music.163.com/api/song/detail/?ids=%%5B%d%%5D' % song_id
    req = urllib.request.Request(url, headers=UA)
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore'))
    songs = data.get('songs') or []
    if not songs:
        return None
    alb = songs[0].get('album') or {}
    return alb.get('picUrl') or alb.get('blurPicUrl')

def mp3_duration(path):
    with open(path, 'rb') as f:
        data = f.read()
    pos = 0
    if data[:3] == b'ID3':
        sz = (data[6] << 21) | (data[7] << 14) | (data[8] << 7) | data[9]
        pos = 10 + sz
    sr = {0: 44100, 1: 48000, 2: 32000}
    br = [None, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, None]
    bitrate = rate = None
    while pos + 4 <= len(data):
        if data[pos] != 0xFF or (data[pos + 1] & 0xE0) != 0xE0:
            pos += 1
            continue
        ver = (data[pos + 1] >> 3) & 3
        layer = (data[pos + 1] >> 1) & 3
        bri = (data[pos + 2] >> 4) & 15
        sri = (data[pos + 2] >> 2) & 3
        if ver == 3 and layer == 1 and bri < 15 and sri < 3:
            bitrate = br[bri] * 1000
            rate = sr[sri]
            break
        pos += 1
    if not bitrate or not rate:
        return 0
    return round((len(data) - pos) / (bitrate / 8))

def next_index():
    m = 0
    for f in os.listdir(MUSIC):
        r = re.match(r'song(\d+)\.mp3$', f)
        if r:
            m = max(m, int(r.group(1)))
    return m + 1

def main():
    log('拉取 QQ 歌单...')
    dissname, songs = get_qq_songs()
    log('歌单名:', dissname, '歌曲数:', len(songs))

    if os.path.exists(PLJSON):
        with open(PLJSON, 'r', encoding='utf-8') as f:
            existing = json.load(f)
    else:
        existing = []
    have = set((e.get('name', ''), e.get('artistsname', '')) for e in existing)

    new_songs = []
    for s in songs:
        if (s['name'], s['singer']) in have:
            continue
        log('新歌:', s['name'], '-', s['singer'])
        kw = (s['name'] + ' ' + s['singer']).strip()
        results = search_netease(kw)
        if not results:
            log('  未搜到，跳过')
            continue
        # 挑选: 排除片段/严重不匹配, 歌手匹配优先, 时长接近, 可下载
        best = None
        candidates = []
        for r in results:
            artists = '/'.join(a['name'] for a in r.get('artists', []))
            dur = r.get('duration', 0) // 1000
            # 排除明显片段或时长差异过大的版本
            if s['interval'] and (dur < s['interval'] * 0.6 or abs(dur - s['interval']) > 45):
                continue
            score = 0
            if s['singer'] and any(part in artists for part in s['singer'].split('/')):
                score += 100
            if s['interval']:
                ddiff = abs(dur - s['interval'])
                if ddiff <= 10:
                    score += 30
                elif ddiff <= 30:
                    score += 10
            if r['name'].strip() == s['name']:
                score += 20
            elif s['name'] in r['name']:
                score += 10
            r['_score'] = score
            r['_dur'] = dur
            r['_artists'] = artists
            candidates.append(r)
        candidates.sort(key=lambda x: -x['_score'])
        if not candidates:
            log('  无可匹配候选，跳过')
            continue
        # 有歌手匹配候选时只用它们; 完全没有歌手匹配时才考虑翻唱版
        singer_matched = [c for c in candidates if c['_score'] >= 100]
        pool = singer_matched if singer_matched else [c for c in candidates if c['_score'] >= 20]
        if not pool:
            log('  无合适候选，跳过')
            continue
        downloaded = False
        for cand in pool:
            url, fee = get_url(cand['id'])
            if not url:
                log('  VIP/不可下载:', cand['name'], '-', cand['_artists'], 'fee=', fee)
                continue
            # 下载
            idx = next_index()
            mp3p = os.path.join(MUSIC, 'song%d.mp3' % idx)
            req = urllib.request.Request(url, headers=UA)
            content = urllib.request.urlopen(req, timeout=60).read()
            if len(content) < 500000:
                log('  文件过小(%dB)，跳过' % len(content))
                continue
            with open(mp3p, 'wb') as f:
                f.write(content)
            # 封面
            cover_url = get_cover(cand['id'])
            if cover_url:
                try:
                    req = urllib.request.Request(cover_url, headers=UA)
                    img = urllib.request.urlopen(req, timeout=30).read()
                    with open(os.path.join(COVER, 'cover%d.jpg' % idx), 'wb') as f:
                        f.write(img)
                except Exception as e:
                    log('  封面失败:', str(e)[:80])
            d = mp3_duration(mp3p)
            mm, ss = divmod(d, 60)
            new_songs.append({
                'id': str(idx),
                'name': cand['name'],
                'artistsname': cand['_artists'],
                'picurl': 'music/cover/cover%d.jpg' % idx,
                'url': 'music/song%d.mp3' % idx,
                'musicDuration': '%02d:%02d ' % (mm, ss),
            })
            log('  已下载 song%d.mp3 (%d:%02d) %s - %s' % (idx, mm, ss, cand['name'], cand['_artists']))
            downloaded = True
            break
        if not downloaded:
            log('  所有候选均不可下载(VIP)，跳过，需人工处理')

    if new_songs:
        playlist = existing + new_songs
        with open(PLJSON, 'w', encoding='utf-8') as f:
            json.dump(playlist, f, ensure_ascii=False, indent=2)
        log('更新 playlist.json: 现有 %d 首 + 新增 %d 首 = %d 首' % (len(existing), len(new_songs), len(playlist)))
    else:
        log('无新增歌曲，歌单已是最新。')

if __name__ == '__main__':
    import urllib.parse
    main()
