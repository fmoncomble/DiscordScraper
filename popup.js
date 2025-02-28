document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start');
    startBtn.addEventListener('click', () => {
        const appUrl = encodeURIComponent('discord_scraper.html');
        const url = chrome.runtime.getURL(appUrl);
        chrome.tabs.create({ url: url });
        window.close();
    });
});
