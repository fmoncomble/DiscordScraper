document.addEventListener('DOMContentLoaded', () => {
    const version = chrome.runtime.getManifest().version;
    const versionDiv = document.getElementById('version-div');
    versionDiv.textContent = `v${version}`;
    const startBtn = document.getElementById('start');
    const permissionsDiv = document.getElementById('permissions_div');
    const permissionsList = document.getElementById('permissions_list');
    const permissionsBtn = document.getElementById('grant_permissions');
    async function checkPermissions() {
        const hostPermissions = chrome.runtime.getManifest().host_permissions;
        const hasPermissions = await chrome.permissions.contains({
            origins: hostPermissions
        });
        if (hasPermissions) {
            permissionsDiv.style.display = 'none';
            startBtn.style.display = 'flex';
        } else {
            permissionsDiv.style.display = 'flex';
            startBtn.style.display = 'none';
            permissionsList.innerHTML = '';
            hostPermissions.forEach(origin => {
                const li = document.createElement('li');
                li.textContent = origin;
                permissionsList.appendChild(li);
            });
            permissionsBtn.addEventListener('click', async () => {
                try {
                    const granted = await chrome.permissions.request({
                        origins: hostPermissions
                    });
                    if (granted) {
                        permissionsDiv.style.display = 'none';
                        startBtn.style.display = 'flex';
                    }
                } catch (error) {
                    console.error('Error requesting permissions:', error);
                }
            });
        }
    }
    checkPermissions();

    startBtn.addEventListener('click', () => {
        const appUrl = encodeURIComponent('discord_scraper.html');
        const url = chrome.runtime.getURL(appUrl);
        chrome.tabs.create({ url: url });
        window.close();
    });
});
