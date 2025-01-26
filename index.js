/* script website downloader YouTube by noval wa.me/6285336580720 */

const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const yts = require('yt-search')
const app = express();
const PORT = 3000;

app.use(express.static('public'));

const logRequestDetails = (req, type, status, extraDetails = {}) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    const url = req.query.url || 'N/A';
    const resolution = extraDetails.resolution || 'N/A';
    const duration = extraDetails.duration || 'N/A';
    const fileSize = extraDetails.fileSize || 'N/A';

    const border = "╔" + "═".repeat(65) + "╗";
    const footer = "╚" + "═".repeat(65) + "╝";
    const paddedText = (text) => `║ ${text.padEnd(63)} ║`;

    const logMessage = [
        border,
        paddedText(`Time       : ${time}`),
        paddedText(`IP         : ${ip}`),
        paddedText(`YouTube URL: ${url}`),
        paddedText(`Type       : ${type}`),
        paddedText(`Resolution : ${resolution}`),
        paddedText(`Duration   : ${duration}`),
        paddedText(`File Size  : ${fileSize}`),
        paddedText(`Status     : ${status}`),
        paddedText(" "),
        paddedText(`© amba rian deploy`),
        footer
    ].join('\n');

    console.log(logMessage);
};


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
        logRequestDetails(req, 'info', 'Failed: Invalid URL');
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

        logRequestDetails(req, 'info', 'Success', {
            resolution: 'N/A',
            duration: response.duration,
            fileSize: 'N/A'
        });

        res.json(response);
    } catch (error) {
        logRequestDetails(req, 'info', `Failed: ${error.message}`);
        console.error('Error fetching YouTube video info:', error);
        res.status(500).json({ error: 'Error fetching video info' });
    }
});


app.get('/download', async (req, res) => {
    const url = req.query.url;
    const resolution = parseInt(req.query.resolution, 10);
    if (!url || !ytdl.validateURL(url)) {
        logRequestDetails(req, 'download', 'Failed: Invalid URL');
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        
const format = ytdl.chooseFormat(info.formats, { quality: resolution });

        if (!format) {
            return res.status(400).send('Resolusi tidak ditemukan.');
        }

        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
        ytdl(url, { format }).pipe(res);
        

            } catch (error) {
        logRequestDetails(req, 'download', `Failed: ${error.message}`);
        res.status(500).send(`Error downloading video: ${error.message}`);
    }
});

app.get('/audio', async (req, res) => {
    const url = req.query.url;
        if (!url || !ytdl.validateURL(url)) {
        logRequestDetails(req, 'audio', 'Failed: Invalid URL');
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        
res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`)  
                ytdl(url, { filter: 'audioonly' }).pipe(res);


        
        
    } catch (error) {
        logRequestDetails(req, 'audio', `Failed: ${error.message}`);
        res.status(500).send(`Error downloading audio: ${error.message}`);
    }
});

const deleteFileAfterDelay = (filePath) => {
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }, 10 * 60 * 1000); 
};

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
