const express = require('express');
const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');
const axios = require('axios');
const path = require('path');
const yts = require('yt-search')
const app = express();
const PORT = 3000;
const YOUTUBE_API_KEY = 'AIzaSyB1bRFJEil3Mf_KUFhQiWXUWedAERxXbt4'; // Ganti dengan API Key Anda
function Mp4(url) {
  return new Promise((resolve, reject) => {
    let title, image;

    const getDownloadId = () => {
      return fetch(`https://ab.cococococ.com/ajax/download.php?copyright=0&format=360&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`)
        .then(response => response.json());
    };

    const checkProgress = (id) => {
      return fetch(`https://p.oceansaver.in/ajax/progress.php?id=${id}`)
        .then(response => response.json());
    };

    const pollProgress = (id) => {
      checkProgress(id).then(data => {
        if (data.progress === 1000) {
          resolve({
            type: 'mp4 (360p)',
            title: title,
            image: image,
            download_url: data.download_url
          });
        } else {
          setTimeout(() => pollProgress(id), 1000);
        }
      }).catch(reject);
    };

    getDownloadId()
      .then(data => {
        if (data.success && data.id) {
          title = data.info.title;
          image = data.info.image;
          pollProgress(data.id);
        } else {
          reject(new Error('Gagal mendapatkan ID unduhan'));
        }
      })
      .catch(reject);
  });
}
async function ycdn(urln) {
const { data } = await axios.get(`https://ycdn.savetube.su/info?url=${urln}`) 
const { title, thumbnail, url, key } = data.data
const req = await axios.get(`https://ycdn.savetube.su/download/audio/128/${key}`) 
const req2 = await axios.get(`https://ycdn.savetube.su/download/video/360/${key}`) 
  return {
title: title, 
thumb: thumbnail, 
url: url, 
dl: req.data.data.downloadUrl, 
dl2: req2.data.data.downloadUrldl

}
}
async function FbDownload(vid_url) {
  try {
    const data = {
      url: vid_url,
    };
    const searchParams = new URLSearchParams();
    searchParams.append("url", data.url);
    const response = await fetch(
      "https://facebook-video-downloader.fly.dev/app/main.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: searchParams.toString(),
      },
    );
    const responseData = await response.json();
    return responseData.result;
  } catch (e) {
    return null;
  }
}
async function tiktok(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const encodedParams = new URLSearchParams();
      encodedParams.set("url", query);
      encodedParams.set("hd", "1");

      const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "current_language=en",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        },
        data: encodedParams,
      });
      const videos = response.data.data;
      resolve(videos);
    } catch (error) {
      reject(error);
    }
  });
}
function Mp3(url) {
  return new Promise((resolve, reject) => {
    let title, image;
    
    const getDownloadId = () => {
      return fetch(`https://ab.cococococ.com/ajax/download.php?copyright=0&format=mp3&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`)
        .then(response => response.json());
    };

    const checkProgress = (id) => {
      return fetch(`https://p.oceansaver.in/ajax/progress.php?id=${id}`)
        .then(response => response.json());
    };

    const pollProgress = (id) => {
      checkProgress(id).then(data => {
        if (data.progress === 1000) {
          resolve({
            type: 'mp3 (128 kbps)',
            title: title,
            image: image,
            download_url: data.download_url
          });
        } else {
          setTimeout(() => pollProgress(id), 1000);
        }
      }).catch(reject);
    };

    getDownloadId()
      .then(data => {
        if (data.success && data.id) {
          title = data.info.title;
          image = data.info.image;
          pollProgress(data.id);
        } else {
          reject(new Error('Gagal mendapatkan ID unduhan'));
        }
      })
      .catch(reject);
  });
}

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,  'index.html'));
});
app.get('/tik', (req, res) => {
  res.sendFile(path.join(__dirname,  'tik.html'));
});
app.get('/download', async (req, res) => {
    const url = req.query.url;
    const resolution = req.query.resolution;

    if (!url) {
        return res.status(400).send('URL video YouTube diperlukan.');
    }

    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: resolution });

        if (!format) {
            return res.status(400).send('Resolusi tidak ditemukan.');
        }

        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
        ytdl(url, { format }).pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat memproses permintaan Anda.');
    }
});
app.get('/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const searchResult = await yts(query);

        
        const videos = searchResult.videos.slice(0, 10).map(video => ({
            title: video.title,
            url: video.url,
            duration: video.timestamp,
            views: video.views,
            thumbnail: video.thumbnail,
            uploaded: video.ago,
            author: video.author.name,
        }));

        res.json({ query, videos });
    } catch (error) {
        console.error('Error fetching search results:', error.message);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

app.get('/info', async (req, res) => {
    const url = req.query.url;
    if (!url || !ytdl.validateURL(url)) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        const response = {
            title: videoDetails.title,
            uploader: videoDetails.author.name,
            thumbnail: videoDetails.thumbnails[0].url,
            duration: new Date(videoDetails.lengthSeconds * 1000).toISOString().substr(11, 8),
            resolutions: info.formats
                .filter(f => f.hasVideo && f.container === 'mp4')
                .map(f => ({ height: f.height, size: (f.contentLength / (1024 * 1024)).toFixed(2) + ' MB' }))
                .filter((value, index, self) => self.findIndex(v => v.height === value.height) === index)
                .sort((a, b) => b.height - a.height),
            audioBitrates: info.formats
                .filter(f => f.hasAudio)
                .map(f => ({ bitrate: f.audioBitrate, size: (f.contentLength / (1024 * 1024)).toFixed(2) + ' MB' }))
                .filter((value, index, self) => self.findIndex(v => v.bitrate === value.bitrate) === index)
                .sort((a, b) => b.bitrate - a.bitrate)
        };

        

        res.json(response);
    } catch (error) {
           console.error('Error fetching YouTube video info:', error);
        res.status(500).json({ error: 'Error fetching video info' });
    }
});
app.get('/audio', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL video YouTube diperlukan.');
    }

    try {
        const info = await ytdl.getInfo(url);
        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp3"`);
        ytdl(url, { filter: 'audioonly' }).pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat memproses permintaan Anda.');
    }
});
app.get('/api/get', async (req, res) => {
  try {
    const message = req.query.url;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "url" tidak ditemukan' });
    }
const response = await axios.post('https://cobalt.excdn.us.kg/exonity', {
                    url: message,                     
  downloadMode: "audio"
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                })
const responsen = await axios.post('https://cobalt.excdn.us.kg/exonity', {
                    url: message,   
filenameStyle: 'pretty', 
                   videoQuality: `360`
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                })
                     let down = {
                       audio: response.data.url, 
                       video: responsen.data.url
                     }
    
    res.status(200).json({
      status: 200,
      creator: "RIAN X EXONITY",
      result: down
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/convertez', async (req, res) => {
  try {
    const message = req.query.url;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "url" tidak ditemukan' });
    }
    let down = await tiktok(message) 
    res.status(200).json({
      status: 200,
      creator: "RIAN X EXONITY",
      result: down
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/fbfaster', async (req, res) => {
  try {
    const message = req.query.url;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "url" tidak ditemukan' });
    }
    let down = await FbDownload(message) 
    res.status(200).json({
      status: 200,
      creator: "RIAN X EXONITY",
      result: down
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/convert', async (req, res) => {
  try {
    const message = req.query.url;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "url" tidak ditemukan' });
    }
    let down = await Mp4(message) 
    res.status(200).json({
      status: 200,
      creator: "RIAN X EXONITY",
      result: down
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
